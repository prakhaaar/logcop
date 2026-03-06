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
  // fast skip if file doesn't contain console
  if (!code.includes("console")) {
    return logs;
  }
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
            type: node.callee.property.name,
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
    ignore: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".next/**",
    ],
  });
  let results = [];

  files.forEach((file) => {
    const logs = parseFile(file);
    results.push(...logs);
  });

  const grouped = {};

  results.forEach((r) => {
    if (!grouped[r.file]) {
      grouped[r.file] = [];
    }
    grouped[r.file].push(r);
  });

  spinner.succeed(chalk.green("Scan completed"));

  if (results.length > 0) {
    console.log(chalk.bold("\nDetected console statements:\n"));

    Object.keys(grouped).forEach((file) => {
      console.log(chalk.cyan.bold(file));

      grouped[file].forEach((log) => {
        console.log(chalk.yellow(`   ⚠ line ${log.line} (${log.type})`));
      });

      console.log("");
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
