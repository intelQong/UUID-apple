import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@udid-tools/core", () => ({
  generateProfile: vi.fn(),
  parseProfileServiceResponse: vi.fn(),
  UdidToolsError: class extends Error {
    constructor(
      public code: string,
      message: string
    ) {
      super(message);
    }
  },
}));

vi.mock("@/lib/profile-challenge", () => ({
  createProfileChallenge: vi.fn(() => "mock-challenge"),
  verifyProfileChallenge: vi.fn(() => true),
}));

vi.mock("@/lib/server-config", () => ({
  publicOrigin: vi.fn(() => "https://example.com"),
  profileSigning: vi.fn(() => undefined),
  profileResponseVerification: vi.fn(() => ({
    allowUnsigned: true,
    verification: { mode: "none" as const },
  })),
}));

import { generateDeviceProfile, parseDeviceResponse } from "../profile-service";
import { generateProfile, parseProfileServiceResponse, UdidToolsError } from "@udid-tools/core";

describe("profile-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateDeviceProfile", () => {
    it("generates device profile successfully", async () => {
      const mockResult = {
        data: Buffer.from("profile-xml"),
        contentType: "application/x-apple-aspen-config" as const,
      };
      vi.mocked(generateProfile).mockResolvedValue({
        ok: true,
        value: mockResult,
        warnings: [],
      } as unknown as Awaited<ReturnType<typeof generateProfile>>);

      const result = await generateDeviceProfile();
      expect(result.data).toEqual(mockResult.data);
      expect(generateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: expect.objectContaining({
            service: expect.objectContaining({
              responseUrl: "https://example.com/api/retrieve",
            }),
          }),
        })
      );
    });

    it("throws when generateProfile returns not ok", async () => {
      vi.mocked(generateProfile).mockResolvedValue({
        ok: false,
        error: new UdidToolsError("CHALLENGE_MISMATCH", "Profile error"),
        warnings: [],
      } as unknown as Awaited<ReturnType<typeof generateProfile>>);

      await expect(generateDeviceProfile()).rejects.toThrow("Profile error");
    });

    it("includes signing options when profileSigning returns a config", async () => {
      const mockResult = {
        data: Buffer.from("signed-profile-xml"),
        contentType: "application/x-apple-aspen-config" as const,
      };
      vi.mocked(generateProfile).mockResolvedValue({
        ok: true,
        value: mockResult,
        warnings: [],
      } as unknown as Awaited<ReturnType<typeof generateProfile>>);

      const { profileSigning } = await import("@/lib/server-config");
      const mockSigning = {
        identity: {
          type: "pkcs12" as const,
          data: { encoding: "base64" as const, value: "dGVzdA==" },
          passphrase: "",
        },
        certificateChain: [],
        digestAlgorithm: "sha256" as const,
      };
      vi.mocked(profileSigning).mockReturnValue(mockSigning);

      const result = await generateDeviceProfile();
      expect(result.data).toEqual(mockResult.data);
      expect(generateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          signing: mockSigning,
        })
      );
      vi.mocked(profileSigning).mockReturnValue(undefined);
    });
  });

  describe("parseDeviceResponse", () => {
    it("parses device response successfully", async () => {
      const mockResponse = {
        attributes: {
          udid: "00008030-001A2B3C4D5E6F78",
          product: "iPhone14,2",
          serial: "C02G12345678",
        },
        challenge: "mock-challenge",
      };
      vi.mocked(parseProfileServiceResponse).mockResolvedValue({
        ok: true,
        value: mockResponse,
        warnings: [],
      } as unknown as Awaited<ReturnType<typeof parseProfileServiceResponse>>);

      const res = await parseDeviceResponse(new ArrayBuffer(16));
      expect(res.attributes.udid).toBe("00008030-001A2B3C4D5E6F78");
    });

    it("throws when parseProfileServiceResponse returns not ok", async () => {
      vi.mocked(parseProfileServiceResponse).mockResolvedValue({
        ok: false,
        error: new UdidToolsError("CHALLENGE_MISMATCH", "Parse error"),
        warnings: [],
      } as unknown as Awaited<ReturnType<typeof parseProfileServiceResponse>>);

      await expect(parseDeviceResponse(new ArrayBuffer(16))).rejects.toThrow("Parse error");
    });

    it("throws when challenge verification fails", async () => {
      const mockResponse = {
        attributes: {
          udid: "00008030-001A2B3C4D5E6F78",
        },
        challenge: "invalid-challenge",
      };
      vi.mocked(parseProfileServiceResponse).mockResolvedValue({
        ok: true,
        value: mockResponse,
        warnings: [],
      } as unknown as Awaited<ReturnType<typeof parseProfileServiceResponse>>);
      const { verifyProfileChallenge } = await import("@/lib/profile-challenge");
      vi.mocked(verifyProfileChallenge).mockReturnValue(false);

      await expect(parseDeviceResponse(new ArrayBuffer(16))).rejects.toThrow(
        "The Profile Service challenge is invalid or expired."
      );
    });
  });
});
