import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react'; // <--- AQUÍ ESTÁ EL ARREGLO: "import type"

// Definimos los tipos de temas disponibles
type Theme = 'light' | 'dark' | 'cream';

// Definimos qué datos va a compartir este contexto
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Creamos el contexto (inicialmente indefinido)
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// EL PROVEEDOR: Este componente envolverá a toda la App
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // 1. Intentamos leer el tema guardado en el navegador, si no hay, usamos 'light'
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('valance_theme');
    return (saved as Theme) || 'light';
  });

  // 2. Efecto mágico: Cada vez que cambia el 'theme', actualizamos el HTML y guardamos
  useEffect(() => {
    // Esto le pone el atributo data-theme="dark" al tag <html>
    document.documentElement.setAttribute('data-theme', theme);
    // Esto lo guarda en la memoria del navegador
    localStorage.setItem('valance_theme', theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// HOOK PERSONALIZADO: Para usar el tema fácil en cualquier lado
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  return context;
};