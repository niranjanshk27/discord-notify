import * as core from "@actions/core";
import axios from "axios";
import { getInputs, Inputs, emojiOption } from "../src/inputs";
import { buildPayload } from "../src/index"; // Assuming the buildPayload function is exported

// Mock dependencies
jest.mock("@actions/core");
jest.mock("@actions/github", () => ({
  context: {
    repo: {
      owner: "test-owner",
      repo: "test-repo"
    },
    serverUrl: "https://github.com",
    runId: "12345"
  }
}));
jest.mock("axios");

describe("Discord Notification Action", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
    
    // Mock core.getInput to return test values
    (core.getInput as jest.Mock).mockImplementation((name) => {
      const inputs: Record<string, string> = {
        "WEBHOOK": "https://discord.webhook/test",
        "TITLE": "Test Release",
        "ANDROID_RESULT": "success",
        "IOS_RESULT": "failure",
        "CHANGELOG": "true",
        "RELEASE_VERSION": "v1.0.0",
        "EMBEDS": "true",
        "RESULT": ""
      };
      return inputs[name] || "";
    });
  });

  describe("getInputs function", () => {
    test("should correctly parse and return inputs", () => {
      const inputs = getInputs();
      
      expect(inputs).toEqual({
        webhook: "https://discord.webhook/test",
        title: "Test Release",
        android_result: "success",
        ios_result: "failure",
        changelog: true,
        release_version: "v1.0.0",
        embeds: true,
        result: ""
      });
    });

    test("should warn when webhook is empty", () => {
      (core.getInput as jest.Mock).mockImplementation((name) => {
        return name === "WEBHOOK" ? "" : "test";
      });
      
      getInputs();
      expect(core.warning).toHaveBeenCalledWith("No webhook URL was provided");
    });

    test("should handle boolean conversion correctly", () => {
      (core.getInput as jest.Mock).mockImplementation((name) => {
        const inputs: Record<string, string> = {
          "WEBHOOK": "https://discord.webhook/test",
          "CHANGELOG": "false",
          "EMBEDS": "TRUE" // Testing case-insensitivity
        };
        return inputs[name] || "";
      });
      
      const inputs = getInputs();
      expect(inputs.changelog).toBe(false);
      expect(inputs.embeds).toBe(true);
    });
  });

  describe("buildPayload function", () => {
    const mockInputs: Inputs = {
      webhook: "https://discord.webhook/test",
      title: "Test Release",
      android_result: "success",
      ios_result: "failure",
      changelog: true,
      release_version: "v1.0.0",
      embeds: true,
      result: "failure"
    };

    test("should build correct embed payload with all inputs", () => {
      const payload = buildPayload(mockInputs);
      
      expect(payload).toHaveProperty("embeds");
      expect(payload.embeds).toHaveLength(1);
      
      const embed = payload.embeds![0];
      expect(embed.title).toBe("Test Release");
      expect(embed.description).toContain("test-repo v1.0.0");
      expect(embed.description).toContain("Android - :white_check_mark:");
      expect(embed.description).toContain("iOS - :x: :no_entry:");
      expect(embed.description).toContain("Build - :x: :no_entry:");

      // Should include changelog field
      const changelogField = embed.fields.find((f: any) => f.name === "Changelogs");
      expect(changelogField).toBeDefined();
      expect(changelogField.value).toContain("https://github.com/test-owner/test-repo/releases/tag/v1.0.0");
      
      // Should include workflow field
      const workflowField = embed.fields.find((f: any) => f.name === "Workflow");
      expect(workflowField).toBeDefined();
      expect(workflowField.value).toContain("https://github.com/test-owner/test-repo/actions/runs/12345");
    });

    test("should build text payload when embeds is false", () => {
      const inputs = { ...mockInputs, embeds: false };
      const payload = buildPayload(inputs);
      
      expect(payload).not.toHaveProperty("embeds");
      expect(payload).toHaveProperty("content");
      expect(payload.content).toContain("Internal Release: test-repo v1.0.0");
      expect(payload.content).toContain("Android: Success ✅");
      expect(payload.content).toContain("iOS: Failed ❌");
      expect(payload.content).toContain("Build: Failed ❌");
    });

    test("should use failure color when any platform has failed", () => {
      const payload = buildPayload(mockInputs);
      const embed = payload.embeds![0];
      
      // Should use failure color (red) since iOS failed
      expect(embed.color).toBe(emojiOption.failure.color);
    });

    test("should use success color when all platforms succeed", () => {
      const inputs = { ...mockInputs, ios_result: "success" };
      const payload = buildPayload(inputs);
      const embed = payload.embeds![0];
      
      // Should use success color (green) since both succeeded
      expect(embed.color).toBe(emojiOption.success.color);
    });

    test("should handle missing android/ios results", () => {
      const inputs = { 
        webhook: "https://discord.webhook/test",
        changelog: true,
        release_version: "v1.0.0",
        embeds: true
      };
      
      const payload = buildPayload(inputs);
      const embed = payload.embeds![0];
      
      // Description should not contain platform status
      expect(embed.description).not.toContain("Android");
      expect(embed.description).not.toContain("iOS");
    });

    test("should handle missing changelog", () => {
      const inputs = { ...mockInputs, changelog: false };
      const payload = buildPayload(inputs);
      const embed = payload.embeds![0];
      
      // Should not include changelog field
      const changelogField = embed.fields.find((f: any) => f.name === "Changelogs");
      expect(changelogField).toBeUndefined();
    });
  });

  describe("sendWebhook function", () => {
    // This would require testing the run function directly and mocking axios responses
    // This is a placeholder for how that test could be structured
    test("should successfully send webhook and set outputs", async () => {
      // Mock axios.post to return a successful response
      (axios.post as jest.Mock).mockResolvedValueOnce({
        status: 200,
        data: { id: "webhook-id" }
      });
      
      // You would need to export the sendWebhook function to test it directly
      // Or test the run() function which calls sendWebhook internally
      
      // Example assertions if run() were being tested:
      // await run();
      // expect(core.setOutput).toHaveBeenCalledWith("status_code", 200);
      // expect(core.setOutput).toHaveBeenCalledWith("result", "success");
    });
  });
});
