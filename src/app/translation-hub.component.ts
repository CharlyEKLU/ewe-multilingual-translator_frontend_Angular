import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Component, EventEmitter, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { TranslationResponse } from "../types";
import { DotRevealComponent } from "./dot-reveal.component";
import { LangCode, TranslationService } from "./translation.service";

declare var anime: any;

const LANGUAGES: Record<LangCode, { name: string; code: LangCode; flag: string }> = {
  fr: { name: "Français", code: "fr", flag: "🇫🇷" },
  en: { name: "English", code: "en", flag: "🇬🇧" },
  ee: { name: "Eʋegbe (Ewe)", code: "ee", flag: "🇹🇬" },
};

@Component({
  selector: "app-translation-hub",
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTooltipModule, DotRevealComponent],
  templateUrl: "./translation-hub.component.html",
})
export class TranslationHubComponent {
  @Output() translationSaved = new EventEmitter<{ sourceLang: string; targetLang: string; sourceText: string; targetText: string }>();

  readonly languages = LANGUAGES;
  readonly langKeys: LangCode[] = ["fr", "en", "ee"];

  text = "";
  sourceLang: LangCode = "fr";
  targetLang: LangCode = "ee";
  visualSourceLang: LangCode | null = "fr";
  visualTargetLang: LangCode | null = "ee";
  isLoading = false;
  error: string | null = null;
  result: TranslationResponse | null = null;
  isRecording = false;
  recordingSeconds = 0;
  isPlayingAudio = false;

  inputMode: "text" | "file" = "text";
  private typingTimeout: any;

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingTimer: ReturnType<typeof setInterval> | null = null;
  private translationRequestId = 0;

  constructor(
    private readonly http: HttpClient,
    private readonly translationService: TranslationService,
  ) {}

  getOtherLanguages(currentLang: LangCode): LangCode[] {
    return this.langKeys.filter((lang) => lang !== currentLang);
  }

  setSourceLang(lang: LangCode, event?: MouseEvent): void {
    if (this.sourceLang === lang) return;

    if (event) {
      const currentActive = document.querySelector('.language-side.source .lang-btn.active') as HTMLElement;
      const targetBtn = event.currentTarget as HTMLElement;
      const label = document.querySelector('.language-side.source .lang-name') as HTMLElement;
      
      this.visualSourceLang = null; // Retire le style actif immédiatement
      
      this.playPremiumAnimation(currentActive, targetBtn, label, LANGUAGES[lang].name, () => {
        this.visualSourceLang = lang; // Applique le style rouge uniquement quand le point atterrit
      });
    } else {
      this.visualSourceLang = lang;
      const label = document.querySelector('.language-side.source .lang-name') as HTMLElement;
      if (label) label.textContent = LANGUAGES[lang].name;
    }

    if (this.targetLang === lang) {
      this.swapLanguages();
    } else {
      this.sourceLang = lang;
      this.result = null;
    }
  }

  setTargetLang(lang: LangCode, event?: MouseEvent): void {
    if (this.targetLang === lang) return;

    if (event) {
      const currentActive = document.querySelector('.language-side.target .lang-btn.active') as HTMLElement;
      const targetBtn = event.currentTarget as HTMLElement;
      const label = document.querySelector('.language-side.target .lang-name') as HTMLElement;
      
      this.visualTargetLang = null; // Retire le style actif immédiatement
      
      this.playPremiumAnimation(currentActive, targetBtn, label, LANGUAGES[lang].name, () => {
        this.visualTargetLang = lang; // Applique le style rouge uniquement quand le point atterrit
      });
    } else {
      this.visualTargetLang = lang;
      const label = document.querySelector('.language-side.target .lang-name') as HTMLElement;
      if (label) label.textContent = LANGUAGES[lang].name;
    }

    if (this.sourceLang === lang) {
      this.swapLanguages();
    } else {
      this.targetLang = lang;
      this.result = null;
    }
  }

  swapLanguages(): void {
    [this.sourceLang, this.targetLang] = [this.targetLang, this.sourceLang];
    [this.visualSourceLang, this.visualTargetLang] = [this.sourceLang, this.targetLang];
    this.result = null;
    // Manual DOM update for labels when swapping since we bypass AnimeJS here
    setTimeout(() => {
      const srcLabel = document.querySelector('.language-side.source .lang-name') as HTMLElement;
      const tgtLabel = document.querySelector('.language-side.target .lang-name') as HTMLElement;
      if (srcLabel) srcLabel.textContent = LANGUAGES[this.sourceLang].name;
      if (tgtLabel) tgtLabel.textContent = LANGUAGES[this.targetLang].name;
    }, 50);
  }

  private playPremiumAnimation(currentBtn: HTMLElement | null, targetBtn: HTMLElement, label: HTMLElement | null, newName: string, onDotLanded: () => void) {
    if (currentBtn && targetBtn) {
      const start = currentBtn.getBoundingClientRect();
      const end = targetBtn.getBoundingClientRect();

      const dot = document.createElement("div");
      dot.className = "fly-dot";
      document.body.appendChild(dot);

      const startX = start.left + start.width / 2 - 5;
      const startY = start.top + start.height / 2 - 5;
      const endX = end.left + end.width / 2 - 5;
      const endY = end.top + end.height / 2 - 5;

      dot.style.left = startX + "px";
      dot.style.top = startY + "px";

      anime({
        targets: dot,
        left: endX,
        top: [ { value: startY - 45 }, { value: endY } ],
        scale: [ { value: 1 }, { value: 1.5 }, { value: 1 } ],
        duration: 650,
        easing: "easeOutCubic",
        complete() { 
          dot.remove(); 
          onDotLanded();
        }
      });
    } else {
      onDotLanded();
    }

    if (targetBtn) {
      anime({
        targets: targetBtn,
        scale: [ { value: 0.92 }, { value: 1.10 }, { value: 1 } ],
        duration: 450,
        easing: 'easeOutBack'
      });
    }

    if (label) {
      anime({
        targets: label,
        opacity: [1, 0],
        translateY: [0, -8],
        duration: 150,
        complete: () => {
          label.textContent = newName;
          anime({
            targets: label,
            opacity: [0, 1],
            translateY: [10, 0],
            duration: 250,
            easing: 'easeOutQuad'
          });
        }
      });
    }
  }

  toggleInputMode(): void {
    this.inputMode = this.inputMode === "text" ? "file" : "text";
  }

  onTextChange(): void {
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.translate();
    }, 1200); // Live translation as requested
  }

  translate(overrideText?: string): void {
    const textToTranslate = overrideText ?? this.text;
    if (!textToTranslate.trim()) {
      this.result = null;
      this.error = null;
      this.isLoading = false;
      return;
    }

    const requestId = ++this.translationRequestId;
    this.isLoading = true;
    this.error = null;

    this.translationService.translate(textToTranslate, this.sourceLang, this.targetLang).subscribe({
      next: (data) => {
        if (requestId !== this.translationRequestId) return;
        this.result = data;
        this.isLoading = false;
      },
      error: (err) => {
        if (requestId !== this.translationRequestId) return;
        this.result = null;
        this.error = err?.error?.error || "Erreur de connexion lors de la traduction.";
        this.isLoading = false;
      },
    });
  }

  saveToHistory(): void {
    if (!this.text || !this.result?.translation) return;
    this.translationSaved.emit({
      sourceLang: this.sourceLang,
      targetLang: this.targetLang,
      sourceText: this.text,
      targetText: this.result.translation
    });
  }

  async toggleRecording(): Promise<void> {
    if (this.isRecording) {
      this.stopRecording();
      return;
    }
    await this.startRecording();
  }

  async startRecording(): Promise<void> {
    this.audioChunks = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.audioChunks.push(event.data);
      };
      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        this.processAudioForSTT(new Blob(this.audioChunks, { type: "audio/webm" }));
      };
      this.mediaRecorder.start();
      this.beginTimer();
    } catch {
      this.beginTimer();
      setTimeout(() => {
        this.stopTimer();
        const sample = this.sourceLang === "fr" ? "Bonjour, bienvenue au marché de Lomé." : this.sourceLang === "en" ? "I want to buy fish and yams." : "Woezɔ̃ yi Togo, akpe kakaka !";
        this.text = sample;
        this.translate(sample);
      }, 3000);
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) this.mediaRecorder.stop();
    this.stopTimer();
  }

  processAudioForSTT(audioBlob: Blob): void {
    this.isLoading = true;
    this.error = null;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = String(reader.result).split(",")[1] ?? "";
      this.http.post<{ text: string }>("/api/stt", { audioData: base64Data, mimeType: "audio/webm", targetLang: this.sourceLang }).subscribe({
        next: (data) => {
          if (!data.text) {
            this.error = "Aucun texte capté. Parlez bien en face du micro.";
            this.isLoading = false;
            return;
          }
          this.text = data.text;
          this.translate(data.text);
        },
        error: (err) => {
          this.error = err?.error?.error || "Erreur de connexion lors de la reconnaissance vocale.";
          this.isLoading = false;
        },
      });
    };
    reader.readAsDataURL(audioBlob);
  }

  playTTS(): void {
    if (!this.result?.translation) return;
    this.isPlayingAudio = true;
    if (this.targetLang === "fr" || this.targetLang === "en") {
      const utterance = new SpeechSynthesisUtterance(this.result.translation);
      utterance.lang = this.targetLang === "fr" ? "fr-FR" : "en-US";
      utterance.onend = () => (this.isPlayingAudio = false);
      utterance.onerror = () => (this.isPlayingAudio = false);
      window.speechSynthesis.speak(utterance);
      return;
    }
    this.http.post<{ audioData: string }>("/api/tts", { text: this.result.translation, lang: "ee" }).subscribe({
      next: (data) => this.playAudioData(data.audioData),
      error: () => this.triggerFallbackSyllableTTS(this.result?.translation ?? ""),
    });
  }

  loadSample(sample: string, source: LangCode, target: LangCode): void {
    this.text = sample;
    this.sourceLang = source;
    this.targetLang = target;
    this.result = null;
  }

  loadMarketSample(): void {
    this.loadSample("Combien coûte l'igname ?", "fr", "ee");
  }

  private beginTimer(): void {
    this.isRecording = true;
    this.recordingSeconds = 0;
    this.recordingTimer = setInterval(() => {
      this.recordingSeconds += 1;
      if (this.recordingSeconds >= 10) this.stopRecording();
    }, 1000);
  }

  private stopTimer(): void {
    this.isRecording = false;
    if (this.recordingTimer) clearInterval(this.recordingTimer);
    this.recordingTimer = null;
    this.recordingSeconds = 0;
  }

  private playAudioData(base64Audio: string): void {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const binaryStr = atob(base64Audio);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    audioCtx.decodeAudioData(
      bytes.buffer,
      (buffer) => {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.onended = () => (this.isPlayingAudio = false);
        source.start(0);
      },
      () => this.triggerFallbackSyllableTTS(this.result?.translation ?? ""),
    );
  }

  private triggerFallbackSyllableTTS(eweText: string): void {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const syllables = eweText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);
    let delay = 0;
    syllables.forEach((syllable) => {
      if (!syllable.length) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      let pitch = 180;
      if (syllable.includes("́")) pitch += 60;
      if (syllable.includes("̀")) pitch -= 40;
      if (/[mnŋ]/.test(syllable)) pitch -= 15;
      osc.frequency.setValueAtTime(pitch, audioCtx.currentTime + delay);
      gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.22);
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + 0.24);
      delay += 0.26;
    });
    setTimeout(() => (this.isPlayingAudio = false), delay * 1000);
  }
}
