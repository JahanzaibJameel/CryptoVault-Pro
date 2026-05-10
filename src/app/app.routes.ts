import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./features/portfolio/portfolio.component').then(m => m.PortfolioComponent)
  },
  {
    path: 'watchlist',
    loadComponent: () => import('./features/watchlist/watchlist.component').then(m => m.WatchlistComponent)
  },
  {
    path: 'news',
    loadComponent: () => import('./features/news/news.component').then(m => m.NewsComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
