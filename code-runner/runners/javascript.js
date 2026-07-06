const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function runJS(code, input = "") {
  return new Promise((resolve) => {
    let finished = false;

    const id = uuid();
    const baseTempDir = path.join(__dirname, "temp");
    const dir = path.join(baseTempDir, id);

    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, "main.js");
    fs.writeFileSync(filePath, code);

    // Run directly using Node
    const run = spawn("node", [filePath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const cleanup = () => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {}
    };

    // Timeout (3 seconds)
    const timeout = setTimeout(() => {
      if (finished) return;

      finished = true;
      run.kill("SIGKILL");
      cleanup();

      resolve({
        status: "Time Limit Exceeded",
        output: "",
      });
    }, 3000);

    // Send stdin
    if (input) {
      run.stdin.write(input);
    }
    run.stdin.end();

    // Capture stdout
    run.stdout.on("data", (data) => {
      stdout += data.toString();

      // Prevent huge outputs
      if (stdout.length > 10000) {
        run.kill("SIGKILL");
      }
    });

    // Capture stderr
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
          output: stderr || stdout || "Non-zero exit code",
        });
      }

      resolve({
        status: "Success",
        output: stdout.trim(),
      });
    });
  });
}

module.exports = { runJS };