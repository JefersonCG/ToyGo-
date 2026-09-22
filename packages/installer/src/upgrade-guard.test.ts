import { describe, expect, it, vi } from "vitest";
import { prepareUpgrade } from "./upgrade-guard";

describe("prepareUpgrade", () => {
  it("creates a before-update backup before an upgrade", async () => {
    const backupService = { createBackup: vi.fn().mockResolvedValue({ id: "backup-1" }) };
    await expect(prepareUpgrade({
      currentVersion: "0.1.0",
      targetVersion: "0.2.0",
      backupService,
      requestedByUserId: "installer",
    })).resolves.toEqual({ currentVersion: "0.1.0", targetVersion: "0.2.0", backupCreated: true });
    expect(backupService.createBackup).toHaveBeenCalledWith({ reason: "before_update", requestedByUserId: "installer" });
  });

  it("blocks a downgrade before any backup or mutation", async () => {
    const backupService = { createBackup: vi.fn() };
    await expect(prepareUpgrade({
      currentVersion: "0.2.0",
      targetVersion: "0.1.0",
      backupService,
      requestedByUserId: "installer",
    })).rejects.toThrow("Downgrade destrutivo bloqueado");
    expect(backupService.createBackup).not.toHaveBeenCalled();
  });

  it("does not create a redundant backup for the same version", async () => {
    const backupService = { createBackup: vi.fn() };
    await expect(prepareUpgrade({
      currentVersion: "0.1.0",
      targetVersion: "0.1.0",
      backupService,
      requestedByUserId: "installer",
    })).resolves.toEqual({ currentVersion: "0.1.0", targetVersion: "0.1.0", backupCreated: false });
    expect(backupService.createBackup).not.toHaveBeenCalled();
  });
});
