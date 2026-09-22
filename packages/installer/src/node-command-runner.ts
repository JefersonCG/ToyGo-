import { spawn } from "node:child_process";
import type { InstallerCommandResult, InstallerCommandRunner } from "./mariadb-provisioner";

export class NodeInstallerCommandRunner implements InstallerCommandRunner {
  run(
    command: string,
    args: string[],
    options?: { env?: NodeJS.ProcessEnv; stdin?: string },
  ): Promise<InstallerCommandResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        env: options?.env ?? process.env,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString("utf8"); });
      child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString("utf8"); });
      child.on("error", reject);
      child.on("close", (exitCode) => resolve({ exitCode: exitCode ?? 1, stdout, stderr }));
      if (options?.stdin !== undefined) child.stdin.end(options.stdin);
      else child.stdin.end();
    });
  }
}
