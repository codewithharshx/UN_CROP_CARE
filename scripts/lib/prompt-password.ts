import * as readline from "node:readline";

/**
 * Prompts for a password with masked terminal feedback (*)
 * Never logs or prints the entered password.
 */
export function promptMaskedPassword(promptLabel: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    process.stdout.write(promptLabel);

    let password = "";

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();

      const onData = (chunk: Buffer) => {
        const char = chunk.toString();

        // Enter key (\r or \n)
        if (char === "\r" || char === "\n") {
          process.stdin.setRawMode(false);
          process.stdin.removeListener("data", onData);
          process.stdout.write("\n");
          rl.close();
          resolve(password);
          return;
        }

        // Ctrl+C (\u0003)
        if (char === "\u0003") {
          process.stdin.setRawMode(false);
          process.stdin.removeListener("data", onData);
          process.stdout.write("\n");
          rl.close();
          process.exit(1);
        }

        // Backspace (\b, \x7f, \x08)
        if (char === "\b" || char === "\x7f" || char === "\x08") {
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write("\b \b");
          }
          return;
        }

        // Ignore other control sequences
        if (char.charCodeAt(0) < 32) {
          return;
        }

        password += char;
        process.stdout.write("*");
      };

      process.stdin.on("data", onData);
    } else {
      // Fallback for non-interactive / piped environments
      rl.question("", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

/**
 * Prompts for a password and a confirmation, ensuring they match and meet length rules
 */
export async function promptPasswordWithConfirmation(
  label: string = "Enter password: ",
  confirmLabel: string = "Confirm password: ",
  minLength: number = 12
): Promise<string> {
  const p1 = await promptMaskedPassword(label);
  if (!p1 || p1.length < minLength) {
    throw new Error(`Password must be at least ${minLength} characters in length.`);
  }

  const p2 = await promptMaskedPassword(confirmLabel);
  if (p1 !== p2) {
    throw new Error("Passwords do not match. Aborting for security.");
  }

  return p1;
}

