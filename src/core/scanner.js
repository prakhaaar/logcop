const fs = require("fs");
const ora = require("ora").default;
const chalk = require("chalk");
const boxen = require("boxen").default;
const glob = require("glob");
const acorn = require("acorn");
const walk = require("acorn-walk");
const { loadConfig } = require("./config");

function detectRisk(argsSource, config) {
  const text = argsSource.toLowerCase();

  for (const pattern of config.risk.critical) {
    if (text.includes(pattern.toLowerCase())) return "critical";
  }
  for (const pattern of config.risk.high) {
    if (text.includes(pattern.toLowerCase())) return "high";
  }
  for (const pattern of config.risk.medium) {
    if (text.includes(pattern.toLowerCase())) return "medium";
  }

  return null;
}

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
          const argsSource = code.slice(
            node.arguments[0]?.start ?? node.start,
            node.arguments[node.arguments.length - 1]?.end ?? node.end,
          );
          const risk =
            node.arguments.length > 0 ? detectRisk(argsSource, config) : null;

          logs.push({
            file,
            line: node.loc.start.line,
            type: node.callee.property.name,
            risk,
            argsSource,
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

  // risk badge helper
  const riskBadge = (risk) => {
    if (risk === "critical") return chalk.bgRed.white(" CRITICAL ");
    if (risk === "high") return chalk.bgYellow.black(" HIGH ");
    if (risk === "medium") return chalk.bgCyan.black(" MEDIUM ");
    return "";
  };

  // pull out critical ones first — can't miss them
  const criticals = results.filter((r) => r.risk === "critical");
  if (criticals.length > 0) {
    console.log(
      chalk.red.bold("\n  ⚠ CRITICAL RISK — potential secret leaks:\n"),
    );
    criticals.forEach((log) => {
      console.log(
        `    ${riskBadge("critical")} ${chalk.gray(log.file)}${chalk.gray(`:${log.line}`)}`,
      );
      console.log(
        `      ${chalk.gray("→")} console.${chalk.yellow(log.type)}(${chalk.red(log.argsSource)})\n`,
      );
    });
  }

  // then print all files grouped
  console.log("");
  Object.keys(grouped).forEach((file) => {
    console.log(chalk.cyan.bold(`  ${file}`));

    grouped[file].forEach((log) => {
      const badge = riskBadge(log.risk);
      const args = log.argsSource ? chalk.gray(`(${log.argsSource})`) : "";
      console.log(
        `    ${chalk.gray("→")} console.${chalk.yellow(log.type)}${args} ${chalk.gray(`:${log.line}`)} ${badge}`,
      );
    });

    console.log("");
  });

  // summary box
  const criticalCount = results.filter((r) => r.risk === "critical").length;
  const highCount = results.filter((r) => r.risk === "high").length;

  console.log(
    boxen(
      chalk.yellow(
        ` Found ${results.length} console statement${results.length === 1 ? "" : "s"} across ${Object.keys(grouped).length} file${Object.keys(grouped).length === 1 ? "" : "s"}\n`,
      ) +
        (criticalCount > 0
          ? chalk.red(` 🔴 ${criticalCount} critical\n`)
          : "") +
        (highCount > 0 ? chalk.yellow(` 🟡 ${highCount} high risk\n`) : "") +
        chalk.gray(" Run logcop fix to remove them"),
      { padding: 1, borderColor: criticalCount > 0 ? "red" : "yellow" },
    ),
  );
}
module.exports = { scanProject, parseFile };
