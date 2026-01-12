import { NextResponse } from "next/server";
import { getRenderJob } from "@/lib/remotion/render-queue";

interface RouteParams {
    params: { jobId: string };
}

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { jobId } = params;
        const job = await getRenderJob(jobId);

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        return NextResponse.json(job);
    } catch (error) {
        console.error("Failed to get render job:", error);
        return NextResponse.json(
            { error: "Failed to get render job" },
            { status: 500 }
        );
    }
}
