import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { TranslationHubComponent } from "./translation-hub.component";
import { FormsModule } from "@angular/forms";

declare var anime: any;

type HistoryItem = { id: string; sourceLang: string; targetLang: string; sourceText: string; targetText: string; date: string; time: string; timestamp: string };

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule, TranslationHubComponent, MatToolbarModule, MatIconModule, MatButtonModule, MatCardModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
  isLoadingApp = true;

  ngOnInit(): void {
    setTimeout(() => {
      this.isLoadingApp = false;
    }, 2500); // Animation duration
  }
  history: HistoryItem[] = [
    {
      id: "hist-1",
      sourceLang: "fr",
      targetLang: "ee",
      sourceText: "La santé est une richesse inestimable.",
      targetText: "Lãmesẽ enye kesinɔnu vevi na amegbetɔ.",
      date: new Date(Date.now() - 3600000 * 2).toLocaleDateString(),
      time: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "hist-2",
      sourceLang: "fr",
      targetLang: "en",
      sourceText: "Merci beaucoup pour l'accueil chaleureux.",
      targetText: "Thank you very much for the warm welcome.",
      date: new Date(Date.now() - 3600000).toLocaleDateString(),
      time: new Date(Date.now() - 3600000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  isHistoryExpanded = false;
  searchQuery = "";
  sortColumn: "timestamp" | "sourceLang" | "targetLang" | "sourceText" | "targetText" = "timestamp";
  sortDirection: "asc" | "desc" = "desc";
  selectedItems = new Set<string>();

  get filteredHistory(): HistoryItem[] {
    let result = this.history;

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(h => 
        h.sourceText.toLowerCase().includes(q) || 
        h.targetText.toLowerCase().includes(q) || 
        h.sourceLang.toLowerCase().includes(q) || 
        h.targetLang.toLowerCase().includes(q) ||
        h.date.includes(q) ||
        h.time.includes(q)
      );
    }

    result = result.sort((a, b) => {
      let valA = a[this.sortColumn as keyof HistoryItem];
      let valB = b[this.sortColumn as keyof HistoryItem];
      
      if (valA < valB) return this.sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return this.sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }

  addTranslationToHistory(data: { sourceLang: string; targetLang: string; sourceText: string; targetText: string }): void {
    const now = new Date();
    this.history = [{ 
      id: `${Date.now()}`, 
      ...data, 
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      timestamp: now.toISOString()
    }, ...this.history];
  }

  deleteItem(id: string): void {
    this.history = this.history.filter(h => h.id !== id);
    this.selectedItems.delete(id);
  }

  deleteSelected(): void {
    this.history = this.history.filter(h => !this.selectedItems.has(h.id));
    this.selectedItems.clear();
  }

  clearHistory(): void {
    this.history = [];
    this.selectedItems.clear();
  }

  toggleSelection(id: string): void {
    if (this.selectedItems.has(id)) {
      this.selectedItems.delete(id);
    } else {
      this.selectedItems.add(id);
    }
  }

  toggleAll(event: any): void {
    if (event.target.checked) {
      this.filteredHistory.forEach(h => this.selectedItems.add(h.id));
    } else {
      this.selectedItems.clear();
    }
  }

  isAllSelected(): boolean {
    if (this.filteredHistory.length === 0) return false;
    return this.filteredHistory.every(h => this.selectedItems.has(h.id));
  }

  sortData(column: "timestamp" | "sourceLang" | "targetLang" | "sourceText" | "targetText"): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortColumn = column;
      this.sortDirection = "asc";
    }
  }

  expandHistory(): void {
    const children = document.querySelectorAll('#leftPanel .card > *');
    
    // 1. Désintégration du contenu de la carte
    anime({
      targets: children,
      opacity: [1, 0],
      scale: [1, 0.95],
      translateY: [0, 15],
      duration: 350,
      delay: anime.stagger(60),
      easing: 'easeInQuad',
      complete: () => {
        const leftPanel = document.getElementById('leftPanel') as HTMLElement;
        const rect = leftPanel.getBoundingClientRect();
        
        // 2. Création de l'élément fantôme (Ghost)
        const ghost = document.createElement('div');
        ghost.style.position = 'fixed';
        ghost.style.top = rect.top + 'px';
        ghost.style.left = rect.left + 'px';
        ghost.style.width = rect.width + 'px';
        ghost.style.height = rect.height + 'px';
        ghost.style.backgroundColor = '#ffffff';
        ghost.style.borderRadius = '24px';
        ghost.style.zIndex = '9999';
        ghost.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
        document.body.appendChild(ghost);
        
        // On cache le vrai panneau et on active l'état étendu
        leftPanel.style.display = 'none';
        this.isHistoryExpanded = true;
        
        // 3. Animation du panneau droit (Historique)
        const rightPanel = document.getElementById('rightPanel') as HTMLElement;
        rightPanel.style.width = '340px';
        
        anime({
          targets: rightPanel,
          width: ['340px', '100%'],
          duration: 600,
          easing: 'easeOutQuart'
        });
        
        // 4. Morphing du Ghost vers le FAB
        const fabDestX = window.innerWidth - 40 - 64; // right 40px
        const fabDestY = window.innerHeight - 30 - 64; // bottom 30px
        
        anime({
          targets: ghost,
          top: fabDestY,
          left: fabDestX,
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: '#E83242', // var(--primary)
          boxShadow: '0 10px 25px rgba(232, 50, 66, 0.4)',
          duration: 650,
          easing: 'easeInOutCubic',
          complete: () => {
            ghost.remove();
            // Apparition du vrai FAB
            const fab = document.querySelector('.fab-container') as HTMLElement;
            if(fab) fab.style.bottom = '30px';
          }
        });
      }
    });
  }

  collapseHistory(): void {
    // 1. Cacher le FAB et créer le Ghost
    const fab = document.querySelector('.fab-container') as HTMLElement;
    if(fab) fab.style.bottom = '-80px';
    
    const fabDestX = window.innerWidth - 40 - 64;
    const fabDestY = window.innerHeight - 30 - 64;
    
    const ghost = document.createElement('div');
    ghost.style.position = 'fixed';
    ghost.style.top = fabDestY + 'px';
    ghost.style.left = fabDestX + 'px';
    ghost.style.width = '64px';
    ghost.style.height = '64px';
    ghost.style.borderRadius = '50%';
    ghost.style.backgroundColor = '#E83242';
    ghost.style.zIndex = '9999';
    document.body.appendChild(ghost);
    
    // 2. Calcul des dimensions cibles
    this.isHistoryExpanded = false;
    const leftPanel = document.getElementById('leftPanel') as HTMLElement;
    leftPanel.style.display = 'block';
    leftPanel.style.opacity = '0'; // Invisible pendant le morphing
    
    const rightPanel = document.getElementById('rightPanel') as HTMLElement;
    rightPanel.style.width = '340px'; // On force la taille finale pour la mesure
    void leftPanel.offsetWidth; // Reflow
    
    const targetRect = leftPanel.getBoundingClientRect(); // Dimensions exactes
    rightPanel.style.width = '100%'; // On remet à 100% pour l'animer
    
    // 3. Animation du panneau droit (rétrécissement)
    anime({
      targets: rightPanel,
      width: ['100%', '340px'],
      duration: 600,
      easing: 'easeOutQuart'
    });
    
    // 4. Morphing du Ghost vers la Carte
    anime({
      targets: ghost,
      top: targetRect.top,
      left: targetRect.left,
      width: targetRect.width,
      height: targetRect.height,
      borderRadius: '24px',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      duration: 650,
      easing: 'easeInOutCubic',
      complete: () => {
        ghost.remove();
        leftPanel.style.opacity = '1';
        
        // 5. Apparition des éléments enfants
        const children = document.querySelectorAll('#leftPanel .card > *');
        anime({
          targets: children,
          opacity: [0, 1],
          scale: [0.95, 1],
          translateY: [15, 0],
          duration: 400,
          delay: anime.stagger(60),
          easing: 'easeOutQuad'
        });
      }
    });
  }
}
