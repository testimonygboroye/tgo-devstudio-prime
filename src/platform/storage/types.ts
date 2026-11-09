export interface PlatformUploadInput {
  file: Buffer;
  filename: string;
  contentType: string;
  folder: string;
  access: "public" | "private";
  maxBytes: number;
}

export interface PlatformStoredFile {
  provider: string;
  providerFileId: string;
  filename: string;
  contentType: string;
  bytes: number;
  access: "public" | "private";
  url?: string;
}

export interface PlatformStorageProvider {
  upload(input: PlatformUploadInput): Promise<PlatformStoredFile>;
  delete(providerFileId: string): Promise<void>;
  createAccessUrl(
    providerFileId: string,
    options?: { expiresInSeconds?: number }
  ): Promise<string>;
}
