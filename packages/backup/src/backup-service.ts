export interface BackupManifest {
  id: string;
  databaseName: string;
  createdAt: string;
  filePath: string;
  checksumSha256?: string;
  sizeBytes?: number;
}

export interface BackupService {
  createBackup(input: { reason: "manual" | "scheduled" | "before_update"; requestedByUserId: string }): Promise<BackupManifest>;
  listBackups(): Promise<BackupManifest[]>;
  restoreBackup(input: { backupId: string; requestedByUserId: string }): Promise<void>;
}

export class BackupPolicy {
  constructor(private readonly retentionDays: number) {
    if (retentionDays < 1) {
      throw new Error("Retencao de backup deve ser de pelo menos um dia.");
    }
  }

  shouldKeepBackup(createdAt: string, now = new Date()): boolean {
    const created = new Date(createdAt).getTime();
    const ageInDays = (now.getTime() - created) / 86_400_000;
    return ageInDays <= this.retentionDays;
  }
}
