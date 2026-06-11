import dotenv from "dotenv";
import express from "express";
import path from "path";
import type { TranslationResponse } from "./src/types";

dotenv.config();

const app = express();
const PORT = Number(process.env["PORT"] || 3000);
const IS_API_ONLY = process.env["API_ONLY"] === "true";
const DEFAULT_TRANSLATION_BASE_URL = "https://epl-tl26-multilingual-translator-api.hf.space/translate";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

type LangCode = "fr" | "en" | "ee";

interface TranslateBody {
  text?: string;
  sourceLang?: LangCode;
  targetLang?: LangCode;
}

function getEnvValue(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value.replace(/^["']|["']$/g, "");
  }
  return "";
}

function buildTranslationUrl(sourceLang: LangCode, targetLang: LangCode): string {
  const baseUrl = getEnvValue("BASE_URL", "base_url") || DEFAULT_TRANSLATION_BASE_URL;
  return `${baseUrl.replace(/\/$/, "")}/${sourceLang}-${targetLang}`;
}

function normalizeTranslationResponse(data: unknown): TranslationResponse {
  const normalizedData = Array.isArray(data) ? data[0] : data;
  const payload =
    normalizedData && typeof normalizedData === "object"
      ? (normalizedData as Record<string, unknown>)
      : {};
  const translation =
    payload["translation"] ??
    payload["translated_text"] ??
    payload["translation_text"] ??
    payload["text"] ??
    (typeof normalizedData === "string" ? normalizedData : "");

  return {
    translation: String(translation),
    explanation: String(payload["explanation"] ?? ""),
    phonetics: String(payload["phonetics"] ?? ""),
    wordAlignments: Array.isArray(payload["wordAlignments"]) ? (payload["wordAlignments"] as TranslationResponse["wordAlignments"]) : [],
    grammaticalPoints: Array.isArray(payload["grammaticalPoints"]) ? (payload["grammaticalPoints"] as string[]) : [],
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

app.post("/api/translate", async (req, res): Promise<void> => {
  const { text, sourceLang, targetLang } = req.body as TranslateBody;

  if (!text?.trim() || !sourceLang || !targetLang) {
    res.status(400).json({ error: "Paramètres requis manquants : text, sourceLang, targetLang." });
    return;
  }

  if (sourceLang === targetLang) {
    res.json(normalizeTranslationResponse({ translation: text }));
    return;
  }

  const bearerToken = getEnvValue("BEARER_TOKEN", "bearer_token", "HF_TOKEN");
  if (!bearerToken) {
    res.status(500).json({ error: "Bearer token manquant. Ajoutez bearer_token dans le fichier .env." });
    return;
  }

  try {
    const response = await fetch(buildTranslationUrl(sourceLang, targetLang), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const rawBody = await response.text();
    let data: unknown = rawBody;
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      data = rawBody;
    }

    if (!response.ok) {
      const errorPayload = data as Record<string, unknown>;
      res.status(response.status).json({
        error: String(errorPayload["error"] ?? errorPayload["detail"] ?? "Erreur retournée par le service de traduction."),
      });
      return;
    }

    res.json(normalizeTranslationResponse(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    res.status(502).json({ error: `Impossible de joindre le service de traduction : ${message}` });
  }
});

if (!IS_API_ONLY && process.env["NODE_ENV"] === "production") {
  const distPath = path.join(process.cwd(), "dist", "ewe-multilingual-translator", "browser");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.log("Express API server running in API-only mode. Use ng serve on port 4200 for the Angular frontend.");
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
