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

    // ✅ Fix Windows path issue
    const dockerPath = dir.replace(/\\/g, "/");

    const dockerCommand = [
      "run",
      "--rm",
      "-i",
      "--init",
      "--memory=100m",
      "--cpus=0.5",
      "--network=none",
      "--pids-limit=50",
      "-v",
      `${dockerPath}:/app`,
      "-w",
      "/app",
      "python:3.10",
      "python",
      "-u",
      "main.py"
    ];

    const run = spawn("docker", dockerCommand, {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    // ⏱ Timeout (3 sec)
    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        run.kill("SIGKILL");
        cleanup();
        return resolve({ status: "Time Limit Exceeded" });
      }
    }, 3000); 

    // ✅ Input handling
    if (input) {
      if (input.length > 5000) {
        cleanup();
        return resolve({ status: "Input Too Large" });
      }

      let normalizedInput = input.trim();

      if (!normalizedInput.includes("\n")) {
        normalizedInput = normalizedInput.split(/\s+/).join("\n");
      }

      normalizedInput += "\n";

      run.stdin.write(normalizedInput);
      run.stdin.end();
    } else {
      run.stdin.end();
    }

    // 📤 Capture stdout (with limit)
    run.stdout.on("data", (data) => {
      if (stdout.length > 10000) {
        run.kill("SIGKILL");
        stdout = "Output Limit Exceeded";
        return;
      }
      stdout += data.toString();
    });

    // ⚠️ Capture stderr
    run.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // ✅ Process finished
    run.on("close", (code) => {
      if (finished) return;
      finished = true;

      clearTimeout(timeout);
      cleanup();

      if (code !== 0) {
        return resolve({
          status: "Runtime Error",
          error: stderr || "Non-zero exit code"
        });
      }

      return resolve({
        status: "Success",
        output: stdout.trim()
      });
    });

    // ❌ Spawn error
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

    // 🧹 Cleanup
    function cleanup() {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {}
    }
  });
}

module.exports = { runPython };