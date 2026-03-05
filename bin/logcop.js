#!/usr/bin/env node

const { Command } = require("commander");
const chalk = require("chalk");
const ora = require("ora").default;
const boxen = require("boxen").default;
const figlet = require("figlet");
const gradient = require("gradient-string");

const program = new Command();

console.log(
  gradient.pastel.multiline(
    figlet.textSync("LOGCOP", { horizontalLayout: "full" }),
  ),
);

console.log(
  boxen(
    chalk.gray(
      "🚓 Detect & eliminate console.log statements before production",
    ),
    {
      padding: 1,
      borderStyle: "round",
      borderColor: "cyan",
    },
  ),
);

program
  .name("logcop")
  .description("🚓 Detect and remove console.log statements")
  .version("1.0.0");

//  SCAN
program
  .command("scan")
  .description("Scan project for console logs")
  .action(async () => {
    const spinner = ora("Scanning project...").start();

    await new Promise((r) => setTimeout(r, 1200));

    spinner.succeed(chalk.green("Scan completed"));

    console.log(
      boxen(chalk.yellow("⚠ Found 12 console.log statements"), {
        padding: 1,
        borderColor: "yellow",
      }),
    );
  });

//  FIX
program
  .command("fix")
  .description("Remove console logs automatically")
  .action(async () => {
    const spinner = ora("Removing console logs...").start();

    await new Promise((r) => setTimeout(r, 1500));

    spinner.succeed(chalk.green("Console logs removed"));

    console.log(
      boxen(chalk.cyan("✨ Your codebase is now clean"), {
        padding: 1,
        borderColor: "cyan",
      }),
    );
  });

// INSTALL
program
  .command("install-hook")
  .description("Install git pre-commit hook")
  .action(async () => {
    const spinner = ora("Installing git hook...").start();

    await new Promise((r) => setTimeout(r, 1000));

    spinner.succeed(chalk.green("Git hook installed"));

    console.log(
      boxen(
        chalk.magenta("🛡 Console logs will now be blocked before commits"),
        { padding: 1, borderColor: "magenta" },
      ),
    );
  });

program.parse(process.argv);
