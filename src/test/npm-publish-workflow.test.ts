import fs from "fs";
import path from "path";

const workflowPath = path.join(
  process.cwd(),
  ".github",
  "workflows",
  "npm-publish.yml"
);
const workflowContent = fs.readFileSync(workflowPath, "utf8");

describe("npm-publish workflow tag strategy", () => {
  test("uses vX.Y.Z tag trigger", () => {
    expect(workflowContent).toMatch(/tags:\s*\n\s*-\s+"v\*\.\*\.\*"/);
  });

  test("does not reference legacy release_levelcaptech tags", () => {
    expect(workflowContent).not.toContain("release_levelcaptech/");
  });

  test("validates tag version format and error message", () => {
    const expectedVersionSnippet = [
      'EXPECTED_VERSION="',
      "$",
      '{GITHUB_REF#refs/tags/v}"',
    ].join("");
    expect(workflowContent).toContain(expectedVersionSnippet);
    expect(workflowContent).toContain(
      'VERSION_PATTERN="^[0-9]+\\.[0-9]+\\.[0-9]+$"'
    );
    expect(workflowContent).toContain("Expected vX.Y.Z");
  });
});
