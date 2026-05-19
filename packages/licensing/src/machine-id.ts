import { createHash } from "node:crypto";
import { cpus, hostname, platform } from "node:os";

export function createMachineId(seed = `${hostname()}|${platform()}|${cpus()[0]?.model ?? "cpu"}`): string {
  return createHash("sha256").update(seed).digest("hex").slice(0, 32);
}
