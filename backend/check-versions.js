import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ PEGA TU CLAVE AQUÍ (Asegúrate que no tenga espacios extra)
const API_KEY = "AIzaSyBDp9JIjPTVluJ1QPpG0vhPobDdbQruiVg"; 

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
  console.log("📡 Conectando con Google para ver versiones disponibles...");
  
  try {
    // Esta función pide la lista oficial de modelos habilitados para TU clave
    // NOTA: Usamos el manager de modelos directamente si la versión de la librería lo permite
    // Si esta función falla, es la clave.
    
    // Truco: Hacemos una petición vacía para forzar la autenticación
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Test"); 
    
    // Si llegamos aquí, la clave sirve y el modelo 1.5-flash existe
    console.log("✅ ¡CONFIRMADO! La versión 'gemini-1.5-flash' está activa y funcionando para tu clave.");
    
  } catch (error) {
    console.error("❌ Error de conexión:");
    console.error(error.message);

    if (error.message.includes("API_KEY_INVALID")) {
        console.log("\n💀 DIAGNÓSTICO: El problema NO es la versión. Es la CLAVE. Google la rechaza.");
    } else if (error.message.includes("404")) {
        console.log("\n🕵️ DIAGNÓSTICO: La clave sirve, pero la versión 'gemini-1.5-flash' no. Prueba con 'gemini-pro'.");
    }
  }
}

listModels();