// Identidade visual do PRÓPRIO produto BrandFlow
// DECISÃO: Usar uma paleta profissional e moderna para marketing
export const brand = {
  name: 'BrandFlow',
  tagline: 'Marketing operacional automático para restaurantes',
  
  colors: {
    primary: '#6366f1',      // Indigo moderno
    secondary: '#8b5cf6',    // Purple complementar
    accent: '#f59e0b',       // Amber para CTAs
    success: '#10b981',      // Green para estados positivos
    warning: '#f59e0b',      // Amber para avisos
    danger: '#ef4444',       // Red para erros
    dark: '#1e293b',         // Slate dark
    light: '#f8fafc',        // Slate light
  },
  
  fonts: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    display: ['Outfit', 'system-ui', 'sans-serif'],
  },
  
  social: {
    email: 'niraslab.dev@gmail.com',
    website: 'https://niraslab.dev',
  },
} as const;

export type Brand = typeof brand;