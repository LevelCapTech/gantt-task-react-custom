const { evaluateAudit } = require("../../scripts/ci/check-npm-audit-gate.mjs");

describe("check-npm-audit-gate", () => {
  test("passes when all high/critical findings are approved and the production audit is clean", () => {
    const initialAudit = {
      metadata: { vulnerabilities: { high: 1, critical: 0 } },
      vulnerabilities: {
        "example-package": {
          severity: "high",
          via: [
            {
              source: "GHSA-example-1",
              url: "https://github.com/advisories/GHSA-example-1",
            },
          ],
        },
      },
    };

    const exceptions = [
      {
        id: "GHSA-example-1",
        package: "example-package",
        severity: "high",
        appliesTo: "both",
        approvedBy: "maintainer",
        approvedAt: "2026-01-01T00:00:00.000Z",
        reason: "Approved exception",
        trackingIssue: "#123",
        expiresAt: "2030-12-31T00:00:00.000Z",
      },
    ];

    const result = evaluateAudit({
      auditJson: initialAudit,
      omitDevJson: { metadata: { vulnerabilities: { high: 0, critical: 0 } }, vulnerabilities: {} },
      exceptions,
      reactVersion: "18",
    });

    expect(result.approved).toBe(true);
  });

  test("fails when a high severity finding is not in the exceptions registry", () => {
    const audit = {
      metadata: { vulnerabilities: { high: 1, critical: 0 } },
      vulnerabilities: {
        "example-package": {
          severity: "high",
          via: [{ source: "GHSA-example-2", url: "https://github.com/advisories/GHSA-example-2" }],
        },
      },
    };

    expect(() =>
      evaluateAudit({
        auditJson: audit,
        omitDevJson: { metadata: { vulnerabilities: { high: 0, critical: 0 } }, vulnerabilities: {} },
        exceptions: [],
        reactVersion: "19",
      })
    ).toThrow(/Unapproved high\/critical vulnerabilities detected/);
  });

  test("fails closed when an exception has an invalid expiresAt and when the payload is malformed", () => {
    const audit = {
      metadata: { vulnerabilities: { high: 1, critical: 0 } },
      vulnerabilities: {
        "example-package": {
          severity: "high",
          via: [{ source: "GHSA-example-3", url: "https://github.com/advisories/GHSA-example-3" }],
        },
      },
    };

    const invalidExpiryExceptions = [
      {
        id: "GHSA-example-3",
        package: "example-package",
        severity: "high",
        appliesTo: "both",
        approvedBy: "maintainer",
        approvedAt: "2026-01-01T00:00:00.000Z",
        reason: "Approved exception",
        trackingIssue: "#123",
        expiresAt: "TBD",
      },
    ];

    expect(() =>
      evaluateAudit({
        auditJson: audit,
        omitDevJson: { metadata: { vulnerabilities: { high: 0, critical: 0 } }, vulnerabilities: {} },
        exceptions: invalidExpiryExceptions,
        reactVersion: "18",
      })
    ).toThrow(/Exception expired for example-package \/ GHSA-example-3/);

    expect(() =>
      evaluateAudit({
        auditJson: { metadata: { vulnerabilities: { high: 1, critical: 0 } }, vulnerabilities: null },
        omitDevJson: { metadata: { vulnerabilities: { high: 0, critical: 0 } }, vulnerabilities: {} },
        exceptions: [],
        reactVersion: "18",
      })
    ).toThrow(/missing a valid vulnerabilities object/);
  });

  test("resolves string via IDs recursively and treats same-day expiry as expired", () => {
    const audit = {
      metadata: { vulnerabilities: { high: 1, critical: 0 } },
      vulnerabilities: {
        "alpha": {
          severity: "high",
          via: ["beta"],
        },
        "beta": {
          severity: "high",
          via: [{ source: "GHSA-example-4", url: "https://github.com/advisories/GHSA-example-4" }],
        },
      },
    };

    const now = new Date();
    const sameDay = new Date(now.getTime()).toISOString();

    expect(() =>
      evaluateAudit({
        auditJson: audit,
        omitDevJson: { metadata: { vulnerabilities: { high: 0, critical: 0 } }, vulnerabilities: {} },
        exceptions: [{
          id: "GHSA-example-4",
          package: "alpha",
          severity: "high",
          appliesTo: "both",
          approvedBy: "maintainer",
          approvedAt: "2026-01-01T00:00:00.000Z",
          reason: "Approved exception",
          trackingIssue: "#123",
          expiresAt: sameDay,
        }],
        reactVersion: "18",
      })
    ).toThrow(/Exception expired for alpha \/ GHSA-example-4/);
  });
});
