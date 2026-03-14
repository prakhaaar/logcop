#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { Command } = require("commander");
const chalk = require("chalk");
const ora = require("ora").default;
const boxen = require("boxen").default;
const { scanProject } = require("../src/core/scanner");
const { fixProject, commentProject } = require("../src/core/fixer");
const program = new Command();

program
  .name("logcop")
  .description("🚓 Detect and remove console.log statements")
  .version("1.0.0");

//  SCAN
/*program
  .command("scan")
  .description("Scan project for console logs")
  .option("--ci", "Exit with code 1 if any console statements found")
  .action(async (options) => {
    await scanProject({ ci: options.ci });
  });
*/
program
  .command("scan")
  .description("Scan project for console logs")
  .option("--ci", "Exit with code 1 if any console statements found")
  .option("--json", "Output results as JSON")
  .action(async (options) => {
    await scanProject({ ci: options.ci, json: options.json });
  });
/*

program
  .command("fix")
  .description("Remove console logs automatically")
  .action(async () => {
    await fixProject();
  });
*
// INSTALL
/*program
  .command("install-hook")
  .description("Install git pre-commit hook")
  .action(async () => {
    const spinner = ora("Installing git hook...").start();

    await new Promise((r) => setTimeout(r, 1000));

    spinner.succeed(chalk.green("Git hook installed"));
  });
*/

//  FIX
program
  .command("fix")
  .description("Remove console logs automatically")
  .option("--dry-run", "Preview what would be removed without changing files")
  .action(async (options) => {
    await fixProject({ dryRun: options.dryRun });
  });

//comment rather than fully removing the logs;
// COMMENT
program
  .command("comment")
  .description("Comment out console statements instead of removing them")
  .option("--dry-run", "Preview what would be commented without changing files")
  .action(async (options) => {
    await commentProject({ dryRun: options.dryRun });
  });

program
  .command("install-hook")
  .description("Install git pre-commit hook")
  .action(async () => {
    const spinner = ora("Installing git hook...").start();

    const hookDir = path.join(process.cwd(), ".git", "hooks");
    const hookPath = path.join(hookDir, "pre-commit");

    //check for .git's existence
    if (!fs.existsSync(hookDir)) {
      spinner.fail(
        chalk.red("No .git directory found. Are you in a git repo?"),
      );
      process.exit(1);
    }
    const hookScript = `#!/bin/sh
npx logcop scan --ci
if [ $? -ne 0 ]; then
  echo ""
  echo " logcop: console statements detected. Run 'logcop fix' to remove them."
  exit 1
fi
`;

    fs.writeFileSync(hookPath, hookScript, { mode: 0o755 });

    spinner.succeed(chalk.green("Git hook installed"));
    console.log(chalk.gray(`  → ${hookPath}`));
    console.log(chalk.gray("  logcop will now run before every commit."));
  });
program.parse(process.argv);
