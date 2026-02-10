import {
  existsSync,
  lstatSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

console.log("🪨 Project Boulder Doctor Checking...");
console.log(`✅ Bun Version: ${Bun.version}`);

const run = (cmd: string[], cwd = process.cwd()) => {
  try {
    const p = Bun.spawnSync(cmd, {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });
    const dec = new TextDecoder();
    return {
      exitCode: p.exitCode,
      text: dec.decode(p.stdout) + dec.decode(p.stderr),
    };
  } catch (e) {
    return { exitCode: 1, text: String(e) };
  }
};

// Check 1: Biome 存在確認 (FR-4.2)
{
  const r = run(["bunx", "biome", "--version"]);
  if (r.exitCode !== 0) {
    console.error("❌ Biome Check: Biome not found or broken");
    console.error("   -> Try: bun add -D @biomejs/biome");
    console.error(`   -> Log: ${r.text}`);
    process.exit(1);
  }
  console.log(`✅ Biome Check: OK (${r.text.trim()})`);
}

// Check 2: Biome Lint 動作確認
{
  const r = run(["bunx", "biome", "lint", "--max-diagnostics=0", "."]);
  if (r.exitCode !== 0) {
    console.error("❌ Biome Lint: lint check failed");
    console.error(`   -> Log: ${r.text}`);
    // 警告のみ、致命的ではない
    console.warn("   -> Warning: lint errors exist, but doctor continues.");
  } else {
    console.log("✅ Biome Lint: OK");
  }
}

// Check 3: ast-grep ツール確認 (Muscle Check)
{
  const r = run(["bun", "run", "oh-my-opencode", "ast-grep", "--version"]);

  if (r.exitCode !== 0 || !/\d+\.\d+\.\d+/.test(r.text)) {
    console.error(
      "❌ Muscle Atrophy: ast-grep FAILED (Dependency missing or Corrupted)",
    );
    console.error("   -> Try: bun add -D oh-my-opencode");
    console.error("   -> Or:  bun pm cache rm && bun install");
    console.error(`   -> Log: ${r.text}`);
    process.exit(1);
  }
  console.log("✅ Muscle Check: ast-grep OK");
}

// Check 4: package.json + テストランナー確認 (FR-4.3)
{
  const packageJsonPath = join(process.cwd(), "package.json");
  if (!existsSync(packageJsonPath)) {
    console.error("❌ Fatal: package.json not found in root.");
    process.exit(1);
  }

  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  } catch {
    console.error("❌ Fatal: package.json is invalid JSON.");
    process.exit(1);
  }

  const scripts = (pkg.scripts || {}) as Record<string, string>;
  const hasTest = !!scripts.test;
  const hasBuild = !!scripts.build;

  if (hasTest) {
    const probeTest = "boulder-probe.test.ts";
    writeFileSync(
      probeTest,
      "import { test } from 'bun:test'; test('probe', () => {});",
    );
    const testRun = run(["bun", "test", probeTest]);
    try {
      unlinkSync(probeTest);
    } catch {
      // Cleanup failed but continue
    }

    if (testRun.exitCode !== 0) {
      console.error("❌ Reflex Check: 'test' script exists but runner failed.");
      console.error(`   -> Log: ${testRun.text}`);
      process.exit(1);
    }
    console.log("✅ Reflex Check: Test script detected and runner is alive.");
  } else if (hasBuild) {
    console.log(
      "⚠️ Reflex Check: No 'test' script, but 'build' script detected.",
    );
  } else {
    console.error(
      "❌ Reflex Check: Neither 'test' nor 'build' scripts found in package.json.",
    );
    console.error("   -> Sisyphus needs a way to verify his work.");
    process.exit(1);
  }
}

// Check 5: ルールディレクトリとシンボリックリンク状態確認 (FR-6 関連)
{
  const rulesDir = join(process.cwd(), "rules");
  if (existsSync(rulesDir)) {
    console.log("✅ Rules Directory: found");
  } else {
    console.warn("⚠️ Rules Directory: 'rules' folder not found in root.");
  }

  const rulesTarget = join(process.cwd(), ".cursor", "rules");

  if (existsSync(rulesTarget)) {
    try {
      const stat = lstatSync(rulesTarget);
      if (stat.isSymbolicLink()) {
        console.log(`✅ Symlink Check: .cursor/rules/ → Boulder rules linked`);
      } else {
        console.log(
          "⚠️ Symlink Check: .cursor/rules/ exists but is NOT a symlink.",
        );
        console.log("   -> Run: boulder init --force");
      }
    } catch {
      console.log("⚠️ Symlink Check: Could not read .cursor/rules/ status.");
    }
  } else {
    console.log("⚠️ Symlink Check: .cursor/rules/ does not exist.");
    console.log("   -> Run: boulder init");
  }
}

console.log("🪨 All Systems Green. Ready to Push.");
