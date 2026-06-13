import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { DebugPanelComponent } from './shared/debug-panel/debug-panel.component';
import { ToastComponent } from './shared/design-system/toast/toast.component';
import { NotificationService } from './core/services/notification.service';
import { OfflineService } from './core/services/offline.service';
import { SettingsStore } from './application/settings/store/settings.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DebugPanelComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent implements OnInit {
  private document = inject(DOCUMENT);
  private settingsStore = inject(SettingsStore);

  isProduction = environment.production;
  isSidebarCollapsed = signal(false);
  currentTheme = this.settingsStore.theme;
  searchQuery = signal('');
  isOnline = signal(navigator.onLine);

  private notificationService = inject(NotificationService);
  private offlineService = inject(OfflineService);
  unreadCount = this.notificationService.unreadCount;

  constructor() {
    // React to theme changes from settings store
    effect(() => {
      this.applyTheme(this.currentTheme());
    });

    // Monitor online/offline status
    this.offlineService.connectionStatus();
    effect(() => {
      this.isOnline.set(this.offlineService.isCurrentlyOnline());
    });
  }

  ngOnInit(): void {
    this.applyTheme(this.currentTheme());
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((value) => !value);
  }

  toggleTheme(): void {
    this.settingsStore.toggleTheme();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  private applyTheme(theme: string): void {
    const body = this.document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${theme}-theme`);
    body.setAttribute('data-theme', theme);
  }
}
