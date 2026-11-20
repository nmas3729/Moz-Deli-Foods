import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { menuItems } from "./menu";

describe("menu image paths", () => {
  it.each(menuItems.filter((item) => item.image))("points $name to a supplied public image", (item) => {
    const imagePath = item.image;
    expect(imagePath).toMatch(/^\/images\//);
    expect(existsSync(resolve(process.cwd(), "public", imagePath!.slice(1)))).toBe(true);
  });
});
