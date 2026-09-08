import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  publicOrigin,
  profileSigning,
  profileResponseVerification,
  profileChallengeSecret,
} from "../server-config";

describe("server-config", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("publicOrigin", () => {
    it("returns origin from UDID_TOOLS_PUBLIC_ORIGIN", () => {
      vi.stubEnv("UDID_TOOLS_PUBLIC_ORIGIN", "https://udid.example.com/");
      const origin = publicOrigin();
      expect(origin).toBe("https://udid.example.com");
    });

    it("defaults to localhost:3000 in development", () => {
      delete process.env["UDID_TOOLS_PUBLIC_ORIGIN"];
      vi.stubEnv("NODE_ENV", "development");
      const origin = publicOrigin();
      expect(origin).toBe("http://localhost:3000");
    });

    it("throws in production when UDID_TOOLS_PUBLIC_ORIGIN is missing", () => {
      vi.stubEnv("UDID_TOOLS_PUBLIC_ORIGIN", "");
      vi.stubEnv("NODE_ENV", "production");
      expect(() => publicOrigin()).toThrow("UDID_TOOLS_PUBLIC_ORIGIN is required");
    });

    it("throws when UDID_TOOLS_PUBLIC_ORIGIN is not an origin only", () => {
      vi.stubEnv("UDID_TOOLS_PUBLIC_ORIGIN", "https://udid.example.com/path");
      expect(() => publicOrigin()).toThrow("UDID_TOOLS_PUBLIC_ORIGIN must be an origin only");
    });

    it("throws in production when protocol is not https", () => {
      vi.stubEnv("UDID_TOOLS_PUBLIC_ORIGIN", "http://udid.example.com");
      vi.stubEnv("NODE_ENV", "production");
      expect(() => publicOrigin()).toThrow("UDID_TOOLS_PUBLIC_ORIGIN must use HTTPS in production");
    });
  });

  describe("profileSigning", () => {
    it("returns undefined for unsigned mode", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_SIGNING_MODE", "unsigned");
      expect(profileSigning()).toBeUndefined();
    });

    it("defaults to unsigned when no signing key is provided", () => {
      delete process.env["UDID_TOOLS_PROFILE_SIGNING_MODE"];
      delete process.env["UDID_TOOLS_PROFILE_SIGNING_PKCS12_BASE64"];
      expect(profileSigning()).toBeUndefined();
    });

    it("throws when signing mode is neither signed nor unsigned", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_SIGNING_MODE", "invalid-mode");
      expect(() => profileSigning()).toThrow(
        "UDID_TOOLS_PROFILE_SIGNING_MODE must be signed or unsigned"
      );
    });

    it("returns signing configuration when signed mode is enabled", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_SIGNING_MODE", "signed");
      vi.stubEnv(
        "UDID_TOOLS_PROFILE_SIGNING_PKCS12_BASE64",
        Buffer.from("pkcs12-data").toString("base64")
      );
      vi.stubEnv("UDID_TOOLS_PROFILE_SIGNING_PKCS12_PASSPHRASE", "test-passphrase");
      vi.stubEnv(
        "UDID_TOOLS_PROFILE_SIGNING_CERTIFICATE_CHAIN_PEM",
        "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----"
      );
      const signing = profileSigning();
      expect(signing).toBeDefined();
      expect(signing?.identity.type).toBe("pkcs12");
      expect(signing?.certificateChain).toHaveLength(1);
    });

    it("returns signing configuration with empty chain when chain is omitted", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_SIGNING_MODE", "signed");
      vi.stubEnv(
        "UDID_TOOLS_PROFILE_SIGNING_PKCS12_BASE64",
        Buffer.from("pkcs12-data").toString("base64")
      );
      delete process.env["UDID_TOOLS_PROFILE_SIGNING_CERTIFICATE_CHAIN_PEM"];
      const signing = profileSigning();
      expect(signing?.certificateChain).toEqual([]);
    });
  });

  describe("profileResponseVerification", () => {
    it("returns none mode when configured", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_RESPONSE_VERIFICATION_MODE", "none");
      const config = profileResponseVerification();
      expect(config.allowUnsigned).toBe(true);
      expect(config.verification.mode).toBe("none");
    });

    it("returns signature mode by default in production with signed profile", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_RESPONSE_VERIFICATION_MODE", "signature");
      vi.stubEnv("UDID_TOOLS_PROFILE_SIGNING_MODE", "signed");
      vi.stubEnv("NODE_ENV", "production");
      const config = profileResponseVerification();
      expect(config.allowUnsigned).toBe(false);
      expect(config.verification.mode).toBe("signature");
    });

    it("allows unsigned responses in signature mode when unsigned profile is configured", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_RESPONSE_VERIFICATION_MODE", "signature");
      vi.stubEnv("UDID_TOOLS_PROFILE_SIGNING_MODE", "unsigned");
      const config = profileResponseVerification();
      expect(config.allowUnsigned).toBe(true);
      expect(config.verification.mode).toBe("signature");
    });

    it("supports trust-chain mode with anchors and intermediates", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_RESPONSE_VERIFICATION_MODE", "trust-chain");
      vi.stubEnv(
        "UDID_TOOLS_PROFILE_RESPONSE_TRUST_ANCHORS_PEM",
        "-----BEGIN CERTIFICATE-----\nROOT\n-----END CERTIFICATE-----"
      );
      vi.stubEnv(
        "UDID_TOOLS_PROFILE_RESPONSE_INTERMEDIATES_PEM",
        "-----BEGIN CERTIFICATE-----\nINTER\n-----END CERTIFICATE-----"
      );
      const config = profileResponseVerification();
      expect(config.verification.mode).toBe("trust-chain");
    });

    it("throws when trust anchors are missing in trust-chain mode", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_RESPONSE_VERIFICATION_MODE", "trust-chain");
      delete process.env["UDID_TOOLS_PROFILE_RESPONSE_TRUST_ANCHORS_PEM"];
      expect(() => profileResponseVerification()).toThrow(
        "UDID_TOOLS_PROFILE_RESPONSE_TRUST_ANCHORS_PEM is required"
      );
    });

    it("throws when certificates contain non-PEM data", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_RESPONSE_VERIFICATION_MODE", "trust-chain");
      vi.stubEnv("UDID_TOOLS_PROFILE_RESPONSE_TRUST_ANCHORS_PEM", "NOT-A-CERTIFICATE");
      expect(() => profileResponseVerification()).toThrow(
        "UDID_TOOLS_PROFILE_RESPONSE_TRUST_ANCHORS_PEM must contain only PEM certificates"
      );
    });

    it("throws when verification mode is invalid", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_RESPONSE_VERIFICATION_MODE", "invalid-mode");
      expect(() => profileResponseVerification()).toThrow(
        "UDID_TOOLS_PROFILE_RESPONSE_VERIFICATION_MODE is invalid or unsafe"
      );
    });
  });

  describe("profileChallengeSecret", () => {
    it("returns development challenge secret buffer", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_CHALLENGE_SECRET_BASE64", "");
      vi.stubEnv("NODE_ENV", "development");
      const secret = profileChallengeSecret();
      expect(secret).toBeInstanceOf(Buffer);
      expect(secret.byteLength).toBe(32);
    });

    it("returns configured challenge secret when valid base64 32-byte", () => {
      const validSecret = Buffer.alloc(32, 0x5a).toString("base64");
      vi.stubEnv("UDID_TOOLS_PROFILE_CHALLENGE_SECRET_BASE64", validSecret);
      const secret = profileChallengeSecret();
      expect(secret.toString("base64")).toBe(validSecret);
    });

    it("throws in production when challenge secret is missing", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_CHALLENGE_SECRET_BASE64", "");
      vi.stubEnv("NODE_ENV", "production");
      expect(() => profileChallengeSecret()).toThrow();
    });

    it("throws when challenge secret is invalid base64", () => {
      vi.stubEnv("UDID_TOOLS_PROFILE_CHALLENGE_SECRET_BASE64", "invalid!");
      expect(() => profileChallengeSecret()).toThrow();
    });

    it("throws when challenge secret base64 has non-canonical padding bits", () => {
      // 43 chars + '=' matches regex but contains non-zero unused padding bits
      const nonCanonical = "A".repeat(42) + "B=";
      vi.stubEnv("UDID_TOOLS_PROFILE_CHALLENGE_SECRET_BASE64", nonCanonical);
      expect(() => profileChallengeSecret()).toThrow(
        "UDID_TOOLS_PROFILE_CHALLENGE_SECRET_BASE64 is invalid"
      );
    });
  });
});
