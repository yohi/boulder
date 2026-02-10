#!/usr/bin/env bun

/**
 * Boulder Doctor - プロジェクト環境のサニティチェック
 *
 * このスクリプトはプロジェクトローカルに配置され、プロジェクト固有の検証を行います。
 * グローバル配置（~/.config/boulder/scripts/boulder-doctor.ts）は将来的に実装予定です。
 */

import { existsSync, lstatSync, readlinkSync, statSync } from "node:fs";
import { join } from "node:path";

const PREFIX = {
  ok: "[OK]",
  fail: "[FAIL]",
  warn: "[WARN]",
  info: "[INFO]",
} as const;

console.log(`${PREFIX.info} Boulder Doctor - Environment Check\n`);

let hasErrors = false;

// Bunのバージョン確認
try {
  const bunVersion = Bun.version;
  console.log(`${PREFIX.ok} Bun: ${bunVersion}`);
} catch (_e) {
  console.error(`${PREFIX.fail} Bun runtime check failed`);
  hasErrors = true;
}

// Biomeの存在確認
try {
  const proc = Bun.spawn(["bunx", "biome", "--version"]);
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error("Biome version check failed");
  }
  console.log(`${PREFIX.ok} Biome: installed`);
} catch (_e) {
  console.error(`${PREFIX.fail} Biome not found or broken`);
  console.error("   → Try: bun add -D @biomejs/biome");
  hasErrors = true;
}

if (!existsSync(join(process.cwd(), "package.json"))) {
  console.error(`${PREFIX.fail} package.json not found`);
  hasErrors = true;
} else {
  console.log(`${PREFIX.ok} package.json: found`);
}

// biome.jsonの存在確認
if (!existsSync(join(process.cwd(), "biome.json"))) {
  console.warn(`${PREFIX.warn} biome.json not found (recommended)`);
} else {
  console.log(`${PREFIX.ok} biome.json: found`);
}

/** @returns true if any symlink check failed */
function verifySymlinkState(
  paths: string[],
  requiredSymlinks: Set<string> = new Set(),
): boolean {
  let failed = false;
  for (const p of paths) {
    const fullPath = join(process.cwd(), p);
    const isRequired = requiredSymlinks.has(p);

    if (!existsSync(fullPath) && !lstatExists(fullPath)) {
      if (isRequired) {
        console.error(`${PREFIX.fail} Required symlink missing: ${p}`);
        failed = true;
      }
      // 必須でないパスはスキップ（他のチェックで検出済み）
      continue;
    }

    try {
      const lst = lstatSync(fullPath);
      if (!lst.isSymbolicLink()) {
        if (isRequired) {
          console.error(
            `${PREFIX.fail} ${p} exists but is not a symbolic link`,
          );
          failed = true;
        }
        continue;
      }

      const target = readlinkSync(fullPath);
      try {
        statSync(fullPath); // リンク先の実体を確認（壊れたリンクなら例外）
        console.log(`${PREFIX.ok} Symlink: ${p} → ${target}`);
      } catch (_targetErr) {
        console.error(
          `${PREFIX.fail} Symlink broken: ${p} → ${target} (target does not exist)`,
        );
        failed = true;
      }
    } catch (err) {
      console.error(
        `${PREFIX.fail} Symlink check failed: ${p} — ${err instanceof Error ? err.message : String(err)}`,
      );
      failed = true;
    }
  }
  return failed;
}

// existsSync returns false for broken symlinks; lstat detects them
function lstatExists(p: string): boolean {
  try {
    lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

const symlinkTargets = [".cursor/rules"];
const requiredSymlinks = new Set([".cursor/rules"]);
if (verifySymlinkState(symlinkTargets, requiredSymlinks)) {
  hasErrors = true;
}

if (hasErrors) {
  console.error(`\n${PREFIX.fail} Environment check failed`);
  process.exit(1);
} else {
  console.log(`\n${PREFIX.ok} All checks passed!`);
  process.exit(0);
}
