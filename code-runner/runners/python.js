const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function runPython(code, input) {
  return new Promise((resolve) => {
    let finished = false;

    const id = uuid();
    const baseTempDir = path.join(__dirname, "temp");
    const dir = path.join(baseTempDir, id);

    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, "main.py");
    fs.writeFileSync(filePath, code);

    let dockerPath = path.resolve(dir);

    const dockerCommand = [
      "run",
      "-i",
      "--rm",
      "--memory=100m",
      "--cpus=0.5",
      "--network=none",
      "--pids-limit=50",
      "-v",
      `${dockerPath}:/app`,
      "python:3.10",
      "python",
      "/app/main.py"
    ];

    const run = spawn("docker", dockerCommand, {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        run.kill("SIGKILL");
        cleanup();
        resolve({ status: "Time Limit Exceeded" });
      }
    }, 3000);

    if (input) {
      run.stdin.write(input + "\n");
    }
    run.stdin.end();

    run.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    run.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    run.on("close", () => {
      if (finished) return;
      finished = true;

      clearTimeout(timeout);
      cleanup();

      if (stderr) {
        return resolve({
          status: "Runtime Error",
          error: stderr
        });
      }

      return resolve({
        status: "Success",
        output: stdout
      });
    });

    run.on("error", (err) => {
      if (finished) return;
      finished = true;

      clearTimeout(timeout);
      cleanup();

      return resolve({
        status: "Internal Error",
        error: err.message
      });
    });

    function cleanup() {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch { }
    }
  });
}

module.exports = { runPython };