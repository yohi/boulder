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

if (!existsSync(join(process.cwd(), "rules"))) {
  console.error(`${PREFIX.fail} rules directory missing`);
  hasErrors = true;
} else {
  console.log(`${PREFIX.ok} rules directory: found`);
}

if (hasErrors) {
  console.error(`\n${PREFIX.fail} Environment check failed`);
  process.exit(1);
} else {
  console.log(`\n${PREFIX.ok} All checks passed!`);
  process.exit(0);
}
