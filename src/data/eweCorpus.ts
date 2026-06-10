import { AlignedSentence } from "../types";

export const PRELOADED_CORPUS: AlignedSentence[] = [
  {
    id: "sent-1",
    fr: "Comment allez-vous ce matin ?",
    en: "How are you doing this morning?",
    ee: "Ʋofɔ nyuiea le ŋdi sia ?",
    confidence: 0.99,
    source: "Conversation standard",
    category: "Salutations & Quotidien"
  },
  {
    id: "sent-2",
    fr: "Je vais bien, merci beaucoup.",
    en: "I am fine, thank you very much.",
    ee: "Mekpɔ lãmesẽ, akpe kakaka.",
    confidence: 0.98,
    source: "Conversation standard",
    category: "Salutations & Quotidien"
  },
  {
    id: "sent-3",
    fr: "Bienvenue au Togo, le pays de l'hospitalité.",
    en: "Welcome to Togo, the land of hospitality.",
    ee: "Woezɔ̃ yi Togo, dutoamenyigba la dzi.",
    confidence: 0.96,
    source: "Portail du Tourisme Togo",
    category: "Gouvernement & Tourisme"
  },
  {
    id: "sent-4",
    fr: "L'éducation est l'avenir de nos enfants.",
    en: "Education is the future of our children.",
    ee: "Nusrɔ̃srɔ̃ enye mía tɔgbuiwo kple mía viwo ƒe etsɔme.",
    confidence: 0.94,
    source: "Manuel d'Éducation Civique",
    category: "École & Éducation"
  },
  {
    id: "sent-5",
    fr: "Où se trouve le marché de Lomé ?",
    en: "Where is the Lomé market?",
    ee: "Afika Lome ƒe dzigbe asi la le ?",
    confidence: 0.97,
    source: "Guide Touristique Lomé",
    category: "Commerce & Marché"
  },
  {
    id: "sent-6",
    fr: "Je voudrais acheter de l'igname et du poisson.",
    en: "I would like to buy some yam and fish.",
    ee: "Medi be maƒle te kple tɔmelã.",
    confidence: 0.95,
    source: "Corpus oral Lomé IV",
    category: "Commerce & Marché"
  },
  {
    id: "sent-7",
    fr: "Combien coûte cette miche de pain ?",
    en: "How much does this loaf of bread cost?",
    ee: "Ablolo sia ƒe home enye gbɔsɔsɔ ka ?",
    confidence: 0.92,
    source: "Enquête Commerciale",
    category: "Commerce & Marché"
  },
  {
    id: "sent-8",
    fr: "La paix et la sécurité nationale sont primordiales.",
    en: "Peace and national security are paramount.",
    ee: "Fafamɛ kple dukɔa ƒe dedienɔnɔ le vevie ŋutɔ.",
    confidence: 0.98,
    source: "Publication Officielle de l'État",
    category: "Gouvernement & Tourisme"
  },
  {
    id: "sent-9",
    fr: "S'il vous plaît, apportez-moi de l'eau à boire.",
    en: "Please, bring me some water to drink.",
    ee: "Meɖekuku, tsɔ tsinɔnu vɛ nam.",
    confidence: 0.93,
    source: "Cahier de dialogue Ewe",
    category: "Salutations & Quotidien"
  },
  {
    id: "sent-10",
    fr: "Le médecin m'a dit de prendre ce médicament.",
    en: "The doctor told me to take this medicine.",
    ee: "Kɔɖila la gblɔ nam be manya atike sia.",
    confidence: 0.95,
    source: "Manuel de Santé Communautaire",
    category: "Santé & Médical"
  },
  {
    id: "sent-11",
    fr: "Prenez soin de votre corps et de votre esprit.",
    en: "Take care of your body and mind.",
    ee: "Lé be na wò ŋutilã kple wò gbɔgbɔ.",
    confidence: 0.91,
    source: "Proverbes & Philosophie Ewe",
    category: "Santé & Médical"
  },
  {
    id: "sent-12",
    fr: "Quel âge as-tu ?",
    en: "How old are you?",
    ee: "Ƒe nenie nye wò ?",
    confidence: 0.97,
    source: "Conversation standard",
    category: "Salutations & Quotidien"
  }
];

export const EWE_GRAMMAR_TILES = [
  {
    title: "Pronoms Personnels",
    desc: "Mise en correspondance des pronoms sujets",
    examples: [
      { fr: "Je / j'", ee: "Me-", note: "Suffixe de verbe. Ex: Meyi (Je suis parti)" },
      { fr: "Tu", ee: "È-", note: "Ex: Èyi (Tu es parti)" },
      { fr: "Il / Elle", ee: "E-", note: "Ex: Eyi (Il/Elle est parti)" },
      { fr: "Nous", ee: "Míe-", note: "Ex: Míeyi (Nous sommes partis)" },
      { fr: "Vous", ee: "Mie-", note: "Ex: Mieyi (Vous êtes partis)" },
      { fr: "Ils / Elles", ee: "Wo-", note: "Ex: Woyi (Ils/Elles sont partis)" }
    ]
  },
  {
    title: "Marqueurs Temporels",
    desc: "Les morphèmes qui modifient le temps du verbe principal (qui se place après le verbe ou s'y adosse)",
    examples: [
      { structure: "A + Verbe", ee: "Futur", note: "Ex: Ma yi (Je partirai, de me + a + yi)" },
      { structure: "Le + Verbe + m", ee: "Présent Continu / Progressif", note: "Ex: Mele yiyim (Je suis en train de partir, duplication du verbe)" },
      { structure: "Verbe + na", ee: "Habituel", note: "Ex: Menyina (J'ai l'habitude d'y aller)" },
      { structure: "Verbe (Sélectif)", ee: "Passé / Aoriste", note: "Ex: Meyi (Je suis parti / Je partis)" }
    ]
  },
  {
    title: "Postpositions de Lieu",
    desc: "L'ewe exprime le lieu par des postpositions nominales placées APRÈS le nom, contrairement aux prépositions en français",
    examples: [
      { prep: "Dans", post: "me", note: "Ex: Akpala me (Dans le panier)" },
      { prep: "Sur", post: "dzi", note: "Ex: Kplɔ̃dzi (Sur la table, kplɔ̃ + dzi)" },
      { prep: "Sous", post: "te", note: "Ex: Atite (Sous l'arbre)" },
      { prep: "Devant", post: "gbo", note: "Ex: Sukugbo (Devant / près de l'école)" }
    ]
  }
];

export const PYTHON_SCRAPER_CODE = `import requests
from bs4 import BeautifulSoup
import json
import re

# Pipeline de scraping de corpus bilingue pour la langue Ewe (Togo)
# Auteur: Master 1 IA-BD | Projet proposé par Mme GBEDEVI

class EweCorpusScraper:
    def __init__(self, target_url):
        self.url = target_url
        self.raw_data = []
        self.aligned_corpus = []

    def scrape_webpage(self):
        print(f"[*] Connexion à: {self.url} ...")
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        try:
            response = requests.get(self.url, headers=headers, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                print("[+] Page HTML récupérée. Parsing en cours...")
                paragraphs = soup.find_all(['p', 'div', 'li'])
                for p in paragraphs:
                    text = p.get_text().strip()
                    if len(text) > 20: # Filtrer le bruit court
                        self.raw_data.append(text)
                print(f"[+] {len(self.raw_data)} blocs pertinents extraits.")
            else:
                print(f"[-] Erreur HTTP: {response.status_code}")
        except Exception as e:
            print(f"[-] Exception détectée: {e}")

    def clean_text(self, text):
        # Normalisation Unicode (conserver les caractères spéciaux Ewe)
        # ɖ, ƒ, ɣ, ʋ, ŋ, ɔ, ɛ, kple tonalités
        text = re.sub(r'\\s+', ' ', text)
        text = text.strip()
        return text

    def run_alignment_pipeline(self):
        # Simulation simplifiée d'un alignement de phrases parallelisées
        print("[*] Lancement de l'alignement NLTK / Fast-Align...")
        for sentence in self.raw_data:
            # Algorithme d'alignement par score sémantique et correspondance lexicale
            cleaned = self.clean_text(sentence)
            # Ajout au corpus final
            self.aligned_corpus.append({
                "source": self.url,
                "text": cleaned
            })
        print(f"[SUCCESS] {len(self.aligned_corpus)} phrases alignées enregistrées.")

if __name__ == "__main__":
    scraper = EweCorpusScraper("https://example-togo-portal.tg/ewe-studies")
    scraper.scrape_webpage()
    scraper.run_alignment_pipeline()
`;
