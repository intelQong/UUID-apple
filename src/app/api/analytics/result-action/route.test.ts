import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vercel/analytics/server", () => ({
  track: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

import { POST } from "./route";
import { track } from "@vercel/analytics/server";
import * as Sentry from "@sentry/nextjs";

describe("POST /api/analytics/result-action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 204 on valid payload and tracks event", async () => {
    const payload = {
      event_name: "result_page_action",
      result_source: "profile",
      action: "copy_field",
      field_type: "meid",
      field_label: "MEID",
      outcome: "success",
    };

    const request = new Request("https://example.com/api/analytics/result-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    expect(response.status).toBe(204);
    expect(track).toHaveBeenCalledWith(
      "result_page_action",
      expect.objectContaining({
        action: "copy_field",
        field_type: "meid",
        field_label: "MEID",
        outcome: "success",
        result_source: "profile",
      })
    );
  });

  it("returns 413 when body exceeds size limit", async () => {
    const largeString = "x".repeat(3000);
    const request = new Request("https://example.com/api/analytics/result-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ large: largeString }),
    });

    const response = await POST(request);
    expect(response.status).toBe(413);
  });

  it("returns 400 on invalid JSON", async () => {
    const request = new Request("https://example.com/api/analytics/result-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json{",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 on missing or invalid event_name / result_source", async () => {
    const request = new Request("https://example.com/api/analytics/result-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_name: "unknown_event" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 204 even if track throws and logs to Sentry", async () => {
    vi.mocked(track).mockRejectedValue(new Error("Analytics down"));

    const payload = {
      event_name: "result_page_action",
      result_source: "sample",
      action: "copy_all",
      format: "txt",
      outcome: "success",
    };

    const request = new Request("https://example.com/api/analytics/result-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    expect(response.status).toBe(204);
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
