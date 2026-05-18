import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EncryptedStorageService } from '../../core/services/encrypted-storage.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container animate-fade-in">
      <header class="settings-header">
        <div class="header-content">
          <h1 class="settings-title text-heading">Settings</h1>
          <p class="settings-subtitle text-secondary">Customize your application preferences</p>
        </div>
      </header>

      <main class="settings-content">
        <!-- Appearance Section -->
        <section class="settings-section glass-card">
          <div class="section-header">
            <h2 class="section-title text-heading">Appearance</h2>
            <p class="section-description text-secondary">Customize the visual appearance</p>
          </div>
          <div class="settings-group">
            <div class="setting-item">
              <label for="theme-select" class="setting-label">Theme</label>
              <div class="setting-control">
                <select id="theme-select" class="glass-select">
                  <option value="dark">Dark Mode</option>
                  <option value="light">Light Mode</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
            <div class="setting-item">
              <label for="language-select" class="setting-label">Language</label>
              <div class="setting-control">
                <select id="language-select" class="glass-select">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <!-- Notifications Section -->
        <section class="settings-section glass-card">
          <div class="section-header">
            <h2 class="section-title text-heading">Notifications</h2>
            <p class="section-description text-secondary">Manage your notification preferences</p>
          </div>
          <div class="settings-group">
            <div class="setting-item">
              <label for="price-alerts-toggle" class="setting-label">Price Alerts</label>
              <div class="setting-control">
                <label class="glass-toggle">
                  <input id="price-alerts-toggle" type="checkbox" checked>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div class="setting-item">
              <label for="news-updates-toggle" class="setting-label">News Updates</label>
              <div class="setting-control">
                <label class="glass-toggle">
                  <input id="news-updates-toggle" type="checkbox" checked>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div class="setting-item">
              <label for="email-notifications-toggle" class="setting-label">Email Notifications</label>
              <div class="setting-control">
                <label class="glass-toggle">
                  <input id="email-notifications-toggle" type="checkbox">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- Security & Encryption Section -->
        <section class="settings-section glass-card">
          <div class="section-header">
            <h2 class="section-title text-heading">Security & Encryption</h2>
            <p class="section-description text-secondary">Protect your sensitive data with encryption</p>
          </div>
          <div class="settings-group">
            <div class="setting-item">
              <label class="setting-label">Encryption Status</label>
              <div class="setting-control">
                <span class="encryption-status" [class.status-enabled]="encryptionStatus().isUnlocked" [class.status-disabled]="!encryptionStatus().isUnlocked">
                  {{ encryptionStatus().isUnlocked ? '🔓 Unlocked' : '🔒 Locked' }}
                </span>
              </div>
            </div>
            
            @if (!encryptionStatus().isUnlocked) {
              <div class="setting-item">
                <label class="setting-label">Setup Encryption</label>
                <div class="setting-control">
                  <button class="glass-button primary" (click)="showEncryptionSetup()">Enable Encryption</button>
                </div>
              </div>
            } @else {
              <div class="setting-item">
                <label class="setting-label">Key Information</label>
                <div class="setting-control">
                  <div class="key-info">
                    <small class="text-secondary">
                      Algorithm: {{ encryptionInfo().algorithm }}<br>
                      Key Type: {{ keyInfo()?.isDeviceKey ? 'Device Key' : 'Session Key' }}<br>
                      Created: {{ keyInfo()?.created | date:'short' }}
                    </small>
                  </div>
                </div>
              </div>
              <div class="setting-item">
                <label class="setting-label">Change Passphrase</label>
                <div class="setting-control">
                  <button class="glass-button secondary" (click)="showChangePassphrase()">Change Passphrase</button>
                </div>
              </div>
              <div class="setting-item">
                <label class="setting-label">Lock Encryption</label>
                <div class="setting-control">
                  <button class="glass-button ghost" (click)="lockEncryption()">Lock Now</button>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Privacy Section -->
        <section class="settings-section glass-card">
          <div class="section-header">
            <h2 class="section-title text-heading">Privacy</h2>
            <p class="section-description text-secondary">Control your privacy settings</p>
          </div>
          <div class="settings-group">
            <div class="setting-item">
              <label for="usage-data-toggle" class="setting-label">Share Usage Data</label>
              <div class="setting-control">
                <label class="glass-toggle">
                  <input id="usage-data-toggle" type="checkbox">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div class="setting-item">
              <label for="analytics-toggle" class="setting-label">Analytics</label>
              <div class="setting-control">
                <label class="glass-toggle">
                  <input id="analytics-toggle" type="checkbox" checked>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- Advanced Section -->
        <section class="settings-section glass-card">
          <div class="section-header">
            <h2 class="section-title text-heading">Advanced</h2>
            <p class="section-description text-secondary">Advanced configuration options</p>
          </div>
          <div class="settings-group">
            <div class="setting-item">
              <label for="api-key-input" class="setting-label">API Key</label>
              <div class="setting-control">
                <input id="api-key-input" type="password" class="glass-input" placeholder="Enter your API key">
              </div>
            </div>
            <div class="setting-item">
              <label for="refresh-rate-select" class="setting-label">Data Refresh Rate</label>
              <div class="setting-control">
                <select id="refresh-rate-select" class="glass-select">
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                </select>
              </div>
            </div>
          </div>
        </section>
      </main>

      <!-- Actions -->
      <footer class="settings-actions">
        <button class="glass-button primary">Save Changes</button>
        <button class="glass-button secondary">Reset to Default</button>
        <button class="glass-button ghost">Export Settings</button>
      </footer>
    </div>

    <!-- Encryption Setup Modal -->
    @if (showEncryptionModal()) {
      <div class="modal-overlay">
        <div class="modal-content glass-card animate-fade-in">
          <div class="modal-header">
            <h3 class="modal-title text-heading">Setup Encryption</h3>
            <p class="modal-subtitle text-secondary">Protect your sensitive data with AES-256 encryption</p>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Passphrase</label>
              <input 
                type="password" 
                class="glass-input" 
                [(ngModel)]="encryptionPassphrase"
                placeholder="Enter a strong passphrase (min 8 characters)"
                [disabled]="isProcessing()"
              >
              <small class="form-hint text-secondary">
                This passphrase will be used to encrypt your portfolio data. Store it safely.
              </small>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="useDeviceKey" [disabled]="isProcessing()">
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">Remember on this device (uses device fingerprint)</span>
              </label>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="glass-button secondary" (click)="cancelEncryptionSetup()" [disabled]="isProcessing()">
              Cancel
            </button>
            <button class="glass-button primary" (click)="setupEncryption()" [disabled]="isProcessing()">
              @if (isProcessing()) {
                <span class="loading-spinner"></span>
                Setting up...
              } @else {
                Enable Encryption
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Change Passphrase Modal -->
    @if (showChangePassphraseModal()) {
      <div class="modal-overlay">
        <div class="modal-content glass-card animate-fade-in">
          <div class="modal-header">
            <h3 class="modal-title text-heading">Change Passphrase</h3>
            <p class="modal-subtitle text-secondary">Update your encryption passphrase</p>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Current Passphrase</label>
              <input 
                type="password" 
                class="glass-input" 
                [(ngModel)]="oldPassphrase"
                placeholder="Enter your current passphrase"
                [disabled]="isProcessing()"
              >
            </div>
            
            <div class="form-group">
              <label class="form-label">New Passphrase</label>
              <input 
                type="password" 
                class="glass-input" 
                [(ngModel)]="newPassphrase"
                placeholder="Enter a new passphrase (min 8 characters)"
                [disabled]="isProcessing()"
              >
            </div>
            
            <div class="form-group">
              <label class="form-label">Confirm New Passphrase</label>
              <input 
                type="password" 
                class="glass-input" 
                [(ngModel)]="confirmPassphrase"
                placeholder="Confirm your new passphrase"
                [disabled]="isProcessing()"
              >
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="glass-button secondary" (click)="cancelChangePassphrase()" [disabled]="isProcessing()">
              Cancel
            </button>
            <button class="glass-button primary" (click)="changePassphrase()" [disabled]="isProcessing()">
              @if (isProcessing()) {
                <span class="loading-spinner"></span>
                Updating...
              } @else {
                Change Passphrase
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private encryptedStorage = inject(EncryptedStorageService);
  private notificationService = inject(NotificationService);
  
  // Encryption state signals
  showEncryptionModal = signal(false);
  showChangePassphraseModal = signal(false);
  encryptionPassphrase = signal('');
  oldPassphrase = signal('');
  newPassphrase = signal('');
  confirmPassphrase = signal('');
  useDeviceKey = signal(false);
  isProcessing = signal(false);
  
  // Computed properties
  encryptionStatus = computed(() => this.encryptedStorage.encryptionStatus());
  keyInfo = computed(() => this.encryptedStorage.keyInfo());
  encryptionInfo = computed(() => this.encryptedStorage.getEncryptionInfo());

  showEncryptionSetup(): void {
    this.showEncryptionModal.set(true);
    this.encryptionPassphrase.set('');
    this.useDeviceKey.set(false);
  }

  showChangePassphrase(): void {
    this.showChangePassphraseModal.set(true);
    this.oldPassphrase.set('');
    this.newPassphrase.set('');
    this.confirmPassphrase.set('');
  }

  async setupEncryption(): Promise<void> {
    if (!this.encryptionPassphrase()) {
      this.notificationService.error('Validation Error', 'Please enter a passphrase');
      return;
    }

    if (this.encryptionPassphrase().length < 8) {
      this.notificationService.error('Validation Error', 'Passphrase must be at least 8 characters long');
      return;
    }

    this.isProcessing.set(true);
    
    try {
      await this.encryptedStorage.setupEncryption(
        this.encryptionPassphrase(),
        this.useDeviceKey()
      );
      
      // Test the encryption
      const testResult = await this.encryptedStorage.testEncryption();
      if (!testResult) {
        throw new Error('Encryption test failed');
      }
      
      this.notificationService.success('Success', 'Encryption enabled successfully');
      this.showEncryptionModal.set(false);
      this.encryptionPassphrase.set('');
    } catch (error) {
      this.notificationService.error('Setup Failed', 'Failed to setup encryption: ' + (error as Error).message);
    } finally {
      this.isProcessing.set(false);
    }
  }

  async changePassphrase(): Promise<void> {
    if (!this.oldPassphrase() || !this.newPassphrase() || !this.confirmPassphrase()) {
      this.notificationService.error('Validation Error', 'Please fill in all passphrase fields');
      return;
    }

    if (this.newPassphrase() !== this.confirmPassphrase()) {
      this.notificationService.error('Validation Error', 'New passphrase and confirmation do not match');
      return;
    }

    if (this.newPassphrase().length < 8) {
      this.notificationService.error('Validation Error', 'New passphrase must be at least 8 characters long');
      return;
    }

    this.isProcessing.set(true);
    
    try {
      await this.encryptedStorage.changePassphrase(
        this.oldPassphrase(),
        this.newPassphrase()
      );
      
      this.notificationService.success('Success', 'Passphrase changed successfully');
      this.showChangePassphraseModal.set(false);
      this.oldPassphrase.set('');
      this.newPassphrase.set('');
      this.confirmPassphrase.set('');
    } catch (error) {
      this.notificationService.error('Change Failed', 'Failed to change passphrase: ' + (error as Error).message);
    } finally {
      this.isProcessing.set(false);
    }
  }

  async lockEncryption(): Promise<void> {
    try {
      await this.encryptedStorage.lock();
      this.notificationService.info('Security', 'Encryption locked. Your data is now secure.');
    } catch (error) {
      this.notificationService.error('Lock Failed', 'Failed to lock encryption: ' + (error as Error).message);
    }
  }

  cancelEncryptionSetup(): void {
    this.showEncryptionModal.set(false);
    this.encryptionPassphrase.set('');
    this.useDeviceKey.set(false);
  }

  cancelChangePassphrase(): void {
    this.showChangePassphraseModal.set(false);
    this.oldPassphrase.set('');
    this.newPassphrase.set('');
    this.confirmPassphrase.set('');
  }
}
