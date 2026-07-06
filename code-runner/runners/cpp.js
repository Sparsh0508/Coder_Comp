const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function runCpp(code, input = "") {
  return new Promise((resolve) => {
    const id = uuid();
    const dir = path.join(__dirname, "temp", id);

    fs.mkdirSync(dir, { recursive: true });

    const sourceFile = path.join(dir, "main.cpp");
    const executable = path.join(dir, "main");
    const inputFile = path.join(dir, "input.txt");

    fs.writeFileSync(sourceFile, code);
    fs.writeFileSync(inputFile, input);

    let finished = false;

    const cleanup = () => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {}
    };

    // -------------------------
    // Compile
    // -------------------------
    const compile = spawn("g++", [
      "-std=c++17",
      sourceFile,
      "-O2",
      "-o",
      executable,
    ]);

    let compileError = "";

    compile.stderr.on("data", (data) => {
      compileError += data.toString();
    });

    compile.on("error", (err) => {
      if (finished) return;
      finished = true;
      cleanup();

      resolve({
        status: "Internal Error",
        output: err.message,
      });
    });

    compile.on("close", (code) => {
      if (finished) return;

      if (code !== 0) {
        finished = true;
        cleanup();

        return resolve({
          status: "Compilation Error",
          output: compileError,
        });
      }

      // -------------------------
      // Run executable
      // -------------------------

      const run = spawn(executable);

      let stdout = "";
      let stderr = "";

      const inputStream = fs.createReadStream(inputFile);
      inputStream.pipe(run.stdin);

      const timeout = setTimeout(() => {
        if (finished) return;

        finished = true;
        run.kill("SIGKILL");
        cleanup();

        resolve({
          status: "Time Limit Exceeded",
          output: "",
        });
      }, 12000);

      run.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      run.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      run.on("error", (err) => {
        if (finished) return;

        finished = true;
        clearTimeout(timeout);
        cleanup();

        resolve({
          status: "Runtime Error",
          output: err.message,
        });
      });

      run.on("close", (exitCode) => {
        if (finished) return;

        finished = true;
        clearTimeout(timeout);
        cleanup();

        if (exitCode !== 0) {
          return resolve({
            status: "Runtime Error",
            output: stderr,
          });
        }

        resolve({
          status: "Success",
          output: stdout.trim(),
        });
      });
    });
  });
}

module.exports = { runCpp };