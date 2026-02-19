const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function runCpp(code, input) {
  return new Promise((resolve) => {

    const id = uuid();
    const dir = path.join(__dirname, "temp", id);

    fs.mkdirSync(dir, { recursive: true });

    const fileName = "main.cpp";
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, code);

    // Compile
    const compile = spawn("g++", ["main.cpp", "-o", "main.exe"], { cwd: dir });

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

      // Run compiled file
      const run = spawn("main.exe", [], { cwd: dir });

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

    compile.on("error", (err) => {
      return resolve({
        status: "Internal Error",
        error: err.message
      });
    });

  });
}

module.exports = { runCpp };
