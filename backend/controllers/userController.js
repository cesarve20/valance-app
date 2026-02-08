// backend/controllers/userController.js
import prisma from '../db.js';
import bcrypt from 'bcryptjs'; 
import jwt from 'jsonwebtoken'; // <--- 1. IMPORTANTE: Agregamos esta librería

// 1. Obtener usuarios
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// 2. Crear usuario (Registro con Moneda y Categorías)
export const createUser = async (req, res) => {
  console.log("🔵 INTENTANDO REGISTRAR USUARIO...");
  const { email, password, name, browser, currency } = req.body; 

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // INICIO DE TRANSACCIÓN
    const result = await prisma.$transaction(async (prisma) => {
      
      // A. Crear Usuario
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          browser,
        },
      });
      console.log("✅ Usuario creado ID:", user.id);

      // B. Crear Billetera (USANDO LA MONEDA ELEGIDA)
      await prisma.wallet.create({
        data: {
          name: "Efectivo",
          balance: 0,
          currency: currency || "ARS",
          userId: user.id
        }
      });
      console.log(`✅ Billetera creada con moneda: ${currency || "ARS"}`);

      // C. Crear Categorías
      const defaultCategories = [
        { name: "Sueldo", type: "INCOME", icon: "DollarSign" },
        { name: "Comida", type: "EXPENSE", icon: "Pizza" },
        { name: "Transporte", type: "EXPENSE", icon: "Car" },
        { name: "Servicios", type: "EXPENSE", icon: "Zap" },
        { name: "Ocio", type: "EXPENSE", icon: "Smile" },
      ];

      await prisma.category.createMany({
        data: defaultCategories.map(cat => ({ ...cat, userId: user.id }))
      });
      console.log("✅ Categorías creadas");

      return user;
    });

    const { password: _, ...userWithoutPassword } = result;
    res.status(201).json(userWithoutPassword);

  } catch (error) {
    console.error("❌ ERROR EN EL REGISTRO:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// 3. Login (AHORA CON SEGURIDAD JWT)
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Contraseña incorrecta' });

    // --- 2. GENERAMOS EL TOKEN SEGURO ---
    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET, // Usamos la variable de entorno
        { expiresIn: '1d' }
    );

    const { password: _, ...userData } = user;
    
    // Enviamos el token al frontend
    res.json({ 
        message: 'Login exitoso', 
        user: userData, 
        token: token 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// 4. Dashboard Data (CON FILTRO DE FECHA)
export const getDashboardData = async (req, res) => {
  const { id } = req.params;
  const { month, year } = req.query; // Recibimos mes y año por URL (ej: ?month=0&year=2026)

  try {
    const userId = Number(id);
    
    // Configurar el rango de fechas
    const dateFilter = {};
    if (month !== undefined && year !== undefined) {
      const startDate = new Date(Number(year), Number(month), 1);
      const endDate = new Date(Number(year), Number(month) + 1, 0); // Último día del mes
      
      // Aplicamos el filtro a la base de datos
      dateFilter.date = {
        gte: startDate,
        lte: endDate
      };
    }

    // A. Wallets (El saldo total SIEMPRE es histórico, no depende del mes)
    const wallets = await prisma.wallet.findMany({ where: { userId } });
    const totalBalance = wallets.reduce((acc, wallet) => acc + Number(wallet.balance), 0);

    // B. Categories
    const categories = await prisma.category.findMany({ where: { userId } });

    // C. Transactions (ESTAS SÍ SE FILTRAN POR FECHA)
    const filteredTransactions = await prisma.transaction.findMany({ 
      where: { 
        userId,
        ...dateFilter // <--- Aquí entra la magia
      },
      orderBy: { date: 'desc' },
      include: { category: true }
    });

    // D. Calcular Ingresos/Gastos del Mes seleccionado
    let income = 0;
    let expense = 0;
    const expenseMap = {};

    filteredTransactions.forEach(t => {
      const amount = Number(t.amount);
      if (t.type === 'INCOME') {
        income += amount;
      } else {
        expense += amount;
        const catName = t.category?.name || "Otros";
        if (!expenseMap[catName]) expenseMap[catName] = 0;
        expenseMap[catName] += amount;
      }
    });

    const chartData = Object.keys(expenseMap).map(name => ({
      name,
      value: expenseMap[name]
    }));

    // E. Presupuestos (Comparar gasto REAL del mes seleccionado vs Límite)
    const rawBudgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true }
    });

    const budgets = rawBudgets.map(budget => {
      // Calculamos cuánto se gastó en esta categoría DENTRO del rango de fechas filtrado
      const spentInPeriod = filteredTransactions
        .filter(t => t.categoryId === budget.categoryId && t.type === 'EXPENSE')
        .reduce((acc, t) => acc + Number(t.amount), 0);
        
      return { ...budget, amount: Number(budget.amount), spent: spentInPeriod };
    });

    res.json({ 
      balance: totalBalance, // Saldo global
      income,                // Ingresos del mes
      expense,               // Gastos del mes
      transactions: filteredTransactions, // Lista del mes
      wallets,
      categories,
      chartData,             // Gráfico del mes
      budgets                // Presupuestos del mes
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

// 5. Crear Transacción (Permitiendo duplicados legítimos)
export const createTransaction = async (req, res) => {
  const { amount, description, type, walletId, categoryId, userId, date } = req.body;

  try {
    const result = await prisma.$transaction(async (prisma) => {
      
      // A. Validar Billetera
      const walletCheck = await prisma.wallet.findUnique({ where: { id: Number(walletId) } });
      if (!walletCheck) throw new Error(`La billetera ID ${walletId} no existe.`);

      // B. Procesar Fecha
      const txDate = date ? new Date(date) : new Date();

      // C. CREAR DIRECTAMENTE (Sin check de duplicados)
      // Confiamos en que el usuario no subirá el mismo Excel dos veces seguidas.
      const newTransaction = await prisma.transaction.create({
        data: {
          amount: Number(amount),
          description: description || "Sin descripción",
          type, 
          date: txDate, 
          walletId: Number(walletId),
          categoryId: Number(categoryId),
          userId: Number(userId)
        }
      });

      // D. Actualizar Saldo
      if (type === 'INCOME') {
        await prisma.wallet.update({
          where: { id: Number(walletId) },
          data: { balance: { increment: Number(amount) } }
        });
      } else {
        await prisma.wallet.update({
          where: { id: Number(walletId) },
          data: { balance: { decrement: Number(amount) } }
        });
      }

      return newTransaction;
    });

    res.status(201).json(result);

  } catch (error) {
    console.error("❌ ERROR BACKEND:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// 6. NUEVA: Obtener todas las billeteras de un usuario
export const getWallets = async (req, res) => {
  const { id } = req.params;
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId: Number(id) }
    });
    res.json(wallets);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener billeteras' });
  }
};

// 7. NUEVA: Crear una nueva billetera
export const createWallet = async (req, res) => {
  const { name, balance, currency, userId, type, bank, creditLimit } = req.body; // <--- Agregamos nuevos campos
  try {
    const wallet = await prisma.wallet.create({
      data: {
        name,
        balance: Number(balance),
        currency,
        userId: Number(userId),
        type: type || 'DEBIT', // Default a Débito si no envían nada
        bank: bank || null,
        creditLimit: creditLimit ? Number(creditLimit) : 0
      }
    });
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear billetera' });
  }
};

// 8. NUEVA: Crear un Presupuesto
export const createBudget = async (req, res) => {
  const { amount, categoryId, userId } = req.body;
  try {
    const newBudget = await prisma.budget.create({
      data: {
        amount: Number(amount),
        categoryId: Number(categoryId),
        userId: Number(userId)
      }
    });
    res.status(201).json(newBudget);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear presupuesto' });
  }
};

// 9. NUEVA: Obtener Presupuestos con Progreso (¡Lógica Inteligente!)
export const getBudgets = async (req, res) => {
  const { id } = req.params;
  const userId = Number(id);

  try {
    // A. Traemos los presupuestos del usuario
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true } // Incluimos el nombre e icono de la categoría
    });

    // B. Calcular cuánto se gastó este mes en cada categoría
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // Día 1 del mes actual

    // Recorremos cada presupuesto y calculamos su gasto real
    const budgetsWithProgress = await Promise.all(budgets.map(async (budget) => {
      
      // Sumamos las transacciones de ESTA categoría en ESTE mes
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: 'EXPENSE', // Solo gastos
          date: { gte: firstDayOfMonth } // Desde el día 1 en adelante
        }
      });

      const spent = transactions.reduce((acc, t) => acc + Number(t.amount), 0);

      return {
        ...budget,
        amount: Number(budget.amount),
        spent // Agregamos el campo "gastado"
      };
    }));

    res.json(budgetsWithProgress);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener presupuestos' });
  }
};

// 10. NUEVA: Borrar Transacción (y devolver el dinero)
export const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Buscamos la transacción original para saber cuánto valía
      const transaction = await prisma.transaction.findUnique({
        where: { id: Number(id) }
      });

      if (!transaction) throw new Error("Transacción no encontrada");

      // 2. Devolvemos el dinero a la billetera (Inverso a lo que se hizo)
      if (transaction.type === 'EXPENSE') {
        // Era gasto, así que devolvemos la plata (Incrementamos)
        await prisma.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: Number(transaction.amount) } }
        });
      } else {
        // Era ingreso, así que quitamos la plata (Decrementamos)
        await prisma.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { decrement: Number(transaction.amount) } }
        });
      }

      // 3. Borramos el registro
      await prisma.transaction.delete({
        where: { id: Number(id) }
      });

      return { message: "Eliminado correctamente" };
    });

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar transacción' });
  }
};

// 11. NUEVA: Borrar Presupuesto
export const deleteBudget = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.budget.delete({
      where: { id: Number(id) }
    });
    res.json({ message: "Presupuesto eliminado" });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar presupuesto' });
  }
};

// 12. NUEVA: Editar Transacción (Update)
export const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { amount, description, type, walletId, categoryId } = req.body;

  try {
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Buscar la transacción ORIGINAL (la vieja)
      const oldTransaction = await prisma.transaction.findUnique({
        where: { id: Number(id) }
      });

      if (!oldTransaction) throw new Error("Transacción no encontrada");

      // 2. REVERTIR el saldo en la billetera vieja
      // (Si era gasto, devolvemos la plata. Si era ingreso, la quitamos).
      if (oldTransaction.type === 'EXPENSE') {
        await prisma.wallet.update({
          where: { id: oldTransaction.walletId },
          data: { balance: { increment: Number(oldTransaction.amount) } }
        });
      } else {
        await prisma.wallet.update({
          where: { id: oldTransaction.walletId },
          data: { balance: { decrement: Number(oldTransaction.amount) } }
        });
      }

      // 3. ACTUALIZAR los datos de la transacción
      const updatedTransaction = await prisma.transaction.update({
        where: { id: Number(id) },
        data: {
          amount: Number(amount),
          description,
          type,
          walletId: Number(walletId),
          categoryId: Number(categoryId)
        }
      });

      // 4. APLICAR el nuevo saldo en la billetera nueva (o la misma)
      if (type === 'EXPENSE') {
        await prisma.wallet.update({
          where: { id: Number(walletId) },
          data: { balance: { decrement: Number(amount) } }
        });
      } else {
        await prisma.wallet.update({
          where: { id: Number(walletId) },
          data: { balance: { increment: Number(amount) } }
        });
      }

      return updatedTransaction;
    });

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar transacción' });
  }
};

// 13. NUEVA: Actualizar Billetera
export const updateWallet = async (req, res) => {
  const { id } = req.params;
  const { name, balance, currency, type, bank, creditLimit } = req.body; // <--- Agregamos nuevos campos
  try {
    const wallet = await prisma.wallet.update({
      where: { id: Number(id) },
      data: { 
        name, 
        balance: Number(balance), 
        currency,
        type, 
        bank, 
        creditLimit: creditLimit ? Number(creditLimit) : 0
      }
    });
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar billetera' });
  }
};

// 14. NUEVA: Eliminar Billetera (¡Cuidado! Borra sus transacciones también)
export const deleteWallet = async (req, res) => {
  const { id } = req.params;
  try {
    // Usamos una transacción para limpiar todo ordenadamente
    await prisma.$transaction(async (prisma) => {
      // 1. Primero borramos las transacciones asociadas a esa billetera
      // (Si no hacemos esto, la base de datos daría error por seguridad)
      await prisma.transaction.deleteMany({
        where: { walletId: Number(id) }
      });
      
      // 2. Ahora sí borramos la billetera
      await prisma.wallet.delete({
        where: { id: Number(id) }
      });
    });
    
    res.json({ message: "Billetera eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar billetera' });
  }
};

// 15. NUEVA: Actualizar Presupuesto
export const updateBudget = async (req, res) => {
  const { id } = req.params;
  const { amount, categoryId } = req.body;
  try {
    const updated = await prisma.budget.update({
      where: { id: Number(id) },
      data: { 
        amount: Number(amount),
        categoryId: Number(categoryId)
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar presupuesto' });
  }
};

// 16. NUEVA: Crear Categoría Personalizada
export const createCategory = async (req, res) => {
  const { name, icon, type, userId } = req.body; // icon será un emoji (ej: "🍔")
  try {
    const newCategory = await prisma.category.create({
      data: {
        name,
        icon: icon || "🏷️", // Emoji por defecto
        type: type || "EXPENSE",
        userId: Number(userId)
      }
    });
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

// 17. NUEVA: Eliminar Categoría
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    // Verificar si se usa en transacciones
    const count = await prisma.transaction.count({
      where: { categoryId: Number(id) }
    });

    if (count > 0) {
      return res.status(400).json({ error: "No puedes borrar una categoría que ya tiene movimientos." });
    }

    await prisma.category.delete({
      where: { id: Number(id) }
    });
    res.json({ message: "Categoría eliminada" });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};

// 18. NUEVA: Obtener Transacciones con Buscador y Paginación
export const getTransactions = async (req, res) => {
  const { id } = req.params;
  const { page = 1, search = "", type = "ALL" } = req.query; // Recibimos página, búsqueda y tipo
  
  const limit = 10; // Elementos por página
  const skip = (Number(page) - 1) * limit;
  const userId = Number(id);

  try {
    // Construimos el filtro dinámico
    const whereClause = {
      userId,
      // Filtro de búsqueda (busca en descripción O en nombre de categoría)
      OR: [
        { description: { contains: search } }, 
        { category: { name: { contains: search } } }
      ]
    };

    // Si el usuario filtra por tipo (INCOME/EXPENSE)
    if (type !== "ALL") {
      whereClause.type = type;
    }

    // 1. Obtener los datos paginados
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      orderBy: { date: 'desc' },
      include: { category: true, wallet: true } // Incluimos wallet para saber de dónde salió la plata
    });

    // 2. Contar el total para saber cuántas páginas hay
    const totalCount = await prisma.transaction.count({ where: whereClause });

    res.json({
      data: transactions,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
};