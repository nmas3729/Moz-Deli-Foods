import { createInterface } from "node:readline";
import { hash } from "bcryptjs";

if (!process.stdin.isTTY || !process.stdin.setRawMode) {
  console.error("Run this command in an interactive terminal.");
  process.exitCode = 1;
} else {
  const input = [];
  let submitted = false;
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  process.stdout.write("Admin password (hidden): ");
  process.stdin.setRawMode(true);
  process.stdin.resume();

  process.stdin.on("data", async (chunk) => {
    for (const byte of chunk) {
      if (submitted) return;
      if (byte === 3) {
        process.stdout.write("\nCancelled.\n");
        process.exit(130);
      }
      if (byte === 13 || byte === 10) {
        submitted = true;
        process.stdin.setRawMode(false);
        terminal.close();
        process.stdout.write("\n");
        const password = Buffer.from(input).toString("utf8");
        if (password.length < 12 || password.length > 200) {
          process.stderr.write("Use a password between 12 and 200 characters.\n");
          process.exitCode = 1;
          return;
        }
        process.stdout.write(`${await hash(password, 12)}\n`);
        return;
      }
      if (byte === 127 || byte === 8) {
        input.pop();
        continue;
      }
      input.push(byte);
    }
  });
}
