import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { TranslationResponse } from "../types";

export type LangCode = "fr" | "en" | "ee";

export interface TranslationRequest {
  text: string;
  sourceLang: LangCode;
  targetLang: LangCode;
}

@Injectable({ providedIn: "root" })
export class TranslationService {
  private readonly apiUrl = "/api/translate";

  constructor(private readonly http: HttpClient) {}

  translate(text: string, sourceLang: LangCode, targetLang: LangCode): Observable<TranslationResponse> {
    return this.http.post<TranslationResponse>(this.apiUrl, {
      text,
      sourceLang,
      targetLang,
    } satisfies TranslationRequest);
  }
}
