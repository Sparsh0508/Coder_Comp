const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function runJava(code, input) {
  return new Promise((resolve) => {

    const id = uuid();
    const dir = path.join(__dirname, "temp", id);

    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, "Main.java");
    fs.writeFileSync(filePath, code);

    const compile = spawn("javac", ["Main.java"], { cwd: dir });

    let compileError = "";

    compile.stderr.on("data", (data) => {
      compileError += data.toString();
    });

    compile.on("close", (compileCode) => {

      if (compileCode !== 0) {
        return resolve({
          status: "Compilation Error",
          error: compileError
        });
      }

      const run = spawn("java", ["Main"], { cwd: dir });

      let stdout = "";
      let stderr = "";

      // ⏳ TIME LIMIT (2 seconds)
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

    });
  });
}

module.exports = { runJava };
