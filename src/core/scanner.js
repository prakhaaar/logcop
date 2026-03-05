const ora = require("ora").default;
const chalk = require("chalk");
const boxen = require("boxen").default;
const glob = require("glob");

async function scanProject() {
  const spinner = ora("Scanning project...").start();

  //real engine for the file scan/
  const files = glob.sync("**/*.{js,ts,jsx,tsx}", {
    ignore: ["node_modules/**"],
  });

  spinner.succeed(chalk.green("Scan completed"));

  console.log(
    boxen(chalk.yellow(` Found ${files.length} JavaScript files in project`), {
      padding: 1,
      borderColor: "yellow",
    }),
  );

  files.slice(0, 10).forEach((file) => {
    console.log(" - " + file);
  });
}

module.exports = { scanProject };
