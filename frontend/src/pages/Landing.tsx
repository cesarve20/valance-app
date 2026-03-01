import { useNavigate } from 'react-router-dom';
import { ArrowRight, PieChart, Users, Wallet } from 'lucide-react'; // <--- Corregido

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-800 font-sans">
      
{/* NAV */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        
        {/* CONTENEDOR DEL LOGO (Ajustado al cuadro rojo que dibujaste) */}
        <div className="flex items-center">
          <img 
              src="/valance-logo.png" 
              alt="Logo Valance" 
              className="h-10 md:h-14 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105 cursor-pointer" 
          />
        </div>

        {/* BOTONES */}
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="px-5 py-2 text-gray-600 font-medium hover:text-blue-600 transition hidden sm:block">Ingresar</button>
            <button onClick={() => navigate('/login')} className="px-5 py-2 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition transform hover:scale-105">Registrarse</button>
        </div>
      </nav>

      {/* HERO */}
      <header className="px-6 py-20 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
          Tus finanzas, <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">bajo control.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Valance es la herramienta definitiva para gestionar tus gastos personales, presupuestos y dividir cuentas con amigos. Simple, rápido y seguro.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <button onClick={() => navigate('/login')} className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg shadow-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 transform hover:-translate-y-1">
                Empezar Gratis <ArrowRight size={20} />
             </button>
             <button className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-bold text-lg shadow-sm hover:bg-gray-50 transition">
                Saber más
             </button>
        </div>
      </header>

      {/* FEATURES */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
                icon={<Wallet className="text-blue-500" size={32} />}
                title="Control de Billeteras"
                desc="Administra efectivo, cuentas bancarias y tarjetas en un solo lugar. Visualiza tu saldo real al instante."
            />
            <FeatureCard 
                icon={<PieChart className="text-cyan-500" size={32} />}
                title="Presupuestos Inteligentes"
                desc="Establece límites de gasto y recibe alertas visuales. Analiza a dónde se va tu dinero con gráficos claros."
            />
            <FeatureCard 
                icon={<Users className="text-indigo-500" size={32} />}
                title="Gastos Compartidos"
                desc="¿Cena con amigos o gastos de casa? Crea grupos, divide los gastos y liquida deudas fácilmente."
            />
        </div>
      </section>

      {/* FOOTER SIMPLE */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        <p>© 2026 Valance App. Desarrollado por César Vergara.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
);

export default Landing;