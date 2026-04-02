const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function runJava(code) {
  return new Promise((resolve) => {
    const id = uuid();
    const dir = path.join(__dirname, "temp", id);

    // ✅ Create temp directory
    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, "Main.java");
    fs.writeFileSync(filePath, code);

    const dockerCommand = [
      "run",
      "-i",
      "--rm",
      "--memory=200m",
      "--cpus=0.5",
      "--network=none",
      "--pids-limit=50",
      "-v",
      `${dir}:/app`,
      "eclipse-temurin:17",
      "sh",
      "-c",
      "javac /app/Main.java && java -cp /app Main"
    ];

    const run = spawn("docker", dockerCommand);

    let stdout = "";
    let stderr = "";

    // ❌ REMOVED stdin.write (NO INPUT NEEDED WITH WRAPPER)

    run.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    run.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    const cleanup = () => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (e) {}
    };

    // ⏱️ Timeout protection (TLE)
    const timeout = setTimeout(() => {
      run.kill("SIGKILL");
      cleanup();
      resolve({
        status: "TLE",
        output: ""
      });
    }, 5000);

    run.on("close", (code) => {
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
  });
}

module.exports = { runJava };