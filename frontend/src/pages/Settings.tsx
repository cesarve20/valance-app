import { useEffect, useState } from 'react';
import api from '../api/axios'; 
import { ArrowLeft, User, Tag, Plus, Trash2, X, Pencil, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: number, name: string, email: string } | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  
  // --- ESTADOS PARA EDICIÓN DE PERFIL ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

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
      // Pre-llenamos el formulario con los datos actuales
      setProfileForm(prev => ({ ...prev, name: parsed.name, email: parsed.email }));
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

  // --- LÓGICA DE ACTUALIZACIÓN DE PERFIL ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    // Validación básica de contraseñas
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      return setProfileMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
    }

    try {
      if (!user) return;
      
      const payload: any = {
        name: profileForm.name,
        email: profileForm.email,
      };
      if (profileForm.password) payload.password = profileForm.password;

      // Llamada al Backend
      const res = await api.put(`/users/${user.id}/profile`, payload);

      // Actualizamos el estado local
      const updatedUser = { ...user, name: res.data.user.name, email: res.data.user.email };
      setUser(updatedUser);

      // Actualizamos LocalStorage (Manteniendo el token intacto)
      const storedUser = JSON.parse(localStorage.getItem('valance_user') || '{}');
      localStorage.setItem('valance_user', JSON.stringify({ ...storedUser, ...updatedUser }));

      // Limpieza y feedback UI
      setIsEditingProfile(false);
      setProfileForm(prev => ({ ...prev, password: '', confirmPassword: '' })); // Borramos las pass por seguridad
      setProfileMessage({ type: 'success', text: '¡Perfil actualizado correctamente!' });
      
      setTimeout(() => setProfileMessage(null), 3000);

    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.response?.data?.error || 'Error al actualizar el perfil.' });
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Mi Perfil</h2>
                <p className="text-sm text-tmuted">Información de tu cuenta</p>
              </div>
            </div>
            
            {/* Botón Editar/Cancelar Perfil */}
            {!isEditingProfile ? (
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 md:px-4 md:py-2 rounded-xl font-bold transition flex items-center gap-2"
              >
                <Pencil size={18} /> <span className="hidden md:inline">Editar</span>
              </button>
            ) : (
              <button 
                onClick={() => {
                  setIsEditingProfile(false);
                  setProfileForm(prev => ({ ...prev, name: user?.name || '', email: user?.email || '', password: '', confirmPassword: '' }));
                }}
                className="text-gray-500 hover:bg-gray-100 p-2 rounded-xl font-bold transition flex items-center gap-2"
              >
                <X size={20} /> <span className="hidden md:inline">Cancelar</span>
              </button>
            )}
          </div>
          
          {profileMessage && (
            <div className={`mb-6 p-3 rounded-lg text-sm font-bold text-center ${profileMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {profileMessage.text}
            </div>
          )}

          {/* VISTA DE LECTURA VS VISTA DE EDICIÓN */}
          {!isEditingProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div>
                <label className="text-xs font-bold text-tmuted uppercase">Nombre</label>
                <p className="text-lg font-medium p-2 border-b border-gray-200/20">{user?.name}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-tmuted uppercase">Email</label>
                <p className="text-lg font-medium p-2 border-b border-gray-200/20">{user?.email}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-tmuted uppercase">Contraseña</label>
                <p className="text-lg font-medium p-2 border-b border-gray-200/20">••••••••</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="animate-fade-in-down space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-tmuted uppercase mb-1 block">Nombre</label>
                  <input 
                    type="text" required
                    className="w-full p-3 rounded-lg bg-main border border-gray-200/30 outline-none focus:ring-2 focus:ring-blue-500 text-tmain"
                    value={profileForm.name}
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-tmuted uppercase mb-1 block">Email</label>
                  <input 
                    type="email" required
                    className="w-full p-3 rounded-lg bg-main border border-gray-200/30 outline-none focus:ring-2 focus:ring-blue-500 text-tmain"
                    value={profileForm.email}
                    onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                  />
                </div>
                
                {/* Opcional: Cambiar Contraseña */}
                <div className="md:col-span-2 pt-4 border-t border-gray-200/20">
                  <p className="text-sm font-bold mb-4 text-tmuted">Cambiar contraseña <span className="text-xs font-normal">(Opcional, déjalo en blanco si no quieres cambiarla)</span></p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <input 
                        type="password" placeholder="Nueva contraseña"
                        className="w-full p-3 rounded-lg bg-main border border-gray-200/30 outline-none focus:ring-2 focus:ring-blue-500 text-tmain"
                        value={profileForm.password}
                        onChange={e => setProfileForm({...profileForm, password: e.target.value})}
                      />
                    </div>
                    <div>
                      <input 
                        type="password" placeholder="Confirmar nueva contraseña"
                        className="w-full p-3 rounded-lg bg-main border border-gray-200/30 outline-none focus:ring-2 focus:ring-blue-500 text-tmain"
                        value={profileForm.confirmPassword}
                        onChange={e => setProfileForm({...profileForm, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200">
                  <Save size={20} /> Guardar Cambios
                </button>
              </div>
            </form>
          )}
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
            {/* Botón Nueva */}
            <button 
              onClick={() => setIsAddingCat(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus size={18} /> Nueva
            </button>
          </div>

          {/* Formulario Agregar */}
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