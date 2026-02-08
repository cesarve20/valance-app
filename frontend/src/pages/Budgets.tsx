import { useEffect, useState } from 'react';
import api from '../api/axios'; // Reemplazo de axios
import { Plus, ArrowLeft, PieChart, AlertCircle, CheckCircle, Trash2, Pencil, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Budgets = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [user, setUser] = useState<{ id: number } | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [budgetData, setBudgetData] = useState({ categoryId: '', amount: '' });

  useEffect(() => {
    const storedUser = localStorage.getItem('valance_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchData(parsed.id);
    }
  }, []);

  const fetchData = async (userId: number) => {
    try {
      const resBudgets = await api.get(`/users/${userId}/budgets`);
      setBudgets(resBudgets.data);
      const resDash = await api.get(`/users/${userId}/dashboard`);
      setCategories(resDash.data.categories);
    } catch (error) { console.error(error); }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setBudgetData({ categoryId: '', amount: '' });
    setIsFormOpen(true);
  };

  const handleEdit = (budget: any) => {
    setEditingId(budget.id);
    setBudgetData({ categoryId: budget.categoryId, amount: budget.amount });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este límite?")) return;
    try {
      await api.delete(`/users/budget/${id}`);
      if (user) fetchData(user.id);
    } catch (error) { alert("Error al eliminar"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !budgetData.categoryId || !budgetData.amount) return;
    try {
      if (editingId) {
        await api.put(`/users/budget/${editingId}`, { ...budgetData, amount: Number(budgetData.amount) });
      } else {
        await api.post('/users/budget', { ...budgetData, userId: user.id });
      }
      setIsFormOpen(false);
      setBudgetData({ categoryId: '', amount: '' });
      setEditingId(null);
      fetchData(user.id);
    } catch (error) { alert("Error al guardar"); }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-red-600';
    if (percent >= 75) return 'bg-orange-500';
    return 'bg-blue-600'; 
  };

  // Clases comunes para inputs/selects en modo oscuro
  const inputClass = "w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 " +
                     "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 font-sans transition-colors duration-300">
      
      <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition text-gray-600 dark:text-gray-300">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Presupuestos</h1>
        </div>
        
        {!isFormOpen && (
          <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg dark:shadow-none">
            <Plus size={20} /> Nuevo Límite
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        
        {isFormOpen && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-8 animate-fade-in-down border-2 border-blue-100 dark:border-gray-700 transition-colors">
              <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                {editingId ? 'Editar Límite' : 'Definir Nuevo Límite'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-300 uppercase mb-1 block">Categoría</label>
                <select className={inputClass} value={budgetData.categoryId} onChange={e => setBudgetData({...budgetData, categoryId: e.target.value})} required>
                  <option value="">Selecciona...</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-40">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-300 uppercase mb-1 block">Límite ($)</label>
                <input type="number" placeholder="Ej: 50000" className={inputClass} value={budgetData.amount} onChange={e => setBudgetData({...budgetData, amount: e.target.value})} required />
              </div>
              <button className="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 flex justify-center items-center gap-2 shadow-md dark:shadow-none">
                <Save size={18} /> {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-6">
          {budgets.length === 0 && !isFormOpen && (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <PieChart size={48} className="mx-auto mb-4 opacity-50" />
              <p>No tienes límites definidos. ¡Crea uno para controlar tus gastos!</p>
            </div>
          )}

          {budgets.map((budget) => {
            const percent = Math.min((budget.spent / budget.amount) * 100, 100);
            const isExceeded = budget.spent > budget.amount;

            return (
              <div key={budget.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group relative transition-colors">
                
                {/* BOTONES DE ACCIÓN */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-800/80 p-1 rounded-lg backdrop-blur-sm">
                  <button onClick={() => handleEdit(budget)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors"><Pencil size={18} /></button>
                  <button onClick={() => handleDelete(budget.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>

                <div className="flex justify-between items-center mb-2 pr-16">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                      <PieChart size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white">{budget.category.name}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Límite: ${budget.amount}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isExceeded ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
                      ${budget.spent} <span className="text-gray-400 dark:text-gray-500 text-sm">/ ${budget.amount}</span>
                    </p>
                  </div>
                </div>

                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden relative">
                  <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(percent)}`} style={{ width: `${percent}%` }}></div>
                </div>

                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{percent.toFixed(0)}% Gastado</span>
                  {isExceeded ? (
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1"><AlertCircle size={12} /> Excedido</span>
                  ) : (
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle size={12} /> En orden</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Budgets;