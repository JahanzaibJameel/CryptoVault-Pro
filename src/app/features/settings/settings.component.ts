import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-container">
      <h1>Settings</h1>
      <p>Application settings and preferences will appear here.</p>
    </div>
  `,
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {}
