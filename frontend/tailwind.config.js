/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Importante: Desactivamos el dark mode automático de tailwind para usar el nuestro manual
  darkMode: ['class', '[data-theme="dark"]'], 
  theme: {
    extend: {
      colors: {
        // Mapeamos nuestras clases a las variables CSS
        main: 'var(--bg-main)',
        card: 'var(--bg-card)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        
        // Texto
        tmain: 'var(--text-main)',
        tmuted: 'var(--text-muted)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in-down': 'fadeInDown 0.5s ease-out',
      },
      keyframes: {
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}