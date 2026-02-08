import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ BORRA LO QUE HAYA AQUÍ Y PEGA TU NUEVA CLAVE CON 'CTRL+V'
const MY_API_KEY = "AIzaSyBDp9JIjPTVluJ1QPpG0vhPobDdbQruiVg"; 

console.log(`🔑 Probando clave: ${MY_API_KEY.substring(0, 10)}... (Verifica que empiece con AIzaSy)`);

const genAI = new GoogleGenerativeAI(MY_API_KEY);

async function testSimple() {
  try {
    // Usamos el modelo más estándar para probar conexión
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Di la palabra: FUNCIONA");
    const response = await result.response;
    
    console.log(`\n✅ ¡ÉXITO! La IA respondió: "${response.text().trim()}"`);
    console.log("👉 Ahora ve al archivo .env y pega esta clave.");

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
  }
}

testSimple();