const fs = require("fs");
const ora = require("ora").default;
const chalk = require("chalk");
const boxen = require("boxen").default;
const glob = require("glob");
const acorn = require("acorn");
const walk = require("acorn-walk");
const { loadConfig } = require("./config");
// parse a single file
function parseFile(file) {
  const code = fs.readFileSync(file, "utf-8");
  const logs = [];
  // fast skip if file doesn't contain console
  if (!code.includes("console")) {
    return logs;
  }
  const config = loadConfig();
  const allowedMethods = ["log", "error", "warn", "debug"].filter(
    (x) => !config.keep.includes(x),
  );
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
            start: node.start,
            end: node.end,
          }); //added start and end of the console statements just to reuse it in fixer.js;
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
  const config = loadConfig();
  const files = glob.sync("**/*.{js,ts,jsx,tsx}", {
    ignore: config.ignore,
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

  if (results.length === 0) {
    console.log(
      boxen(chalk.green(" ✔ No console statements found"), {
        padding: 1,
        borderColor: "green",
      }),
    );
    return;
  }

  console.log("");
  Object.keys(grouped).forEach((file) => {
    console.log(chalk.cyan.bold(`  ${file}`));

    grouped[file].forEach((log) => {
      console.log(
        `    ${chalk.gray("→")} console.${chalk.yellow(log.type)} ${chalk.gray(`:${log.line}`)}`,
      );
    });

    console.log("");
  });

  console.log(
    boxen(
      chalk.yellow(
        ` Found ${results.length} console statement${results.length === 1 ? "" : "s"} across ${Object.keys(grouped).length} file${Object.keys(grouped).length === 1 ? "" : "s"}\n`,
      ) + chalk.gray(" Run logcop fix to remove them"),
      { padding: 1, borderColor: "yellow" },
    ),
  );
}

module.exports = { scanProject, parseFile };
