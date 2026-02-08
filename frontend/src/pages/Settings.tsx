import { useEffect, useState } from 'react';
import api from '../api/axios'; // Reemplazo de axios
import { ArrowLeft, User, Tag, Plus, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: number, name: string, email: string } | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Estado para nueva categoría
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', icon: '🏷️' });

  // Lista de emojis sugeridos
  const emojis = ["🍔", "🛒", "🚗", "🏠", "💊", "🎮", "✈️", "🐶", "🎓", "💻", "🎁", "🍺", "🏋️", "🎬", "🍕", "☕", "👶", "🔧"];

  useEffect(() => {
    const storedUser = localStorage.getItem('valance_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchCategories(parsed.id);
    }
  }, []);

  const fetchCategories = async (userId: number) => {
    try {
      const res = await api.get(`/users/${userId}/dashboard`);
      setCategories(res.data.categories);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCat.name) return;
    try {
      await api.post('/users/category', {
        ...newCat,
        userId: user.id,
        type: 'EXPENSE'
      });
      setIsAddingCat(false);
      setNewCat({ name: '', icon: '🏷️' });
      fetchCategories(user.id);
    } catch (error) {
      alert("Error al crear categoría");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("¿Borrar categoría? Solo se puede si no tiene gastos asociados.")) return;
    try {
      await api.delete(`/users/category/${id}`);
      if (user) fetchCategories(user.id);
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al eliminar");
    }
  };

  return (
    <div className="min-h-screen bg-main text-tmain font-sans p-8 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 max-w-4xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-card rounded-full transition text-tmuted hover:text-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold">Configuración</h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* SECCIÓN 1: PERFIL */}
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-gray-200/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Mi Perfil</h2>
              <p className="text-sm text-tmuted">Información de tu cuenta</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-tmuted uppercase">Nombre</label>
              <p className="text-lg font-medium p-2 border-b border-gray-200/20">{user?.name}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-tmuted uppercase">Email</label>
              <p className="text-lg font-medium p-2 border-b border-gray-200/20">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: CATEGORÍAS */}
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-gray-200/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <Tag size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Mis Categorías</h2>
                <p className="text-sm text-tmuted">Personaliza cómo organizas tus gastos</p>
              </div>
            </div>
            {/* Botón Nueva (Color Fijo Branding) */}
            <button 
              onClick={() => setIsAddingCat(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus size={18} /> Nueva
            </button>
          </div>

          {/* Formulario Agregar (Visible solo al dar click) */}
          {isAddingCat && (
            <form onSubmit={handleAddCategory} className="mb-8 bg-main p-4 rounded-xl border border-dashed border-gray-400/30 animate-fade-in-down flex flex-col md:flex-row gap-4 items-end">
               <div className="w-full md:w-auto">
                <label className="text-xs font-bold text-tmuted uppercase mb-1 block">Icono</label>
                <select 
                  className="w-full p-3 rounded-lg bg-card border border-gray-200/20 outline-none text-2xl text-tmain cursor-pointer"
                  value={newCat.icon}
                  onChange={e => setNewCat({...newCat, icon: e.target.value})}
                >
                  {emojis.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-tmuted uppercase mb-1 block">Nombre</label>
                <input 
                  type="text" placeholder="Ej: Streaming, Gym..." 
                  className="w-full p-3 rounded-lg bg-card border border-gray-200/20 outline-none focus:ring-2 focus:ring-blue-500 text-tmain placeholder-gray-400"
                  value={newCat.name}
                  onChange={e => setNewCat({...newCat, name: e.target.value})}
                  autoFocus
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button type="submit" className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 flex-1 transition">Guardar</button>
                <button type="button" onClick={() => setIsAddingCat(false)} className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition">
                  <X size={20} />
                </button>
              </div>
            </form>
          )}

          {/* Lista de Categorías (Grid) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="group relative p-4 rounded-xl border border-gray-200/20 bg-main hover:bg-card hover:shadow-md transition-all flex flex-col items-center gap-2 text-center cursor-default">
                <span className="text-4xl mb-1 filter drop-shadow-sm">{cat.icon || "🏷️"}</span>
                <span className="font-bold text-sm text-tmain truncate w-full">{cat.name}</span>
                
                {/* Botón borrar (Solo visible al hover) */}
                <button 
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="absolute top-1 right-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  title="Eliminar categoría"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Settings;