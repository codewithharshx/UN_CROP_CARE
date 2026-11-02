import { describe, it, expect, afterAll } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { LocalStorageAdapter } from "../lib/storage/adapter";

describe("Phase 4: Storage Adapter Test Suite", () => {
  const testDir = path.resolve(process.cwd(), "test-uploads");
  const adapter = new LocalStorageAdapter(testDir, "/test-uploads");

  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("saves a valid image buffer with generated safe filename and url", async () => {
    const dummyImageBuffer = Buffer.from("fake-png-data-header-bytes");
    const result = await adapter.save({
      buffer: dummyImageBuffer,
      mimeType: "image/png",
      originalName: "test-product.png",
    });

    expect(result.filename).toMatch(/\.png$/);
    expect(result.url).toMatch(/^\/test-uploads\/.*\.png$/);
    expect(result.size).toBe(dummyImageBuffer.length);
    expect(result.mimeType).toBe("image/png");

    // Check file exists on disk
    const content = await fs.readFile(path.join(testDir, result.filename));
    expect(content.equals(dummyImageBuffer)).toBe(true);

    // Test delete
    const deleted = await adapter.delete(result.filename);
    expect(deleted).toBe(true);
  });

  it("rejects unsupported MIME types", async () => {
    const exeBuffer = Buffer.from("fake-binary-bytes");
    await expect(
      adapter.save({
        buffer: exeBuffer,
        mimeType: "application/x-msdownload",
      })
    ).rejects.toThrow("Unsupported file type");
  });

  it("rejects files exceeding 5 MB limit", async () => {
    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB
    await expect(
      adapter.save({
        buffer: oversizedBuffer,
        mimeType: "image/jpeg",
      })
    ).rejects.toThrow("exceeds maximum limit");
  });

  it("protects against path traversal in getUrl and delete", async () => {
    const safeUrl = adapter.getUrl("../../../etc/passwd");
    expect(safeUrl).toBe("/test-uploads/passwd");

    const deleted = await adapter.delete("../../../nonexistent.txt");
    expect(deleted).toBe(false);
  });
});

