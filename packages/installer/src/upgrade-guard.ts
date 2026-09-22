export interface UpgradeBackupService {
  createBackup(input: { reason: "before_update"; requestedByUserId: string }): Promise<unknown>;
}

export interface UpgradePreparation {
  currentVersion: string;
  targetVersion: string;
  backupCreated: boolean;
}

function parseVersion(value: string): [number, number, number] {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(value.trim());
  if (!match) throw new Error(`Versao invalida para atualizacao: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(left: string, right: string): number {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
  }
  return 0;
}

export async function prepareUpgrade(input: {
  currentVersion: string;
  targetVersion: string;
  backupService: UpgradeBackupService;
  requestedByUserId: string;
}): Promise<UpgradePreparation> {
  const comparison = compareVersions(input.targetVersion, input.currentVersion);
  if (comparison < 0) {
    throw new Error(`Downgrade destrutivo bloqueado: ${input.currentVersion} -> ${input.targetVersion}.`);
  }
  if (comparison === 0) {
    return { currentVersion: input.currentVersion, targetVersion: input.targetVersion, backupCreated: false };
  }
  await input.backupService.createBackup({ reason: "before_update", requestedByUserId: input.requestedByUserId });
  return { currentVersion: input.currentVersion, targetVersion: input.targetVersion, backupCreated: true };
}
