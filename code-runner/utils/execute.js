const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

exports.execute = (
  code,
  extension,
  runCommandBuilder,
  input = "",
  timeoutMs = 3000
) => {
  return new Promise((resolve) => {
    const id = randomUUID();
    const tempDir = path.join(__dirname, "..", "temp", id);

    console.log("\n======================================");
    console.log("[Executor] New Execution");
    console.log("[Executor] ID:", id);
    console.log("[Executor] Extension:", extension);
    console.log("[Executor] Temp Directory:", tempDir);
    console.log("[Executor] Platform:", process.platform);
    console.log("[Executor] Node Version:", process.version);
    console.log("[Executor] Code Size:", code.length, "bytes");
    console.log("[Executor] Input Size:", input.length, "bytes");

    fs.mkdirSync(tempDir, { recursive: true });

    const fileName = `Main.${extension}`;
    const filePath = path.join(tempDir, fileName);

    fs.writeFileSync(filePath, code);

    console.log("[Executor] Source File:", filePath);

    const { command, args } = runCommandBuilder(fileName, tempDir);

    console.log("[Executor] Command:", command);
    console.log("[Executor] Args:", args.join(" "));

    const start = Date.now();

    console.time(`[Executor ${id}]`);

    const child = spawn(command, args, {
      cwd: tempDir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let finished = false;

    // --------------------
    // Input
    // --------------------
    if (input) {
      let normalizedInput = input.trim();

      if (!normalizedInput.includes("\n")) {
        normalizedInput = normalizedInput
          .split(/\s+/)
          .join("\n");
      }

      normalizedInput += "\n";

      console.log("[Executor] Input:");
      console.log(normalizedInput);

      child.stdin.write(normalizedInput);
    }

    child.stdin.end();

    // --------------------
    // STDOUT
    // --------------------
    child.stdout.on("data", (data) => {
      const text = data.toString();

      stdout += text;

      console.log("[STDOUT]");
      console.log(text);
    });

    // --------------------
    // STDERR
    // --------------------
    child.stderr.on("data", (data) => {
      const text = data.toString();

      stderr += text;

      console.error("[STDERR]");
      console.error(text);
    });

    // --------------------
    // Cleanup
    // --------------------
    const cleanup = () => {
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, {
            recursive: true,
            force: true,
          });

          console.log("[Executor] Temp Directory Deleted");
        }
      } catch (err) {
        console.error("[Executor] Cleanup Error:", err);
      }
    };

    // --------------------
    // Timeout
    // --------------------
    const timer = setTimeout(() => {
      if (finished) return;

      finished = true;

      console.error("[Executor] Time Limit Exceeded");

      child.kill("SIGKILL");

      cleanup();

      console.timeEnd(`[Executor ${id}]`);

      resolve({
        status: "TLE",
        stdout: "",
        stderr: "Time Limit Exceeded",
        time: timeoutMs / 1000,
      });
    }, timeoutMs);

    // --------------------
    // Close
    // --------------------
    child.on("close", (exitCode, signal) => {
      if (finished) return;

      finished = true;

      clearTimeout(timer);

      const end = Date.now();
      const time = (end - start) / 1000;

      console.timeEnd(`[Executor ${id}]`);

      console.log("[Executor] Exit Code:", exitCode);
      console.log("[Executor] Signal:", signal);
      console.log("[Executor] Time:", time, "seconds");

      cleanup();

      if (exitCode !== 0) {
        console.error("[Executor] Runtime Error");

        return resolve({
          status: "Runtime Error",
          stdout,
          stderr,
          time,
        });
      }

      console.log("[Executor] Execution Successful");
      console.log("[Executor] Final Output:");
      console.log(stdout.trim());
      console.log("======================================");

      resolve({
        status: "Accepted",
        stdout,
        stderr,
        time,
      });
    });

    // --------------------
    // Spawn Error
    // --------------------
    child.on("error", (err) => {
      if (finished) return;

      finished = true;

      clearTimeout(timer);

      console.error("[Executor] Spawn Error:", err);

      cleanup();

      console.timeEnd(`[Executor ${id}]`);

      resolve({
        status: "Runtime Error",
        stdout,
        stderr: err.message,
        time: 0,
      });
    });
  });
};