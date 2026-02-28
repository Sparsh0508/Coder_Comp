const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function runCpp(code, input) {
  return new Promise((resolve) => {
    let finished = false;

    const id = uuid();
    const dir = path.join(__dirname, "temp", id);
    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, "main.cpp");
    fs.writeFileSync(filePath, code);

    let dockerPath = path.resolve(dir);

    const dockerCommand = [
      "run",
      "-i",
      "--rm",
      "--memory=200m",
      "--cpus=0.5",
      "--network=none",
      "--pids-limit=50",
      "-v",
      `${dockerPath}:/app`,
      "gcc:latest",
      "sh",
      "-c",
      "g++ /app/main.cpp -o /app/main && /app/main"
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
    }, 5000);

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

    run.on("close", (code) => {
      if (finished) return;
      finished = true;

      clearTimeout(timeout);
      cleanup();

      if (code !== 0 && stderr) {
        return resolve({
          status: "Compilation or Runtime Error",
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
      } catch {}
    }
  });
}

module.exports = { runCpp };