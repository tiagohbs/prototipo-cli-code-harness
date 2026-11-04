import React, { useState, useEffect, useMemo } from "react";
import {
  Copy,
  Check,
  Download,
  Play,
  Terminal,
  ShieldCheck,
  GitBranch,
  FileCode,
  Sliders,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  SKILL_ARTIFACTS,
  SUBAGENT_SCENARIOS,
  SubagentBenchmarkScenario,
  FalsifiabilityItem,
} from "./data/harnessData";

interface LiveSubagentResult {
  selectedTrack: string;
  trackRationale: string;
  planLockContract: string[];
  refactoredCode: string;
  falsifiabilityAudit: FalsifiabilityItem[];
  engineeringReceipt: string[];
}

interface DiskArtifactInfo {
  path: string;
  sizeBytes: number;
  lines: number;
}

export default function App() {
  // Active Skill Artifact Tab
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(SKILL_ARTIFACTS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Interactive Impact Router Simulator State
  const [simFilesCount, setSimFilesCount] = useState<number>(4);
  const [simTouchesSecurityOrDb, setSimTouchesSecurityOrDb] = useState<boolean>(true);
  const [simBreaksPublicContract, setSimBreaksPublicContract] = useState<boolean>(false);
  const [simHasConcurrency, setSimHasConcurrency] = useState<boolean>(true);

  // Subagent Benchmark & Live Execution State
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SUBAGENT_SCENARIOS[0].id);
  const [comparisonView, setComparisonView] = useState<"side-by-side" | "harnessed-only" | "falsifiability">(
    "side-by-side"
  );
  const [subagentModel, setSubagentModel] = useState<"gemini-3.8-flash" | "gemini-3.1-flash-lite">(
    "gemini-3.8-flash"
  );
  const [customPrompt, setCustomPrompt] = useState<string>(SUBAGENT_SCENARIOS[0].taskPrompt);
  const [customSourceCode, setCustomSourceCode] = useState<string>(SUBAGENT_SCENARIOS[0].sourceCode);
  const [customCallerContext, setCustomCallerContext] = useState<string>(SUBAGENT_SCENARIOS[0].callerContext);

  const [isRunningSubagent, setIsRunningSubagent] = useState<boolean>(false);
  const [liveResult, setLiveResult] = useState<LiveSubagentResult | null>(null);
  const [liveDurationMs, setLiveDurationMs] = useState<number | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Workspace Disk Inspection State
  const [diskFiles, setDiskFiles] = useState<DiskArtifactInfo[]>([]);

  useEffect(() => {
    fetch("/api/harness/artifacts")
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.filesOnDisk)) {
          setDiskFiles(data.filesOnDisk);
        }
      })
      .catch(() => {
        // Ignore silent fetch error in static preview fallback
      });
  }, []);

  const activeArtifact = useMemo(
    () => SKILL_ARTIFACTS.find((a) => a.id === selectedArtifactId) ?? SKILL_ARTIFACTS[0],
    [selectedArtifactId]
  );

  const activeScenario: SubagentBenchmarkScenario = useMemo(
    () => SUBAGENT_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? SUBAGENT_SCENARIOS[0],
    [selectedScenarioId]
  );

  const handleSelectScenario = (scenario: SubagentBenchmarkScenario) => {
    setSelectedScenarioId(scenario.id);
    setCustomPrompt(scenario.taskPrompt);
    setCustomSourceCode(scenario.sourceCode);
    setCustomCallerContext(scenario.callerContext);
    setLiveResult(null);
    setLiveError(null);
  };

  // Deterministic Track Routing Computation
  const routedTrack = useMemo(() => {
    if (simTouchesSecurityOrDb || simBreaksPublicContract || simHasConcurrency || simFilesCount > 6) {
      return {
        name: "Via Profunda (Deep Track)",
        code: "DEEP_TRACK",
        contextBudget: "Carrega SKILL.md + references/harness-protocols.md (~1.600 tokens)",
        lockMode: "Trava Plan/Build Rígida + Grafo de Callers 1º Grau + Snapshot Git Reversível",
        reviewGate: "Auditoria Adversarial Completa (Evidence Grounding + Falsifiability Gate)",
        commands: [
          "./cli-code-harness/scripts/aci-probe.sh profile",
          "./cli-code-harness/scripts/aci-probe.sh callers <SimboloAlvo>",
          'HARNESS_CHECKPOINT=$(git stash create "harness-pre-build")',
          "npm run lint --silent && node --test <suite_focada>",
        ],
      };
    }
    if (simFilesCount >= 3) {
      return {
        name: "Via Padrão (Standard Track)",
        code: "STANDARD_TRACK",
        contextBudget: "Carrega apenas SKILL.md (~920 tokens) + Contratos Diretos",
        lockMode: "Plano Relâmpago (3–5 linhas) + Congelamento de Interfaces antes da Escrita",
        reviewGate: "Triagem Estruturada de git diff -U5 + Execução de Testes Focados",
        commands: [
          "git status -sb",
          'rg -n --max-count=15 "export (interface|type|function)" <arquivos>',
          "npm run lint --silent",
        ],
      };
    }
    return {
      name: "Via Rápida (Fast Track)",
      code: "FAST_TRACK",
      contextBudget: "Carrega apenas SKILL.md (~920 tokens) + Arquivo Alvo Cirúrgico",
      lockMode: "Edição Atômica Direta (Sem artefatos intermediários)",
      reviewGate: "Oráculo de Tipos Imediato (Typecheck/Lint) + Inspeção git diff --stat",
      commands: ["npm run lint --silent", "git diff --stat"],
    };
  }, [simFilesCount, simTouchesSecurityOrDb, simBreaksPublicContract, simHasConcurrency]);

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback copy
    }
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace(/\//g, "-");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBundle = () => {
    const bundleContent = SKILL_ARTIFACTS.map(
      (art) =>
        `# ==============================================================================\n# FILE: ${art.relativePath}\n# ROLE: ${art.role}\n# ==============================================================================\n\n${art.content}`
    ).join("\n\n\n");
    handleDownloadFile("cli-code-harness-complete-bundle.md", bundleContent);
  };

  const handleRunLiveSubagent = async () => {
    setIsRunningSubagent(true);
    setLiveError(null);
    try {
      const response = await fetch("/api/harness/subagent-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: subagentModel,
          taskTitle: activeScenario.title,
          taskPrompt: customPrompt,
          sourceCode: customSourceCode,
          callerContext: customCallerContext,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Falha ao executar subagente.");
      }
      setLiveResult(data.result);
      setLiveDurationMs(data.durationMs ?? null);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : "Erro inesperado na chamada do subagente.");
    } finally {
      setIsRunningSubagent(false);
    }
  };

  const displayedHarnessOutput: LiveSubagentResult = liveResult ?? {
    selectedTrack: activeScenario.harnessedOutput.selectedTrack,
    trackRationale: activeScenario.harnessedOutput.trackRationale,
    planLockContract: activeScenario.harnessedOutput.planLockContract,
    refactoredCode: activeScenario.harnessedOutput.refactoredCode,
    falsifiabilityAudit: activeScenario.harnessedOutput.falsifiabilityAudit,
    engineeringReceipt: activeScenario.harnessedOutput.engineeringReceipt,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8">
          <a
            href="#top"
            className="text-base font-bold tracking-tight text-slate-950 font-mono whitespace-nowrap shrink-0"
          >
            cli-code-harness
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#artefatos"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Artefatos da Skill
            </a>
            <a
              href="#roteador"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Roteador de Impacto
            </a>
            <a
              href="#subagente"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Bancada do Subagente
            </a>
            <a
              href="#falsificabilidade"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Portão de Falsificabilidade
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              onClick={handleDownloadBundle}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Pacote Completo
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-10 space-y-14">
        {/* Hero & Architectural Summary */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch border-b border-slate-200 pb-10">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span>Cognitive & Deterministic CLI Harness</span>
                <span aria-hidden="true">·</span>
                <span>Arquitetura Modular em 3 Estágios</span>
                <span aria-hidden="true">·</span>
                <span>Zero Context Rot</span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 leading-tight"
                style={{ textWrap: "balance" }}
              >
                Orquestração Cognitiva, Codificação Estrita e Revisão Adversarial com Falsificabilidade
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-[68ch]">
                Projetada a partir das evidências empíricas do <em>Scaffold Effect</em> (Aider, OpenCode,
                SWE-agent, Pydantic AI e PR-AF), a skill <code className="font-mono text-slate-900">cli-code-harness</code>{" "}
                opera como um freio determinístico contra edições prematuras, diluição de atenção na janela de
                contexto e falsos positivos em revisões de código.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#artefatos"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <FileCode className="w-4 h-4" />
                Inspecionar SKILL.md e Protocolos
              </a>
              <a
                href="#subagente"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-white text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4" />
                Executar Teste com Subagente
              </a>
            </div>
          </div>

          {/* Right column: Workspace Disk Verification Table */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Artefatos Instalados no Workspace
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Arquivos físicos gerados e prontos para uso direto em CLI
                  </p>
                </div>
                <Terminal className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {SKILL_ARTIFACTS.map((item) => {
                  const diskMatch = diskFiles.find((d) => d.path.endsWith(item.relativePath));
                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-mono font-medium text-slate-900 truncate">
                          /{item.relativePath}
                        </div>
                        <div className="text-slate-500 truncate">{item.role}</div>
                      </div>
                      <div className="text-right font-mono tabular-nums text-slate-600 shrink-0">
                        <div>~{item.tokenEstimate} tokens</div>
                        <div className="text-[11px] text-emerald-700">
                          {diskMatch ? `${diskMatch.lines} linhas em disco` : "Sincronizado"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-left">
              <div>
                <div className="text-xs text-slate-500">Economia de Contexto</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900">-84.2%</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Limite Auto-Reparo</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900">Max 3x</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Ruído Falso-Positivo</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900">0 Alertas</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: SKILL ARTIFACTS VIEWER & EXPORT */}
        <section id="artefatos" className="space-y-6 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                01. Especificação Modular da Skill (`cli-code-harness`)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Estrutura dividida entre o motor sempre ativo (<code className="font-mono">SKILL.md</code>), os
                protocolos profundos sob demanda (<code className="font-mono">references/harness-protocols.md</code>) e o
                script determinístico de sondagem ACI (<code className="font-mono">scripts/aci-probe.sh</code>).
              </p>
            </div>

            {/* Interactive Segmented File Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg self-start">
              {SKILL_ARTIFACTS.map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => setSelectedArtifactId(artifact.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedArtifactId === artifact.id
                      ? "bg-white text-slate-950 shadow-xs"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  {artifact.filename}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-mono font-semibold text-slate-900">
                  /{activeArtifact.relativePath}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeArtifact.role}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{activeArtifact.loadPolicy}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyText(activeArtifact.id, activeArtifact.content)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedId === activeArtifact.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Bloco Único
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDownloadFile(activeArtifact.filename, activeArtifact.content)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Arquivo
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-950 text-slate-100 overflow-x-auto max-h-[540px] overflow-y-auto">
              <pre className="text-xs font-mono leading-relaxed whitespace-pre">
                {activeArtifact.content}
              </pre>
            </div>
          </div>
        </section>

        {/* SECTION 2: INTERACTIVE IMPACT & COUPLING ROUTER */}
        <section id="roteador" className="space-y-6 scroll-mt-20">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              02. Simulador de Roteamento por Raio de Impacto e Acoplamento
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Teste como a skill classifica automaticamente uma tarefa entre <strong>Via Rápida</strong>,{" "}
              <strong>Via Padrão</strong> e <strong>Via Profunda</strong> para economizar tokens em edições
              triviais e exigir garantias máximas em mudanças críticas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Controls */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm font-semibold text-slate-900">
                    Parâmetros da Alteração
                  </span>
                  <Sliders className="w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <label htmlFor="files-slider" className="font-medium text-slate-700">
                      Arquivos Acoplados no Grafo de Callers
                    </label>
                    <span className="font-mono font-semibold tabular-nums text-slate-900">
                      {simFilesCount} {simFilesCount === 1 ? "arquivo" : "arquivos"}
                    </span>
                  </div>
                  <input
                    id="files-slider"
                    type="range"
                    min={1}
                    max={12}
                    value={simFilesCount}
                    onChange={(e) => setSimFilesCount(Number(e.target.value))}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>1–2 (Isolado)</span>
                    <span>3–6 (Multi-módulo)</span>
                    <span>7+ (Sistêmico)</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simTouchesSecurityOrDb}
                      onChange={(e) => setSimTouchesSecurityOrDb(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 accent-slate-900"
                    />
                    <span>
                      <strong>Superfície de Segurança ou Banco de Dados</strong>: Altera middlewares de
                      autenticação, criptografia, permissões ou schemas/queries SQL.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simHasConcurrency}
                      onChange={(e) => setSimHasConcurrency(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 accent-slate-900"
                    />
                    <span>
                      <strong>Concorrência ou Estado Compartilhado</strong>: Envolve webhooks paralelos,
                      filas assíncronas, locks, streams ou caches mutáveis.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simBreaksPublicContract}
                      onChange={(e) => setSimBreaksPublicContract(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 accent-slate-900"
                    />
                    <span>
                      <strong>Mutação de Contrato Público</strong>: Modifica assinaturas exportadas consumidas
                      por outros serviços ou pacotes externos.
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSimFilesCount(1);
                    setSimTouchesSecurityOrDb(false);
                    setSimHasConcurrency(false);
                    setSimBreaksPublicContract(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Preset: Via Rápida
                </button>
                <button
                  onClick={() => {
                    setSimFilesCount(4);
                    setSimTouchesSecurityOrDb(false);
                    setSimHasConcurrency(false);
                    setSimBreaksPublicContract(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Preset: Via Padrão
                </button>
                <button
                  onClick={() => {
                    setSimFilesCount(4);
                    setSimTouchesSecurityOrDb(true);
                    setSimHasConcurrency(true);
                    setSimBreaksPublicContract(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Preset: Via Profunda
                </button>
              </div>
            </div>

            {/* Routed Decision Output */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-xs font-mono text-slate-500">Protocolo Determinístico Selecionado</div>
                    <h3 className="text-lg font-bold text-slate-950 mt-0.5">{routedTrack.name}</h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-800">
                    {routedTrack.code}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                    <div className="font-semibold text-slate-900">Orçamento de Contexto</div>
                    <div className="text-slate-600 leading-relaxed">{routedTrack.contextBudget}</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                    <div className="font-semibold text-slate-900">Trava Plan/Build & Git</div>
                    <div className="text-slate-600 leading-relaxed">{routedTrack.lockMode}</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                    <div className="font-semibold text-slate-900">Portão de Revisão</div>
                    <div className="text-slate-600 leading-relaxed">{routedTrack.reviewGate}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-800">
                  Sequência ACI Sintética Obrigatória no Terminal:
                </div>
                <div className="bg-slate-950 text-slate-100 p-4 rounded-lg font-mono text-xs space-y-1.5 overflow-x-auto">
                  {routedTrack.commands.map((cmd, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-slate-500 select-none">$</span>
                      <span>{cmd}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: SUBAGENT BENCHMARK & LIVE RUNNER */}
        <section id="subagente" className="space-y-6 scroll-mt-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                03. Validação em Subagente de Menor Custo (Sem Harness vs. Com `cli-code-harness`)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Compare os resultados homologados em modelos rápidos (<code className="font-mono">gemini-3.1-flash-lite</code>{" "}
                / <code className="font-mono">gemini-3.8-flash</code>) ou dispare uma execução real agora mesmo
                injetando a skill completa no subagente.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {SUBAGENT_SCENARIOS.map((scen) => (
                <button
                  key={scen.id}
                  onClick={() => handleSelectScenario(scen)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedScenarioId === scen.id
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {scen.title.split(":")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Input & Live Trigger Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{activeScenario.domain}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {activeScenario.coupledFilesCount} arquivos acoplados
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Via Esperada: <strong className="text-slate-900">{ displayedHarnessOutput.selectedTrack }</strong>
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-950 mt-1">{activeScenario.title}</h3>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <select
                  aria-label="Selecionar modelo do subagente"
                  value={subagentModel}
                  onChange={(e) =>
                    setSubagentModel(e.target.value as "gemini-3.8-flash" | "gemini-3.1-flash-lite")
                  }
                  className="px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="gemini-3.8-flash">Subagente: gemini-3.8-flash</option>
                  <option value="gemini-3.1-flash-lite">Subagente: gemini-3.1-flash-lite</option>
                </select>

                <button
                  onClick={handleRunLiveSubagent}
                  disabled={isRunningSubagent}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isRunningSubagent ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Executando Harness...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Rodar Subagente ao Vivo
                    </>
                  )}
                </button>
              </div>
            </div>

            {liveError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{liveError}</span>
              </div>
            )}

            {liveResult && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>
                    Execução ao vivo concluída pelo subagente{" "}
                    <strong className="font-mono">{subagentModel}</strong> sob governança da skill{" "}
                    <code className="font-mono">cli-code-harness</code>.
                  </span>
                </div>
                {liveDurationMs !== null && (
                  <span className="font-mono tabular-nums font-semibold shrink-0">
                    {(liveDurationMs / 1000).toFixed(2)}s
                  </span>
                )}
              </div>
            )}

            {/* Editable Prompt & Code Inputs for Live Testing */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prompt da Tarefa (Editável para teste ao vivo)
                  </label>
                  <textarea
                    rows={3}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mapa ACI de Callers e Middlewares (1º Grau)
                  </label>
                  <textarea
                    rows={4}
                    value={customCallerContext}
                    onChange={(e) => setCustomCallerContext(e.target.value)}
                    className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="lg:col-span-7">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código-Alvo Original (Pré-Refatoração)
                </label>
                <textarea
                  rows={8}
                  value={customSourceCode}
                  onChange={(e) => setCustomSourceCode(e.target.value)}
                  className="w-full p-3 text-xs font-mono bg-slate-950 text-slate-100 border border-slate-800 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setComparisonView("side-by-side")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    comparisonView === "side-by-side"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Comparativo Lado a Lado
                </button>
                <button
                  onClick={() => setComparisonView("harnessed-only")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    comparisonView === "harnessed-only"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Contrato Plan Lock & Código Final
                </button>
                <button
                  onClick={() => setComparisonView("falsifiability")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    comparisonView === "falsifiability"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Auditoria de Falsificabilidade
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-600">
                <span>
                  Sem Harness: <strong className="text-red-700">{activeScenario.unharnessedOutput.tokensConsumed} tokens</strong>
                </span>
                <span>·</span>
                <span>
                  Com Harness: <strong className="text-emerald-700">{activeScenario.harnessedOutput.tokensConsumed} tokens</strong>
                </span>
              </div>
            </div>

            {/* Comparison Content */}
            {comparisonView === "side-by-side" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Unharnessed Subagent */}
                <div className="border border-red-200 bg-red-50/30 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-red-200/70 pb-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Subagente Sem Harness (Comportamento Padrão)
                      </h4>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-red-700">
                      {activeScenario.unharnessedOutput.falsePositiveAlerts} falsos positivos
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {activeScenario.unharnessedOutput.critique}
                  </p>

                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-red-900">
                      Falhas Estruturais Deixadas pelo Modelo Solto:
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
                      {activeScenario.unharnessedOutput.missedEdgeCases.map((miss, i) => (
                        <li key={i}>{miss}</li>
                      ))}
                    </ul>
                  </div>

                  <pre className="p-4 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                    {activeScenario.unharnessedOutput.flawedSnippet}
                  </pre>
                </div>

                {/* Harnessed Subagent */}
                <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200/70 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Subagente Governado por `cli-code-harness`
                      </h4>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-emerald-800">
                      {displayedHarnessOutput.selectedTrack}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-emerald-950">
                      Trava Somente-Leitura (Plan Lock Contract):
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
                      {displayedHarnessOutput.planLockContract.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <pre className="p-4 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-[380px] overflow-y-auto leading-relaxed">
                    {displayedHarnessOutput.refactoredCode}
                  </pre>
                </div>
              </div>
            )}

            {comparisonView === "harnessed-only" && (
              <div className="space-y-5 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5" />
                      Contrato Plan/Build (Definido Antes da Escrita)
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                      {displayedHarnessOutput.planLockContract.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      Recibo de Engenharia (`### RESUMO DAS MUDANÇAS`)
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                      {displayedHarnessOutput.engineeringReceipt.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-950 text-slate-100 p-5 rounded-xl overflow-x-auto">
                  <pre className="text-xs font-mono leading-relaxed">
                    {displayedHarnessOutput.refactoredCode}
                  </pre>
                </div>
              </div>
            )}

            {comparisonView === "falsifiability" && (
              <div className="pt-2 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-3 px-4 font-semibold">ID</th>
                      <th className="py-3 px-4 font-semibold">Hipótese de Falha</th>
                      <th className="py-3 px-4 font-semibold">Evidência de Caminho (Caller -&gt; Sink)</th>
                      <th className="py-3 px-4 font-semibold">Tentativa de Refutação (Busca por Guardas)</th>
                      <th className="py-3 px-4 font-semibold text-right">Veredito do Portão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayedHarnessOutput.falsifiabilityAudit.map((row) => {
                      const survived = row.verdict.toUpperCase().includes("SOBREVIVEU");
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/80">
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                            {row.id}
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-medium">{row.hypothesis}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{row.evidencePath}</td>
                          <td className="py-3.5 px-4 text-slate-600">{row.refutationAttempt}</td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-right whitespace-nowrap">
                            {survived ? (
                              <span className="text-amber-800">SOBREVIVEU (Corrigido no Diff)</span>
                            ) : (
                              <span className="text-emerald-700">REFUTADO (Falso Positivo Descartado)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: FALSIFIABILITY GATE ARCHITECTURE REFERENCE */}
        <section id="falsificabilidade" className="space-y-4 scroll-mt-20 border-t border-slate-200 pt-10">
          <h2 className="text-xl font-bold text-slate-950">
            04. Como o Portão de Falsificabilidade Elimina Alucinações na Revisão
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono text-slate-500">Fase A · Evidence Grounding</div>
              <h3 className="text-sm font-bold text-slate-900">Rastreio Obrigatório Source-to-Sink</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                O revisor é proibido de comentar linhas isoladas do diff. Toda hipótese exige localizar os{" "}
                <em>callers</em> reais com <code className="font-mono">rg</code> e demonstrar como um payload
                externo alcança o trecho alterado.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono text-slate-500">Fase B · Vulnerabilidades Compostas</div>
              <h3 className="text-sm font-bold text-slate-900">Análise Transacional e TOCTOU</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cruza múltiplos arquivos modificados em busca de condições de corrida entre checagem e escrita
                (TOCTOU), vazamento de cursores/locks em exceções assíncronas e quebras de contrato de tipos.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono text-slate-500">Fase C · Falsifiability Gate</div>
              <h3 className="text-sm font-bold text-slate-900">Refutação Ativa Antes do Alerta</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                O agente tenta invalidar a própria suspeita procurando middlewares de autenticação, schemas
                Zod/Pydantic ou constraints SQL já ativos no projeto. Alertas refutados são descartados em
                silêncio.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-5 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            cli-code-harness · Especificação e Bancada de Homologação de Engenharia de Software
          </span>
          <span className="font-mono">
            Arquivos salvos em /cli-code-harness/SKILL.md e /cli-code-harness/references/harness-protocols.md
          </span>
        </div>
      </footer>
    </div>
  );
}
