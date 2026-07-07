const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function runCpp(code, input = "") {
  return new Promise((resolve) => {
    const id = uuid();
    const dir = path.join(__dirname, "temp", id);

    console.log("=======================================");
    console.log(`[CPP Runner] New Execution Started`);
    console.log(`[CPP Runner] Execution ID: ${id}`);
    console.log(`[CPP Runner] Temp Directory: ${dir}`);

    fs.mkdirSync(dir, { recursive: true });

    const sourceFile = path.join(dir, "main.cpp");
    const executable = path.join(dir, "main");
    const inputFile = path.join(dir, "input.txt");

    fs.writeFileSync(sourceFile, code);
    fs.writeFileSync(inputFile, input);

    console.log(`[CPP Runner] Source File Created`);
    console.log(`[CPP Runner] Input Size: ${input.length} bytes`);
    console.log(`[CPP Runner] Code Size: ${code.length} bytes`);

    let finished = false;

    const cleanup = () => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`[CPP Runner] Temp Directory Deleted`);
      } catch (err) {
        console.error("[CPP Runner] Cleanup Error:", err);
      }
    };

    console.time(`[CPP Runner] Compile Time ${id}`);

    // -------------------------
    // Compile
    // -------------------------
    console.log("[CPP Runner] Starting Compilation...");

    const compile = spawn("g++", [
      "-std=c++17",
      sourceFile,
      "-O2",
      "-o",
      executable,
    ]);

    let compileError = "";

    compile.stdout.on("data", (data) => {
      console.log("[CPP Compile STDOUT]", data.toString());
    });

    compile.stderr.on("data", (data) => {
      compileError += data.toString();
      console.error("[CPP Compile STDERR]", data.toString());
    });

    compile.on("error", (err) => {
      console.error("[CPP Runner] Compiler Spawn Error:", err);

      if (finished) return;
      finished = true;
      cleanup();

      resolve({
        status: "Internal Error",
        output: err.message,
      });
    });

    compile.on("close", (code) => {
      console.timeEnd(`[CPP Runner] Compile Time ${id}`);

      if (finished) return;

      console.log(`[CPP Runner] Compile Exit Code: ${code}`);

      if (code !== 0) {
        console.error("[CPP Runner] Compilation Failed");

        finished = true;
        cleanup();

        return resolve({
          status: "Compilation Error",
          output: compileError,
        });
      }

      console.log("[CPP Runner] Compilation Successful");
      console.log("[CPP Runner] Executable:", executable);

      // -------------------------
      // Run executable
      // -------------------------

      console.time(`[CPP Runner] Execution Time ${id}`);

      const run = spawn(executable);

      let stdout = "";
      let stderr = "";

      const inputStream = fs.createReadStream(inputFile);
      inputStream.pipe(run.stdin);

      const timeout = setTimeout(() => {
        if (finished) return;

        console.error("[CPP Runner] Time Limit Exceeded");

        finished = true;
        run.kill("SIGKILL");
        cleanup();

        resolve({
          status: "Time Limit Exceeded",
          output: "",
        });
      }, 12000);

      run.stdout.on("data", (data) => {
        const text = data.toString();
        stdout += text;

        console.log("[CPP STDOUT]", text);
      });

      run.stderr.on("data", (data) => {
        const text = data.toString();
        stderr += text;

        console.error("[CPP STDERR]", text);
      });

      run.on("error", (err) => {
        console.error("[CPP Runner] Runtime Spawn Error:", err);

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
        console.timeEnd(`[CPP Runner] Execution Time ${id}`);

        if (finished) return;

        finished = true;
        clearTimeout(timeout);
        cleanup();

        console.log(`[CPP Runner] Program Exit Code: ${exitCode}`);

        if (exitCode !== 0) {
          console.error("[CPP Runner] Runtime Error");
          console.error(stderr);

          return resolve({
            status: "Runtime Error",
            output: stderr,
          });
        }

        console.log("[CPP Runner] Execution Successful");
        console.log("[CPP Runner] Output:");
        console.log(stdout.trim());
        console.log("=======================================");

        resolve({
          status: "Success",
          output: stdout.trim(),
        });
      });
    });
  });
}

module.exports = { runCpp };