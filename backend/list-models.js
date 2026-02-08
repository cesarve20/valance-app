// backend/list-models.js
// No necesitamos importar nada raro, Node v24 ya trae 'fetch' nativo.

const API_KEY = "AIzaSyBDp9JIjPTVluJ1QPpG0vhPobDdbQruiVg"; // <--- Pega tu clave AIza...

async function verMenuDeModelos() {
  console.log("🔍 Consultando a Google qué modelos tienes disponibles...");
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("❌ Error:", data.error.message);
      return;
    }

    console.log("\n📋 --- MODELOS DISPONIBLES PARA TI ---");
    // Filtramos para mostrar solo los que sirven para generar texto (generateContent)
    const modelosUtiles = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
    
    modelosUtiles.forEach(m => {
      console.log(`✅ Nombre real: "${m.name.replace('models/', '')}"`);
    });
    
    console.log("\n👉 Copia uno de los nombres de arriba (ej: gemini-pro) y úsalo en tu código.");

  } catch (error) {
    console.error("Error de red:", error);
  }
}

verMenuDeModelos();