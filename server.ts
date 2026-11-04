import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function readSkillFileSafe(relativePath: string): string {
  const resolved = path.resolve(__dirname, relativePath);
  if (!resolved.startsWith(__dirname)) {
    throw new Error("Invalid file path.");
  }
  if (!fs.existsSync(resolved)) {
    return "";
  }
  return fs.readFileSync(resolved, "utf-8");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "1mb" }));

  // Endpoint 1: Inspect live workspace manifest & skill artifacts on disk
  app.get("/api/harness/artifacts", (_req: Request, res: Response) => {
    try {
      const skillMd = readSkillFileSafe("cli-code-harness/SKILL.md");
      const protocolsMd = readSkillFileSafe("cli-code-harness/references/harness-protocols.md");
      const aciProbeSh = readSkillFileSafe("cli-code-harness/scripts/aci-probe.sh");
      const pkgRaw = readSkillFileSafe("package.json");
      let pkgSummary = { scripts: {}, dependencies: [] as string[] };
      if (pkgRaw) {
        const parsed = JSON.parse(pkgRaw);
        pkgSummary = {
          scripts: parsed.scripts || {},
          dependencies: Object.keys({
            ...(parsed.dependencies || {}),
            ...(parsed.devDependencies || {}),
          }),
        };
      }

      res.json({
        ok: true,
        filesOnDisk: [
          {
            path: "/cli-code-harness/SKILL.md",
            sizeBytes: Buffer.byteLength(skillMd, "utf8"),
            lines: skillMd ? skillMd.split("\n").length : 0,
          },
          {
            path: "/cli-code-harness/references/harness-protocols.md",
            sizeBytes: Buffer.byteLength(protocolsMd, "utf8"),
            lines: protocolsMd ? protocolsMd.split("\n").length : 0,
          },
          {
            path: "/cli-code-harness/scripts/aci-probe.sh",
            sizeBytes: Buffer.byteLength(aciProbeSh, "utf8"),
            lines: aciProbeSh ? aciProbeSh.split("\n").length : 0,
          },
        ],
        workspaceProfile: pkgSummary,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to inspect harness artifacts.";
      res.status(500).json({ ok: false, error: message });
    }
  });

  // Endpoint 2: Run live subagent test with cli-code-harness injected
  app.post("/api/harness/subagent-test", async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const {
        modelId = "gemini-3.8-flash",
        taskTitle,
        taskPrompt,
        sourceCode,
        callerContext,
      } = req.body ?? {};

      const allowedModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];
      const selectedModel = allowedModels.includes(modelId) ? modelId : "gemini-3.8-flash";

      if (!taskPrompt || typeof taskPrompt !== "string" || !sourceCode || typeof sourceCode !== "string") {
        res.status(400).json({
          ok: false,
          error: "Os campos taskPrompt e sourceCode são obrigatórios para o teste do subagente.",
        });
        return;
      }

      const skillMd = readSkillFileSafe("cli-code-harness/SKILL.md");
      const protocolsMd = readSkillFileSafe("cli-code-harness/references/harness-protocols.md");

      const ai = getGenAIClient();

      const systemInstruction = [
        "Você é um subagente de engenharia executando sob governança estrita da skill `cli-code-harness`.",
        "Aplique rigorosamente: (1) Classificação de Via por Raio de Impacto, (2) Trava Plan/Build com Contrato de Tipos e Mapa de Callers,",
        "(3) Codificação Determinística sem placeholders, tratando todos os edge cases, concorrência e segurança,",
        "(4) Revisão Adversarial com Evidence Grounding e Portão de Falsificabilidade (tente refutar cada alerta procurando guardas existentes; descarte falsos positivos e corrija no código apenas falhas reais comprovadas).",
        "",
        "=== SKILL.MD ===",
        skillMd,
        "",
        "=== HARNESS-PROTOCOLS.MD ===",
        protocolsMd,
      ].join("\n");

      const userPrompt = [
        `TAREFA: ${taskTitle || "Auditoria e Refatoração Cirúrgica"}`,
        `REQUISITO DO USUÁRIO: ${taskPrompt}`,
        "",
        "=== CONTEXTO DE CALLERS E MANIFESTO (ACI) ===",
        callerContext || "Nenhum caller adicional informado.",
        "",
        "=== CÓDIGO-ALVO ATUAL ===",
        sourceCode,
      ].join("\n");

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              selectedTrack: {
                type: Type.STRING,
                description: "Via selecionada: Via Rápida, Via Padrão ou Via Profunda",
              },
              trackRationale: {
                type: Type.STRING,
                description: "Justificativa técnica baseada em raio de acoplamento e risco",
              },
              planLockContract: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 a 4 itens do contrato de tipos, invariantes e callers mapeados antes da escrita",
              },
              refactoredCode: {
                type: Type.STRING,
                description: "Código completo refatorado, sem placeholders e pronto para produção",
              },
              falsifiabilityAudit: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    hypothesis: { type: Type.STRING },
                    evidencePath: { type: Type.STRING },
                    refutationAttempt: { type: Type.STRING },
                    verdict: {
                      type: Type.STRING,
                      description: "SOBREVIVEU (Corrigido) ou REFUTADO (Falso Positivo Descartado)",
                    },
                  },
                  required: ["id", "hypothesis", "evidencePath", "refutationAttempt", "verdict"],
                },
              },
              engineeringReceipt: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista enxuta para o bloco RESUMO DAS MUDANÇAS",
              },
            },
            required: [
              "selectedTrack",
              "trackRationale",
              "planLockContract",
              "refactoredCode",
              "falsifiabilityAudit",
              "engineeringReceipt",
            ],
          },
        },
      });

      const rawText = (response.text ?? "{}").trim();
      const parsedResult = JSON.parse(rawText);
      const durationMs = Date.now() - startTime;

      res.json({
        ok: true,
        modelUsed: selectedModel,
        durationMs,
        result: parsedResult,
      });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const message = error instanceof Error ? error.message : "Erro ao executar subagente Gemini.";
      res.status(500).json({
        ok: false,
        durationMs,
        error: message,
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CLI Code Harness Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
