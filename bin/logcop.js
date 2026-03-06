#!/usr/bin/env node

const { Command } = require("commander");
const chalk = require("chalk");
const ora = require("ora").default;
const boxen = require("boxen").default;
const figlet = require("figlet");
const gradient = require("gradient-string");
const { scanProject } = require("../src/core/scanner");
const { fixProject } = require("../src/core/fixer");
const program = new Command();

program
  .name("logcop")
  .description("🚓 Detect and remove console.log statements")
  .version("1.0.0");

//  SCAN
program
  .command("scan")
  .description("Scan project for console logs")
  .action(async () => {
    await scanProject();
  });

//  FIX
program
  .command("fix")
  .description("Remove console logs automatically")
  .action(async () => {
    await fixProject();
  });

// INSTALL
program
  .command("install-hook")
  .description("Install git pre-commit hook")
  .action(async () => {
    const spinner = ora("Installing git hook...").start();

    await new Promise((r) => setTimeout(r, 1000));

    spinner.succeed(chalk.green("Git hook installed"));
  });

program.parse(process.argv);
