#!/usr/bin/env bun

/**
 * Boulder Doctor - プロジェクト環境のサニティチェック
 *
 * このスクリプトはプロジェクトローカルに配置され、プロジェクト固有の検証を行います。
 * グローバル配置（~/.config/boulder/scripts/boulder-doctor.ts）は将来的に実装予定です。
 */

console.log("🔍 Boulder Doctor - Environment Check\n");

let hasErrors = false;

// Bunのバージョン確認
try {
  const bunVersion = Bun.version;
  console.log(`✅ Bun: ${bunVersion}`);
} catch (_e) {
  console.error("❌ Bun runtime check failed");
  hasErrors = true;
}

// Biomeの存在確認
try {
  const proc = Bun.spawn(["bunx", "biome", "--version"]);
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error("Biome version check failed");
  }
  console.log("✅ Biome: installed");
} catch (_e) {
  console.error("❌ Biome not found or broken");
  console.error("   → Try: bun add -D @biomejs/biome");
  hasErrors = true;
}

// package.jsonの存在確認
import { existsSync, lstatSync, readlinkSync, statSync } from "node:fs";
import { join } from "node:path";

if (!existsSync(join(process.cwd(), "package.json"))) {
  console.error("❌ package.json not found");
  hasErrors = true;
} else {
  console.log("✅ package.json: found");
}

// biome.jsonの存在確認
if (!existsSync(join(process.cwd(), "biome.json"))) {
  console.warn("⚠️  biome.json not found (recommended)");
} else {
  console.log("✅ biome.json: found");
}

/** @returns true if any symlink check failed */
function verifySymlinkState(paths: string[]): boolean {
  let failed = false;
  for (const p of paths) {
    const fullPath = join(process.cwd(), p);
    if (!existsSync(fullPath) && !lstatExists(fullPath)) {
      // パスが存在しない場合はスキップ（他のチェックで検出済み）
      continue;
    }

    try {
      const lst = lstatSync(fullPath);
      if (!lst.isSymbolicLink()) {
        continue;
      }

      const target = readlinkSync(fullPath);
      try {
        statSync(fullPath); // リンク先の実体を確認（壊れたリンクなら例外）
        console.log(`✅ Symlink: ${p} → ${target}`);
      } catch (_targetErr) {
        console.error(
          `❌ Symlink broken: ${p} → ${target} (target does not exist)`,
        );
        failed = true;
      }
    } catch (err) {
      console.error(
        `❌ Symlink check failed: ${p} — ${err instanceof Error ? err.message : String(err)}`,
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

const symlinkTargets = ["package.json", "biome.json", "bun", "biome"];
if (verifySymlinkState(symlinkTargets)) {
  hasErrors = true;
}

if (hasErrors) {
  console.error("\n❌ Environment check failed");
  process.exit(1);
} else {
  console.log("\n✅ All checks passed!");
  process.exit(0);
}
