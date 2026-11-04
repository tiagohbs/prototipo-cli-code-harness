export interface SkillArtifactFile {
  id: string;
  filename: string;
  relativePath: string;
  role: string;
  loadPolicy: string;
  tokenEstimate: number;
  content: string;
}

export interface FalsifiabilityItem {
  id: string;
  hypothesis: string;
  evidencePath: string;
  refutationAttempt: string;
  verdict: "SOBREVIVEU (Corrigido)" | "REFUTADO (Falso Positivo Descartado)";
}

export interface SubagentBenchmarkScenario {
  id: string;
  title: string;
  domain: string;
  coupledFilesCount: number;
  touchesAuthOrDb: boolean;
  breaksPublicContract: boolean;
  taskPrompt: string;
  callerContext: string;
  sourceCode: string;
  unharnessedOutput: {
    tokensConsumed: number;
    falsePositiveAlerts: number;
    missedEdgeCases: string[];
    flawedSnippet: string;
    critique: string;
  };
  harnessedOutput: {
    selectedTrack: string;
    trackRationale: string;
    tokensConsumed: number;
    planLockContract: string[];
    refactoredCode: string;
    falsifiabilityAudit: FalsifiabilityItem[];
    engineeringReceipt: string[];
  };
}

export const SKILL_ARTIFACTS: SkillArtifactFile[] = [
  {
    id: "skill-md",
    filename: "SKILL.md",
    relativePath: "cli-code-harness/SKILL.md",
    role: "Motor Operacional Principal",
    loadPolicy: "Sempre ativo na sessão CLI (~920 tokens)",
    tokenEstimate: 920,
    content: `---
name: cli-code-harness
description: >
  Cognitive and deterministic execution harness for CLI coding agents. Enforces
  dynamic stack discovery from local manifests, impact-based routing (Fast,
  Standard, Deep tracks), Synthetic Agent-Computer Interface (ACI) context
  hygiene, strict Plan/Build read-write segregation, compiler/LSP-driven
  bounded self-repair with Git checkpoints, and noise-free adversarial review
  via Evidence Grounding and Falsifiability Gates.
---

# CLI Code Harness (\`cli-code-harness\`)

Este documento define o protocolo operacional obrigatório do **Cognitive & Deterministic Harness** para agentes de engenharia de software operando em ambientes de linha de comando (CLI) e IDEs. Seu objetivo é neutralizar a degradação de janela de contexto (*Context Rot* / *Lost-in-the-Middle*), o desperdício de tokens documentado no *Scaffold Effect* (até 40x por tarefa), edições prematuras sem contrato e alertas falsos-positivos durante a revisão.

---

## 1. Descoberta Dinâmica de Stack (Zero-Bloat Profiling)

Nunca carregue documentação genérica de linguagens nem assuma flags de ferramentas por adivinhação. Na primeira interação com um repositório, execute uma **Sondagem Ultraleve de Manifesto** (limite estrito de <= 40 linhas de perfil mental/cache):

1. **Inspeção de Manifestos Raiz**:
   - Verifique apenas a existência e as seções de scripts/dependências em: \`package.json\`, \`tsconfig.json\`, \`pyproject.toml\`, \`Cargo.toml\`, \`go.mod\`, \`Makefile\`, \`justfile\` ou \`.github/workflows/*.yml\`.
2. **Extração de Oráculos Determinísticos**:
   - Identifique os comandos exatos para:
     - \`TYPECHECK_CMD\` (ex.: \`npm run lint\`, \`npx tsc --noEmit\`, \`mypy .\`, \`cargo check\`)
     - \`LINT_CMD\` (ex.: \`npx eslint --quiet\`, \`ruff check --quiet\`)
     - \`TEST_FOCUSED_CMD\` (ex.: \`node --test <file>\`, \`npx vitest run <file>\`, \`pytest -q <file>\`, \`go test ./pkg/...\`)
     - \`BUILD_CMD\` (ex.: \`npm run build\`, \`cargo build --quiet\`)
3. **Mapeamento de Convenções Nativas**:
   - Identifique em menos de 3 comandos de busca estrutural: biblioteca de validação de schemas (Zod, Pydantic, Valibot, TypeBox), padrão de tratamento de erros (\`Result<T, E>\`, exceções tipadas, middlewares Express/Fastify) e ORM/camada de dados.

---

## 2. Roteamento por Raio de Impacto e Acoplamento (3 Vias)

Antes de qualquer mutação em disco, classifique a tarefa não pelo volume bruto de linhas, mas pelo **raio de acoplamento** e **criticidade semântica**:

| Via Operacional | Critério de Ativação (Raio de Impacto) | Protocolo de Contexto e Estado | Validação e Revisão Exigida |
| :--- | :--- | :--- | :--- |
| **Via Rápida** (*Fast Track*) | Alteração isolada em 1–2 arquivos; zero mutação em assinaturas públicas, schemas de banco ou segurança. | Leitura cirúrgica do arquivo-alvo; sem documentos intermediários. | Execução imediata de \`TYPECHECK_CMD\` + \`LINT_CMD\` e inspeção de \`git diff --stat\`. |
| **Via Padrão** (*Standard Track*) | Features ou correções abrangendo 3–6 arquivos; criação ou alteração de interfaces internas entre módulos. | Plano Relâmpago (3–5 linhas); trava *Plan/Build*; contrato de tipos fechado antes da escrita. | Checkpoint Git reversível + execução de \`TEST_FOCUSED_CMD\` + triagem estruturada de diff. |
| **Via Profunda** (*Deep Track*) | Alterações em autenticação, criptografia, concorrência, migrações de banco, middlewares globais ou contratos de API pública. | Carregamento obrigatório de \`references/harness-protocols.md\`; mapeamento completo de *callers* e grafo de dependências. | Snapshots Git por sub-etapa + suíte de regressão + Auditoria Adversarial com *Evidence Grounding* e *Falsifiability Gate*. |

---

## 3. Engenharia de Contexto e Interface ACI Sintética

Para preservar a acurácia sintática e impedir a diluição de atenção no meio da janela (*lost-in-the-middle*), todas as chamadas de ferramentas e comandos de terminal devem obedecer à disciplina **ACI Sintética** (inspirada no *SWE-agent* e *Aider Repo Map*):

1. **Proibição de Despejos Verborrágicos**:
   - **NUNCA** execute suítes de teste, builds ou buscas sem limitadores de saída.
   - Sempre anexe flags silenciosas ou paginadores estritos:
     - Git: \`git status -sb\`, \`git diff --stat\`, \`git diff -U5\`, \`git log -n 5 --oneline\`.
     - Busca: \`rg -n --max-count=15 --max-columns=160 "<simbolo>"\` (evite \`grep -R\` irrestrito ou leitura de \`node_modules\`/\`dist\`/\`.git\`).
     - Testes/Linters: adicione \`--quiet\`, \`-q\`, \`--reporter=dot\` ou pipe \`| head -n 60\` quando houver risco de stacktraces massivos.
2. **Isolamento de Leitura em 3 Estágios**:
   - **Estágio 1 — Orquestração Panorâmica**: Leia apenas árvores de diretórios e assinaturas exportadas (\`export interface\`, \`export type\`, \`export function\`, \`def \`, \`pub fn \`) para construir o mapa topológico de acoplamento.
   - **Estágio 2 — Codificação Cirúrgica**: Carregue integralmente na janela de contexto **somente** os arquivos que serão modificados no passo atual e seus contratos de tipos diretos.
   - **Estágio 3 — Revisão por Diff**: Audite exclusivamente a saída de \`git diff -U5\` combinada com a verificação pontual de *callers* externos.

---

## 4. Segregação Plan/Build e Codificação Determinística

Inspirado na arquitetura de privilégios segregados (*OpenCode Plan/Build*) e validação estrita (*Pydantic AI* / *Aider*):

### 4.1. Trava Somente-Leitura (Plan Lock)
Em tarefas de **Via Padrão** ou **Via Profunda**, é estritamente proibido invocar ferramentas de escrita ou edição de arquivos até que os 3 itens abaixo estejam definidos:
1. **Contrato de Dados e Tipos**: Assinaturas exatas de entrada/saída, invariantes de domínio e tipos de erro.
2. **Mapa de Callers Afetados**: Lista nominal de todos os arquivos que importam ou invocam os símbolos modificados.
3. **Critério de Aceite Executável**: Comando determinístico exato que provará o sucesso da mudança.

### 4.2. Defensividade Estrutural na Escrita (Build Lock)
Quando a escrita é liberada:
- **Zero Placeholders**: Proibido emitir \`TODO\`, \`FIXME\`, \`// lógica aqui\`, implementações parciais ou mocks silenciosos.
- **Casos de Borda Explícitos**: Trate entradas nulas/indefinidas, coleções vazias, limites numéricos (\`0\`, \`NaN\`, \`Infinity\`), timeouts de rede/I/O, cancelamento (\`AbortSignal\`) e condições de corrida (idempotência / travas atômicas).
- **Segurança por Padrão**: Sanitize entradas externas na fronteira (validação por schema), previna injeções (SQL/ comando/ XSS), evite vazamento de segredos ou stacktraces internos em respostas HTTP.

### 4.3. Loop de Auto-Reparo Contido e Oráculo de Tipos
Após cada lote lógico de edição em disco:
1. Dispare imediatamente \`TYPECHECK_CMD\` e \`TEST_FOCUSED_CMD\`.
2. Se o comando retornar código de saída != 0:
   - Extraia apenas o erro bruto do compilador/teste (máximo de 40 linhas relevantes).
   - Corrija a causa-raiz estrutural (nunca silencie o erro com \`@ts-ignore\`, \`any\` ou remoção do assert de teste).
   - **Limite Rígido de Tentativas**: Máximo de **3 ciclos de auto-reparo** consecutivos. Se a falha persistir após a 3ª tentativa, execute rollback imediato para o último checkpoint estável (\`git checkout -- <arquivos>\` ou restauração de snapshot), reavalie a arquitetura e reporte o bloqueio.

---

## 5. Revisão Adversarial com Evidência e Falsificabilidade

Para eliminar tanto a revisão complacente quanto o ruído de falsos positivos teóricos (padrão *Agent-Field / PR-AF*), toda alteração concluída passa pelo pipeline de auditoria antes da entrega:

1. **Geração de Hipótese de Falha**:
   - Inspecione o \`git diff -U5\` procurando por: quebra de contrato nos *callers*, mutação de estado compartilhado sem sincronização, falha de autorização/autenticação, vazamento de recursos ou regressão de performance ($O(N^2)$ em caminhos críticos, queries N+1).
2. **Fundamentação em Evidências (*Evidence Grounding*)**:
   - É proibido reportar ou corrigir um risco hipotético sem rastrear no repositório a árvore real de chamadas (\`rg "<funcao_alterada>"\`). Prove com arquivo e linha exata como um payload ou estado inválido atinge o código modificado em execução real.
3. **Portão de Falsificabilidade (*Falsifiability Gate*)**:
   - Antes de aprovar um alerta de defeito, atue como advogado de defesa do código e tente **refutar o próprio alerta**:
     - Existe um middleware upstream, schema Zod/Pydantic, constraint de banco ou guarda de tipo que já intercepta esse estado antes da função?
     - O ambiente de execução garante isolamento single-thread ou transacional naquele escopo?
   - **Regra de Corte**: Se o alerta for refutado por uma proteção existente no projeto, **descarte-o silenciosamente**. Apenas falhas que **sobrevivam à tentativa de refutação** são corrigidas no código e registradas no recibo final.

---

## 6. Formato de Entrega: Diff-First + Recibo de Engenharia

Nunca despeje explicações prolixas que poluam o terminal. Entregue o código aplicado e validado acompanhado deste **Recibo de Engenharia** compacto:

\`\`\`markdown
### RECIBO DE ENGENHARIA (CLI-CODE-HARNESS)
- **Via Acionada**: [Rápida | Padrão | Profunda] — [Justificativa de impacto em 1 linha]
- **Arquivos Modificados**: \`caminho/arquivo1.ts\`, \`caminho/arquivo2.ts\`
- **Oráculo Determinístico**:
  - Typecheck/Lint: \`[comando executado]\` -> [PASS / código 0]
  - Testes Focados: \`[comando executado]\` -> [PASS / X testes verificados]
- **Auditoria de Falsificabilidade**:
  - [Hipótese analisada] -> [Evidência em caller:linha] -> [Refutado por guarda X | Confirmado e corrigido no diff]

### RESUMO DAS MUDANÇAS
- [Lista objetiva e cirúrgica de cada alteração implementada para cumprir os requisitos e sanar falhas estruturais]
\`\`\``,
  },
  {
    id: "harness-protocols-md",
    filename: "references/harness-protocols.md",
    relativePath: "cli-code-harness/references/harness-protocols.md",
    role: "Protocolos Profundos Sob Demanda",
    loadPolicy: "Carregado sob demanda na Via Padrão/Profunda (~680 tokens)",
    tokenEstimate: 680,
    content: `# Protocolos Avançados do Harness (\`references/harness-protocols.md\`)

> **Instrução de Carregamento Sob Demanda**: Carregue este arquivo na janela de contexto somente quando a tarefa for classificada na **Via Padrão** (se houver refatoração multi-módulo com risco de regressão) ou obrigatoriamente na **Via Profunda** (alterações de banco de dados, segurança, autenticação, concorrência ou contratos públicos).

---

## 1. Algoritmo de Mapeamento Estrutural de Repositório (Repo Map Lite)

Inspirado na extração via AST e ranqueamento topológico do *Aider*, substitua buscas textuais cegas pelo protocolo de **Grafo Local de Acoplamento** em 3 passos determinísticos:

### Passo 1: Extração de Símbolos Exportados nos Arquivos-Alvo
Execute leitura seletiva das declarações públicas do arquivo que sofrerá mutação:
\`\`\`bash
# TypeScript / JavaScript
rg -n "^(export\\s+(async\\s+)?function|export\\s+(const|type|interface|class|enum))\\s+" <arquivo_alvo>

# Python
rg -n "^(def|async\\s+def|class)\\s+" <arquivo_alvo>

# Go / Rust
rg -n "^(func|type|pub\\s+(fn|struct|enum|trait))\\s+" <arquivo_alvo>
\`\`\`

### Passo 2: Descoberta de Callers de 1º Grau (Inbound Edges)
Para cada símbolo que terá assinatura, comportamento ou efeito colateral alterado, localize todos os pontos de chamada ativos no repositório:
\`\`\`bash
rg -n --max-count=30 --glob '!{node_modules,dist,build,.git,coverage}/**' "\\b<NomeDoSimbolo>\\b"
\`\`\`

### Passo 3: Contrato de Congelamento (Contract Freeze)
Antes de iniciar o *Build Mode*, preencha mentalmente ou no rascunho de execução a matriz de impacto:
- **Símbolo Alvo**: \`<nome>\`
- **Invariante Pré-Condição**: O que os callers garantem antes de chamar?
- **Invariante Pós-Condição**: O que a função promete retornar ou lançar?
- **Callers que quebram se a assinatura mudar**: \`[lista de arquivo:linha]\`

---

## 2. Protocolo de Checkpoints Reversíveis em Git (State Persistence)

Inspirado na persistência transacional do *LangGraph* e nos commits atômicos do *Aider*, nunca execute refatorações multi-arquivo sem um ponto de restauração determinístico.

### 2.1. Criação de Snapshot Pré-Mutação
Antes de iniciar edições da **Via Padrão** ou **Via Profunda**:
1. Verifique se a árvore de trabalho possui modificações não rastreadas pelo agente:
   \`\`\`bash
   git status --porcelain
   \`\`\`
2. Crie uma referência de snapshot reversível sem alterar o histórico público da branch:
   \`\`\`bash
   HARNESS_CHECKPOINT=$(git stash create "harness-checkpoint-pre-build")
   echo "Checkpoint SHA: \${HARNESS_CHECKPOINT:-HEAD}"
   \`\`\`

### 2.2. Gatilho de Rollback Determinístico (Time-Travel Recovery)
O rollback para \`\${HARNESS_CHECKPOINT:-HEAD}\` deve ser acionado automaticamente quando:
- O loop de auto-reparo atingir **3 falhas consecutivas** no \`TYPECHECK_CMD\` ou \`TEST_FOCUSED_CMD\`.
- Uma correção de bug exigir modificar mais que o dobro de arquivos previstos no *Plan Lock* (sinal de efeito cascata não planejado).

---

## 3. Pipeline Completo de Auditoria Adversarial (PR-AF Protocol)

Quando a **Via Profunda** estiver ativa, o agente deve mudar sua postura cognitiva de *Construtor* para *Auditor Red-Team Cético* e preencher a matriz de 3 fases abaixo sobre o \`git diff -U5\`:

### Fase A — Fundamentação em Evidências (*Evidence Grounding*)
Nenhuma vulnerabilidade ou bug pode ser alegado apenas olhando para uma linha isolada do diff. Para cada suspeita $S_i$:
1. **Rastreio de Origem (Source-to-Sink)**: De onde vem o dado? (Ex.: \`req.body\`, query param, fila de mensagens, banco de dados, arquivo externo).
2. **Prova de Caminho Executável**: Cite o caminho completo:
   \`[Caller Externo:linha] -> [Intermediário:linha] -> [Linha Modificada no Diff]\`.

### Fase B — Síntese de Vulnerabilidades Compostas
Verifique se a combinação entre dois arquivos modificados cria uma falha emergente:
- **Concorrência / TOCTOU (Time-of-Check to Time-of-Use)**: A verificação de saldo/permissão/estado ocorre fora da transação ou lock onde a escrita acontece?
- **Assimetria de Serialização/Tipagem**: O backend alterou um campo para opcional/nullable, mas o consumidor frontend assume presença estrita sem fallback?
- **Vazamento de Recursos em Exceção**: Se uma chamada assíncrona intermediária falhar ou sofrer timeout, conexões, locks, timers ou listeners abertos antes dela são liberados em bloco \`finally\`?

### Fase C — Portão de Falsificabilidade (*Falsifiability Gate*)
Para cada anomalia fundamentada na Fase A/B, execute uma busca ativa por **mitigações existentes** no repositório para tentar **invalidar** a própria suspeita:

| ID | Anomalia Suspeita | Evidência de Caminho (Source -> Sink) | Tentativa de Refutação (Busca por Guardas/Middlewares) | Veredito do Portão |
| :--- | :--- | :--- | :--- | :--- |
| \`F-01\` | Ex: SQL Injection / Filtro não sanitizado | \`routes/users.ts:42\` -> \`repo.ts:18\` | Verificado \`middlewares/validate.ts:12\`: schema Zod restringe input a \`z.string().uuid()\`. | **REFUTADO** (Descartar alerta) |
| \`F-02\` | Ex: Condição de corrida em duplo clique de webhook | \`webhooks/stripe.ts:88\` -> \`ledger.ts:34\` | Buscado lock/idempotency key em \`webhooks/\` e \`ledger.ts\`: ausente; \`SELECT\` seguido de \`INSERT\` sem \`UNIQUE\` ou \`FOR UPDATE\`. | **SOBREVIVEU** (Bloqueante: corrigir antes de entregar) |`,
  },
  {
    id: "aci-probe-sh",
    filename: "scripts/aci-probe.sh",
    relativePath: "cli-code-harness/scripts/aci-probe.sh",
    role: "Utilitário Determinístico ACI (Bash)",
    loadPolicy: "Executado via CLI sem consumir janela com código de script",
    tokenEstimate: 310,
    content: `#!/usr/bin/env bash
# ==============================================================================
# cli-code-harness: Synthetic ACI Probe & Deterministic Stack Profiler
# ==============================================================================
# Uso:
#   ./aci-probe.sh profile           -> Extrai perfil ultraleve da stack (<40 linhas)
#   ./aci-probe.sh callers <simbolo> -> Mapeia definicoes e callers de 1o grau
#   ./aci-probe.sh verify            -> Executa typecheck/lint/test com output contido
# ==============================================================================

set -euo pipefail

MODE="\${1:-profile}"
TARGET="\${2:-}"

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
}

run_callers() {
  if [[ -z "$TARGET" ]]; then
    echo "Erro: Especifique o simbolo. Uso: ./aci-probe.sh callers <Simbolo>" >&2
    exit 1
  fi
  echo "=== [ACI-PROBE] CALLER & REFERENCE GRAPH: \${TARGET} ==="
  if command -v rg >/dev/null 2>&1; then
    rg -n --max-count=25 --max-columns=160 $EXCLUDE_GLOBS "\\b\${TARGET}\\b" . || echo "Nenhuma referencia encontrada."
  else
    grep -rn --exclude-dir={node_modules,dist,build,.git} "\\b\${TARGET}\\b" . | head -n 40 || echo "Nenhuma referencia encontrada."
  fi
}

run_verify() {
  echo "=== [ACI-PROBE] DETERMINISTIC ORACLE VERIFICATION ==="
  if [[ -f "package.json" ]]; then
    npm run lint --silent 2>&1 | head -n 45
    echo "-> Status: PASS (exit 0)"
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
esac`,
  },
];

export const SUBAGENT_SCENARIOS: SubagentBenchmarkScenario[] = [
  {
    id: "webhook-toctou-idempotency",
    title: "01. Condição de Corrida TOCTOU em Webhook de Pagamento e Estorno",
    domain: "Concorrência & Transações Financeiras",
    coupledFilesCount: 4,
    touchesAuthOrDb: true,
    breaksPublicContract: false,
    taskPrompt:
      "Refatore processPaymentWebhook para garantir idempotência sob retentativas paralelas do provedor de pagamento, evitar saldo duplicado (TOCTOU), validar limites numéricos e descartar falsos positivos de autenticação já cobertos pelo middleware upstream.",
    callerContext: [
      "src/routes/webhooks.ts:19 -> router.post('/webhooks/payment', verifyHmacSignatureMiddleware, validateZod(WebhookSchema), processPaymentWebhook)",
      "src/middlewares/verifyHmac.ts:8 -> Valida assinatura criptográfica X-Signature com timingSafeEqual antes do controller.",
      "src/middlewares/validateZod.ts:14 -> Valida eventId (uuid v4) e accountId (uuid v4), mas permite amount: z.number().",
      "src/db/ledgerRepo.ts:44 -> export interface LedgerClient { withSerializableTx<T>(fn: (tx: TxClient) => Promise<T>): Promise<T>; }",
    ].join("\n"),
    sourceCode: `// src/services/paymentWebhook.ts
import { db } from "../db/ledgerRepo";

export async function processPaymentWebhook(payload: {
  eventId: string;
  accountId: string;
  amountCents: number;
}) {
  // Verifica se o evento já foi processado
  const existing = await db.query(
    "SELECT id FROM processed_events WHERE event_id = $1",
    [payload.eventId]
  );
  if (existing.rows.length > 0) {
    return { status: "ignored" };
  }

  // Atualiza saldo da conta e registra evento
  const account = await db.query(
    "SELECT balance_cents FROM accounts WHERE id = $1",
    [payload.accountId]
  );
  const newBalance = account.rows[0].balance_cents + payload.amountCents;

  await db.query("UPDATE accounts SET balance_cents = $1 WHERE id = $2", [
    newBalance,
    payload.accountId,
  ]);
  await db.query(
    "INSERT INTO processed_events (event_id, created_at) VALUES ($1, NOW())",
    [payload.eventId]
  );

  return { status: "credited", balanceCents: newBalance };
}`,
    unharnessedOutput: {
      tokensConsumed: 18420,
      falsePositiveAlerts: 3,
      missedEdgeCases: [
        "Manteve SELECT antes de INSERT fora de transação atômica (vulnerável a race condition quando 2 webhooks chegam no mesmo milissegundo).",
        "Não tratou account.rows[0] indefinido (TypeError quando conta não existe).",
        "Emitiu 3 alertas falsos pedindo verificação de HMAC e validação de UUID que já existiam em verifyHmacSignatureMiddleware e validateZod.",
      ],
      flawedSnippet: `// Saída típica de subagente sem harness:
export async function processPaymentWebhook(payload: any) {
  // TODO: validar assinatura HMAC aqui
  try {
    const existing = await db.query("SELECT id FROM processed_events WHERE event_id = $1", [payload.eventId]);
    if (existing.rows.length > 0) return { status: "ignored" };
    // Ainda vulnerável a TOCTOU entre processos concorrentes!
    await db.query("UPDATE accounts SET balance_cents = balance_cents + $1 WHERE id = $2", [payload.amountCents, payload.accountId]);
    await db.query("INSERT INTO processed_events (event_id) VALUES ($1)", [payload.eventId]);
  } catch (e) {
    console.error(e);
  }
}`,
      critique:
        "Sem a trava Plan/Build e o Portão de Falsificabilidade, o modelo menor leu 14 arquivos desnecessários, inventou um TODO para HMAC (que já estava no middleware de rota) e falhou em usar ON CONFLICT DO NOTHING + lock pessimista dentro de transação.",
    },
    harnessedOutput: {
      selectedTrack: "Via Profunda",
      trackRationale:
        "Mutação em fluxo financeiro concorrente e persistência transacional com acoplamento em 4 módulos (webhooks, middlewares, service e ledgerRepo).",
      tokensConsumed: 2190,
      planLockContract: [
        "Contrato de Entrada: Payload validado por WebhookSchema upstream, porém `amountCents` exige guarda determinística de inteiro seguro positivo (`Number.isSafeInteger(n) && n > 0`).",
        "Invariante de Concorrência: Eliminação de TOCTOU via `INSERT INTO processed_events ... ON CONFLICT (event_id) DO NOTHING RETURNING event_id` dentro de `db.withSerializableTx`.",
        "Invariante de Entidade: Atualização atômica `UPDATE accounts SET balance_cents = balance_cents + $1 ... RETURNING balance_cents` com erro tipado se `rowCount === 0`.",
        "Callers Verificados: `src/routes/webhooks.ts:19` preserva assinatura `{ status: 'ignored' | 'credited', balanceCents?: number }`.",
      ],
      refactoredCode: `// src/services/paymentWebhook.ts
import { db, TxClient } from "../db/ledgerRepo";

export interface PaymentWebhookPayload {
  readonly eventId: string;
  readonly accountId: string;
  readonly amountCents: number;
}

export type PaymentWebhookResult =
  | { readonly status: "ignored"; readonly eventId: string }
  | { readonly status: "credited"; readonly eventId: string; readonly balanceCents: number };

export class WebhookDomainError extends Error {
  constructor(
    public readonly code: "INVALID_AMOUNT" | "ACCOUNT_NOT_FOUND",
    message: string
  ) {
    super(message);
    this.name = "WebhookDomainError";
  }
}

export async function processPaymentWebhook(
  payload: PaymentWebhookPayload
): Promise<PaymentWebhookResult> {
  if (
    typeof payload.amountCents !== "number" ||
    !Number.isSafeInteger(payload.amountCents) ||
    payload.amountCents <= 0
  ) {
    throw new WebhookDomainError(
      "INVALID_AMOUNT",
      \`amountCents deve ser um inteiro positivo seguro. Recebido: \${String(payload.amountCents)}\`
    );
  }

  return db.withSerializableTx(async (tx: TxClient): Promise<PaymentWebhookResult> => {
    // 1. Trava atômica de idempotência: elimina condição de corrida TOCTOU
    const claimResult = await tx.query<{ event_id: string }>(
      \`INSERT INTO processed_events (event_id, created_at)
       VALUES ($1, NOW())
       ON CONFLICT (event_id) DO NOTHING
       RETURNING event_id\`,
      [payload.eventId]
    );

    if (claimResult.rowCount === 0) {
      return { status: "ignored", eventId: payload.eventId };
    }

    // 2. Incremento atômico no banco evitando leitura intermediária defasada
    const updateResult = await tx.query<{ balance_cents: number }>(
      \`UPDATE accounts
       SET balance_cents = balance_cents + $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING balance_cents\`,
      [payload.amountCents, payload.accountId]
    );

    const updatedRow = updateResult.rows[0];
    if (!updatedRow) {
      // Dispara rollback automático da transação (incluindo o processed_events recém-inserido)
      throw new WebhookDomainError(
        "ACCOUNT_NOT_FOUND",
        \`Conta destino não localizada para accountId=\${payload.accountId}\`
      );
    }

    return {
      status: "credited",
      eventId: payload.eventId,
      balanceCents: Number(updatedRow.balance_cents),
    };
  });
}`,
      falsifiabilityAudit: [
        {
          id: "F-01",
          hypothesis: "Falta de verificação de assinatura HMAC do provedor de webhook.",
          evidencePath: "src/routes/webhooks.ts:19 -> src/middlewares/verifyHmac.ts:8",
          refutationAttempt:
            "Inspecionado pipeline da rota: `verifyHmacSignatureMiddleware` executa `crypto.timingSafeEqual` antes de invocar `processPaymentWebhook`.",
          verdict: "REFUTADO (Falso Positivo Descartado)",
        },
        {
          id: "F-02",
          hypothesis: "Condição de corrida TOCTOU entre SELECT e INSERT de `processed_events`.",
          evidencePath: "src/routes/webhooks.ts:19 -> src/services/paymentWebhook.ts:10-32",
          refutationAttempt:
            "Verificado se havia lock distribuído Redis ou transação única: inexistente. Duas requisições paralelas liam `existing.rows.length === 0` simultaneamente.",
          verdict: "SOBREVIVEU (Corrigido)",
        },
        {
          id: "F-03",
          hypothesis: "Corrupção de saldo por `amountCents` negativo, `NaN` ou ponto flutuante.",
          evidencePath: "src/middlewares/validateZod.ts:14 -> src/services/paymentWebhook.ts:21",
          refutationAttempt:
            "Verificado `WebhookSchema`: definia apenas `z.number()` sem `.int().positive()`, permitindo `NaN` ou valores fracionários/negativos.",
          verdict: "SOBREVIVEU (Corrigido)",
        },
      ],
      engineeringReceipt: [
        "Encapsulamento integral da operação em `db.withSerializableTx` para garantir atomicidade entre registro de evento e crédito em conta.",
        "Substituição do padrão `SELECT` + `INSERT` por `INSERT ... ON CONFLICT (event_id) DO NOTHING RETURNING`, eliminando a janela de condição de corrida (TOCTOU).",
        "Substituição do cálculo de saldo em memória JS por incremento atômico em SQL (`balance_cents = balance_cents + $1 RETURNING balance_cents`) com rollback imediato caso a conta não exista.",
        "Adição de validação estrita `Number.isSafeInteger(payload.amountCents) && payload.amountCents > 0` na fronteira do serviço.",
      ],
    },
  },
  {
    id: "batch-stream-abort-leak",
    title: "02. Vazamento de Memória e Descritores em Processador de Lotes Assíncrono",
    domain: "Escalabilidade, I/O & Concorrência Controlada",
    coupledFilesCount: 3,
    touchesAuthOrDb: false,
    breaksPublicContract: false,
    taskPrompt:
      "Corrija o esgotamento de memória (OOM), a ausência de cancelamento via AbortSignal e o vazamento de conexões em caso de falha parcial durante o processamento de lotes em `syncCustomerRecords`.",
    callerContext: [
      "src/workers/nightlySync.ts:31 -> await syncCustomerRecords(cursorStream, { concurrency: 4, signal: abortController.signal })",
      "src/adapters/crmClient.ts:12 -> export async function pushRecordWithTimeout(record: CustomerRecord, signal?: AbortSignal): Promise<void>",
    ].join("\n"),
    sourceCode: `// src/workers/batchProcessor.ts
import { pushRecordWithTimeout } from "../adapters/crmClient";

export async function syncCustomerRecords(
  recordsIterable: AsyncIterable<{ id: string; email: string }>,
  options: { concurrency: number; signal?: AbortSignal }
) {
  const allRecords = [];
  for await (const rec of recordsIterable) {
    allRecords.push(rec);
  }

  // Dispara todas as chamadas em paralelo
  const results = await Promise.all(
    allRecords.map((r) => pushRecordWithTimeout(r))
  );

  return { processed: results.length };
}`,
    unharnessedOutput: {
      tokensConsumed: 11340,
      falsePositiveAlerts: 2,
      missedEdgeCases: [
        "Continuou materializando todo o `AsyncIterable` em `allRecords` na RAM antes de processar (causa OOM em streams de milhões de registros).",
        "Não validou `concurrency <= 0` (causaria loop infinito ou travamento da fila).",
        "Se o `recordsIterable` possuir método `.return()` (cursor de banco), não garantiu fechamento em caso de abort.",
      ],
      flawedSnippet: `// Saída típica de subagente sem harness:
export async function syncCustomerRecords(recordsIterable: any, options: any) {
  const allRecords = [];
  for await (const rec of recordsIterable) {
    if (options.signal?.aborted) break;
    allRecords.push(rec);
  }
  // Ainda acumula tudo na memória e ignora o limite de concorrência!
  await Promise.all(allRecords.map(r => pushRecordWithTimeout(r, options.signal)));
  return { processed: allRecords.length };
}`,
      critique:
        "O modelo sem harness adicionou apenas um `if (signal?.aborted) break`, mantendo o anti-padrão de carregar todo o stream na memória e disparar `Promise.all` irrestrito ignorando `options.concurrency`.",
    },
    harnessedOutput: {
      selectedTrack: "Via Padrão",
      trackRationale:
        "Refatoração de controle de fluxo assíncrono e gerenciamento de memória entre 3 módulos internos sem alterar o contrato externo do worker.",
      tokensConsumed: 1640,
      planLockContract: [
        "Invariante de Complexidade Espacial: Memória $O(K)$ onde $K = \\text{concurrency}$ (proibido materializar o `AsyncIterable` completo em array).",
        "Guarda de Fronteira: `concurrency` deve ser normalizado para inteiro seguro $\\ge 1$ e $\\le 64$.",
        "Ciclo de Vida de Recursos: Propagar `AbortSignal` para cada chamada de `pushRecordWithTimeout` e garantir fechamento determinístico do iterator no bloco `finally`.",
      ],
      refactoredCode: `// src/workers/batchProcessor.ts
import { pushRecordWithTimeout } from "../adapters/crmClient";

export interface CustomerRecord {
  readonly id: string;
  readonly email: string;
}

export interface SyncBatchOptions {
  readonly concurrency: number;
  readonly signal?: AbortSignal;
}

export interface SyncBatchSummary {
  readonly processed: number;
}

const MAX_SAFE_CONCURRENCY = 64;

export async function syncCustomerRecords(
  recordsIterable: AsyncIterable<CustomerRecord>,
  options: SyncBatchOptions
): Promise<SyncBatchSummary> {
  if (!recordsIterable || typeof recordsIterable[Symbol.asyncIterator] !== "function") {
    throw new TypeError("recordsIterable deve implementar Symbol.asyncIterator.");
  }

  const rawConcurrency = options?.concurrency ?? 1;
  if (!Number.isFinite(rawConcurrency) || rawConcurrency < 1) {
    throw new RangeError(\`concurrency inválido (\${String(rawConcurrency)}). Deve ser >= 1.\`);
  }
  const concurrency = Math.min(Math.floor(rawConcurrency), MAX_SAFE_CONCURRENCY);
  const signal = options?.signal;

  signal?.throwIfAborted();

  const iterator = recordsIterable[Symbol.asyncIterator]();
  const inFlight = new Set<Promise<void>>();
  let processed = 0;
  let firstError: unknown = null;

  try {
    while (!firstError) {
      if (signal?.aborted) {
        signal.throwIfAborted();
      }

      const { value, done } = await iterator.next();
      if (done) {
        break;
      }

      const taskPromise = (async () => {
        await pushRecordWithTimeout(value, signal);
        processed += 1;
      })();

      const trackedPromise = taskPromise.then(
        () => {
          inFlight.delete(trackedPromise);
        },
        (err: unknown) => {
          inFlight.delete(trackedPromise);
          if (!firstError) {
            firstError = err;
          }
        }
      );

      inFlight.add(trackedPromise);

      if (inFlight.size >= concurrency) {
        await Promise.race(inFlight);
      }
    }

    if (inFlight.size > 0) {
      await Promise.allSettled(inFlight);
    }

    if (firstError) {
      throw firstError;
    }

    signal?.throwIfAborted();
    return { processed };
  } finally {
    // Garante liberação determinística do cursor de banco/arquivo subjacente
    if (typeof iterator.return === "function") {
      try {
        await iterator.return();
      } catch {
        // Silencia erro secundário de fechamento para preservar a exceção primária
      }
    }
  }
}`,
      falsifiabilityAudit: [
        {
          id: "F-01",
          hypothesis: "Crescimento linear de memória O(N) levando a OOM em streams longos.",
          evidencePath: "src/workers/nightlySync.ts:31 -> src/workers/batchProcessor.ts:8-11",
          refutationAttempt:
            "Verificado se `cursorStream` limitava registros na origem: não, é um cursor contínuo de tabela inteira.",
          verdict: "SOBREVIVEU (Corrigido)",
        },
        {
          id: "F-02",
          hypothesis: "Vazamento de cursor aberto no banco se `pushRecordWithTimeout` lançar erro no meio da iteração.",
          evidencePath: "src/workers/batchProcessor.ts:9 -> iterator manual",
          refutationAttempt:
            "Verificado se a interrupção da pool de Promises fechava o `AsyncIterator` antes do esgotamento: quando uma Promise rejeitava ou o pool abortava, era necessário invocar `iterator.return()` explicitamente.",
          verdict: "SOBREVIVEU (Corrigido)",
        },
      ],
      engineeringReceipt: [
        "Substituição do acúmulo integral em memória (`allRecords.push`) por janela deslizante de backpressure com `Set<Promise<void>>` limitada a `O(concurrency)`.",
        "Validação defensiva de `recordsIterable` e normalização de `concurrency` no intervalo `[1, 64]`.",
        "Propagação estrita de `AbortSignal` antes de cada leitura de cursor e para `pushRecordWithTimeout`.",
        "Fechamento determinístico do `AsyncIterator` via `iterator.return()` em bloco `finally` para impedir vazamento de cursores de banco de dados.",
      ],
    },
  },
];
