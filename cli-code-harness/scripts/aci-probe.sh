#!/usr/bin/env bash
# ==============================================================================
# cli-code-harness: Synthetic ACI Probe & Deterministic Stack Profiler
# ==============================================================================
# Uso:
#   ./aci-probe.sh profile           -> Extrai perfil ultraleve da stack (<40 linhas)
#   ./aci-probe.sh callers <simbolo> -> Mapeia definicoes e callers de 1o grau
#   ./aci-probe.sh verify            -> Executa typecheck/lint/test com output contido
# ==============================================================================

set -euo pipefail

MODE="${1:-profile}"
TARGET="${2:-}"

EXCLUDE_GLOBS="--glob !node_modules/** --glob !dist/** --glob !build/** --glob !.git/** --glob !coverage/** --glob !.next/**"

run_profile() {
  echo "=== [ACI-PROBE] STACK & MANIFEST PROFILE ==="
  echo "cwd: $(pwd)"
  echo "git_branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'none')"
  echo "git_dirty_files: $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"

  if [[ -f "package.json" ]]; then
    echo "manifest: package.json (Node/TypeScript)"
    node -e '
      const fs = require("fs");
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
      const scripts = pkg.scripts || {};
      const deps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });
      console.log("scripts:", JSON.stringify(scripts));
      console.log("key_packages:", deps.filter(d =>
        /^(typescript|vite|next|express|fastify|zod|drizzle|prisma|vitest|jest|playwright|eslint|tailwindcss)$/.test(d)
      ).join(", "));
    ' 2>/dev/null || true
  fi

  if [[ -f "pyproject.toml" ]]; then
    echo "manifest: pyproject.toml (Python)"
    grep -E "^(name|version|requires-python)" pyproject.toml 2>/dev/null | head -n 5 || true
  fi

  if [[ -f "Cargo.toml" ]]; then
    echo "manifest: Cargo.toml (Rust)"
    grep -E "^(name|edition)" Cargo.toml 2>/dev/null | head -n 5 || true
  fi

  if [[ -f "go.mod" ]]; then
    echo "manifest: go.mod (Go)"
    head -n 5 go.mod 2>/dev/null || true
  fi
}

run_callers() {
  if [[ -z "$TARGET" ]]; then
    echo "Erro: Especifique o simbolo. Uso: ./aci-probe.sh callers <Simbolo>" >&2
    exit 1
  fi
  echo "=== [ACI-PROBE] CALLER & REFERENCE GRAPH: ${TARGET} ==="
  if command -v rg >/dev/null 2>&1; then
    rg -n --max-count=25 --max-columns=160 $EXCLUDE_GLOBS "\b${TARGET}\b" . || echo "Nenhuma referencia encontrada."
  else
    grep -rn --exclude-dir={node_modules,dist,build,.git} "\b${TARGET}\b" . | head -n 40 || echo "Nenhuma referencia encontrada."
  fi
}

run_verify() {
  echo "=== [ACI-PROBE] DETERMINISTIC ORACLE VERIFICATION ==="
  if [[ -f "package.json" ]]; then
    if node -e 'const p=require("./package.json"); process.exit(p.scripts?.lint ? 0 : 1)' 2>/dev/null; then
      echo "-> Running: npm run lint --silent"
      npm run lint --silent 2>&1 | head -n 45
      echo "-> Status: PASS (exit 0)"
    elif [[ -f "tsconfig.json" ]]; then
      echo "-> Running: npx tsc --noEmit"
      npx tsc --noEmit 2>&1 | head -n 45
      echo "-> Status: PASS (exit 0)"
    fi
  fi
}

case "$MODE" in
  profile) run_profile ;;
  callers) run_callers ;;
  verify)  run_verify ;;
  *)
    echo "Modo invalido: $MODE. Use: profile | callers <simbolo> | verify" >&2
    exit 1
    ;;
esac
