const fs = require("fs");
const path = require("path");

const defaults = {
  ignore: ["node_modules/**", "dist/**", "build/**", "coverage/**", ".next/**"],
  keep: [],
  risk: {
    critical: [
      "process.env",
      "password",
      "secret",
      "token",
      "apiKey",
      "api_key",
      "privateKey",
      "private_key",
      "jwt",
      "Authorization",
      "accessToken",
      "access_token",
      "clientSecret",
      "client_secret",
    ],
    high: [
      "user",
      "userData",
      "currentUser",
      "req.body",
      "request.body",
      "response.data",
      "result",
      "headers",
      "req.headers",
      "config",
      "settings",
      "db",
      "connection",
      "connectionString",
    ],
    medium: [
      "email",
      "phone",
      "ssn",
      "payload",
      "data",
      "body",
      "res",
      "ctx",
      "context",
    ],
  },
};

function loadConfig() {
  const configPath = path.join(process.cwd(), "logcop.config.js");

  // no config file found, use defaults
  if (!fs.existsSync(configPath)) {
    return defaults;
  }

  try {
    const userConfig = require(configPath);

    // deep merge
    return {
      ignore: userConfig.ignore || defaults.ignore,
      keep: userConfig.keep || defaults.keep,
      risk: {
        critical: userConfig.risk?.critical || defaults.risk.critical,
        high: userConfig.risk?.high || defaults.risk.high,
        medium: userConfig.risk?.medium || defaults.risk.medium,
      },
    };
  } catch (e) {
    console.warn("⚠ Could not load logcop.config.js, using defaults.");
    return defaults;
  }
}

module.exports = { loadConfig };
