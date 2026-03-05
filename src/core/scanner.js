const ora = require("ora");
const chalk = require("chalk");
const boxen = require("boxen");

async function scanProject() {
  const spinner = ora("Scanning project...").start();

  await new Promise((r) => setTimeout(r, 1200));

  spinner.succeed(chalk.green("Scan completed"));

  console.log(
    boxen(chalk.yellow("⚠ Found 12 console.log statements"), {
      padding: 1,
      borderColor: "yellow",
    }),
  );
}

module.exports = { scanProject };
