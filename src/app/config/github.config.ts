export const GITHUB_CONFIG = {
  // Reemplaza con tu GitHub Client ID
  CLIENT_ID: 'PEGA_AQUI_TU_GITHUB_CLIENT_ID',
  
  // URL de autorización de GitHub
  AUTHORIZE_URL: 'https://github.com/login/oauth/authorize',
  
  // Scopes que necesitamos
  SCOPES: ['user:email', 'read:user'],
  
  // URL de redirect (debe coincidir con la configurada en GitHub)
  REDIRECT_URI: 'http://localhost:4200/auth/github/callback'
};

// Instrucciones para obtener el GitHub Client ID:
// 1. Ve a https://github.com/settings/developers
// 2. Clic en "New OAuth App"
// 3. Application name: "MicroCreditos DApp"
// 4. Homepage URL: http://localhost:4200
// 5. Authorization callback URL: http://localhost:4200/auth/github/callback
// 6. Copia el Client ID y reemplázalo arriba