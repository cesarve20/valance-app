// frontend/src/api/axios.ts
import axios from 'axios';

// ---------------------------------------------------------------------------
// 🌍 CONFIGURACIÓN DE URLS (Backend)
// ---------------------------------------------------------------------------
// Aquí definimos a dónde debe llamar el Frontend.
// Cambia la variable 'prodUrl' con el link que te dio Render.
// ---------------------------------------------------------------------------

const prodUrl = 'https://valance-api.onrender.com/api'; // <--- ¡PEGA AQUÍ TU URL DE RENDER! (Mantén el /api al final)
const localUrl = 'http://localhost:3000/api';

// MAGIA AUTOMÁTICA 🪄
// Si 'import.meta.env.PROD' es true (estamos en Vercel/Nube), usa la de Render.
// Si es false (estamos en tu PC), usa localhost.
const BASE_URL = import.meta.env.PROD ? prodUrl : localUrl;

console.log(`🔌 Conectando a: ${BASE_URL}`); // Para que veas en consola a dónde apunta

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// --- INTERCEPTOR MÁGICO ---
// Antes de que salga cualquier petición, le pegamos el token si existe
api.interceptors.request.use((config) => {
    const userStr = localStorage.getItem('valance_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        } catch (e) {
            console.error("Error parseando usuario", e);
        }
    }
    return config;
});

export default api;