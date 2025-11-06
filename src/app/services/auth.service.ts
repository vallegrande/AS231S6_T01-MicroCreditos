import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { GOOGLE_CONFIG } from '../config/google.config';
import { GITHUB_CONFIG } from '../config/github.config';
import { APP_CONSTANTS } from '../constants/app.constants';

export interface User {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
  walletAddress?: string;
  loginMethod: 'google' | 'github' | 'web3';
  isAdmin?: boolean;
  username?: string; // Para GitHub
}

declare global {
  interface Window { 
    ethereum?: any;
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private googleClientId = GOOGLE_CONFIG.CLIENT_ID;

  constructor(private http: HttpClient) {
    this.loadStoredUser();
    this.initializeGoogleAuth();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  private initializeGoogleAuth(): void {
    // El script ya está cargado en index.html, solo esperamos a que esté disponible
    if (typeof window !== 'undefined') {
      const checkGoogleReady = () => {
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: this.googleClientId,
              callback: this.handleGoogleCallback.bind(this),
              auto_select: false,
              cancel_on_tap_outside: false,
              use_fedcm_for_prompt: false // Desactivar FedCM que puede causar problemas
            });
            console.log('✅ Google Identity Services inicializado correctamente');
          } catch (error) {
            console.error('❌ Error al inicializar Google Identity Services:', error);
          }
        } else {
          setTimeout(checkGoogleReady, 100);
        }
      };
      
      // Esperar un poco antes de intentar inicializar
      setTimeout(checkGoogleReady, 500);
    }
  }

  // Autenticación con Google usando Google Identity Services (SIN POPUP)
  async loginWithGoogle(): Promise<User> {
    return new Promise((resolve, reject) => {
      console.log('🚀 Iniciando login con Google (método sin popup)...');
      
      if (!window.google?.accounts?.id) {
        reject(new Error('Google Identity Services no está disponible. Recarga la página.'));
        return;
      }

      // Configurar callbacks para esta sesión
      this.googleLoginResolve = resolve;
      this.googleLoginReject = reject;

      try {
        // Reinicializar Google con configuración específica (SIN REDIRECCIÓN)
        window.google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: this.handleGoogleCallback.bind(this),
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: false
          // NO usar ux_mode: 'redirect' para evitar problemas de URI
        });

        console.log('🔄 Intentando login sin popup...');
        
        // Crear un botón temporal y hacer clic automáticamente
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
        
        // Renderizar botón de Google
        window.google.accounts.id.renderButton(tempDiv, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'signin_with',
          shape: 'rectangular'
        });
        
        // Hacer clic automático después de un momento
        setTimeout(() => {
          const googleButton = tempDiv.querySelector('div[role="button"]') as HTMLElement;
          if (googleButton) {
            console.log('🖱️ Haciendo clic automático en botón de Google...');
            googleButton.click();
          } else {
            // Fallback: usar prompt normal
            console.log('🔄 Fallback: usando prompt...');
            window.google!.accounts!.id!.prompt((notification: any) => {
              console.log('📋 Notificación de Google:', notification);
              
              if (notification.isNotDisplayed()) {
                reject(new Error('Popup bloqueado. Permite popups para este sitio o usa el botón de reinicializar.'));
              } else if (notification.isSkippedMoment()) {
                reject(new Error('Login cancelado por el usuario'));
              }
            });
          }
          
          // Limpiar elemento temporal
          setTimeout(() => {
            if (tempDiv.parentNode) {
              tempDiv.parentNode.removeChild(tempDiv);
            }
          }, 1000);
        }, 500);

      } catch (error) {
        console.error('❌ Error al mostrar Google login:', error);
        reject(new Error('Error al inicializar Google login: ' + error));
      }
    });
  }



  private googleLoginResolve?: (user: User) => void;
  private googleLoginReject?: (error: Error) => void;

  public handleGoogleCallback(response: any): void {
    console.log('🎯 Google callback recibido:', response);
    
    try {
      if (!response.credential) {
        throw new Error('No se recibió credential de Google');
      }

      // Decodificar el JWT token
      const payload = this.parseJwt(response.credential);
      console.log('📋 Payload decodificado:', payload);
      
      const user: User = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        loginMethod: 'google',
        isAdmin: this.checkIfAdmin(payload.email)
      };

      console.log('👤 Usuario creado:', user);
      this.setCurrentUser(user);
      
      if (this.googleLoginResolve) {
        console.log('✅ Resolviendo promesa de login');
        this.googleLoginResolve(user);
        this.googleLoginResolve = undefined;
        this.googleLoginReject = undefined;
      } else {
        console.warn('⚠️ No hay promesa pendiente para resolver');
      }
    } catch (error) {
      console.error('❌ Error en handleGoogleCallback:', error);
      if (this.googleLoginReject) {
        this.googleLoginReject(new Error('Error al procesar la respuesta de Google: ' + error));
        this.googleLoginResolve = undefined;
        this.googleLoginReject = undefined;
      }
    }
  }

  // Método público para procesar respuesta de Google directamente
  public async processGoogleResponse(response: any): Promise<User> {
    return new Promise((resolve, reject) => {
      try {
        if (!response.credential) {
          throw new Error('No se recibió credential de Google');
        }

        // Decodificar el JWT token
        const payload = this.parseJwt(response.credential);
        console.log('📋 Payload decodificado:', payload);
        
        const user: User = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          loginMethod: 'google',
          isAdmin: this.checkIfAdmin(payload.email)
        };

        console.log('👤 Usuario creado:', user);
        this.setCurrentUser(user);
        resolve(user);
        
      } catch (error) {
        console.error('❌ Error procesando respuesta de Google:', error);
        reject(new Error('Error al procesar la respuesta de Google: ' + error));
      }
    });
  }



  // Autenticación con GitHub
  async loginWithGitHub(): Promise<User> {
    return new Promise((resolve, reject) => {
      const githubAuthUrl = `${GITHUB_CONFIG.AUTHORIZE_URL}?` +
        `client_id=${GITHUB_CONFIG.CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(GITHUB_CONFIG.REDIRECT_URI)}&` +
        `scope=${GITHUB_CONFIG.SCOPES.join(' ')}&` +
        `state=${Math.random().toString(36).substring(7)}`;

      const popup = window.open(githubAuthUrl, 'github-login', 'width=500,height=600');
      
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          reject(new Error('Login cancelado por el usuario'));
        }
      }, 1000);

      // Escuchar el mensaje del popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup?.close();
          
          const user: User = {
            id: event.data.user.id.toString(),
            email: event.data.user.email,
            name: event.data.user.name || event.data.user.login,
            username: event.data.user.login,
            picture: event.data.user.avatar_url,
            loginMethod: 'github',
            isAdmin: this.checkIfAdminGitHub(event.data.user.login)
          };
          
          this.setCurrentUser(user);
          resolve(user);
        } else if (event.data.type === 'GITHUB_AUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup?.close();
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageListener);
    });
  }

  // Autenticación con Web3/MetaMask
  async loginWithWeb3(): Promise<User> {
    if (!window.ethereum) {
      throw new Error('MetaMask no está instalado');
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No se obtuvieron cuentas');
      }

      const walletAddress = accounts[0];
      
      // Crear mensaje para firmar
      const message = `Iniciar sesión en MicroCréditos DApp\nDirección: ${walletAddress}\nTiempo: ${new Date().toISOString()}`;
      
      // Solicitar firma
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });

      const isAdmin = this.checkIfAdminWallet(walletAddress);
      
      const user: User = {
        id: walletAddress,
        walletAddress: walletAddress,
        loginMethod: 'web3',
        isAdmin: isAdmin
      };

      console.log('👤 Usuario Web3 creado:');
      console.log('- Dirección:', walletAddress);
      console.log('- Es admin:', isAdmin);
      console.log('- Usuario completo:', user);

      this.setCurrentUser(user);
      return user;
    } catch (error) {
      throw new Error('Error al conectar con MetaMask: ' + error);
    }
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // Obtener usuario actual
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  // Verificar si es admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.isAdmin || false;
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private parseJwt(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  private checkIfAdmin(email: string): boolean {
    // Lista de emails de administradores
    const adminEmails = [
      'admin@microcreditos.com',
      'victor@microcreditos.com',
      'ronaldinho@microcreditos.com'
      // Agrega más emails de admin aquí
    ];
    return adminEmails.includes(email);
  }

  private checkIfAdminWallet(address: string): boolean {
    // Usar las direcciones de admin de las constantes
    const adminWallets = APP_CONSTANTS.ADMIN_ADDRESSES.map(addr => addr.toLowerCase());
    const isAdmin = adminWallets.includes(address.toLowerCase());
    
    console.log('🔍 Verificando admin wallet:');
    console.log('- Dirección:', address);
    console.log('- Admin wallets:', adminWallets);
    console.log('- Es admin:', isAdmin);
    
    return isAdmin;
  }

  private checkIfAdminGitHub(username: string): boolean {
    // Lista de usernames de GitHub de administradores
    const adminGitHubUsers = [
      'tu-username-github',
      'admin-github-user'
      // Agrega más usernames de admin aquí
    ];
    return adminGitHubUsers.includes(username.toLowerCase());
  }
}