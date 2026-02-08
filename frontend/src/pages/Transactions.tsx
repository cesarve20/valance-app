import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, ArrowRight, ArrowLeft as PrevIcon, 
  ArrowUpRight, ArrowDownLeft, Filter, Trash2, Pencil, Calendar 
} from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import ExcelImport from '../components/ExcelImport'; // 1. IMPORTAR COMPONENTE
import api from '../api/axios';

// Tipos
interface Category { id: number; name: string; }
interface Wallet { id: number; name: string; type: string; bank: string | null; currency: string; }
interface Transaction { id: number; amount: number; description: string; date: string; type: 'INCOME' | 'EXPENSE'; category?: Category; wallet?: Wallet; walletId: number; categoryId: number; }

const Transactions = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: number } | null>(null);
  
  // Datos
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados de Filtros
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, INCOME, EXPENSE
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modales y Datos Auxiliares
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined);
  const [auxData, setAuxData] = useState<{ wallets: Wallet[], categories: Category[] }>({ wallets: [], categories: [] });

  useEffect(() => {
    const stored = localStorage.getItem('valance_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      fetchTransactions(parsed.id, 1, search, typeFilter);
      fetchAuxData(parsed.id);
    }
  }, []);

  // Efecto "Debounce"
  useEffect(() => {
    if (!user) return;
    const delayDebounceFn = setTimeout(() => {
      setPage(1); 
      fetchTransactions(user.id, 1, search, typeFilter);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, typeFilter]);

  const fetchTransactions = async (userId: number, pageNum: number, searchText: string, type: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${userId}/transactions`, {
        params: { page: pageNum, search: searchText, type }
      });
      setTransactions(res.data.data);
      setTotalPages(res.data.totalPages);
      setPage(res.data.currentPage);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchAuxData = async (userId: number) => {
    try {
      const res = await api.get(`/users/${userId}/dashboard`);
      setAuxData({ wallets: res.data.wallets, categories: res.data.categories });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    try {
      await api.delete(`/users/transaction/${id}`);
      if (user) fetchTransactions(user.id, page, search, typeFilter);
    } catch (error) { alert("Error al eliminar"); }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && user) {
      fetchTransactions(user.id, newPage, search, typeFilter);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-main text-tmain font-sans p-4 md:p-8 transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-card rounded-full transition text-tmuted hover:text-primary">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Historial</h1>
        </div>
        
        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tmuted" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="pl-10 pr-4 py-2.5 rounded-xl bg-card border border-gray-200/20 outline-none focus:ring-2 focus:ring-primary w-full md:w-64 text-sm text-tmain placeholder-tmuted"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-tmuted" size={18} />
            <select 
              className="pl-10 pr-8 py-2.5 rounded-xl bg-card border border-gray-200/20 outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-sm w-full md:w-auto text-tmain"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">Todos</option>
              <option value="INCOME">Ingresos</option>
              <option value="EXPENSE">Gastos</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- 2. IMPORTADOR DE EXCEL (Integrado) --- */}
      <div className="max-w-6xl mx-auto mb-6">
        <ExcelImport 
          userId={user?.id || 0} 
          categories={auxData.categories} 
          wallets={auxData.wallets} // <--- AHORA PASAMOS LAS WALLETS REALES
          onSuccess={() => fetchTransactions(user?.id || 0, 1, search, typeFilter)} 
        />
      </div>

      {/* TABLA / LISTA */}
      <div className="max-w-6xl mx-auto bg-card rounded-2xl shadow-sm border border-gray-200/20 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-tmuted">Cargando movimientos...</div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center text-tmuted flex flex-col items-center">
            <Calendar size={48} className="mb-4 opacity-30" />
            <p className="text-lg">No se encontraron movimientos.</p>
            <p className="text-sm opacity-70">Intenta cambiar los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-main/50 text-tmuted text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-bold">Descripción</th>
                  <th className="p-4 font-bold hidden md:table-cell">Categoría</th>
                  <th className="p-4 font-bold hidden md:table-cell">Billetera</th>
                  <th className="p-4 font-bold">Fecha</th>
                  <th className="p-4 font-bold text-right">Monto</th>
                  <th className="p-4 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/20 text-sm">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-main/30 transition-colors group">
                    <td className="p-4 font-medium flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${t.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {t.type === 'INCOME' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                       </div>
                       <div className="flex flex-col">
                         <span>{t.description || "Sin descripción"}</span>
                         {/* En móvil mostramos categoría aquí abajo */}
                         <span className="md:hidden text-xs text-tmuted">{t.category?.name}</span>
                       </div>
                    </td>
                    <td className="p-4 text-tmuted hidden md:table-cell">{t.category?.name || "General"}</td>
                    <td className="p-4 text-tmuted hidden md:table-cell">
                        {/* Mostramos Banco y Nombre de la wallet */}
                        {t.wallet ? (
                            <span className="flex flex-col leading-tight">
                                <span className="font-bold text-xs">{t.wallet.bank !== 'OTRO' && t.wallet.bank ? t.wallet.bank : ''}</span>
                                <span>{t.wallet.name}</span>
                            </span>
                        ) : "-"}
                    </td>
                    <td className="p-4 text-tmuted whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className={`p-4 text-right font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => { setTransactionToEdit(t); setIsModalOpen(true); }}
                           className="p-1.5 text-blue-500 hover:bg-blue-50/50 rounded transition"
                         >
                           <Pencil size={16} />
                         </button>
                         <button 
                           onClick={() => handleDelete(t.id)}
                           className="p-1.5 text-red-500 hover:bg-red-50/50 rounded transition"
                         >
                           <Trash2 size={16} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200/20 flex items-center justify-between bg-main/30">
            <span className="text-sm text-tmuted">
              Página <b>{page}</b> de <b>{totalPages}</b>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePageChange(page - 1)} 
                disabled={page === 1}
                className="p-2 rounded-lg bg-card border border-gray-200/20 hover:bg-main disabled:opacity-50 disabled:cursor-not-allowed transition text-tmain"
              >
                <PrevIcon size={18} />
              </button>
              <button 
                onClick={() => handlePageChange(page + 1)} 
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-card border border-gray-200/20 hover:bg-main disabled:opacity-50 disabled:cursor-not-allowed transition text-tmain"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <TransactionModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        userId={user?.id || 0} 
        wallets={auxData.wallets} 
        categories={auxData.categories}
        onSuccess={() => user && fetchTransactions(user.id, page, search, typeFilter)} 
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
};

export default Transactions;