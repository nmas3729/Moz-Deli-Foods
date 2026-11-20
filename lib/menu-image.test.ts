import { describe, expect, it } from "vitest";
import { detectMenuImageType, isMenuImagePath } from "@/lib/menu-image";

describe("menu image validation", () => {
  it.each([
    [Uint8Array.from([0xff, 0xd8, 0xff, 0]), "image/jpeg"],
    [Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"],
    [Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), "image/webp"],
  ])("recognizes supported file signatures", (data, contentType) => {
    expect(detectMenuImageType(data)).toBe(contentType);
  });

  it("rejects non-image signatures and unsafe paths", () => {
    expect(detectMenuImageType(new TextEncoder().encode("<svg></svg>"))).toBeNull();
    expect(isMenuImagePath("/images/food/seafood/fish-and-chips.webp")).toBe(true);
    expect(isMenuImagePath("/images/../../secret")).toBe(false);
    expect(isMenuImagePath("/api/menu/images/123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(isMenuImagePath("/api/menu/images/not-an-id")).toBe(false);
  });
});
