const fs = require("fs");
const glob = require("glob");
const ora = require("ora").default;
const chalk = require("chalk");
const boxen = require("boxen").default;
const { parseFile } = require("./scanner");
const { loadConfig } = require("./config");
//detect logs
function fixFile(file) {
  const code = fs.readFileSync(file, "utf-8");

  if (!code.includes("console")) return 0;

  const logs = parseFile(file); //reusing the old parsefile function instead of reinventing the wheel;

  if (!logs.length) return 0;

  let updated = code;

  // removing from bottom → top to avoid index shift
  logs
    .sort((a, b) => b.start - a.start)
    .forEach((log) => {
      let start = log.start;
      let end = log.end;
      //consumptioon of trailing semicolon ;edge case
      if (updated[end] === ";") end += 1;

      //consumption of the entire line if nothinng else is on it
      const lineStart = updated.lastIndexOf("\n", start - 1) + 1;
      const beforeLog = updated.slice(lineStart, start).trim();
      if (beforeLog === "") {
        // line is only whitespace + the console statement, remove whole line
        start = lineStart;
        if (updated[end] === "\n") end += 1;
      }

      updated = updated.slice(0, start) + updated.slice(end);
    });

  // collapse multiple blank lines into one
  updated = updated.replace(/\n{3,}/g, "\n\n");

  fs.writeFileSync(file, updated, "utf-8");

  return logs.length;
}

async function fixProject({ dryRun = false } = {}) {
  const spinner = ora(
    dryRun ? "Previewing changes..." : "Removing console statements...",
  ).start();
  const config = loadConfig();
  const files = glob.sync("**/*.{js,ts,jsx,tsx}", {
    ignore: config.ignore,
  });
  let removed = 0;

  files.forEach((file) => {
    if (dryRun) {
      const logs = parseFile(file);
      if (logs.length > 0) {
        console.log("");
        console.log(chalk.cyan.bold(`  ${file}`));
        logs.forEach((log) => {
          console.log(
            `    ${chalk.gray("→")} would remove console.${chalk.yellow(log.type)}${chalk.gray(`(${log.argsSource})`)} ${chalk.gray(`:${log.line}`)}`,
          );
        });
        removed += logs.length;
      }
    } else {
      removed += fixFile(file);
    }
  });

  spinner.succeed(chalk.green(dryRun ? "Dry run completed" : "Fix completed"));

  console.log(
    boxen(
      dryRun
        ? chalk.cyan(
            ` Would remove ${removed} console statement${removed === 1 ? "" : "s"}\n`,
          ) +
            chalk.gray(" (no files were changed)\n") +
            chalk.gray(" Run logcop fix to apply")
        : chalk.cyan(
            ` Removed ${removed} console statement${removed === 1 ? "" : "s"}`,
          ),
      { padding: 1, borderColor: "cyan" },
    ),
  );
}
module.exports = { fixProject };
