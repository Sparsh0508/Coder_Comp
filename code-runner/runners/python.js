const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function runPython(code, input = "") {
  return new Promise((resolve) => {
    let finished = false;

    const id = uuid();
    const baseTempDir = path.join(__dirname, "temp");
    const dir = path.join(baseTempDir, id);

    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, "main.py");
    fs.writeFileSync(filePath, code);

    const run = spawn("python3", ["-u", filePath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const cleanup = () => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {}
    };

    // Timeout
    const timeout = setTimeout(() => {
      if (finished) return;

      finished = true;
      run.kill("SIGKILL");
      cleanup();

      resolve({
        status: "Time Limit Exceeded",
        output: "",
      });
    }, 10000);

    // Input
    if (input) {
      if (input.length > 5000) {
        clearTimeout(timeout);
        cleanup();

        return resolve({
          status: "Input Too Large",
          output: "",
        });
      }

      let normalizedInput = input.trim();

      if (!normalizedInput.includes("\n")) {
        normalizedInput = normalizedInput
          .split(/\s+/)
          .join("\n");
      }

      normalizedInput += "\n";

      run.stdin.write(normalizedInput);
    }

    run.stdin.end();

    // stdout
    run.stdout.on("data", (data) => {
      stdout += data.toString();

      if (stdout.length > 10000) {
        run.kill("SIGKILL");
      }
    });

    // stderr
    run.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    run.on("error", (err) => {
      if (finished) return;

      finished = true;
      clearTimeout(timeout);
      cleanup();

      resolve({
        status: "Internal Error",
        output: err.message,
      });
    });

    run.on("close", (code) => {
      if (finished) return;

      finished = true;
      clearTimeout(timeout);
      cleanup();

      if (code !== 0) {
        return resolve({
          status: "Runtime Error",
          output: stderr || "Non-zero exit code",
        });
      }

      resolve({
        status: "Success",
        output: stdout.trim(),
      });
    });
  });
}

module.exports = { runPython };