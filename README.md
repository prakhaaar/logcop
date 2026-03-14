# 🚓 logcop

You debug with `console.log`. Everyone does.

You add 10 of them chasing a bug, fix it, and move on.
Three of them just shipped to production.
One of them was logging `user.password`.

logcop finds them before that happens.

```bash
npx logcop scan
```

---

## What it does

Scans your codebase for every `console.log`, `console.error`, `console.warn`, and `console.debug` — and tells you which ones are just noise and which ones are a security problem.

```
✔ Scan completed

  ⚠ CRITICAL RISK — potential secret leaks:

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

The difference between ESLint `no-console` and logcop:

ESLint sees `console.log(x)` and flags it.
logcop looks **inside** and tells you `x` is your JWT token.

---

## Install

```bash
npm install -g logcop
```

Or without installing:

```bash
npx logcop scan
```

---

## Commands

### Scan

```bash
logcop scan
```

Scans every `.js`, `.ts`, `.jsx`, `.tsx` file and prints results grouped by file with risk levels.

### Fix

```bash
logcop fix
```

Removes all console statements. Cleans up trailing semicolons and blank lines left behind.

```bash
logcop fix --dry-run
```

Preview what would be removed without touching any files.

### Comment

```bash
logcop comment
```

Not ready to delete? Comments them out instead:

```js
// console.log(user) // logcop: disabled
```

Safe, reversible, and still silences the output.

```bash
logcop comment --dry-run
```

### Git Hook

```bash
logcop install-hook
```

Installs a pre-commit hook. Blocks any commit that contains console statements. One command, done.

### CI Mode

```bash
logcop scan --ci
```

Exits with code `1` if any console statements are found. Drop it into any pipeline to block bad PRs automatically.

### JSON Output

```bash
logcop scan --json
```

Machine-readable output for pipelines, scripts, and custom tooling:

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

logcop reads the arguments of every console statement — not just that it exists, but **what it's logging**.

| Level       | Patterns                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| 🔴 Critical | `password`, `secret`, `token`, `apiKey`, `jwt`, `privateKey`, `Authorization`, `process.env`, `accessToken`, `clientSecret` |
| 🟡 High     | `user`, `userData`, `req.body`, `headers`, `config`, `db`, `connectionString`, `response.data`                              |
| 🟢 Medium   | `email`, `phone`, `payload`, `data`, `body`                                                                                 |

String contents are ignored — `console.log("request failed")` won't be flagged. Only actual variable names and object properties are checked.

---

## GitHub Actions

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

Add this and no console statement ever merges to main again.

---

## Config

Create `logcop.config.js` in your project root:

```js
module.exports = {
  // folders to skip
  ignore: ["node_modules/**", "dist/**", "build/**"],

  // console methods to never touch
  keep: ["error", "warn"],

  // customize what gets flagged
  risk: {
    critical: ["password", "secret", "token", "process.env", "apiKey", "jwt"],
    high: ["user", "userData", "req.body", "headers", "config", "db"],
    medium: ["email", "phone", "payload"],
  },
};
```

`keep: ["error", "warn"]` is useful if your team uses `console.error` intentionally — logcop will leave those alone and only touch `console.log` and `console.debug`.

---

## The real reason this exists

Debugging means adding console logs everywhere. That's normal. That's how you find bugs.

The problem isn't the logs — it's forgetting to remove them.

With agentic coding on the rise, more code is being written and shipped faster than ever. The gap between "writing code" and "shipping code" is shrinking. That gap is where cleanup used to happen.

A `console.log(token)` in a Node.js server dumps your JWT into stdout. That stdout goes into your logging platform. That logging platform has 10 people with access.

You didn't mean to ship it. You were debugging at 2am and forgot to clean up.

logcop catches it.

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
- [ ] `logcop init` — generate config file
- [ ] API response leak detection (`res.json(user)`)
- [ ] localStorage leak detection
- [ ] Watch mode

---

## License

MIT © Prakhar Mishra
