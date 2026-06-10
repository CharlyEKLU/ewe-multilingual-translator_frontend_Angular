// import express from "express";
// import path from "path";
// import { GoogleGenAI, Modality } from "@google/genai";
// import dotenv from "dotenv";

// // Load environment variables
// dotenv.config();

// // Initialize Express
// const app = express();
// const PORT = 3000;

// // Increase payload limits for speech/audio base64 payloads
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ limit: "50mb", extended: true }));

// // Initialize Google Gen AI
// const apiKey = process.env["GEMINI_API_KEY"] || "";
// const ai = new GoogleGenAI({
//   apiKey: apiKey,
//   httpOptions: {
//     headers: {
//       "User-Agent": "aistudio-build",
//     },
//   },
// });

// // Helper: Calculate BLEU score (n-gram overlap with brevity penalty)
// function calculateBLEU(candidate: string, reference: string): { bleu: number; precisions: number[]; brevityPenalty: number } {
//   const sanitize = (text: string) =>
//     text
//       .toLowerCase()
//       .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
//       .split(/\s+/)
//       .filter((w) => w.length > 0);

//   const candTokens = sanitize(candidate);
//   const refTokens = sanitize(reference);

//   if (candTokens.length === 0 || refTokens.length === 0) {
//     return { bleu: 0, precisions: [0, 0, 0, 0], brevityPenalty: 0 };
//   }

//   const precisions: number[] = [];
//   const maxN = Math.min(4, candTokens.length);

//   for (let n = 1; n <= 4; n++) {
//     if (n > maxN) {
//       precisions.push(0);
//       continue;
//     }

//     // Get candidate n-grams
//     const candNGrams: { [key: string]: number } = {};
//     for (let i = 0; i <= candTokens.length - n; i++) {
//       const ngram = candTokens.slice(i, i + n).join(" ");
//       candNGrams[ngram] = (candNGrams[ngram] || 0) + 1;
//     }

//     // Get reference n-grams
//     const refNGrams: { [key: string]: number } = {};
//     for (let i = 0; i <= refTokens.length - n; i++) {
//       const ngram = refTokens.slice(i, i + n).join(" ");
//       refNGrams[ngram] = (refNGrams[ngram] || 0) + 1;
//     }

//     // Count overlaps
//     let overlap = 0;
//     let totalCandNGrams = 0;
//     for (const ngram in candNGrams) {
//       totalCandNGrams += candNGrams[ngram];
//       if (refNGrams[ngram]) {
//         overlap += Math.min(candNGrams[ngram], refNGrams[ngram]);
//       }
//     }

//     precisions.push(totalCandNGrams > 0 ? overlap / totalCandNGrams : 0);
//   }

//   // Brevity Penalty
//   const c = candTokens.length;
//   const r = refTokens.length;
//   const brevityPenalty = c > r ? 1 : Math.exp(1 - r / c);

//   // Geometric mean of precisions
//   const validPrecisions = precisions.slice(0, maxN).filter((p) => p > 0);
//   let geomMean = 0;
//   if (validPrecisions.length > 0) {
//     const sumLogs = validPrecisions.reduce((sum, p) => sum + Math.log(p), 0);
//     geomMean = Math.exp(sumLogs / validPrecisions.length);
//   }

//   const bleu = brevityPenalty * geomMean;
//   return {
//     bleu: Math.round(bleu * 1000) / 10,
//     precisions: precisions.map((p) => Math.round(p * 1000) / 10),
//     brevityPenalty: Math.round(brevityPenalty * 100) / 100,
//   };
// }

// // Helper: Calculate ROUGE-L (Longest Common Subsequence)
// function calculateROUGEL(candidate: string, reference: string): number {
//   const sanitize = (text: string) =>
//     text
//       .toLowerCase()
//       .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
//       .split(/\s+/)
//       .filter((w) => w.length > 0);

//   const X = sanitize(candidate);
//   const Y = sanitize(reference);

//   const m = X.length;
//   const n = Y.length;

//   if (m === 0 || n === 0) return 0;

//   // LCS DP table
//   const L = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

//   for (let i = 0; i <= m; i++) {
//     for (let j = 0; j <= n; j++) {
//       if (i === 0 || j === 0) {
//         L[i][j] = 0;
//       } else if (X[i - 1] === Y[j - 1]) {
//         L[i][j] = L[i - 1][j - 1] + 1;
//       } else {
//         L[i][j] = Math.max(L[i - 1][j], L[i][j - 1]);
//       }
//     }
//   }

//   const lcs = L[m][n];

//   // Recall and Precision based on LCS
//   const r_lcs = lcs / n;
//   const p_lcs = lcs / m;

//   const beta = 1; // standard ROUGE-F1
//   if (r_lcs + p_lcs === 0) return 0;
//   const f_lcs = ((1 + beta * beta) * r_lcs * p_lcs) / (r_lcs + p_lcs);

//   return Math.round(f_lcs * 1000) / 10;
// }

// // REST API Endpoints

// // 1. Health check
// app.get("/api/health", (req, res) => {
//   res.json({ status: "healthy", time: new Date().toISOString() });
// });

// // 2. Multilingual Translation
// app.post("/api/translate", async (req, res): Promise<void> => {
//   const { text, sourceLang, targetLang } = req.body;

//   if (!text || !sourceLang || !targetLang) {
//     res.status(400).json({ error: "Missing required parameters: text, sourceLang, targetLang" });
//     return;
//   }

//   if (!apiKey) {
//     res.status(500).json({
//       error: "Gemini API key is not configured. Please supply GEMINI_API_KEY in the Secrets settings.",
//     });
//     return;
//   }

//   try {
//     const prompt = `
//       Translate the following text.
//       Source Language: ${sourceLang}
//       Target Language: ${targetLang}
//       Text to Translate: "${text}"

//       The target and source languages can be any of the three: English, French, or Ewe (Eʋegbe, a language from Togo/Ghana).
      
//       Ewe has special orthography including:
//       - 'ɖ' (African d)
//       - 'ƒ' (African f / voiceless bilabial fricative)
//       - 'ɣ' (Voiced velar fricative)
//       - 'ʋ' (Voiced bilabial fricative)
//       - 'ŋ' (Eng / velar nasal)
//       - 'ɔ' (Open o)
//       - 'ɛ' (Open e)
      
//       Provide a highly precise translation. 
//       Because Ewe is low-resource, please double-check that you respect appropriate vocabulary, grammatical agreements, postpositions (e.g. 'me', 'gbo', 'dzi'), and verb markers (e.g., 'le' for progressive, 'a' for future, 'na' for habitual/dative).

//       Your output MUST be in JSON format matching the following schema structure:
//       {
//         "translation": "The direct translation using correct characters and orthography.",
//         "explanation": "A concise explanation of the grammatical differences, sentence structure, or vocabulary nuances in French.",
//         "phonetics": "A comprehensive pronunciation guide of the translation. If target is Ewe, detail how the syllables and vowels are pronounced, including tonal accents. If English/French, standard IPAs or clear sound descriptions.",
//         "wordAlignments": [
//           {
//             "source": "A specific word or phrase from the source text",
//             "target": "The corresponding translated word or phrase in the target text",
//             "meaning": "Literal meaning of the target word/phrase explained briefly",
//             "partOfSpeech": "Part of speech (e.g., Noun, Verb, Pronoun, Postposition, Tense Marker)"
//           }
//         ],
//         "grammaticalPoints": [
//           "A short grammatical tip or rule illustrated by this translation."
//         ]
//       }

//       Return strictly the JSON object and no other surrounding markdown backticks.
//     `;

//     const response = await ai.models.generateContent({
//       model: "gemini-3.5-flash",
//       contents: prompt,
//       config: {
//         responseMimeType: "application/json",
//       },
//     });

//     const resultText = response.text || "{}";
//     const resultJson = JSON.parse(resultText);
//     res.json(resultJson);
//   } catch (error: any) {
//     console.error("Translation API Error:", error);
//     res.status(500).json({ error: error.message || "Failed to process translation." });
//   }
// });

// // 3. Speech to Text (STT) via multi-modal transcription
// app.post("/api/stt", async (req, res): Promise<void> => {
//   const { audioData, mimeType, targetLang } = req.body;

//   if (!audioData || !mimeType) {
//     res.status(400).json({ error: "Missing audio data or mimeType" });
//     return;
//   }

//   if (!apiKey) {
//     res.status(500).json({
//       error: "Gemini API key is not configured. Please supply GEMINI_API_KEY in the Secrets settings.",
//     });
//     return;
//   }

//   try {
//     const audioPart = {
//       inlineData: {
//         mimeType: mimeType,
//         data: audioData, // Base64 spoken audio
//       },
//     };

//     const targetLangDesc = targetLang === "ee" ? "Ewe (Eʋegbe, ensuring you use Togolese Ewe spelling with special characters: ɖ, ƒ, ɣ, ʋ, ŋ, ɔ, ɛ)" : targetLang === "fr" ? "French" : "English";

//     const textPart = {
//       text: `Listen to this speech recording very carefully. Cut down any background static or silence. Transcribe the spoken text word-for-word into standard ${targetLangDesc}. 
//       Do NOT add any explanations, or tags like "Transcribed:". Just output the transcribed sentence directly and literally.`,
//     };

//     const response = await ai.models.generateContent({
//       model: "gemini-3.5-flash",
//       contents: { parts: [audioPart, textPart] },
//     });

//     const transcribedText = response.text?.trim() || "";
//     res.json({ text: transcribedText });
//   } catch (error: any) {
//     console.error("STT API Error:", error);
//     res.status(500).json({ error: error.message || "Failed to transcribe audio." });
//   }
// });

// // 4. Text to Speech (TTS) using prompt-level audio synthesis or phonetic rendering
// app.post("/api/tts", async (req, res): Promise<void> => {
//   const { text, lang } = req.body;

//   if (!text || !lang) {
//     res.status(400).json({ error: "Missing text or lang parameters" });
//     return;
//   }

//   if (!apiKey) {
//     res.status(500).json({ error: "Gemini API key is not configured." });
//     return;
//   }

//   try {
//     // We can use gemini-3.1-flash-tts-preview for French and English
//     // Let's configure it
//     const prompt = `Say this text in ${lang === "fr" ? "French" : lang === "en" ? "English" : "Ewe (Eʋegbe)"}: "${text}".
//     Speak naturally, clearly, and elegantly.`;

//     const voiceName = lang === "en" ? "Zephyr" : lang === "fr" ? "Kore" : "Fenrir";

//     const response = await ai.models.generateContent({
//       model: "gemini-3.1-flash-tts-preview",
//       contents: [{ parts: [{ text: prompt }] }],
//       config: {
//         responseModalities: [Modality.AUDIO],
//         speechConfig: {
//           voiceConfig: {
//             prebuiltVoiceConfig: { voiceName: voiceName },
//           },
//         },
//       },
//     });

//     const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

//     if (base64Audio) {
//       res.json({ audioData: base64Audio, mimeType: "audio/pcm" });
//     } else {
//       res.status(500).json({ error: "No audio generated from TTS model." });
//     }
//   } catch (error: any) {
//     console.error("TTS API Error (falling back to frontend simulation):", error);
//     res.status(500).json({ error: error.message || "Speech generation failed. Local phonetic synthesizer fallback active." });
//   }
// });

// // 5. Simulated Scraper & Multi-Stage NLP Preprocessing Pipeline
// app.post("/api/scrape", async (req, res): Promise<void> => {
//   const { url, platform } = req.body;

//   if (!url) {
//     res.status(400).json({ error: "Missing url parameter" });
//     return;
//   }

//   try {
//     // We simulate a fully fledged, visual logging of the web scrape. 
//     // This gives a marvelous insight into scraping libraries (BeautifulSoup/Scrapy) and sentence alignments.
//     const steps = [
//       `[INFO] Initializing Web Scraper for: ${url}`,
//       `[INFO] Target platform identified: ${platform || "General Portal"}`,
//       `[SCRAPE] Performing HTTP GET request via proxy...`,
//       `[SCRAPE] Connection Success! status: 200 OK. Content-Type: text/html; charset=utf-8`,
//       `[NLP] Raw HTML payload retrieved (bytes: ${Math.floor(Math.random() * 20000) + 15000})`,
//       `[NLP] Parsing HTML tree using BeautifulSoup (lxml parser)...`,
//       `[NLP] Extracting primary text elements (p, div, article, li)...`,
//       `[NLP] Filtered 24 paragraph elements. Running text normalization (Unicode NFC/NFD alignment)...`,
//       `[NLP] Tokenizing text into logical sentences using spaCy French/Ewe model...`,
//       `[ALIGN] Initializing sentence-level auto-alignment using fast_align...`,
//       `[ALIGN] Calculating sentence-pair translation probabilities based on bilingual glossary...`,
//       `[ALIGN] Discarded 9 sentence pairs below alignment threshold (confidence < 0.65)...`,
//       `[ALIGN] Confirmed ${Math.floor(Math.random() * 5) + 6} highly aligned trilingual sentence pairs!`,
//       `[SUCCESS] Alignment completed successfully. Generated datasets ready for NMT model ingestion.`
//     ];

//     // Alignments sample database from Togolese local portals (Government, Ewe literature, etc.)
//     const matches = [
//       {
//         fr: "La paix et l'union nationale sont essentielles pour le développement du Togo.",
//         en: "Peace and national unity are essential for the development of Togo.",
//         ee: "Fafamɛ kple anyigbadzi ɖekawɔwɔ le vevie na Togo ƒe ŋgɔyiyi.",
//         confidence: 0.96,
//         source: "Togo Government Bulletin"
//       },
//       {
//         fr: "Les enfants doivent aller à l'école tous les matins pour apprendre.",
//         en: "Children must go to school every morning to learn.",
//         ee: "Deviwo ɖo na de suku ŋdi sia ŋdi be woasrɔ̃ nu.",
//         confidence: 0.94,
//         source: "Ewe Educational Manual"
//       },
//       {
//         fr: "Le marché local est animé et les marchands vendent des ignames.",
//         en: "The local market is bustling and the merchants are selling yams.",
//         ee: "Asi la le vevie eye nudzrawo le te dzram.",
//         confidence: 0.89,
//         source: "Togolese Cultural Archives"
//       },
//       {
//         fr: "La santé est une richesse inestimable pour tout être humain.",
//         en: "Health is an invaluable wealth for every human being.",
//         ee: "Lãmesẽ enye kesinɔnu vevi na amegbetɔ ɖesiaɖe.",
//         confidence: 0.97,
//         source: "Health Ministry Portal"
//       },
//       {
//         fr: "Bienvenue au Togo, la terre de nos aïeux.",
//         en: "Welcome to Togo, the land of our ancestors.",
//         ee: "Woezɔ̃ yi Togo, mía tɔgbuiwo ƒe anyigba.",
//         confidence: 0.99,
//         source: "Tourism Agency Brochure"
//       },
//       {
//         fr: "Puis-je avoir un verre d'eau s'il vous plaît?",
//         en: "Can I have a glass of water please?",
//         ee: "Meɖekuku, makpɔ tsinɔnu eɖeka?",
//         confidence: 0.92,
//         source: "Spoken Corpus Alignment Project"
//       }
//     ];

//     // Return the step logs and aligned data with a small randomized latency of execution simulation
//     res.json({
//       logs: steps,
//       alignedData: matches.slice(0, Math.floor(Math.random() * 2) + 5),
//     });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message || "Failed to simulate scraping." });
//   }
// });

// // 6. NLP evaluation engine
// app.post("/api/evaluate", (req, res): void => {
//   const { candidate, reference } = req.body;

//   if (!candidate || !reference) {
//     res.status(400).json({ error: "Missing candidate or reference text" });
//     return;
//   }

//   const bleuData = calculateBLEU(candidate, reference);
//   const rougeL = calculateROUGEL(candidate, reference);

//   res.json({
//     bleu: bleuData.bleu,
//     precisions: bleuData.precisions,
//     brevityPenalty: bleuData.brevityPenalty,
//     rougeL: rougeL,
//     candidateWordCount: candidate.split(/\s+/).filter(Boolean).length,
//     referenceWordCount: reference.split(/\s+/).filter(Boolean).length,
//   });
// });

// // Setup API in development and Angular static serving in production.
// async function startServer() {
//   if (process.env["NODE_ENV"] === "production") {
//     const distPath = path.join(process.cwd(), "dist", "ewe-multilingual-translator", "browser");
//     app.use(express.static(distPath));
//     app.get("*", (req, res) => {
//       res.sendFile(path.join(distPath, "index.html"));
//     });
//   } else {
//     console.log("Express API server running in development mode. Use ng serve on port 4200 for the Angular frontend.");
//   }

//   app.listen(PORT, "0.0.0.0", () => {
//     console.log(`Server running on http://0.0.0.0:${PORT}`);
//   });
// }

// startServer();
