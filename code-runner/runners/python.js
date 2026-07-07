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

    console.log("========================================");
    console.log("[Python Runner] New Execution");
    console.log("[Python Runner] ID:", id);
    console.log("[Python Runner] Temp Directory:", dir);
    console.log("[Python Runner] Platform:", process.platform);
    console.log("[Python Runner] Node Version:", process.version);
    console.log("[Python Runner] Code Size:", code.length, "bytes");
    console.log("[Python Runner] Input Size:", input.length, "bytes");

    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, "main.py");
    fs.writeFileSync(filePath, code);

    console.log("[Python Runner] main.py created");

    const cleanup = () => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log("[Python Runner] Temp directory deleted");
      } catch (err) {
        console.error("[Python Runner] Cleanup Error:", err);
      }
    };

    // Check Python installation
    const checkPython = spawn("which", ["python3"]);

    checkPython.stdout.on("data", (data) => {
      console.log("[Python Runner] python3 location:", data.toString().trim());
    });

    checkPython.stderr.on("data", (data) => {
      console.error("[Python Runner] which python3 error:", data.toString());
    });

    checkPython.on("close", (code) => {
      console.log("[Python Runner] which python3 exit code:", code);
    });

    console.time(`[Python Execution ${id}]`);

    console.log("[Python Runner] Starting Program...");

    const run = spawn("python3", ["-u", filePath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    // Timeout
    const timeout = setTimeout(() => {
      if (finished) return;

      console.error("[Python Runner] Time Limit Exceeded");

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
        console.error("[Python Runner] Input Too Large");

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

      console.log("[Python Runner] Input Sent:");
      console.log(normalizedInput);

      run.stdin.write(normalizedInput);
    }

    run.stdin.end();

    // stdout
    run.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;

      console.log("[Python STDOUT]");
      console.log(text);

      if (stdout.length > 10000) {
        console.warn("[Python Runner] Output limit exceeded. Killing process.");
        run.kill("SIGKILL");
      }
    });

    // stderr
    run.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;

      console.error("[Python STDERR]");
      console.error(text);
    });

    run.on("error", (err) => {
      console.error("[Python Runner] Process Spawn Error:", err);

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
      console.timeEnd(`[Python Execution ${id}]`);

      if (finished) return;

      finished = true;
      clearTimeout(timeout);
      cleanup();

      console.log("[Python Runner] Exit Code:", code);

      if (code !== 0) {
        console.error("[Python Runner] Runtime Error");
        console.error(stderr);

        return resolve({
          status: "Runtime Error",
          output: stderr || "Non-zero exit code",
        });
      }

      console.log("[Python Runner] Execution Successful");
      console.log("[Python Runner] Final Output:");
      console.log(stdout.trim());
      console.log("========================================");

      resolve({
        status: "Success",
        output: stdout.trim(),
      });
    });
  });
}

module.exports = { runPython };