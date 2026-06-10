export interface WordAlignment {
  source: string;
  target: string;
  meaning: string;
  partOfSpeech?: string;
}

export interface TranslationResponse {
  translation: string;
  explanation: string;
  phonetics: string;
  wordAlignments: WordAlignment[];
  grammaticalPoints: string[];
}

export interface AlignedSentence {
  id: string;
  fr: string;
  en: string;
  ee: string;
  confidence: number;
  source: string;
  category: string;
}

export interface ScraperLog {
  id: string;
  text: string;
  timestamp: string;
  type: "info" | "success" | "error" | "code" | "nlp";
}

export interface EvaluationResult {
  bleu: number;
  precisions: number[];
  brevityPenalty: number;
  rougeL: number;
  candidateWordCount: number;
  referenceWordCount: number;
}
