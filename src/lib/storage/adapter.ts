import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export interface StorageResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface StorageAdapter {
  save(options: {
    buffer: Buffer | Uint8Array;
    mimeType: string;
    originalName?: string;
  }): Promise<StorageResult>;
  delete(filename: string): Promise<boolean>;
  getUrl(filename: string): string;
}

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
};

/**
 * Local disk storage adapter saving to public/uploads or custom directory
 */
export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;
  private urlPrefix: string;

  constructor(
    uploadDir: string = path.resolve(process.cwd(), "public", "uploads"),
    urlPrefix: string = "/uploads"
  ) {
    this.uploadDir = uploadDir;
    this.urlPrefix = urlPrefix;
  }

  async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  async save(options: {
    buffer: Buffer | Uint8Array;
    mimeType: string;
    originalName?: string;
  }): Promise<StorageResult> {
    const { buffer, mimeType } = options;

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
      throw new Error(`Unsupported file type: ${mimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`);
    }

    // Validate size
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds maximum limit of 5 MB.`);
    }

    await this.ensureDirectory();

    // Generate secure random filename
    const ext = MIME_EXTENSION_MAP[mimeType] || ".bin";
    const randomHex = crypto.randomBytes(16).toString("hex");
    const filename = `${Date.now()}-${randomHex}${ext}`;
    const destinationPath = path.join(this.uploadDir, filename);

    // Write file securely
    await fs.writeFile(destinationPath, buffer);

    return {
      url: this.getUrl(filename),
      filename,
      size: buffer.length,
      mimeType,
    };
  }

  async delete(filename: string): Promise<boolean> {
    try {
      // Prevent path traversal
      const safeFilename = path.basename(filename);
      const filePath = path.join(this.uploadDir, safeFilename);
      await fs.unlink(filePath);
      return true;
    } catch (err: any) {
      if (err.code === "ENOENT") return false;
      throw err;
    }
  }

  getUrl(filename: string): string {
    const safeFilename = path.basename(filename);
    return `${this.urlPrefix}/${safeFilename}`;
  }
}

/**
 * Vercel Blob storage adapter for production serverless deployments.
 * Automatically used when BLOB_READ_WRITE_TOKEN is set or STORAGE_DRIVER=vercel-blob.
 */
export class VercelBlobStorageAdapter implements StorageAdapter {
  private token: string;

  constructor(token?: string) {
    this.token = token || process.env.BLOB_READ_WRITE_TOKEN || "";
    if (!this.token && process.env.NODE_ENV === "production") {
      console.warn("VercelBlobStorageAdapter initialized without BLOB_READ_WRITE_TOKEN. Uploads will fail.");
    }
  }

  async save(options: {
    buffer: Buffer | Uint8Array;
    mimeType: string;
    originalName?: string;
  }): Promise<StorageResult> {
    const { buffer, mimeType } = options;

    if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
      throw new Error(`Unsupported file type: ${mimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`);
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds maximum limit of 5 MB.`);
    }

    const ext = MIME_EXTENSION_MAP[mimeType] || ".bin";
    const randomHex = crypto.randomBytes(16).toString("hex");
    const pathname = `uploads/${Date.now()}-${randomHex}${ext}`;

    const res = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${this.token}`,
        "x-api-version": "7",
        "content-type": mimeType,
      },
      body: buffer as any,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Vercel Blob upload failed (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as { url: string; pathname: string };

    return {
      url: data.url,
      filename: pathname,
      size: buffer.length,
      mimeType,
    };
  }

  async delete(filename: string): Promise<boolean> {
    try {
      const res = await fetch("https://blob.vercel-storage.com/delete", {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.token}`,
          "x-api-version": "7",
          "content-type": "application/json",
        },
        body: JSON.stringify({ urls: [filename] }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  getUrl(filename: string): string {
    if (filename.startsWith("http://") || filename.startsWith("https://")) {
      return filename;
    }
    return `https://blob.vercel-storage.com/${filename}`;
  }
}

// Default singleton instance
let defaultAdapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!defaultAdapter) {
    if (
      process.env.STORAGE_DRIVER === "vercel-blob" ||
      (process.env.BLOB_READ_WRITE_TOKEN && process.env.NODE_ENV === "production")
    ) {
      defaultAdapter = new VercelBlobStorageAdapter();
    } else {
      defaultAdapter = new LocalStorageAdapter();
    }
  }
  return defaultAdapter;
}

