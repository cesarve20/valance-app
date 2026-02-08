// frontend/src/api/axios.ts
import axios from 'axios';

// Detectamos si estamos en tu PC o en la Nube automáticamente
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// --- INTERCEPTOR MÁGICO ---
// Antes de que salga cualquier petición, le pegamos el token
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