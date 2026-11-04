# Protocolos Avançados do Harness (`references/harness-protocols.md`)

> **Instrução de Carregamento Sob Demanda**: Carregue este arquivo na janela de contexto somente quando a tarefa for classificada na **Via Padrão** (se houver refatoração multi-módulo com risco de regressão) ou obrigatoriamente na **Via Profunda** (alterações de banco de dados, segurança, autenticação, concorrência ou contratos públicos).

---

## 1. Algoritmo de Mapeamento Estrutural de Repositório (Repo Map Lite)

Inspirado na extração via AST e ranqueamento topológico do *Aider*, substitua buscas textuais cegas pelo protocolo de **Grafo Local de Acoplamento** em 3 passos determinísticos:

### Passo 1: Extração de Símbolos Exportados nos Arquivos-Alvo
Execute leitura seletiva das declarações públicas do arquivo que sofrerá mutação:
```bash
# TypeScript / JavaScript
rg -n "^(export\s+(async\s+)?function|export\s+(const|type|interface|class|enum))\s+" <arquivo_alvo>

# Python
rg -n "^(def|async\s+def|class)\s+" <arquivo_alvo>

# Go / Rust
rg -n "^(func|type|pub\s+(fn|struct|enum|trait))\s+" <arquivo_alvo>
```

### Passo 2: Descoberta de Callers de 1º Grau (Inbound Edges)
Para cada símbolo que terá assinatura, comportamento ou efeito colateral alterado, localize todos os pontos de chamada ativos no repositório:
```bash
rg -n --max-count=30 --glob '!{node_modules,dist,build,.git,coverage}/**' "\b<NomeDoSimbolo>\b"
```

### Passo 3: Contrato de Congelamento (Contract Freeze)
Antes de iniciar o *Build Mode*, preencha mentalmente ou no rascunho de execução a matriz de impacto:
- **Símbolo Alvo**: ` <nome> `
- **Invariante Pré-Condição**: O que os callers garantem antes de chamar?
- **Invariante Pós-Condição**: O que a função promete retornar ou lançar?
- **Callers que quebram se a assinatura mudar**: `[lista de arquivo:linha]`

---

## 2. Protocolo de Checkpoints Reversíveis em Git (State Persistence)

Inspirado na persistência transacional do *LangGraph* e nos commits atômicos do *Aider*, nunca execute refatorações multi-arquivo sem um ponto de restauração determinístico.

### 2.1. Criação de Snapshot Pré-Mutação
Antes de iniciar edições da **Via Padrão** ou **Via Profunda**:
1. Verifique se a árvore de trabalho possui modificações não rastreadas pelo agente:
   ```bash
   git status --porcelain
   ```
2. Crie uma referência de snapshot reversível sem alterar o histórico público da branch:
   ```bash
   # Captura um objeto stash no banco do Git sem limpar o working tree atual
   HARNESS_CHECKPOINT=$(git stash create "harness-checkpoint-pre-build")
   echo "Checkpoint SHA: ${HARNESS_CHECKPOINT:-HEAD}"
   ```

### 2.2. Gatilho de Rollback Determinístico (Time-Travel Recovery)
O rollback para `${HARNESS_CHECKPOINT:-HEAD}` deve ser acionado automaticamente quando:
- O loop de auto-reparo atingir **3 falhas consecutivas** no `TYPECHECK_CMD` ou `TEST_FOCUSED_CMD`.
- Uma correção de bug exigir modificar mais que o dobro de arquivos previstos no *Plan Lock* (sinal de efeito cascata não planejado).

---

## 3. Pipeline Completo de Auditoria Adversarial (PR-AF Protocol)

Quando a **Via Profunda** estiver ativa, o agente deve mudar sua postura cognitiva de *Construtor* para *Auditor Red-Team Cético* e preencher a matriz de 3 fases abaixo sobre o `git diff -U5`:

### Fase A — Fundamentação em Evidências (*Evidence Grounding*)
Nenhuma vulnerabilidade ou bug pode ser alegado apenas olhando para uma linha isolada do diff. Para cada suspeita $S_i$:
1. **Rastreio de Origem (Source-to-Sink)**: De onde vem o dado? (Ex.: `req.body`, query param, fila de mensagens, banco de dados, arquivo externo).
2. **Prova de Caminho Executável**: Cite o caminho completo:
   `[Caller Externo:linha] -> [ Intermediário:linha ] -> [Linha Modificada no Diff]`.

### Fase B — Síntese de Vulnerabilidades Compostas
Verifique se a combinação entre dois arquivos modificados cria uma falha emergente:
- **Concorrência / TOCTOU (Time-of-Check to Time-of-Use)**: A verificação de saldo/permissão/estado ocorre fora da transação ou lock onde a escrita acontece?
- **Assimetria de Serialização/Tipagem**: O backend alterou um campo para opcional/nullable, mas o consumidor frontend assume presença estrita sem fallback?
- **Vazamento de Recursos em Exceção**: Se uma chamada assíncrona intermediária falhar ou sofrer timeout, conexões, locks, timers ou listeners abertos antes dela são liberados em bloco `finally`?

### Fase C — Portão de Falsificabilidade (*Falsifiability Gate*)
Para cada anomalia fundamentada na Fase A/B, execute uma busca ativa por **mitigações existentes** no repositório para tentar **invalidar** a própria suspeita:

| ID | Anomalia Suspeita | Evidência de Caminho (Source -> Sink) | Tentativa de Refutação (Busca por Guardas/Middlewares) | Veredito do Portão |
| :--- | :--- | :--- | :--- | :--- |
| `F-01` | Ex: SQL Injection / Filtro não sanitizado | `routes/users.ts:42` -> `repo.ts:18` | Verificado `middlewares/validate.ts:12`: schema Zod restringe input a `z.string().uuid()`. | **REFUTADO** (Descartar alerta) |
| `F-02` | Ex: Condição de corrida em duplo clique de webhook | `webhooks/stripe.ts:88` -> `ledger.ts:34` | Buscado lock/idempotency key em `webhooks/` e `ledger.ts`: ausente; `SELECT` seguido de `INSERT` sem `UNIQUE` ou `FOR UPDATE`. | **SOBREVIVEU** (Bloqueante: corrigir antes de entregar) |

> **Regra de Ouro**: Jamais emita avisos do tipo *"Certifique-se de validar X em produção"* ou *"Considere adicionar tratamento de erro"*. Se o problema sobreviveu ao Portão de Falsificabilidade e está dentro do escopo de segurança/corretude da tarefa, **corrija-o diretamente no código** antes de encerrar.
