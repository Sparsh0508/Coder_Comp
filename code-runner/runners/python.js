const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function runPython(code, input) {
  return new Promise((resolve) => {

    const id = uuid();
    const dir = path.join(__dirname, "temp", id);

    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, "main.py");
    fs.writeFileSync(filePath, code);

    const run = spawn("python", ["main.py"], { cwd: dir });

    let stdout = "";
    let stderr = "";

    const timeout = setTimeout(() => {
      run.kill("SIGKILL");
      return resolve({
        status: "Time Limit Exceeded"
      });
    }, 2000);

    run.stdin.write(input);
    run.stdin.end();

    run.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    run.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    run.on("close", () => {
      clearTimeout(timeout);

      if (stderr) {
        return resolve({
          status: "Runtime Error",
          error: stderr
        });
      }

      return resolve({
        status: "Success",
        output: stdout
      });
    });

    run.on("error", (err) => {
      clearTimeout(timeout);
      return resolve({
        status: "Internal Error",
        error: err.message
      });
    });

  });
}

module.exports = { runPython };
