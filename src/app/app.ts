import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { FailureToggleComponent } from './core/debug/failure-toggle.component';
import { ToastComponent } from './shared/design-system/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, FailureToggleComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  isProduction = environment.production;
}
