#!/usr/bin/env bun
import { existsSync, lstatSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BOULDER_HOME = join(homedir(), ".config", "boulder");
const RULES_SOURCE = join(BOULDER_HOME, "rules");
const TARGET_DIR = ".cursor";
const RULES_TARGET = join(TARGET_DIR, "rules");

async function main() {
  const force = process.argv.includes("--force");
  const cwd = process.cwd();

  try {
    // 1. プロジェクト確認
    if (!existsSync(join(cwd, "package.json"))) {
      console.error("❌ package.json not found. Is this a project directory?");
      process.exit(1);
    }

    // 2. Boulder ルールソースの確認
    if (!existsSync(RULES_SOURCE)) {
      console.error(`❌ Boulder rules not found at: ${RULES_SOURCE}`);
      console.error(
        "   -> Install Boulder: git clone <repo> ~/.config/boulder",
      );
      process.exit(1);
    }

    // 3. .cursor ディレクトリ作成
    if (!existsSync(TARGET_DIR)) {
      mkdirSync(TARGET_DIR, { recursive: true });
    }

    // 4. 既存の rules 確認
    if (existsSync(RULES_TARGET)) {
      const stat = lstatSync(RULES_TARGET);
      if (stat.isSymbolicLink()) {
        console.log("✅ Already linked to Boulder rules.");
        await runDoctor();
        return;
      }
      if (!force) {
        console.error("⚠️  .cursor/rules/ already exists.");
        console.error("   Use --force to overwrite.");
        process.exit(1);
      }
      rmSync(RULES_TARGET, { recursive: true });
      console.log("🗑️  Removed existing .cursor/rules/");
    }

    // 5. シンボリックリンク作成（クロスプラットフォーム対応）
    const symlinkType = process.platform === "win32" ? "junction" : "dir";
    symlinkSync(RULES_SOURCE, RULES_TARGET, symlinkType);
    console.log(`✅ Linked: ${RULES_TARGET} → ${RULES_SOURCE}`);

    // 6. Doctor 実行
    await runDoctor();
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

async function runDoctor() {
  console.log("\n🔍 Running boulder doctor...\n");
  const doctorPath = join(BOULDER_HOME, "scripts", "boulder-doctor.ts");
  const localDoctor = join(process.cwd(), "scripts", "boulder-doctor.ts");

  const targetPath = existsSync(doctorPath) ? doctorPath : localDoctor;

  if (!existsSync(targetPath)) {
    console.warn("⚠️ boulder-doctor.ts not found. Skipping health check.");
    return;
  }

  const doctor = Bun.spawn(["bun", "run", targetPath]);
  const exitCode = await doctor.exited;
  if (exitCode !== 0) {
    throw new Error(`boulder doctor failed with exit code ${exitCode}`);
  }
}

main();
