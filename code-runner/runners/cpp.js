const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function runCpp(code, input = "") {
  return new Promise((resolve) => {
    let finished = false;

    const id = uuid();
    const dir = path.join(__dirname, "temp", id);
    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, "main.cpp");
    fs.writeFileSync(filePath, code);

    // 🔥 write input to file
    const inputPath = path.join(dir, "input.txt");
    fs.writeFileSync(inputPath, input);

    const dockerCommand = [
      "run",
      "--rm",
      "--memory=200m",
      "--cpus=0.5",
      "--network=none",
      "--pids-limit=50",
      "-v",
      `${dir}:/app`,
      "gcc:latest",
      "sh",
      "-c",
      "g++ /app/main.cpp -o /app/main && /app/main < /app/input.txt"
    ];

    const run = spawn("docker", dockerCommand);

    let stdout = "";
    let stderr = "";

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        run.kill("SIGKILL");
        cleanup();
        resolve({ status: "Time Limit Exceeded", output: "" });
      }
    }, 5000);

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

      if (code !== 0) {
        return resolve({
          status: "Error",
          output: stderr
        });
      }

      resolve({
        status: "Success",
        output: stdout.trim()
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