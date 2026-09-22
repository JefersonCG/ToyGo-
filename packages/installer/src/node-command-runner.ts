import { spawn } from "node:child_process";
import type { InstallerCommandResult, InstallerCommandRunner } from "./mariadb-provisioner";

export class NodeInstallerCommandRunner implements InstallerCommandRunner {
  start(
    command: string,
    args: string[],
    options?: { env?: NodeJS.ProcessEnv },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        env: options?.env ?? process.env,
        stdio: "ignore",
        detached: true,
        windowsHide: true,
      });
      child.once("error", reject);
      child.once("spawn", () => {
        child.unref();
        resolve();
      });
    });
  }

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
      let settled = false;
      const settle = (result: InstallerCommandResult): void => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      child.on("error", (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      });
      // A Windows service can inherit the child stdout/stderr handles. Waiting
      // for `close` would then keep the installer blocked after the command
      // process has already exited. The process exit is the completion signal;
      // the listeners above still collect any output emitted before it.
      child.on("exit", (exitCode) => settle({ exitCode: exitCode ?? 1, stdout, stderr }));
      if (options?.stdin !== undefined) child.stdin.end(options.stdin);
      else child.stdin.end();
    });
  }
}
