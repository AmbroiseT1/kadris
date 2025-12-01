import axios from 'axios';

// On utilise la variable d'environnement ou une valeur par défaut pour le dev local
// On utilise la variable d'environnement ou une valeur par défaut pour le dev local
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const api = axios.create({
    baseURL: API_URL,
});

// Intercepteur pour injecter le token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401 (Token expiré ou invalide)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                // On pourrait rediriger ici, mais c'est souvent mieux géré par le Context
                // window.location.href = '/login'; 
            }
        }
        return Promise.reject(error);
    }
);
