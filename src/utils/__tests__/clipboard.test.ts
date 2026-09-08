import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { writeClipboard } from "../clipboard";

describe("writeClipboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false for empty text", async () => {
    expect(await writeClipboard("")).toBe(false);
  });

  it("returns false when browser APIs are missing", async () => {
    expect(await writeClipboard("test-text")).toBe(false);
  });

  it("uses navigator.clipboard when available and in secure context", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.stubGlobal("window", { isSecureContext: true });

    const result = await writeClipboard("test-udid");
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith("test-udid");
  });

  it("falls back to document.execCommand when navigator.clipboard fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Permission denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.stubGlobal("window", { isSecureContext: true });

    const mockTextarea = {
      value: "",
      style: {},
      setAttribute: vi.fn(),
      focus: vi.fn(),
      setSelectionRange: vi.fn(),
      remove: vi.fn(),
    };

    vi.stubGlobal("document", {
      createElement: vi.fn(() => mockTextarea),
      body: {
        appendChild: vi.fn(),
      },
      execCommand: vi.fn(() => true),
    });

    const result = await writeClipboard("test-udid");
    expect(result).toBe(true);
    expect(mockTextarea.setSelectionRange).toHaveBeenCalledWith(0, 9);
    expect(mockTextarea.remove).toHaveBeenCalled();
  });

  it("returns false when both methods fail", async () => {
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("Failed")),
      },
    });
    vi.stubGlobal("window", { isSecureContext: true });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => {
        throw new Error("DOM failure");
      }),
    });

    const result = await writeClipboard("test-udid");
    expect(result).toBe(false);
  });
});
