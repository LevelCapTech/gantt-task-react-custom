import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const DEFAULT_EXCEPTIONS_PATH = path.resolve(".github/security/npm-audit-exceptions.json");
const REPO_ROOT = process.cwd();

function parseArgs(argv) {
  const args = { react: "18" };
  for (const raw of argv) {
    if (!raw.startsWith("--")) continue;
    if (raw.startsWith("--react=")) {
      args.react = raw.slice("--react=".length);
    } else if (raw.startsWith("--exceptions-file=")) {
      args.exceptionsFile = raw.slice("--exceptions-file=".length);
    } else if (raw.startsWith("--audit-json=")) {
      args.auditJsonFile = raw.slice("--audit-json=".length);
    } else if (raw.startsWith("--omit-dev-json=")) {
      args.omitDevJsonFile = raw.slice("--omit-dev-json=".length);
    }
  }
  return args;
}

function readJson(filePath, label) {
  if (!existsSync(filePath)) {
    throw new Error(`${label} file does not exist: ${filePath}`);
  }
  const raw = readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${filePath}`);
  }
}

function runAuditCommand(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: process.env,
  });

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";

  if (result.error) {
    throw new Error(`${label} execution failed: ${result.error.message}`);
  }

  if (!stdout.trim()) {
    throw new Error(`${label} returned no output`);
  }

  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`${label} produced invalid JSON`);
  }

  return {
    code: result.status,
    stdout,
    stderr,
    parsed,
  };
}

function normalizeViaKeys(via) {
  if (!via) return [];
  const items = Array.isArray(via) ? via : [via];
  const ids = [];
  for (const item of items) {
    if (typeof item === "string") {
      ids.push(item);
    } else if (item && typeof item === "object") {
      if (typeof item.url === "string") {
        const match = item.url.match(/GHSA-[a-z0-9-]+/i);
        if (match) ids.push(match[0]);
        else if (typeof item.source === "string") ids.push(item.source);
      } else if (typeof item.source === "string") {
        ids.push(item.source);
      }
    }
  }
  return [...new Set(ids)];
}

function resolveAdvisoryIdsForPackage(vulnerabilities, packageName, visited = new Set()) {
  const node = vulnerabilities[packageName];
  if (!node || !node.via) return [];
  if (visited.has(packageName)) return [];
  visited.add(packageName);

  const ids = [];
  const viaEntries = Array.isArray(node.via) ? node.via : [node.via];
  for (const entry of viaEntries) {
    if (typeof entry === "string") {
      const targetPackage = entry;
      const targetIds = resolveAdvisoryIdsForPackage(vulnerabilities, targetPackage, new Set(visited));
      if (targetIds.length > 0) {
        ids.push(...targetIds);
      } else {
        const targetNode = vulnerabilities[targetPackage];
        if (targetNode && targetNode.via && Array.isArray(targetNode.via)) {
          ids.push(...normalizeViaKeys(targetNode.via));
        }
      }
      continue;
    }
    if (entry && typeof entry === "object") {
      const id = entry.url ? entry.url.match(/GHSA-[a-z0-9-]+/i)?.[0] : null;
      if (id) {
        ids.push(id);
      } else if (typeof entry.source === "string") {
        ids.push(entry.source);
      }
    }
  }
  return [...new Set(ids)];
}

function parseExceptions(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Exception registry not found: ${filePath}`);
  }
  const parsed = readJson(filePath, "Exception registry");
  if (!Array.isArray(parsed)) {
    throw new Error("Exception registry must be an array");
  }
  return parsed;
}

function isExpired(exception) {
  if (!exception || !exception.expiresAt) return true;
  return new Date(exception.expiresAt).getTime() <= Date.now();
}

function evaluateAudit({ auditJson, omitDevJson, exceptions, reactVersion }) {
  const auditEntries = auditJson && auditJson.vulnerabilities ? auditJson.vulnerabilities : {};
  const omitDevEntries = omitDevJson && omitDevJson.vulnerabilities ? omitDevJson.vulnerabilities : {};

  if (omitDevJson && ((omitDevJson.metadata?.vulnerabilities?.high || 0) > 0 || (omitDevJson.metadata?.vulnerabilities?.critical || 0) > 0)) {
    throw new Error(`Production dependency scan failed: high/critical vulnerabilities remain in --omit=dev`);
  }

  const highCriticalKeys = [];
  for (const [packageName, entry] of Object.entries(auditEntries)) {
    const severity = typeof entry.severity === "string" ? entry.severity.toLowerCase() : "moderate";
    if (severity !== "high" && severity !== "critical") continue;

    const advisoryIds = resolveAdvisoryIdsForPackage(auditEntries, packageName, new Set());
    if (advisoryIds.length === 0) {
      throw new Error(`Unable to resolve advisory IDs for ${packageName} in react ${reactVersion}`);
    }

    for (const advisoryId of advisoryIds) {
      const matched = exceptions.find((exception) => {
        return (
          exception.package === packageName &&
          exception.id === advisoryId &&
          exception.severity === severity &&
          exception.appliesTo && (
            exception.appliesTo === "both" ||
            exception.appliesTo === reactVersion
          )
        );
      });

      if (!matched) {
        highCriticalKeys.push({ packageName, advisoryId, severity, job: `react${reactVersion}` });
        continue;
      }

      if (isExpired(matched)) {
        throw new Error(`Exception expired for ${packageName} / ${advisoryId} (${matched.expiresAt})`);
      }
    }
  }

  if (highCriticalKeys.length > 0) {
    const details = highCriticalKeys
      .map((item) => `${item.packageName}:${item.advisoryId}:${item.severity}:${item.job}`)
      .join(" | ");
    throw new Error(`Unapproved high/critical vulnerabilities detected: ${details}`);
  }

  return { approved: true, omitDevEntries };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const reactVersion = args.react || "18";
  const exceptionsPath = args.exceptionsFile || DEFAULT_EXCEPTIONS_PATH;

  try {
    const exceptions = parseExceptions(exceptionsPath);
    const auditJsonPath = args.auditJsonFile || "";
    const omitDevJsonPath = args.omitDevJsonFile || "";

    const auditData = auditJsonPath ? readJson(auditJsonPath, "Audit JSON") : runAuditCommand("npm", ["audit", "--json"], "npm audit --json").parsed;
    const omitDevData = omitDevJsonPath ? readJson(omitDevJsonPath, "Omit dev audit JSON") : runAuditCommand("npm", ["audit", "--omit=dev", "--json"], "npm audit --omit=dev --json").parsed;

    evaluateAudit({ auditJson: auditData, omitDevJson: omitDevData, exceptions, reactVersion });

    console.log(`PASS react${reactVersion}: audit gate satisfied`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL react${reactVersion}: ${message}`);
    return 1;
  }
}

if (typeof process !== "undefined" && process.argv && process.argv[1] && process.argv[1].endsWith("check-npm-audit-gate.mjs")) {
  process.exitCode = main();
}

export {
  evaluateAudit,
  main,
  parseArgs,
  parseExceptions,
  resolveAdvisoryIdsForPackage,
  normalizeViaKeys,
};
