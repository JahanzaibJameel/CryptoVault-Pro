import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="watchlist-container">
      <h1>Watchlist</h1>
      <p>Your cryptocurrency watchlist will appear here.</p>
    </div>
  `,
  styleUrl: './watchlist.component.scss'
})
export class WatchlistComponent {}
