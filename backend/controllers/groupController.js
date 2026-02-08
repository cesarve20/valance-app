import prisma from '../db.js';

// --- CREAR GRUPO ---
export const createGroup = async (req, res) => {
  const { name, icon, userId } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    const userName = user ? user.name : "Admin";

    const newGroup = await prisma.group.create({
      data: {
        name,
        icon: icon || "💸",
        ownerId: Number(userId),
        members: { create: [{ name: userName, userId: Number(userId) }] } 
      },
      include: { members: true }
    });
    res.json(newGroup);
  } catch (error) {
    res.status(500).json({ error: "Error creando grupo" });
  }
};

// --- OBTENER MIS GRUPOS ---
export const getUserGroups = async (req, res) => {
  const { userId } = req.params;
  try {
    const groups = await prisma.group.findMany({
      where: { ownerId: Number(userId) },
      include: {
        members: true,
        _count: { select: { expenses: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo grupos" });
  }
};

// --- OBTENER DETALLE ---
export const getGroupDetails = async (req, res) => {
  const { groupId } = req.params;
  const { month, year } = req.query; 

  try {
    const dateFilter = {};
    if (month !== undefined && year !== undefined) {
      const startDate = new Date(Number(year), Number(month), 1);
      const endDate = new Date(Number(year), Number(month) + 1, 0); 
      
      dateFilter.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const group = await prisma.group.findUnique({
      where: { id: Number(groupId) },
      include: {
        members: true,
        expenses: {
          where: dateFilter, 
          include: { 
            paidBy: true,
            splits: { include: { member: true } }
          },
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!group) return res.status(404).json({ error: "Grupo no encontrado" });
    res.json(group);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo detalle" });
  }
};

// --- AGREGAR MIEMBRO (POR EMAIL O NOMBRE) ---
export const addMember = async (req, res) => {
    const { groupId, email, name } = req.body;

    try {
        let memberName = name;
        let linkedUserId = null;

        if (email) {
            const userFound = await prisma.user.findUnique({ where: { email } });
            if (!userFound) {
                return res.status(404).json({ error: "Usuario no encontrado con ese email" });
            }
            memberName = userFound.name; 
            linkedUserId = userFound.id;
        }

        const newMember = await prisma.groupMember.create({
            data: {
                name: memberName || "Sin Nombre",
                userId: linkedUserId, 
                groupId: Number(groupId)
            }
        });
        res.json(newMember);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error agregando miembro" });
    }
};

// --- CREAR GASTO (CON OPCIÓN DE DIVISIÓN MANUAL) ---
export const createExpense = async (req, res) => {
  const { groupId, description, amount, paidById, memberIds, customSplits } = req.body;

  try {
    let splitsData = [];

    // CASO A: División Manual
    if (customSplits && customSplits.length > 0) {
        const totalSplit = customSplits.reduce((sum, s) => sum + Number(s.amount), 0);
        // Pequeño margen de error para decimales
        if (Math.abs(totalSplit - Number(amount)) > 1) { 
             return res.status(400).json({ error: "La suma de las divisiones no coincide con el total" });
        }
        splitsData = customSplits;
    } 
    // CASO B: División Automática
    else {
        let participants = memberIds;
        if (!participants || participants.length === 0) {
            const allMembers = await prisma.groupMember.findMany({ where: { groupId: Number(groupId) } });
            participants = allMembers.map(m => m.id);
        }
        
        const splitAmount = Number(amount) / participants.length;
        splitsData = participants.map(mId => ({
            memberId: Number(mId),
            amount: splitAmount
        }));
    }

    const newExpense = await prisma.groupExpense.create({
      data: {
        description,
        amount: Number(amount),
        groupId: Number(groupId),
        paidById: Number(paidById),
        splits: {
          create: splitsData.map(s => ({
            memberId: Number(s.memberId),
            amount: Number(s.amount)
          }))
        }
      },
      include: { paidBy: true, splits: true }
    });

    res.json(newExpense);
  } catch (error) {
    console.error("Error creando gasto:", error);
    res.status(500).json({ error: "Error creando gasto compartido" });
  }
};

// --- ACTUALIZAR GASTO ---
export const updateGroupExpense = async (req, res) => {
    const { id } = req.params; 
    const { description, amount, paidById, customSplits, memberIds } = req.body;

    try {
        const result = await prisma.$transaction(async (prisma) => {
            
            // 1. Borrar divisiones anteriores
            await prisma.expenseSplit.deleteMany({
                where: { groupExpenseId: Number(id) }
            });

            // 2. Calcular nuevas divisiones
            let splitsData = [];
            const totalAmount = Number(amount);

            if (customSplits && customSplits.length > 0) {
                 splitsData = customSplits;
            } else {
                 let participants = memberIds || [];
                 if (participants.length === 0) {
                      const expense = await prisma.groupExpense.findUnique({ where: { id: Number(id) } });
                      const allMembers = await prisma.groupMember.findMany({ where: { groupId: expense.groupId } });
                      participants = allMembers.map(m => m.id);
                 }
                 
                 const splitAmount = totalAmount / participants.length;
                 splitsData = participants.map(mId => ({
                      memberId: Number(mId),
                      amount: splitAmount
                 }));
            }

            // 3. Actualizar Gasto y crear nuevos Splits
            const updatedExpense = await prisma.groupExpense.update({
                where: { id: Number(id) },
                data: {
                    description,
                    amount: totalAmount,
                    paidById: Number(paidById),
                    splits: {
                        create: splitsData.map(s => ({
                            memberId: Number(s.memberId),
                            amount: Number(s.amount)
                        }))
                    }
                },
                include: { paidBy: true, splits: true }
            });

            return updatedExpense;
        });

        res.json(result);

    } catch (error) {
        console.error("Error actualizando gasto:", error);
        res.status(500).json({ error: "Error al editar el gasto" });
    }
};

// --- ELIMINAR GRUPO (Solo Owner) ---
// ESTA FUNCIÓN DEBE APARECER UNA SOLA VEZ AL FINAL
export const deleteGroup = async (req, res) => {
    const { groupId } = req.params;
    const userId = req.user.id; 

    try {
        const group = await prisma.group.findUnique({
            where: { id: Number(groupId) }
        });

        if (!group) return res.status(404).json({ error: "Grupo no encontrado" });

        // Solo el dueño puede borrarlo
        if (group.ownerId !== userId) {
            return res.status(403).json({ error: "Solo el administrador puede eliminar este grupo" });
        }

        // Borrado en cascada manual (Transaction)
        await prisma.$transaction(async (prisma) => {
            // 1. Buscar gastos del grupo
            const expenses = await prisma.groupExpense.findMany({
                where: { groupId: Number(groupId) },
                select: { id: true }
            });
            const expenseIds = expenses.map(e => e.id);

            // 2. Borrar los splits
            if (expenseIds.length > 0) {
                await prisma.expenseSplit.deleteMany({
                    where: { groupExpenseId: { in: expenseIds } }
                });
            }

            // 3. Borrar los Gastos
            await prisma.groupExpense.deleteMany({
                where: { groupId: Number(groupId) }
            });

            // 4. Borrar los Miembros
            await prisma.groupMember.deleteMany({
                where: { groupId: Number(groupId) }
            });

            // 5. Borrar el Grupo
            await prisma.group.delete({
                where: { id: Number(groupId) }
            });
        });

        res.json({ message: "Grupo eliminado correctamente" });

    } catch (error) {
        console.error("Error eliminando grupo:", error);
        res.status(500).json({ error: "Error al eliminar el grupo" });
    }
};