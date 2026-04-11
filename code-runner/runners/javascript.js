const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function runJS(code, input) {
  return new Promise((resolve) => {
    let finished = false;

    const id = uuid();
    const baseTempDir = path.join(__dirname, "temp");
    const dir = path.join(baseTempDir, id);

    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, "main.js");
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
      "node:18-alpine",
      "node",
      "main.js"
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
      run.stdin.write(input);
      run.stdin.end();
    } else {
      run.stdin.end();
    }

    // Capture stdout
    run.stdout.on("data", (data) => {
      if (stdout.length > 10000) {
        run.kill("SIGKILL");
        return;
      }
      stdout += data.toString();
    });

    // Capture stderr
    run.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Process finished
    run.on("close", (code) => {
      if (finished) return;
      finished = true;

      clearTimeout(timeout);
      cleanup();

      if (code !== 0) {
        return resolve({
          status: "Runtime Error",
          output: stderr || stdout || "Non-zero exit code"
        });
      }

      return resolve({
        status: "Success",
        output: stdout.trim() || stderr.trim()
      });
    });

    // Cleanup
    function cleanup() {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {}
    }
  });
}

module.exports = { runJS };
