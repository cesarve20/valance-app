import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios'; // <--- CAMBIO IMPORTANTE: Usamos tu instancia configurada
import { 
  LayoutDashboard, Wallet, PieChart, Users, Settings, 
  LogOut, Plus, X, Menu, ArrowRight 
} from 'lucide-react';

interface Group {
  id: number;
  name: string;
  icon: string;
  _count?: { expenses: number };
  members: { name: string }[];
}

const Groups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('💸');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Usuario logueado
  const user = JSON.parse(localStorage.getItem('valance_user') || '{}');

  useEffect(() => {
    if (user.id) fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      // CORRECCIÓN DE RUTA: Agregamos '/user' para coincidir con el backend
      // Y usamos 'api' para que envíe el Token automáticamente
      const res = await api.get(`/groups/user/${user.id}`);
      setGroups(res.data);
    } catch (error) {
      console.error("Error cargando grupos", error);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    try {
      // Usamos 'api' en lugar de axios "crudo"
      await api.post('/groups', {
        name: newGroupName,
        icon: newGroupIcon,
        userId: user.id
      });
      setIsModalOpen(false);
      setNewGroupName('');
      fetchGroups(); 
    } catch (error) {
      alert("Error creando grupo");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('valance_user');
    navigate('/'); // Te manda a la Landing Page
  };

  return (
    <div className="flex h-screen bg-main text-tmain font-sans overflow-hidden transition-colors duration-300">
      
      {/* --- SIDEBAR --- */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-2xl transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:shadow-xl flex flex-col justify-between
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
        <div>
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-tmain">Valance</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-tmuted hover:text-tmain">
              <X size={24} />
            </button>
          </div>

          <nav className="mt-6 px-4 space-y-2">
            <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 text-tmuted hover:bg-main hover:text-tmain rounded-xl font-medium transition-colors text-left">
              <LayoutDashboard size={20} /> <span>Panel Principal</span>
            </button>
            <button onClick={() => navigate('/wallets')} className="w-full flex items-center gap-3 px-4 py-3 text-tmuted hover:bg-main hover:text-tmain rounded-xl font-medium transition-colors text-left">
              <Wallet size={20} /> <span>Mis Billeteras</span>
            </button>
            <button onClick={() => navigate('/budgets')} className="w-full flex items-center gap-3 px-4 py-3 text-tmuted hover:bg-main hover:text-tmain rounded-xl font-medium transition-colors text-left">
              <PieChart size={20} /> <span>Presupuestos</span>
            </button>
            
            {/* BOTÓN ACTIVO */}
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary rounded-xl font-medium transition-colors text-left">
              <Users size={20} /> <span>Grupos (Split)</span>
            </button>

            <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 px-4 py-3 text-tmuted hover:bg-main hover:text-tmain rounded-xl font-medium transition-colors text-left">
              <Settings size={20} /> <span>Configuración</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200/20">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50/10 rounded-xl font-medium transition-colors">
            <LogOut size={20} /> <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full bg-main">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-tmain hover:bg-main rounded-lg"><Menu /></button>
                <div>
                    <h2 className="text-2xl font-bold text-tmain">Gastos Compartidos</h2>
                    <p className="text-sm text-tmuted">Gestiona deudas y viajes con amigos</p>
                </div>
            </div>
            
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-95 w-full md:w-auto justify-center"
            >
                <Plus size={20} /> Nuevo Grupo
            </button>
        </header>

        {/* LISTA DE GRUPOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => (
                <div 
                    key={group.id} 
                    onClick={() => navigate(`/groups/detail/${group.id}`)}
                    className="bg-card p-6 rounded-2xl shadow-sm border border-gray-100/50 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                >
                    {/* Decoración de fondo */}
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl grayscale group-hover:scale-110 transition-transform duration-500">{group.icon}</div>
                    
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm">
                            {group.icon}
                        </div>
                        <h3 className="font-bold text-xl mb-1 text-tmain">{group.name}</h3>
                        <p className="text-sm text-tmuted mb-6 flex items-center gap-2">
                           <Users size={14} /> {group.members.length} miembros • {group._count?.expenses || 0} gastos
                        </p>
                        
                        <div className="flex justify-between items-end">
                            <div className="flex -space-x-3">
                                {group.members.slice(0, 3).map((m, i) => (
                                    <div key={i} className="w-9 h-9 rounded-full bg-main border-2 border-card flex items-center justify-center text-xs font-bold text-tmain shadow-sm" title={m.name}>
                                        {m.name.charAt(0).toUpperCase()}
                                    </div>
                                ))}
                                {group.members.length > 3 && (
                                    <div className="w-9 h-9 rounded-full bg-main border-2 border-card flex items-center justify-center text-xs text-tmuted font-medium shadow-sm">
                                        +{group.members.length - 3}
                                    </div>
                                )}
                            </div>
                            
                            <button className="p-2 bg-main hover:bg-primary/10 text-primary rounded-xl transition-colors">
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            
            {groups.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-main rounded-full flex items-center justify-center mb-4">
                        <Users size={32} className="text-tmuted opacity-50" />
                    </div>
                    <h3 className="text-lg font-bold text-tmain">No tienes grupos aún</h3>
                    <p className="text-tmuted max-w-xs mt-1">Crea un grupo para empezar a dividir gastos de casa, viajes o salidas.</p>
                </div>
            )}
        </div>
      </main>

      {/* --- MODAL CREAR GRUPO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100/20 animation-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-tmain">Nuevo Grupo</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-tmuted hover:text-tmain"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleCreateGroup}>
                    <div className="mb-5">
                        <label className="block text-sm font-medium mb-2 text-tmuted">Nombre del Grupo</label>
                        <div className="relative">
                            <input 
                                autoFocus
                                type="text" 
                                className="w-full pl-4 pr-4 py-3 rounded-xl bg-main border border-gray-200/20 text-tmain focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-400"
                                placeholder="Ej: Viaje a la Costa"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="mb-8">
                        <label className="block text-sm font-medium mb-3 text-tmuted">Icono</label>
                        <div className="flex gap-3 overflow-x-auto p-2 scrollbar-hide">
                            {['🏠','✈️','🍕','🍻','🎁','🚗','⚽','🏖️'].map(icon => (
                                <button 
                                    type="button" 
                                    key={icon} 
                                    onClick={() => setNewGroupIcon(icon)} 
                                    className={`w-12 h-12 rounded-xl text-2xl flex-shrink-0 flex items-center justify-center transition-all ${newGroupIcon === icon ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'bg-main hover:bg-gray-200/50'}`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-tmuted hover:bg-main rounded-xl font-medium transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200/50 transition-all active:scale-95">
                            Crear Grupo
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Groups;