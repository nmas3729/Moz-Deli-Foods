export const MAX_MENU_IMAGE_BYTES = 5 * 1024 * 1024;

export function detectMenuImageType(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8
    && bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47
    && bytes[4] === 0x0d
    && bytes[5] === 0x0a
    && bytes[6] === 0x1a
    && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function isMenuImagePath(image: string | null) {
  if (image === null) return true;
  if (/^\/images\/[A-Za-z0-9._/-]+$/.test(image) && !image.includes("..")) return true;
  return /^\/api\/menu\/images\/[0-9a-f-]{36}$/.test(image);
}

export function getMenuImageAssetId(image: string | null) {
  return image?.match(/^\/api\/menu\/images\/([0-9a-f-]{36})$/)?.[1] ?? null;
}
