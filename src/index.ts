import * as core from "@actions/core";
import * as github from "@actions/github";
import axios from "axios";
import { getInputs, Inputs } from "./inputs";

// Main execution function for action
export async function run(): Promise<void> {
  try {
    core.debug("Getting Inputs");
    const inputs = getInputs();
    
    if (!inputs.webhook) {
      throw new Error("Webhook URL is required");
    }

    core.debug("Generating payload");
    const payload = buildPayload(inputs);

    core.info(`Sending webhook notification for ${github.context.repo.repo} ${inputs.release_version || ""}`);
    await sendWebhook(inputs.webhook, payload);
    core.info("✅ Webhook notification sent successfully");

  } catch (error) {
    handleError(error);
  }
}

// Build webhook payload
export function buildPayload(inputs: Readonly<Inputs>): Record<string, any> {
  const ctx = github.context;
  const { owner, repo } = ctx.repo;
  const { serverUrl, runId } = ctx;
  
  const repoUrl = `${serverUrl}/${owner}/${repo}`;
  const workflowUrl = `${repoUrl}/actions/runs/${runId}`;

  // Default color for embed (Discord green)
  const SUCCESS_COLOR = 2664261; // Green
  const FAILURE_COLOR = 13313073; // Red
  const NEUTRAL_COLOR = 6061450; // Blue/gray

  // Determine the overall status
  const androidSuccess = inputs.android_result === "success";
  const iosSuccess = inputs.ios_result === "success";
  const allSuccess = androidSuccess && iosSuccess;
  const anyFailure = (inputs.android_result && !androidSuccess) || (inputs.ios_result && !iosSuccess);

  let embed: Record<string, any> = {
    color: anyFailure ? FAILURE_COLOR : (allSuccess ? SUCCESS_COLOR : NEUTRAL_COLOR),
    title: inputs.title || `:rocket: ${repo}`,
    url: workflowUrl,
    description: `### ${repo} ${inputs.release_version || ""}`
  };

  // Build description according to platform
  if (inputs.android_result || inputs.ios_result) {
    let platformStatus = '\n\n';

    if(inputs.android_result) {
      platformStatus += `Android - ${androidSuccess ? ":white_check_mark:" : ":x: :no_entry:"}\n`
    }

    if(inputs.ios_result) {
      platformStatus += `iOS - ${iosSuccess ? ":white_check_mark:" : ":x: :no_entry:"}`
    }

    // Only add platform status if we have results
    if (platformStatus !== '\n\n') {
      embed.description += platformStatus;
    }
  }

  // Add fields in embed
  embed.fields = [];

  // Add changelog if available
  if (inputs.changelog && inputs.release_version) {
    embed.fields.push({
      name: "Changelogs",
      value: `[View Release Notes](${repoUrl}/releases/tag/${inputs.release_version})`,
    });
  }

  // Add workflowUrl
  embed.fields.push({
    name: "Workflow",
    value: `[View Workflow Run](${workflowUrl})`,
  })

  // Add timestamp
  embed.timestamp = new Date().toISOString();

  // If embeds aren't enabled, create plain text content instead
  let content = '';
  if (!inputs.embeds) {
    content = `${inputs.content || "Internal Release"}: ${repo} ${inputs.release_version || ""}\n`

    if (inputs.android_result) {
      content += `Android: ${androidSuccess ? "Success ✅" : "Failed ❌"}\n`;
    }

    if (inputs.ios_result) {
      content += `iOS: ${iosSuccess ? "Success ✅" : "Failed ❌"}\n`;
    }

    content += `Workflow: ${workflowUrl}`
  }

  const payload: Record<string, any> = {
    content: content,
  };

  if (inputs.embeds) {
    payload.embeds = [embed];
  }

  return payload;
}

export async function sendWebhook(webhook: string, payload:Record<string, any>):Promise<void> {
  try {
    core.debug(`Sending webhook payload: ${JSON.stringify(payload)}`);

    const response = await axios.post(webhook, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000 // 10 seconds timeout
    })

    core.setOutput("status_code", response.status);
    core.setOutput("response_body", JSON.stringify(response.data));
    core.setOutput("result", "success");

    core.debug(`Webhook response (${response.status}): ${JSON.stringify(response.data)}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      core.setOutput("status_code", error.response?.status);
      core.setOutput("response_body", JSON.stringify(error.response?.data));
      core.setOutput("result", "failure");

      throw new Error(`Webhook response (${error.response?.status}): ${JSON.stringify(error.response?.data)}`);
    }
    throw error;
  }
}

// Handle errors consistently
function handleError(error: unknown): never {
  if (error instanceof Error) {
    core.setFailed(`Error: ${error.message}`);
  } else {
    core.setFailed(`An unknown error occurred: ${String(error)}`);
  }
  throw error;
}


// Only call run if this file is being executed directly
if (require.main === module) {
  run().catch(error => {
    if (error instanceof Error) {
      core.setFailed(`Error: ${error.message}`);
    } else {
      core.setFailed(`An unknown error occurred: ${String(error)}`);
    }
  });
}
