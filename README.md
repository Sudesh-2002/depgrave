# 🪦 depgrave

Analyzes your full dependency tree and shows for each package:

- 📅 Last commit date
- 🔓 Open CVEs with real CVSS scores
- 🚌 Bus factor (active maintainers)
- 📊 Risk score (0–100)

## Install

```bash
npm install -g depgrave
```

Or run without installing:

```bash
npx depgrave ./my-project
```

## Usage

```bash
# scan current directory
depgrave

# scan a specific project
depgrave ./path/to/project

# export JSON report
depgrave ./my-project --output report.json

# export CSV
depgrave ./my-project --output report.csv

# scan only first N packages
depgrave ./my-project --limit 50

# CI mode — exit code 1 if critical packages found
depgrave ./my-project --fail-on critical

# cache utilities
depgrave --cache-stats
depgrave --clear-cache
```

## Risk Score

Each package is scored 0–100 based on:

| Signal | Weight | Source |
|---|---|---|
| CVE severity (CVSS v3) | 0–40 pts | OSV.dev |
| Commit recency | 0–25 pts | GitHub API |
| Bus factor | 0–20 pts | GitHub API |
| Download popularity | 0–15 pts | npm API |

| Score | Risk Level |
|---|---|
| 0–25 | 🟢 Low |
| 26–50 | 🟡 Medium |
| 51–75 | 🟠 High |
| 76–100 | 🔴 Critical |

## GitHub Token

Set a GitHub token to avoid rate limiting (5000 req/hr vs 60/hr):

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

Or create a `.env` file in your project:

```
GITHUB_TOKEN=ghp_your_token_here
```

## CI Integration

```yaml
- name: Run depgrave
  run: npx depgrave . --output report.json --fail-on critical
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## License

MIT