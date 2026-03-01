import express from 'express';
import { 
  getUsers, 
  createUser, 
  loginUser, 
  getDashboardData, 
  createTransaction,
  deleteTransaction,
  updateTransaction,
  getWallets,
  createWallet,
  updateWallet,
  deleteWallet,
  getBudgets,
  createBudget,
  deleteBudget,
  updateBudget,
  createCategory,
  deleteCategory,
  getTransactions,
  updateUserProfile,
  forgotPassword,
  resetPassword, // <--- IMPORTACIÓN NUEVA
} from '../controllers/userController.js';
import { googleLogin } from '../controllers/authController.js';
import { getFinancialAdvice } from '../controllers/aiController.js';

const router = express.Router();

router.get('/', getUsers);
router.post('/', createUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);

// Dashboard & Transacciones
router.get('/:id/dashboard', getDashboardData);
router.post('/transaction', createTransaction);
router.delete('/transaction/:id', deleteTransaction);
router.put('/transaction/:id', updateTransaction);

// Billeteras
router.get('/:id/wallets', getWallets);
router.post('/wallet', createWallet);
router.put('/wallet/:id', updateWallet);
router.delete('/wallet/:id', deleteWallet);

// CATEGORÍAS
router.post('/category', createCategory);
router.delete('/category/:id', deleteCategory);

// Presupuestos
router.get('/:id/budgets', getBudgets);
router.post('/budget', createBudget);
router.delete('/budget/:id', deleteBudget);
router.put('/budget/:id', updateBudget);

// HISTORIAL (NUEVA RUTA)
router.get('/:id/transactions', getTransactions); // <--- NUEVA

// PERFIL DE USUARIO
router.put('/:id/profile', updateUserProfile); // <--- NUEVA RUTA PARA EDICIÓN
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:id/:token', resetPassword); // <--- NUEVA RUTA PARA RESETEO DE CONTRASEÑA

export default router;