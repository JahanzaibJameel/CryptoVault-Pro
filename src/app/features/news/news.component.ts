import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="news-container">
      <h1>Crypto News</h1>
      <p>Latest cryptocurrency news and market updates will appear here.</p>
    </div>
  `,
  styleUrl: './news.component.scss'
})
export class NewsComponent {}
