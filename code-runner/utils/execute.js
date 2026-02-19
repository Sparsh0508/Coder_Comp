const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

exports.execute = (code, extension, runCommandBuilder, input = "", timeoutMs = 3000) => {
  return new Promise((resolve) => {
    const id = randomUUID();
    const tempDir = path.join(__dirname, "..", "temp", id);

    fs.mkdirSync(tempDir, { recursive: true }); 
    const fileName = `Main.${extension}`;
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, code);

    const { command, args } = runCommandBuilder(fileName, tempDir);

    const start = Date.now();
    const process = spawn(command, args, { cwd: tempDir });

    let stdout = "";
    let stderr = "";

    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }

    process.stdout.on("data", data => stdout += data.toString());
    process.stderr.on("data", data => stderr += data.toString());

    const cleanup = () => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    };

    const timer = setTimeout(() => {
      process.kill("SIGKILL");
      cleanup();
      resolve({
        status: "TLE",
        stdout: "",
        stderr: "Time Limit Exceeded",
        time: timeoutMs / 1000
      });
    }, timeoutMs);

    process.on("close", code => {
      clearTimeout(timer);
      const end = Date.now();
      const time = (end - start) / 1000;
      cleanup();

      if (code !== 0) {
        return resolve({ status: "Runtime Error", stdout, stderr, time });
      }

      resolve({ status: "Accepted", stdout, stderr, time });
    });

    process.on("error", err => {
      clearTimeout(timer);
      cleanup();
      resolve({ status: "Runtime Error", stdout, stderr: err.message, time: 0 });
    });
  });
};
