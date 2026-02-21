// commitlint.config.cjs
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // 最低限の統一と読みやすさ
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "refactor", "test", "chore", "ci", "build", "perf", "revert"],
    ],
    "subject-empty": [2, "never"],
    "header-max-length": [2, "always", 100],

    // 日本語運用を想定し、case系で事故らないようにする
    "subject-case": [0],
  },
};
