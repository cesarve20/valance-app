import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from '../db.js';

// Inicializar Gemini (si falla la clave aquí, no importa, lo manejamos abajo)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "no_key");

export const categorizeTransactions = async (req, res) => {
  const { descriptions, userId } = req.body;

  if (!descriptions || descriptions.length === 0) {
    return res.status(400).json({ error: "No hay descripciones" });
  }

  try {
    // 1. Obtener categorías del usuario
    const categories = await prisma.category.findMany({
      where: { userId: Number(userId) },
      select: { id: true, name: true }
    });

    if (categories.length === 0) {
      return res.status(400).json({ error: "No hay categorías" });
    }

    // --- INTENTO 1: USAR INTELIGENCIA ARTIFICIAL ---
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.length < 10) {
        throw new Error("Clave de API inválida o ausente");
      }

      const categoriesList = categories.map(c => `${c.id}:${c.name}`).join(", ");
      const inputDescriptions = descriptions.slice(0, 50).join(" | ");

      const prompt = `
        Eres un asistente contable experto en Argentina.
        Tengo estas categorías (ID:Nombre): [${categoriesList}]
        
        Clasifica estos gastos bancarios: "${inputDescriptions}"
        
        Reglas de contexto:
        - Farmacity, Dr. Ahorro, OSDE -> Salud
        - Coto, Carrefour, Jumbo, Chino -> Supermercado
        - Uber, Cabify, Axion, YPF -> Transporte
        - Rappi, PedidosYa, McDonald -> Comida/Delivery
        - Edesur, Metrogas, Personal, Fibertel -> Servicios
        
        IMPORTANTE: Responde SOLO con un array JSON de números (IDs) que correspondan al orden de los gastos.
        Ejemplo: [12, 5, 8, 12]
      `;

      // Usamos el modelo que confirmamos que tienes disponible
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Limpieza de la respuesta (por si la IA pone texto extra)
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const categoryIds = JSON.parse(cleanedText);

      console.log("🤖 ¡ÉXITO! Clasificación realizada con Gemini 2.0 Flash");
      return res.json({ categoryIds });

    } catch (aiError) {
      console.warn("⚠️ La IA falló (o clave inválida). Activando sistema de respaldo...", aiError.message);
      // NO devolvemos error. Pasamos al PLAN B automáticamente.
    }

    // --- INTENTO 2: SISTEMA DE REGLAS (FALLBACK / RESPALDO) ---
    // Si la IA falla, usamos este diccionario local para que el usuario no se quede trabado
    const categoryIds = descriptions.map(desc => {
      return fallbackCategorization(desc, categories);
    });

    console.log("✅ Clasificación realizada con Sistema de Reglas Local");
    res.json({ categoryIds });

  } catch (error) {
    console.error("❌ Error fatal en el controlador:", error);
    res.status(500).json({ error: "Error procesando categorías" });
  }
};

// --- EL CEREBRO DE RESPALDO (DICCIONARIO LOCAL) 🧠 ---
function fallbackCategorization(description, categories) {
  const desc = description.toLowerCase();
  
  // Helper para buscar ID
  const getCatId = (keywords) => {
    const found = categories.find(c => keywords.some(k => c.name.toLowerCase().includes(k)));
    return found ? found.id : 0;
  };

  // 1. Coincidencia exacta de nombre de categoría
  const match = categories.find(c => desc.includes(c.name.toLowerCase()));
  if (match) return match.id;

  // 2. Reglas manuales básicas
  if (desc.includes('farmacia') || desc.includes('farmacity') || desc.includes('osde') || desc.includes('swiss') || desc.includes('doctor')) return getCatId(['salud', 'farmacia']);
  
  if (desc.includes('coto') || desc.includes('carrefour') || desc.includes('jumbo') || desc.includes('dia%') || desc.includes('vea') || desc.includes('vital') || desc.includes('changomas') || desc.includes('super')) return getCatId(['supermercado', 'comida', 'alimentos']);
  
  if (desc.includes('uber') || desc.includes('cabify') || desc.includes('didi') || desc.includes('ypf') || desc.includes('shell') || desc.includes('axion') || desc.includes('peaje')) return getCatId(['transporte', 'auto', 'movilidad']);
  
  if (desc.includes('rappi') || desc.includes('pedidos') || desc.includes('mcdonald') || desc.includes('burger') || desc.includes('starbucks') || desc.includes('cafe') || desc.includes('mostaza') || desc.includes('tostado')) return getCatId(['salidas', 'delivery', 'comida', 'restaurantes']);
  
  if (desc.includes('zara') || desc.includes('nike') || desc.includes('adidas') || desc.includes('shopping') || desc.includes('prune') || desc.includes('sporting') || desc.includes('dexter') || desc.includes('moov')) return getCatId(['ropa', 'vestimenta', 'compras']);
  
  if (desc.includes('edesur') || desc.includes('edenor') || desc.includes('metrogas') || desc.includes('movistar') || desc.includes('personal') || desc.includes('claro') || desc.includes('fibertel') || desc.includes('telecentro') || desc.includes('flow')) return getCatId(['servicios', 'hogar', 'luz', 'gas']);

  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('youtube') || desc.includes('prime') || desc.includes('hbo') || desc.includes('steam')) return getCatId(['suscripciones', 'ocio']);

  return 0;
}

// ----------------------------------------------------------------------
// NUEVA: Asesor Financiero IA (Gemini)
// ----------------------------------------------------------------------
export const getFinancialAdvice = async (req, res) => {
  const { id } = req.params;
  const { month, year } = req.query;

  try {
    const userId = Number(id);

    // 1. Filtrar transacciones del mes
    const dateFilter = {};
    if (month !== undefined && year !== undefined) {
      const startDate = new Date(Number(year), Number(month), 1);
      const endDate = new Date(Number(year), Number(month) + 1, 0);
      dateFilter.date = { gte: startDate, lte: endDate };
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId, ...dateFilter },
      include: { category: true }
    });

    // 2. Calcular Ingresos y Gastos por Categoría
    let income = 0;
    let expense = 0;
    const expenseMap = {};

    transactions.forEach(t => {
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

    // Si no hay datos, no gastamos cuota de la API
    if (income === 0 && expense === 0) {
      return res.json({ advice: "Aún no tienes movimientos este mes. ¡Registra tus ingresos y gastos para que pueda darte consejos personalizados!" });
    }

    // 3. Preparar el Prompt Maestro para Gemini
    const prompt = `
      Actúa como un asesor financiero personal experto, empático y directo.
      Analiza los siguientes datos financieros mensuales del usuario:
      
      - Ingresos totales del mes: $${income}
      - Gastos totales del mes: $${expense}
      - Balance neto: $${income - expense}
      - Desglose de gastos por categoría: ${JSON.stringify(expenseMap)}

      Por favor, devuélveme una respuesta en formato Markdown con la siguiente estructura exacta:
      1. Un saludo motivador y un breve análisis de 2 líneas sobre cómo le fue este mes.
      2. **El Semáforo:** Dime si su nivel de gasto es Saludable (Verde), Precaución (Amarillo) o Peligro (Rojo).
      3. **Tus 3 Consejos:** Basado estrictamente en las categorías donde más gastó, dale 3 consejos prácticos y accionables para ahorrar dinero.
      4. **Meta de Ahorro:** Sugiere un monto o porcentaje exacto para intentar ahorrar el próximo mes.
    `;

    // 4. Llamar a Gemini (Usamos la misma versión 2.0-flash para consistencia)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const advice = response.text();

    // 5. Devolver el consejo al Frontend
    res.json({ advice });

  } catch (error) {
    console.error("❌ ERROR EN ASESOR IA:", error);
    res.status(500).json({ error: "Error al generar el consejo financiero" });
  }
};