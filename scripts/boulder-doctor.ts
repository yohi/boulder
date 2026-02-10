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
import { existsSync } from "node:fs";
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

if (hasErrors) {
  console.error("\n❌ Environment check failed");
  process.exit(1);
} else {
  console.log("\n✅ All checks passed!");
  process.exit(0);
}
