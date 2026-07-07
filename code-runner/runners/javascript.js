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

    console.log("========================================");
    console.log("[JS Runner] New Execution");
    console.log("[JS Runner] ID:", id);
    console.log("[JS Runner] Temp Directory:", dir);
    console.log("[JS Runner] Platform:", process.platform);
    console.log("[JS Runner] Node Version:", process.version);
    console.log("[JS Runner] Code Size:", code.length, "bytes");
    console.log("[JS Runner] Input Size:", input.length, "bytes");

    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, "main.js");
    fs.writeFileSync(filePath, code);

    console.log("[JS Runner] main.js created");

    const cleanup = () => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log("[JS Runner] Temp directory deleted");
      } catch (err) {
        console.error("[JS Runner] Cleanup Error:", err);
      }
    };

    // Check Node installation
    const checkNode = spawn("which", ["node"]);

    checkNode.stdout.on("data", (data) => {
      console.log("[JS Runner] node location:", data.toString().trim());
    });

    checkNode.stderr.on("data", (data) => {
      console.error("[JS Runner] which node error:", data.toString());
    });

    checkNode.on("close", (code) => {
      console.log("[JS Runner] which node exit code:", code);
    });

    console.time(`[JS Execution ${id}]`);

    console.log("[JS Runner] Starting Program...");

    const run = spawn("node", [filePath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const timeout = setTimeout(() => {
      if (finished) return;

      console.error("[JS Runner] Time Limit Exceeded");

      finished = true;
      run.kill("SIGKILL");
      cleanup();

      resolve({
        status: "Time Limit Exceeded",
        output: "",
      });
    }, 3000);

    if (input) {
      console.log("[JS Runner] Input:");
      console.log(input);

      run.stdin.write(input);
    }

    run.stdin.end();

    run.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;

      console.log("[JS STDOUT]");
      console.log(text);

      // Prevent excessive output
      if (stdout.length > 10000) {
        console.warn("[JS Runner] Output exceeded limit. Killing process.");
        run.kill("SIGKILL");
      }
    });

    run.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;

      console.error("[JS STDERR]");
      console.error(text);
    });

    run.on("error", (err) => {
      console.error("[JS Runner] Process Spawn Error:", err);

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
      console.timeEnd(`[JS Execution ${id}]`);

      if (finished) return;

      finished = true;
      clearTimeout(timeout);
      cleanup();

      console.log("[JS Runner] Exit Code:", code);

      if (code !== 0) {
        console.error("[JS Runner] Runtime Error");
        console.error(stderr || stdout);

        return resolve({
          status: "Runtime Error",
          output: stderr || stdout || "Non-zero exit code",
        });
      }

      console.log("[JS Runner] Execution Successful");
      console.log("[JS Runner] Final Output:");
      console.log(stdout.trim());
      console.log("========================================");

      resolve({
        status: "Success",
        output: stdout.trim(),
      });
    });
  });
}

module.exports = { runJS };