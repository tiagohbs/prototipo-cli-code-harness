---
name: cli-code-harness
description: >
  Cognitive and deterministic execution harness for CLI coding agents. Enforces
  dynamic stack discovery from local manifests, impact-based routing (Fast,
  Standard, Deep tracks), Synthetic Agent-Computer Interface (ACI) context
  hygiene, strict Plan/Build read-write segregation, compiler/LSP-driven
  bounded self-repair with Git checkpoints, and noise-free adversarial review
  via Evidence Grounding and Falsifiability Gates.
---

# CLI Code Harness (`cli-code-harness`)

Este documento define o protocolo operacional obrigatório do **Cognitive & Deterministic Harness** para agentes de engenharia de software operando em ambientes de linha de comando (CLI) e IDEs. Seu objetivo é neutralizar a degradação de janela de contexto (*Context Rot* / *Lost-in-the-Middle*), o desperdício de tokens documentado no *Scaffold Effect* (até 40x por tarefa), edições prematuras sem contrato e alertas falsos-positivos durante a revisão.

---

## 1. Descoberta Dinâmica de Stack (Zero-Bloat Profiling)

Nunca carregue documentação genérica de linguagens nem assuma flags de ferramentas por adivinhação. Na primeira interação com um repositório, execute uma **Sondagem Ultraleve de Manifesto** (limite estrito de $\le 40$ linhas de perfil mental/cache):

1. **Inspeção de Manifestos Raiz**:
   - Verifique apenas a existência e as seções de scripts/dependências em: `package.json`, `tsconfig.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Makefile`, `justfile` ou `.github/workflows/*.yml`.
2. **Extração de Oráculos Determinísticos**:
   - Identifique os comandos exatos para:
     - `TYPECHECK_CMD` (ex.: `npm run lint`, `npx tsc --noEmit`, `mypy .`, `cargo check`)
     - `LINT_CMD` (ex.: `npx eslint --quiet`, `ruff check --quiet`)
     - `TEST_FOCUSED_CMD` (ex.: `node --test <file>`, `npx vitest run <file>`, `pytest -q <file>`, `go test ./pkg/...`)
     - `BUILD_CMD` (ex.: `npm run build`, `cargo build --quiet`)
3. **Mapeamento de Convenções Nativas**:
   - Identifique em menos de 3 comandos de busca estrutural: biblioteca de validação de schemas (Zod, Pydantic, Valibot, TypeBox), padrão de tratamento de erros (`Result<T, E>`, exceções tipadas, middlewares Express/Fastify) e ORM/camada de dados.

---

## 2. Roteamento por Raio de Impacto e Acoplamento (3 Vias)

Antes de qualquer mutação em disco, classifique a tarefa não pelo volume bruto de linhas, mas pelo **raio de acoplamento** e **criticidade semântica**:

| Via Operacional | Critério de Ativação (Raio de Impacto) | Protocolo de Contexto e Estado | Validação e Revisão Exigida |
| :--- | :--- | :--- | :--- |
| **Via Rápida** (*Fast Track*) | Alteração isolada em 1–2 arquivos; zero mutação em assinaturas públicas, schemas de banco ou segurança. | Leitura cirúrgica do arquivo-alvo; sem documentos intermediários. | Execução imediata de `TYPECHECK_CMD` + `LINT_CMD` e inspeção de `git diff --stat`. |
| **Via Padrão** (*Standard Track*) | Features ou correções abrangendo 3–6 arquivos; criação ou alteração de interfaces internas entre módulos. | Plano Relâmpago (3–5 linhas); trava *Plan/Build*; contrato de tipos fechado antes da escrita. | Checkpoint Git reversível + execução de `TEST_FOCUSED_CMD` + triagem estruturada de diff. |
| **Via Profunda** (*Deep Track*) | Alterações em autenticação, criptografia, concorrência, migrações de banco, middlewares globais ou contratos de API pública. | Carregamento obrigatório de `references/harness-protocols.md`; mapeamento completo de *callers* e grafo de dependências. | Snapshots Git por sub-etapa + suíte de regressão + Auditoria Adversarial com *Evidence Grounding* e *Falsifiability Gate*. |

---

## 3. Engenharia de Contexto e Interface ACI Sintética

Para preservar a acurácia sintática e impedir a diluição de atenção no meio da janela (*lost-in-the-middle*), todas as chamadas de ferramentas e comandos de terminal devem obedecer à disciplina **ACI Sintética** (inspirada no *SWE-agent* e *Aider Repo Map*):

1. **Proibição de Despejos Verborrágicos**:
   - **NUNCA** execute suítes de teste, builds ou buscas sem limitadores de saída.
   - Sempre anexe flags silenciosas ou paginadores estritos:
     - Git: `git status -sb`, `git diff --stat`, `git diff -U5`, `git log -n 5 --oneline`.
     - Busca: `rg -n --max-count=15 --max-columns=160 "<simbolo>"` (evite `grep -R` irrestrito ou leitura de `node_modules`/`dist`/`.git`).
     - Testes/Linters: adicione `--quiet`, `-q`, `--reporter=dot` ou pipe `| head -n 60` quando houver risco de stacktraces massivos.
2. **Isolamento de Leitura em 3 Estágios**:
   - **Estágio 1 — Orquestração Panorâmica**: Leia apenas árvores de diretórios e assinaturas exportadas (`export interface`, `export type`, `export function`, `def `, `pub fn `) para construir o mapa topológico de acoplamento.
   - **Estágio 2 — Codificação Cirúrgica**: Carregue integralmente na janela de contexto **somente** os arquivos que serão modificados no passo atual e seus contratos de tipos diretos.
   - **Estágio 3 — Revisão por Diff**: Audite exclusivamente a saída de `git diff -U5` combinada com a verificação pontual de *callers* externos.

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
- **Zero Placeholders**: Proibido emitir `TODO`, `FIXME`, `// lógica aqui`, implementações parciais ou mocks silenciosos.
- **Casos de Borda Explícitos**: Trate entradas nulas/indefinidas, coleções vazias, limites numéricos (`0`, `NaN`, `Infinity`), timeouts de rede/I/O, cancelamento (`AbortSignal`) e condições de corrida (idempotência / travas atômicas).
- **Segurança por Padrão**: Sanitize entradas externas na fronteira (validação por schema), previna injeções (SQL/ comando/ XSS), evite vazamento de segredos ou stacktraces internos em respostas HTTP.

### 4.3. Loop de Auto-Reparo Contido e Oráculo de Tipos
Após cada lote lógico de edição em disco:
1. Dispare imediatamente `TYPECHECK_CMD` e `TEST_FOCUSED_CMD`.
2. Se o comando retornar código de saída $\neq 0$:
   - Extraia apenas o erro bruto do compilador/teste (máximo de 40 linhas relevantes).
   - Corrija a causa-raiz estrutural (nunca silencie o erro com `@ts-ignore`, `any` ou remoção do assert de teste).
   - **Limite Rígido de Tentativas**: Máximo de **3 ciclos de auto-reparo** consecutivos. Se a falha persistir após a 3ª tentativa, execute rollback imediato para o último checkpoint estável (`git checkout -- <arquivos>` ou restauração de snapshot), reavalie a arquitetura e reporte o bloqueio.

---

## 5. Revisão Adversarial com Evidência e Falsificabilidade

Para eliminar tanto a revisão complacente quanto o ruído de falsos positivos teóricos (padrão *Agent-Field / PR-AF*), toda alteração concluída passa pelo pipeline de auditoria antes da entrega:

1. **Geração de Hipótese de Falha**:
   - Inspecione o `git diff -U5` procurando por: quebra de contrato nos *callers*, mutação de estado compartilhado sem sincronização, falha de autorização/autenticação, vazamento de recursos ou regressão de performance ($O(N^2)$ em caminhos críticos, queries N+1).
2. **Fundamentação em Evidências (*Evidence Grounding*)**:
   - É proibido reportar ou corrigir um risco hipotético sem rastrear no repositório a árvore real de chamadas (`rg "<funcao_alterada>"`). Prove com arquivo e linha exata como um payload ou estado inválido atinge o código modificado em execução real.
3. **Portão de Falsificabilidade (*Falsifiability Gate*)**:
   - Antes de aprovar um alerta de defeito, atue como advogado de defesa do código e tente **refutar o próprio alerta**:
     - Existe um middleware upstream, schema Zod/Pydantic, constraint de banco ou guarda de tipo que já intercepta esse estado antes da função?
     - O ambiente de execução garante isolamento single-thread ou transacional naquele escopo?
   - **Regra de Corte**: Se o alerta for refutado por uma proteção existente no projeto, **descarte-o silenciosamente**. Apenas falhas que **sobrevivam à tentativa de refutação** são corrigidas no código e registradas no recibo final.

---

## 6. Formato de Entrega: Diff-First + Recibo de Engenharia

Nunca despeje explicações prolixas que poluam o terminal. Entregue o código aplicado e validado acompanhado deste **Recibo de Engenharia** compacto:

```markdown
### RECIBO DE ENGENHARIA (CLI-CODE-HARNESS)
- **Via Acionada**: [Rápida | Padrão | Profunda] — [Justificativa de impacto em 1 linha]
- **Arquivos Modificados**: `caminho/arquivo1.ts`, `caminho/arquivo2.ts`
- **Oráculo Determinístico**:
  - Typecheck/Lint: `[comando executado]` -> [PASS / código 0]
  - Testes Focados: `[comando executado]` -> [PASS / X testes verificados]
- **Auditoria de Falsificabilidade**:
  - [Hipótese analisada] -> [Evidência em caller:linha] -> [Refutado por guarda X | Confirmado e corrigido no diff]

### RESUMO DAS MUDANÇAS
- [Lista objetiva e cirúrgica de cada alteração implementada para cumprir os requisitos e sanar falhas estruturais]
```
