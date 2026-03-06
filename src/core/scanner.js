const fs = require("fs");
const ora = require("ora").default;
const chalk = require("chalk");
const boxen = require("boxen").default;
const glob = require("glob");
const acorn = require("acorn");
const walk = require("acorn-walk");

// parse a single file
function parseFile(file) {
  const code = fs.readFileSync(file, "utf-8");
  const logs = [];
  const allowedMethods = ["log", "error", "warn", "debug"];
  try {
    const ast = acorn.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
    });

    walk.simple(ast, {
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.name === "console" &&
          allowedMethods.includes(node.callee.property.name)
        ) {
          logs.push({
            file,
            line: node.loc.start.line,
          });
        }
      },
    });
  } catch (error) {
    // ignore parse errors
  }

  return logs;
}

async function scanProject() {
  const spinner = ora("Scanning project...").start();

  //real engine for the file scan/

  const files = glob.sync("**/*.{js,ts,jsx,tsx}", {
    ignore: ["node_modules/**"],
  });

  let results = [];

  files.forEach((file) => {
    const logs = parseFile(file);
    results.push(...logs);
  });

  spinner.succeed(chalk.green("Scan completed"));

  if (results.length > 0) {
    console.log(chalk.bold("\nDetected console statements:\n"));

    results.forEach((r) => {
      console.log(chalk.yellow(`⚠ ${r.file} : line ${r.line} (${r.type})`));
    });
  }

  console.log("");

  console.log(
    boxen(chalk.yellow(`⚠ Found ${results.length} console statements`), {
      padding: 1,
      borderColor: "yellow",
    }),
  );
}

module.exports = { scanProject };
