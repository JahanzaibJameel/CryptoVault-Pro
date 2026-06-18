import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="app-header">
      <nav class="navbar">
        <div class="nav-brand">
          <a routerLink="/" class="brand-link">
            <span class="brand-icon">₿</span>
            <span class="brand-text">Crypto Vault Pro</span>
          </a>
        </div>

        <div class="nav-menu">
          <a
            routerLink="/dashboard"
            routerLinkActive="active"
            class="nav-link"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            Dashboard
          </a>
          <a routerLink="/portfolio" routerLinkActive="active" class="nav-link"> Portfolio </a>
          <a routerLink="/watchlist" routerLinkActive="active" class="nav-link"> Watchlist </a>
          <a routerLink="/news" routerLinkActive="active" class="nav-link"> News </a>
          <a routerLink="/settings" routerLinkActive="active" class="nav-link"> Settings </a>
        </div>

        <div class="nav-actions">
          <button class="nav-toggle" (click)="toggleMobileMenu()" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
    </header>
  `,
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  toggleMobileMenu(): void {
    // Mobile menu toggle logic would go here
    // Mobile menu toggled (debug logging removed)
  }
}
