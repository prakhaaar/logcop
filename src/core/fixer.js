const fs = require("fs");
const glob = require("glob");
const ora = require("ora").default;
const chalk = require("chalk");
const boxen = require("boxen").default;
const { parseFile } = require("./scanner");

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
      updated = updated.slice(0, log.start) + updated.slice(log.end);
    });

  fs.writeFileSync(file, updated, "utf-8");

  return logs.length;
}

async function fixProject() {
  const spinner = ora("Removing console statements...").start();

  const files = glob.sync("**/*.{js,ts,jsx,tsx}", {
    ignore: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".next/**",
    ],
  });

  let removed = 0;

  files.forEach((file) => {
    removed += fixFile(file);
  });

  spinner.succeed(chalk.green("Fix completed"));

  console.log(
    boxen(chalk.cyan(`✨ Removed ${removed} console statements`), {
      padding: 1,
      borderColor: "cyan",
    }),
  );
}

module.exports = { fixProject };
