import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/profile-service", () => ({
  generateDeviceProfile: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  startSpan: vi.fn((_span, callback) => callback()),
}));

import { GET } from "./route";
import { generateDeviceProfile } from "@/lib/profile-service";
import * as Sentry from "@sentry/nextjs";

describe("GET /api/register.signed.mobileconfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with application/x-apple-aspen-config on success", async () => {
    const mockPayload = Buffer.from("mock-mobileconfig-payload");
    vi.mocked(generateDeviceProfile).mockResolvedValue({
      data: mockPayload,
      contentType: "application/x-apple-aspen-config",
      profile: {} as never,
      protection: "unsigned" as never,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/x-apple-aspen-config");
    expect(response.headers.get("Content-Disposition")).toContain(
      'attachment; filename="register.signed.mobileconfig"'
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const buffer = await response.arrayBuffer();
    expect(Buffer.from(buffer)).toEqual(mockPayload);
  });

  it("returns 500 and captures exception in Sentry on error", async () => {
    vi.mocked(generateDeviceProfile).mockRejectedValue(new Error("Signing failed"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Internal Server Error");
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { flow: "udid_retrieval", stage: "profile_generation" },
      })
    );
  });
});
