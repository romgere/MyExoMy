module.exports = {
  branches: [
    "main"
  ],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { type: "chore", release: "patch" }
        ]
      }
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalCommits",
        // See default "presetConfig" here :
        // https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-changelog-conventionalcommits/writer-opts.js#L181
        presetConfig: {
          types: [
            {
              type: "feat",
              section: "Features"
            },
            {
              type: "fix",
              section: "Bug Fixes"
            },
            {
              type: "perf",
              section: "Performance Improvements"
            },
            {
              type: "docs",
              section: "Documentation",
              hidden: false
            },
            {
              type: "chore",
              section: "Internal",
              hidden: false
            },
            {
              type: "refactor",
              section: "Internal",
              hidden: false
            },
            {
              type: "test",
              section: "Internal",
              hidden: false
            },
            {
              type: "build",
              section: "Internal",
              hidden: false
            },
            {
              type: "ci",
              section: "Internal",
              hidden: false
            }
          ]
        }
      }
    ],
    [
      "semantic-release-slack-bot",
      {
        slackIcon: ":cms_sheep:",
        slackName: "Docs CLI release bot",
        notifyOnSuccess: true,
        notifyOnFail: true,
        onSuccessTemplate: {
          text: "<!subteam^S02L4RFCMNJ> A new version of $package_name with version $npm_package_version has been released"
        },
        onFailTemplate: {
          text: "<!subteam^S02L4RFCMNJ> A error occured while publishing $package_name"
        }
      }
    ],
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git"
  ]
}
