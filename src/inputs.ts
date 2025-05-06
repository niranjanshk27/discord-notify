import * as core from "@actions/core";

export interface Inputs {
  webhook: string;
  content?: string;
  title?: string;
  color?: number;
  android_result?: string;
  ios_result?: string;
  result?: string;
  changelog?: boolean;
  release_version?: string;
  embeds?: boolean;
}

function stringToBoolen(str: string | null | undefined): boolean {
  if (!str) return false;
  return str.toLowerCase() === 'true';
}

export function getInputs(): Inputs {
  const webhook = core.getInput("WEBHOOK");
  
  const inputs: Inputs = {
    webhook: webhook,
    title: core.getInput("TITLE"),
    android_result: core.getInput("ANDROID_RESULT"),
    ios_result: core.getInput("IOS_RESULT"),
    changelog: stringToBoolen(core.getInput("CHANGELOG")),
    release_version: core.getInput("RELEASE_VERSION"),
    embeds: stringToBoolen(core.getInput("EMBEDS")),
    result: core.getInput("RESULT"),
    content: core.getInput("CONTENT"),
  };

  if (!webhook) {
    core.warning("No webhook URL was provided");
  }

  return inputs;
}

interface ColorOption {
  status: string;
  color: number;
  emoji: string;
}

export const emojiOption: Record<string, ColorOption> = {
  success: {
    status: "Success",
    color: 0x28a745,
    emoji: ":white_check_mark:",
  },
  failure: {
    status: "Failure",
    color: 0xcb2431,
    emoji: ":x:",
  },
  cancelled: {
    status: "Cancelled",
    color: 0xdbab09,
    emoji: ":x:",
  },
};
