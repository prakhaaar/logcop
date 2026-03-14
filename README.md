# 🚓 logcop

<p align="center">
  <img src="./logcop.png" alt="logcop" width="600" />
</p>

### Detect. Remove. Protect.

---

You're three hours deep into a bug.

You've added `console.log` everywhere function arguments, API responses, auth tokens, the whole request object. You finally find the bug, fix it, close the laptop.

You forgot to remove the logs.

They ship. They hit production. Your JWT is now sitting in Datadog. Your `user.password` is in CloudWatch. Your entire `process.env` just got logged in a platform that your whole team and maybe your infrastructure vendor has access to.

You didn't mean to do it. Nobody does. That's exactly the problem.

**logcop is the last check before code leaves your machine.**

```bash
npx logcop scan
```

---

## The problem is bigger than you think

Every developer debugs with `console.log`. It's fast, it's easy, it works. The issue isn't the logs themselves it's what they contain, and that they never get cleaned up.

Here's what a typical debugging session looks like:

```js
console.log("user object:", user); // contains email, role, password hash
console.log("auth response:", response.data); // contains JWT token
console.log("env check:", process.env); // contains every secret in your app
console.log("request body:", req.body); // contains raw user input
console.log("here"); // the classic
```

Five logs. Four of them are a security incident waiting to happen.

The code works so you ship it. The logs go with it. Now those values are streaming into your log aggregator on every request silently, permanently, until someone notices or something goes wrong.

This is not a hypothetical. It happens constantly. It happens to senior engineers. It happens at companies with security teams. It happens because cleanup is the last thing on your mind when you've finally fixed the bug.

logcop makes cleanup automatic.

---

## What it does

Scans your entire codebase for every `console.log`, `console.error`, `console.warn`, and `console.debug` and tells you not just that they exist, but **what they're logging and how dangerous it is.**

```
✔ Scan completed

  ⚠ CRITICAL RISK  potential secret leaks:

    CRITICAL  src/auth.js:14
      → console.log(password)

    CRITICAL  src/api.js:8
      → console.log(process.env)

  src/auth.js
    → console.log(password) :14        CRITICAL
    → console.log(token) :22           CRITICAL
    → console.log(user) :31            HIGH
    → console.log("starting app") :45

┌──────────────────────────────────────────────────┐
│                                                  │
│   Found 4 console statements across 1 file       │
│   🔴 2 critical                                  │
│   🟡 1 high risk                                 │
│   Run logcop fix to remove them                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

This is the difference between logcop and ESLint's `no-console`:

ESLint sees `console.log(x)` and flags it.
logcop looks **inside** and tells you `x` is your JWT token.

---

## Install

```bash
npm install -g logcop
```

Or run without installing:

```bash
npx logcop scan
```

---

## Commands

### Scan

```bash
logcop scan
```

Scans every `.js`, `.ts`, `.jsx`, `.tsx` file in your project. Prints results grouped by file with risk levels inline. Critical findings are pulled to the top impossible to miss.

### Fix

```bash
logcop fix
```

Removes all console statements automatically. Handles trailing semicolons, blank lines, and indentation leaves your code clean, not full of ghost whitespace.

```bash
logcop fix --dry-run
```

Preview exactly what would be removed before touching anything. Always a good idea before running on a real codebase.

### Comment

```bash
logcop comment
```

Not ready to delete? Comments them out instead of removing them:

```js
// console.log(user) // logcop: disabled
```

Non-destructive, reversible, and still silences the output. Useful when you want to keep the log for reference but not have it run.

```bash
logcop comment --dry-run
```

### Git Hook

```bash
logcop install-hook
```

Installs a git pre-commit hook that runs `logcop scan --ci` before every commit. If console statements are found, the commit is blocked. One command. No configuration. Works forever.

### CI Mode

```bash
logcop scan --ci
```

Exits with code `1` if any console statements are found, `0` if the project is clean. Drop this into any pipeline and no console statement ever merges to main again.

### JSON Output

```bash
logcop scan --json
```

Machine-readable output for pipelines, scripts, dashboards, and custom tooling:

```json
{
  "total": 4,
  "files": 1,
  "critical": 2,
  "high": 1,
  "results": [
    {
      "file": "src/auth.js",
      "line": 14,
      "type": "log",
      "risk": "critical",
      "argsSource": "password"
    }
  ]
}
```

---

## Risk Levels

logcop doesn't just find console statements it reads their arguments and scores them by how dangerous they are. String contents are ignored. Only actual variable names and object properties are checked, so `console.log("request failed")` won't be flagged but `console.log(request)` will.

| Level       | What it catches                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| 🔴 Critical | `password`, `secret`, `token`, `apiKey`, `jwt`, `privateKey`, `Authorization`, `process.env`, `accessToken`, `clientSecret` |
| 🟡 High     | `user`, `userData`, `req.body`, `headers`, `config`, `db`, `connectionString`, `response.data`                              |
| 🟢 Medium   | `email`, `phone`, `payload`, `data`, `body`                                                                                 |

Critical findings are always shown first, separated from the rest of the output. If your scan has red you should not ship.

---

## GitHub Actions

Add this to your repo and logcop runs on every pull request:

```yaml
# .github/workflows/logcop.yml
name: logcop

on: [pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npx logcop scan --ci
```

PRs with console statements fail the check. They cannot merge until the logs are removed or the risk is reviewed. This is the zero-effort way to make console hygiene a team standard without adding it to your code review checklist.

---

## Config

Create `logcop.config.js` in your project root to customize behavior for your team:

```js
module.exports = {
  // folders to skip
  ignore: ["node_modules/**", "dist/**", "build/**"],

  // console methods to never touch
  // useful if your team uses console.error for intentional error logging
  keep: ["error", "warn"],

  // customize risk patterns to match your codebase
  risk: {
    critical: ["password", "secret", "token", "process.env", "apiKey", "jwt"],
    high: ["user", "userData", "req.body", "headers", "config", "db"],
    medium: ["email", "phone", "payload"],
  },
};
```

Commit this file to your repo and the whole team runs with the same rules. No per-developer configuration needed.

---

## Why not just use ESLint?

You probably already have ESLint. You might already have `no-console` enabled. Here's why that's not enough:

ESLint tells you a log exists. It has no idea what's inside it. `console.log(password)` and `console.log("hello")` look identical to ESLint both get flagged the same way, both get fixed the same way.

logcop treats them differently because they are different. One is noise. One is a credentials leak.

Beyond that logcop gives you choices. You can fix, comment, preview, or just scan. You can keep `error` and `warn` while removing `log` and `debug`. You can run it in CI, wire it to a git hook, or pipe its output as JSON into your own tooling.

It's not a replacement for ESLint. It's the thing ESLint can't do.

---

## Roadmap

- [x] Console statement detection
- [x] Security risk scanner
- [x] Auto-fix with clean removal
- [x] Comment mode
- [x] Dry run mode
- [x] Git hook integration
- [x] CI/CD pipeline mode
- [x] JSON output
- [x] Team config file

---

## License

MIT © Prakhar Mishra
