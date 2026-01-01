import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import type { ProductionSnapshot, ProductionStep } from "./types";
import { resolveAdapter } from "./adapters";

function resolveProjectRoot() {
  const candidate = path.resolve(process.cwd(), "../..");
  if (fs.existsSync(path.join(candidate, "package.json"))) {
    return candidate;
  }
  return process.cwd();
}

const ARTIFACT_DIR = path.join(resolveProjectRoot(), "data", "production-os", "artifacts");

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatStepLabel(step: ProductionStep, index: number) {
  const tool = step.tool ? `/${step.tool}` : "";
  const name = step.name ? ` - ${step.name}` : "";
  return `STEP ${index + 1}: ${step.type}${tool}${name}`;
}

export async function executeJobRun(jobRunId: string) {
  const jobRun = await prisma.jobRun.findUnique({
    where: { id: jobRunId },
    include: { item: true, template: true }
  });

  if (!jobRun) {
    throw new Error("JobRun not found");
  }

  let logBuffer = jobRun.log || "";
  const appendLog = (line: string) => {
    logBuffer = logBuffer ? `${logBuffer}\n${line}` : line;
  };

  appendLog(`[${new Date().toISOString()}] Job started`);

  await prisma.jobRun.update({
    where: { id: jobRunId },
    data: {
      status: "running",
      startedAt: new Date(),
      log: logBuffer
    }
  });

  try {
    const snapshot = safeJsonParse<ProductionSnapshot>(jobRun.inputSnapshot, {
      version: 1,
      capturedAt: new Date().toISOString(),
      item: {
        id: jobRun.itemId,
        title: jobRun.item.title,
        status: jobRun.item.status,
        tags: [],
        inputText: jobRun.item.inputText,
        kpiNote: jobRun.item.kpiNote
      },
      template: null,
      assets: [],
      references: [],
      steps: [],
      params: {}
    });

    const steps = snapshot.steps ?? [];
    if (steps.length === 0) {
      appendLog("No steps found. Marking as succeeded.");
    }

    for (let index = 0; index < steps.length; index += 1) {
      const step = steps[index];
      const timestamp = new Date().toISOString();
      const stepId = step.id || `step-${index + 1}`;
      appendLog(`[${timestamp}] STEP ${index + 1} START ${stepId}`);

      const requestPayload = {
        stepId,
        type: step.type,
        tool: step.tool,
        params: step.params ?? {}
      };
      appendLog(`[${timestamp}] STEP ${index + 1} REQUEST ${JSON.stringify(requestPayload)}`);

      if (step.params && (step.params as { forceFail?: boolean }).forceFail) {
        const errorMessage = `Step failed: ${formatStepLabel(step, index)}`;
        const responsePayload = {
          stepId,
          status: "error",
          error: errorMessage
        };
        appendLog(`[${timestamp}] STEP ${index + 1} RESPONSE ${JSON.stringify(responsePayload)}`);
        throw new Error(errorMessage);
      }

      const adapter = resolveAdapter(step.tool);
      const adapterResult = await adapter.execute({
        step,
        snapshot,
        jobRunId: jobRun.id
      });
      const responsePayload = {
        stepId,
        status: adapterResult.status,
        adapter: adapter.name,
        output: adapterResult.output,
        error: adapterResult.error
      };
      appendLog(`[${timestamp}] STEP ${index + 1} RESPONSE ${JSON.stringify(responsePayload)}`);

      if (adapterResult.status === "error") {
        throw new Error(adapterResult.error || `Adapter error: ${formatStepLabel(step, index)}`);
      }

      appendLog(`[${timestamp}] STEP ${index + 1} COMPLETE ${stepId}`);
    }

    ensureDir(ARTIFACT_DIR);
    const artifactName = `${jobRun.item.title || "item"}-${jobRun.id}`;
    const artifactPath = path.join(ARTIFACT_DIR, `${jobRun.id}.json`);
    const artifactPayload = {
      jobRunId: jobRun.id,
      itemId: jobRun.itemId,
      createdAt: new Date().toISOString(),
      snapshot,
      log: logBuffer
    };
    fs.writeFileSync(artifactPath, JSON.stringify(artifactPayload, null, 2), "utf-8");

    const artifact = await prisma.artifact.create({
      data: {
        itemId: jobRun.itemId,
        jobRunId: jobRun.id,
        name: artifactName,
        type: snapshot.template?.format || "artifact",
        uri: artifactPath,
        metadata: JSON.stringify({
          runner: "local",
          stepCount: steps.length
        })
      }
    });

    appendLog(`[${new Date().toISOString()}] Job succeeded`);

    await prisma.jobRun.update({
      where: { id: jobRunId },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        log: logBuffer
      }
    });

    return { artifactId: artifact.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    appendLog(`[${new Date().toISOString()}] Job failed: ${message}`);

    await prisma.jobRun.update({
      where: { id: jobRunId },
      data: {
        status: "failed",
        finishedAt: new Date(),
        log: logBuffer
      }
    });

    return { error: message };
  }
}
