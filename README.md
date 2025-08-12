# Discord Notify GitHub Action

[![PR validation](https://github.com/niranjanshk27/discord-notify/actions/workflows/check-pr.yml/badge.svg)](https://github.com/niranjanshk27/discord-notify/actions/workflows/check-pr.yml)

**Discord Notify** is a GitHub Action that sends build, release, or workflow notifications to a Discord channel using a webhook. It supports both simple text messages and rich embed messages, making it easy to keep your team updated on repository events directly in Discord.

---

## Usage

### 1. Content Only (Simple Text Message)

To send a plain text message to your Discord channel:

```yaml
- name: Send Discord Notification (Text Only)
  uses: niranjanshk27/discord-notify@main
  with:
    WEBHOOK: ${{ secrets.DISCORD_WEBHOOK }}
    CONTENT: "✅ Build passed for PR #${{ github.event.pull_request.number }}"
    EMBEDS: "false"
```

**Required Inputs:**
- `WEBHOOK`: Your Discord webhook URL (store as a secret).
- `CONTENT`: The message to send.
- `EMBEDS`: Set to `"false"` for plain text.

---

### 2. With Embeds (Rich Message)

To send a rich embed message (with color, title, and more):

```yaml
- name: Send Discord Notification (With Embed)
  uses: niranjanshk27/discord-notify@main
  with:
    WEBHOOK: ${{ secrets.DISCORD_WEBHOOK }}
    TITLE: "Build Status"
    CONTENT: "Build and tests completed for PR #${{ github.event.pull_request.number }}"
    EMBEDS: "true"
    RESULT: "success"
```

**Additional Inputs for Embeds:**
- `TITLE`: The title for the embed.
- `RESULT`: Can be `"success"`, `"failure"`, or `"cancelled"` to color the embed.
- `EMBEDS`: Set to `"true"` to enable embed formatting.

---

## Example Workflow

Here's a full example of how to use the action in a workflow:

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: yarn install
      - run: yarn test
      - run: yarn build

      - name: Notify Discord (Embed)
        if: success()
        uses: niranjanshk27/discord-notify@main
        with:
          WEBHOOK: ${{ secrets.DISCORD_WEBHOOK }}
          TITLE: "CI Passed"
          CONTENT: "All checks passed for PR #${{ github.event.pull_request.number }}"
          EMBEDS: "true"
          RESULT: "success"
```

---

## Inputs Reference

| Name             | Required | Description                                      |
|------------------|----------|--------------------------------------------------|
| `WEBHOOK`        | Yes      | Discord webhook URL                              |
| `CONTENT`        | No       | Message to send                                  |
| `TITLE`          | No       | Title for embed                                  |
| `EMBEDS`         | No       | `"true"` for embed, `"false"` for plain text     |
| `RESULT`         | No       | `"success"`, `"failure"`, or `"cancelled"`       |
| `ANDROID_RESULT` | No       | Android build result (for release flows)         |
| `IOS_RESULT`     | No       | iOS build result (for release flows)             |
| `CHANGELOG`      | No       | `"true"` to include changelog link in embed      |
| `RELEASE_VERSION`| No       | Version string for release notification          |

---

## Notes

- The action can be used at any step in your workflow to notify about builds, releases, or custom events.
- For more advanced usage (changelogs, platform-specific results), see the action's README or source.

---
