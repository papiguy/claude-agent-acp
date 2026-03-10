import { afterEach, describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  backupInvocationDirectory,
  resolveClaudeInvocationPaths,
  restoreInvocationDirectory,
} from "../claude-config.js";

describe("claude config helpers", () => {
  const tempPaths: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempPaths.splice(0).map((dir) => fs.promises.rm(dir, { recursive: true, force: true })),
    );
  });

  it("resolves custom invocation directories to an internal .claude directory", () => {
    const invocationDir = "/tmp/user-project";
    expect(resolveClaudeInvocationPaths(invocationDir)).toEqual({
      invocationDir,
      claudeDir: path.join(invocationDir, ".claude"),
      usesCustomInvocationDir: true,
    });
  });

  it("backs up and restores invocation directory contents", async () => {
    const sourceDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "claude-source-"));
    const backupDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "claude-backup-"));
    const restoreDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "claude-restore-"));
    tempPaths.push(sourceDir, backupDir, restoreDir);

    await fs.promises.mkdir(path.join(sourceDir, ".claude"), { recursive: true });
    await fs.promises.writeFile(path.join(sourceDir, ".claude", "settings.json"), '{"model":"x"}');
    await fs.promises.writeFile(path.join(sourceDir, ".claude.json"), '{"auth":"ok"}');

    const snapshotDir = path.join(backupDir, "snapshot");
    await backupInvocationDirectory(sourceDir, snapshotDir);

    await fs.promises.writeFile(path.join(restoreDir, "stale.txt"), "stale");
    await restoreInvocationDirectory(snapshotDir, restoreDir);

    expect(await fs.promises.readFile(path.join(restoreDir, ".claude", "settings.json"), "utf8")).toBe(
      '{"model":"x"}',
    );
    expect(await fs.promises.readFile(path.join(restoreDir, ".claude.json"), "utf8")).toBe(
      '{"auth":"ok"}',
    );
    await expect(fs.promises.access(path.join(restoreDir, "stale.txt"))).rejects.toThrow();
  });
});
