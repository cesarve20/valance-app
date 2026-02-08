// backend/db.js
import { PrismaClient } from '@prisma/client';

// Creamos una única instancia de Prisma para toda la app
const prisma = new PrismaClient();

export default prisma;