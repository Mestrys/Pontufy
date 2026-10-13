// Configuração central da landing page.
// A URL do sistema Pontufy (aplicação real, com login) é definida via
// variável de ambiente VITE_APP_URL no build.
export const APP_URL: string = import.meta.env.VITE_APP_URL ?? 'https://app.pontufy.com';

export const LOGIN_URL = `${APP_URL}/login`;

// Mesmo endereço de ajuda usado no app (Perfil → Ajuda e termos). A landing não
// tem backend: o contato abre o e-mail da pessoa em vez de um formulário.
export const CONTACT_EMAIL = 'ajuda@pontufy.com';
