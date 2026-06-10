import { Component, Input, ElementRef, ViewChild, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-dot-reveal',
  standalone: true,
  template: `<div #output class="dot-reveal-output"></div>`,
  styles: [`
    .dot-reveal-output {
      font-size: 24px;
      line-height: 1.6;
      word-break: break-word;
      min-height: 100px;
    }
  `]
})
export class DotRevealComponent implements OnChanges, OnDestroy {
  @Input() text: string = '';
  @ViewChild('output', { static: true }) outputRef!: ElementRef<HTMLDivElement>;

  private timeouts: ReturnType<typeof setTimeout>[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['text']) {
      this.dotReveal(this.text || '');
    }
  }

  ngOnDestroy(): void {
    this.clearTimeouts();
  }

  private clearTimeouts(): void {
    this.timeouts.forEach(clearTimeout);
    this.timeouts = [];
  }

  private createDotChar(char: string, delayOffset: number): void {
    if (char === ' ') {
      const space = document.createElement('span');
      space.style.display = 'inline-block';
      space.style.width = '8px';
      this.outputRef.nativeElement.appendChild(space);
      return;
    }

    const wrapper = document.createElement("span");
    wrapper.className = "char";

    const cols = 5;
    const rows = 7;

    for (let i = 0; i < cols * rows; i++) {
      const dot = document.createElement("span");
      dot.className = "dot";
      const x = (i % cols) * 4;
      const y = Math.floor(i / cols) * 4;
      dot.style.left = x + "px";
      dot.style.top = y + "px";
      wrapper.appendChild(dot);
    }

    this.outputRef.nativeElement.appendChild(wrapper);

    const dots = wrapper.querySelectorAll(".dot") as NodeListOf<HTMLElement>;

    dots.forEach((dot, i) => {
      this.timeouts.push(setTimeout(() => {
        dot.style.transition = "all 0.2s ease-out";
        dot.style.opacity = "1";
        dot.style.transform = "scale(1)";
        dot.style.background = "var(--primary)";
      }, delayOffset + i * 3));
    });

    this.timeouts.push(setTimeout(() => {
      wrapper.innerHTML = char;
      wrapper.className = "char-revealed";
    }, delayOffset + 150));
  }

  private dotReveal(text: string): void {
    this.clearTimeouts();
    if (!this.outputRef) return;
    
    this.outputRef.nativeElement.innerHTML = "";
    
    const chars = text.substring(0, 150).split("");
    if (text.length > 150) {
      chars.push('.', '.', '.');
    }

    chars.forEach((char, i) => {
      this.createDotChar(char, i * 40); 
    });
  }
}
