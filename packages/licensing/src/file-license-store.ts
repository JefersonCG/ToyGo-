import { readFile, writeFile } from "node:fs/promises";
import type { LocalLicenseState, LocalLicenseStore } from "./license-types";

export class FileLicenseStore implements LocalLicenseStore {
  constructor(private readonly filePath: string) {}

  async read(): Promise<LocalLicenseState | null> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw) as LocalLicenseState;
    } catch {
      return null;
    }
  }

  async write(state: LocalLicenseState): Promise<void> {
    await writeFile(this.filePath, JSON.stringify(state, null, 2), "utf8");
  }
}
