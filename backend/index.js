// backend/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import groupRoutes from './routes/groupRoutes.js';
// 1. IMPORTAR RUTAS Y CONTROLADORES
import userRoutes from './routes/userRoutes.js';
// ¡IMPORTANTE! Importamos el cerebro de la IA que creamos antes
import { categorizeTransactions } from './controllers/aiController.js';

// Cargar variables de entorno (.env)
dotenv.config();

// 2. INICIALIZAR LA APP (Esto debe ir antes de usar 'app')
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors()); // Permite que el Frontend se conecte
app.use(express.json()); // Permite recibir JSON (importante para los POST)
app.use('/api/groups', groupRoutes);

// --- Rutas ---

// Ruta de prueba básica
app.get('/', (req, res) => {
  res.json({ message: 'API de Valance funcionando 🚀' });
});

// 🤖 RUTA INTELIGENCIA ARTIFICIAL (Nueva)
// Ahora sí funciona porque 'app' ya existe y 'categorizeTransactions' está importado
app.post('/api/ai/categorize', categorizeTransactions);

// Conectar las rutas de Usuarios
app.use('/api/users', userRoutes);

// --- Arrancar Servidor ---
app.listen(PORT, () => {
  console.log(`✅ Servidor Valance corriendo en http://localhost:${PORT}`);
});