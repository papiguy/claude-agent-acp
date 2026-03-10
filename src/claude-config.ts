import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export type ClaudeInvocationPaths = {
  invocationDir: string;
  claudeDir: string;
  usesCustomInvocationDir: boolean;
};

export function defaultClaudeConfigDir(): string {
  return process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), ".claude");
}

export function resolveClaudeInvocationPaths(configDir?: string): ClaudeInvocationPaths {
  if (!configDir) {
    const claudeDir = path.resolve(defaultClaudeConfigDir());
    return {
      invocationDir: claudeDir,
      claudeDir,
      usesCustomInvocationDir: false,
    };
  }

  const invocationDir = path.resolve(configDir);
  return {
    invocationDir,
    claudeDir: path.join(invocationDir, ".claude"),
    usesCustomInvocationDir: true,
  };
}

export function getClaudeAuthPaths(paths: ClaudeInvocationPaths): {
  authFile: string;
  backupFile: string;
} {
  return {
    authFile: path.join(paths.invocationDir, ".claude.json"),
    backupFile: path.join(paths.invocationDir, ".claude.json.backup"),
  };
}

export async function backupInvocationDirectory(
  invocationDir: string,
  backupDir: string,
): Promise<void> {
  const source = path.resolve(invocationDir);
  const destination = path.resolve(backupDir);

  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  await fs.promises.rm(destination, { recursive: true, force: true });
  await fs.promises.cp(source, destination, { recursive: true });
}

export async function restoreInvocationDirectory(
  backupDir: string,
  invocationDir: string,
): Promise<void> {
  const source = path.resolve(backupDir);
  const destination = path.resolve(invocationDir);

  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  await fs.promises.rm(destination, { recursive: true, force: true });
  await fs.promises.cp(source, destination, { recursive: true });
}
