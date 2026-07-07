const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function runJava(code, input = "") {
  return new Promise((resolve) => {
    const id = uuid();
    const dir = path.join(__dirname, "temp", id);

    console.log("========================================");
    console.log("[Java Runner] New Execution");
    console.log("[Java Runner] ID:", id);
    console.log("[Java Runner] Temp Directory:", dir);
    console.log("[Java Runner] Platform:", process.platform);
    console.log("[Java Runner] Node:", process.version);

    fs.mkdirSync(dir, { recursive: true });

    const javaFile = path.join(dir, "Main.java");
    fs.writeFileSync(javaFile, code);

    console.log("[Java Runner] Main.java created");
    console.log("[Java Runner] Code Size:", code.length, "bytes");
    console.log("[Java Runner] Input Size:", input.length, "bytes");

    let finished = false;

    const cleanup = () => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log("[Java Runner] Temp directory deleted");
      } catch (err) {
        console.error("[Java Runner] Cleanup Error:", err);
      }
    };

    // Check javac
    const checkJavac = spawn("which", ["javac"]);

    checkJavac.stdout.on("data", (d) => {
      console.log("[Java Runner] javac location:", d.toString().trim());
    });

    checkJavac.stderr.on("data", (d) => {
      console.error("[Java Runner] which javac error:", d.toString());
    });

    checkJavac.on("close", (code) => {
      console.log("[Java Runner] which javac exit code:", code);
    });

    console.time(`[Java Compile ${id}]`);

    console.log("[Java Runner] Starting Compilation...");

    const compile = spawn("javac", ["Main.java"], {
      cwd: dir,
    });

    let compileError = "";

    compile.stdout.on("data", (data) => {
      console.log("[Java Compile STDOUT]");
      console.log(data.toString());
    });

    compile.stderr.on("data", (data) => {
      compileError += data.toString();
      console.error("[Java Compile STDERR]");
      console.error(data.toString());
    });

    compile.on("error", (err) => {
      console.error("[Java Runner] Compiler Spawn Error:", err);

      if (finished) return;

      finished = true;
      cleanup();

      resolve({
        status: "Internal Error",
        output: err.message,
      });
    });

    compile.on("close", (code) => {
      console.timeEnd(`[Java Compile ${id}]`);

      if (finished) return;

      console.log("[Java Runner] Compilation Exit Code:", code);

      if (code !== 0) {
        console.error("[Java Runner] Compilation Failed");

        finished = true;
        cleanup();

        return resolve({
          status: "Compilation Error",
          output: compileError,
        });
      }

      console.log("[Java Runner] Compilation Successful");

      console.time(`[Java Execution ${id}]`);

      // -------------------------
      // Run Java Program
      // -------------------------
      const run = spawn("java", ["-cp", dir, "Main"]);

      let stdout = "";
      let stderr = "";

      if (input) {
        let normalizedInput = input.trim();

        if (!normalizedInput.includes("\n")) {
          normalizedInput = normalizedInput
            .split(/\s+/)
            .join("\n");
        }

        normalizedInput += "\n";

        console.log("[Java Runner] Input Sent:");
        console.log(normalizedInput);

        run.stdin.write(normalizedInput);
      }

      run.stdin.end();

      const timeout = setTimeout(() => {
        if (finished) return;

        console.error("[Java Runner] Time Limit Exceeded");

        finished = true;
        run.kill("SIGKILL");
        cleanup();

        resolve({
          status: "Time Limit Exceeded",
          output: "",
        });
      }, 5000);

      run.stdout.on("data", (data) => {
        const text = data.toString();
        stdout += text;

        console.log("[Java STDOUT]");
        console.log(text);
      });

      run.stderr.on("data", (data) => {
        const text = data.toString();
        stderr += text;

        console.error("[Java STDERR]");
        console.error(text);
      });

      run.on("error", (err) => {
        console.error("[Java Runner] Runtime Spawn Error:", err);

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
        console.timeEnd(`[Java Execution ${id}]`);

        if (finished) return;

        finished = true;
        clearTimeout(timeout);
        cleanup();

        console.log("[Java Runner] Exit Code:", exitCode);

        if (exitCode !== 0) {
          console.error("[Java Runner] Runtime Error");
          console.error(stderr);

          return resolve({
            status: "Runtime Error",
            output: stderr,
          });
        }

        console.log("[Java Runner] Execution Successful");
        console.log("[Java Runner] Final Output:");
        console.log(stdout.trim());
        console.log("========================================");

        resolve({
          status: "Success",
          output: stdout.trim(),
        });
      });
    });
  });
}

module.exports = { runJava };