import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="callback-message">
        <div class="spinner"></div>
        <p>Procesando autenticación...</p>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .callback-message {
      text-align: center;
      color: white;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['code']) {
        // Determinar si es Google o GitHub por la URL
        const currentUrl = window.location.pathname;
        
        if (currentUrl.includes('google')) {
          this.handleGoogleCallback(params['code']);
        } else if (currentUrl.includes('github')) {
          this.handleGitHubCallback(params['code']);
        }
      } else if (params['error']) {
        this.handleError(params['error']);
      }
    });
  }

  private handleGoogleCallback(code: string): void {
    // Simular datos de usuario de Google (en producción, intercambiarías el código por un token)
    const mockUser = {
      id: '123456789',
      email: 'usuario@gmail.com',
      name: 'Usuario de Prueba',
      picture: 'https://via.placeholder.com/150'
    };

    // Enviar mensaje al popup padre
    if (window.opener) {
      window.opener.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        user: mockUser
      }, window.location.origin);
      window.close();
    }
  }

  private handleGitHubCallback(code: string): void {
    // Simular datos de usuario de GitHub (en producción, intercambiarías el código por un token)
    const mockUser = {
      id: 987654321,
      login: 'usuario-github',
      name: 'Usuario GitHub',
      email: 'usuario@github.com',
      avatar_url: 'https://via.placeholder.com/150'
    };

    // Enviar mensaje al popup padre
    if (window.opener) {
      window.opener.postMessage({
        type: 'GITHUB_AUTH_SUCCESS',
        user: mockUser
      }, window.location.origin);
      window.close();
    }
  }

  private handleError(error: string): void {
    if (window.opener) {
      window.opener.postMessage({
        type: 'AUTH_ERROR',
        error: error
      }, window.location.origin);
      window.close();
    }
  }
}