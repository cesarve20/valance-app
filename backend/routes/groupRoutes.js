// backend/routes/groupRoutes.js
import express from 'express';
import { 
    createGroup, getUserGroups, getGroupDetails, 
    addMember, createExpense, updateGroupExpense,
    deleteGroup // <--- AHORA SÍ LA IMPORTAMOS
} from '../controllers/groupController.js';

import { checkAuth } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// Rutas protegidas
router.route('/').post(checkAuth, createGroup);
router.route('/user/:userId').get(checkAuth, getUserGroups);
router.route('/detail/:groupId').get(checkAuth, getGroupDetails);
router.route('/member').post(checkAuth, addMember);
router.route('/expense').post(checkAuth, createExpense);
router.route('/expense/:id').put(checkAuth, updateGroupExpense);

// NUEVA RUTA PARA BORRAR
router.route('/:groupId').delete(checkAuth, deleteGroup);

export default router;