import net from "net";
import { spawn } from "child_process";

const DEFAULT_PORT = 3001;
const MAX_PORT = 3100;

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "0.0.0.0");
  });
}

async function findAvailablePort(startPort) {
  for (let port = startPort; port <= MAX_PORT; port += 1) {
    const free = await isPortFree(port);
    if (free) return port;
  }
  return null;
}

async function run() {
  const envPort = Number.parseInt(process.env.PORT || "", 10);
  const startPort = Number.isFinite(envPort) ? envPort : DEFAULT_PORT;

  const port = await findAvailablePort(startPort);
  if (!port) {
    console.error(`No available ports between ${startPort} and ${MAX_PORT}`);
    process.exit(1);
  }

  if (port !== startPort) {
    console.log(`Port ${startPort} is in use. Using ${port} instead.`);
  } else {
    console.log(`Using port ${port}.`);
  }

  const child = spawn("next", ["dev", "-p", String(port)], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(port) }
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

run();
