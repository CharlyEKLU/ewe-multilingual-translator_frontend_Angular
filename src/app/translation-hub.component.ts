import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Component, EventEmitter, OnDestroy, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
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
export class TranslationHubComponent implements OnDestroy {
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
  private typingTimeout: any;

  private baseText = "";
  private recognition: any = null;
  private recordingTimer: ReturnType<typeof setInterval> | null = null;
  private translationRequestId = 0;
  private currentTranslationSub?: Subscription;

  constructor(
    private readonly http: HttpClient,
    private readonly translationService: TranslationService,
  ) { }

  ngOnDestroy(): void {
    if (this.currentTranslationSub) {
      this.currentTranslationSub.unsubscribe();
    }
  }

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
      if (this.text.trim()) {
        this.translate();
      }
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
      if (this.text.trim()) {
        this.translate();
      }
    }
  }

  swapLanguages(): void {
    [this.sourceLang, this.targetLang] = [this.targetLang, this.sourceLang];
    [this.visualSourceLang, this.visualTargetLang] = [this.sourceLang, this.targetLang];

    if (this.result?.translation) {
      this.text = this.result.translation;
    }

    this.result = null;
    if (this.text.trim()) {
      this.translate();
    }
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
        top: [{ value: startY - 45 }, { value: endY }],
        scale: [{ value: 1 }, { value: 1.5 }, { value: 1 }],
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
        scale: [{ value: 0.92 }, { value: 1.10 }, { value: 1 }],
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

  onTextChange(): void {
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.translate();
    }, 1000); // Live translation with 1s debounce
  }

  translate(overrideText?: string, autoPlayTTS: boolean = false): void {
    clearTimeout(this.typingTimeout);
    const textToTranslate = overrideText ?? this.text;
    if (!textToTranslate.trim()) {
      this.result = null;
      this.error = null;
      this.isLoading = false;
      return;
    }

    if (this.currentTranslationSub) {
      this.currentTranslationSub.unsubscribe();
    }

    const requestId = ++this.translationRequestId;
    this.isLoading = true;
    this.error = null;

    this.currentTranslationSub = this.translationService.translate(textToTranslate, this.sourceLang, this.targetLang).subscribe({
      next: (data) => {
        if (requestId !== this.translationRequestId) return;
        this.result = data;
        this.isLoading = false;
        if (autoPlayTTS && this.targetLang !== "ee") {
          setTimeout(() => this.playTTS(), 300);
        }
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
    this.error = null;
    this.baseText = this.text.trim();
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.error = "La reconnaissance vocale n'est pas supportée par ce navigateur.";
      // Fallback
      this.beginTimer();
      setTimeout(() => {
        this.stopTimer();
        const sample = this.sourceLang === "fr" ? "Bonjour, bienvenue au marché de Lomé." : this.sourceLang === "en" ? "I want to buy fish and yams." : "Woezɔ̃ yi Togo, akpe kakaka !";
        this.text = sample;
        this.translate(sample, true);
      }, 3000);
      return;
    }

    if (!this.recognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          this.baseText += (this.baseText ? ' ' : '') + finalTranscript.trim();
        }

        const displayText = this.baseText + (interimTranscript ? (this.baseText ? ' ' : '') + interimTranscript.trim() + ' ...' : '');
        this.text = displayText;
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          this.error = "Erreur vocale: " + event.error;
        }
        this.stopRecording();
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this.text = this.baseText; // On s'assure d'avoir la version propre finale
        this.stopTimer();
        if (this.text.trim()) {
          this.translate(this.text, true);
        }
      };
    }

    let lang = 'fr-FR';
    if (this.sourceLang === 'en') lang = 'en-US';
    else if (this.sourceLang === 'ee') lang = 'ee-TG';

    this.recognition.lang = lang;
    this.text = this.baseText; // On démarre avec le texte de base
    
    try {
      this.recognition.start();
      this.isRecording = true;
      this.beginTimer();
    } catch (e) {
      this.error = "Impossible de démarrer la reconnaissance vocale.";
      this.isRecording = false;
    }
  }

  stopRecording(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
    this.isRecording = false;
    this.stopTimer();
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
