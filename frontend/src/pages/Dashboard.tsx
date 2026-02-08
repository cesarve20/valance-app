import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios'; 
import { 
  LayoutDashboard, Wallet, PieChart, LogOut, Plus, 
  ArrowDownLeft, ArrowUpRight, Calendar, Trash2, Pencil, 
  Menu, X, Sun, Moon, Coffee, Settings, Users, TrendingUp, TrendingDown 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import TransactionModal from '../components/TransactionModal';
import ExpenseChart from '../components/ExpenseChart';
import BudgetChart from '../components/BudgetChart';

// --- TIPOS ---
interface Category { id: number; name: string; icon: string; }
interface Transaction { id: number; amount: number; description: string; date: string; type: 'INCOME' | 'EXPENSE'; category?: Category; walletId: number; categoryId: number; }
interface Budget { id: number; amount: number; spent: number; category: Category; }
interface DashboardData { balance: number; income: number; expense: number; wallets: any[]; categories: any[]; transactions: Transaction[]; chartData: any[]; budgets: Budget[]; }

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<{ id: number, name: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- ESTADO DE FECHAS ---
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [financeData, setFinanceData] = useState<DashboardData>({
    balance: 0, income: 0, expense: 0, wallets: [], categories: [], transactions: [], chartData: [], budgets: []
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined);

  // --- Fetch con filtros ---
  const fetchDashboardData = async (userId: number, month: number, year: number) => {
    try {
      const response = await api.get(`/users/${userId}/dashboard`, {
        params: { month, year }
      });
      setFinanceData(response.data);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('valance_user');
    if (!storedUser) { navigate('/'); return; }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchDashboardData(parsedUser.id, selectedMonth, selectedYear);
  }, [navigate, selectedMonth, selectedYear]);

  const handleLogout = () => { localStorage.removeItem('valance_user'); navigate('/'); };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar movimiento?")) return;
    try { 
      await api.delete(`/users/transaction/${id}`); 
      if (user) fetchDashboardData(user.id, selectedMonth, selectedYear); 
    } catch (error) { alert("Error"); }
  };

  const handleEdit = (t: Transaction) => { setTransactionToEdit(t); setIsModalOpen(true); };
  const handleCreateNew = () => { setTransactionToEdit(undefined); setIsModalOpen(true); };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('cream');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun size={20} />;
    if (theme === 'dark') return <Moon size={20} />;
    return <Coffee size={20} />;
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // --- CÁLCULO DEL BALANCE MENSUAL ---
  const monthlyBalance = financeData.income - financeData.expense;
  const isPositive = monthlyBalance >= 0;

  return (
    <div className="flex h-screen bg-main text-tmain font-sans overflow-hidden transition-colors duration-300">
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
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
            <button onClick={() => { navigate('/dashboard'); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary rounded-xl font-medium transition-colors text-left">
              <LayoutDashboard size={20} /> <span>Panel Principal</span>
            </button>
            <button onClick={() => { navigate('/wallets'); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-tmuted hover:bg-main hover:text-tmain rounded-xl font-medium transition-colors text-left">
              <Wallet size={20} /> <span>Mis Billeteras</span>
            </button>
            <button onClick={() => { navigate('/budgets'); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-tmuted hover:bg-main hover:text-tmain rounded-xl font-medium transition-colors text-left">
              <PieChart size={20} /> <span>Presupuestos</span>
            </button>
            
            <button onClick={() => { navigate('/groups'); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-tmuted hover:bg-main hover:text-tmain rounded-xl font-medium transition-colors text-left">
              <Users size={20} /> <span>Grupos (Split)</span>
            </button>

            <button onClick={() => { navigate('/settings'); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-tmuted hover:bg-main hover:text-tmain rounded-xl font-medium transition-colors text-left">
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto relative w-full bg-main">
        <header className="bg-card/80 backdrop-blur-md shadow-sm p-4 md:p-6 flex flex-col md:flex-row justify-between items-center sticky top-0 z-20 gap-4">
          
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-tmain hover:bg-main rounded-lg">
                <Menu size={24} />
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Resumen</h2>
                <p className="text-tmuted text-xs md:text-sm hidden sm:block">Bienvenido, {user?.name}</p>
              </div>
            </div>

            {/* SELECTOR DE FECHA (MÓVIL) */}
            <div className="md:hidden flex items-center gap-2 bg-main rounded-lg p-1">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-tmain outline-none appearance-none pr-1"
                >
                  {monthNames.map((m, i) => <option key={i} value={i} className="bg-main text-tmain">{m}</option>)}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-tmuted outline-none appearance-none"
                >
                  <option value={2024} className="bg-main text-tmain">2024</option>
                  <option value={2025} className="bg-main text-tmain">2025</option>
                  <option value={2026} className="bg-main text-tmain">2026</option>
                </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-end">
            
            {/* SELECTOR DE FECHA (DESKTOP) */}
            <div className="hidden md:flex items-center bg-main rounded-xl p-1 px-3 border border-gray-200/20 shadow-sm transition-colors duration-300">
              <Calendar size={16} className="text-tmuted mr-2" />
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent font-bold text-tmain outline-none cursor-pointer appearance-none text-right mr-1"
              >
                {monthNames.map((m, i) => <option key={i} value={i} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{m}</option>)}
              </select>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-bold text-tmuted outline-none cursor-pointer appearance-none ml-1"
              >
                <option value={2024} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">2024</option>
                <option value={2025} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">2025</option>
                <option value={2026} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">2026</option>
              </select>
            </div>

            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-main text-tmain hover:bg-gray-200/50 transition-colors shadow-sm border border-gray-200/20"
              title="Cambiar Tema"
            >
              {getThemeIcon()}
            </button>

            <button 
              onClick={handleCreateNew} 
              className="bg-blue-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
            >
              <Plus size={20} className="text-white" /> 
              <span className="hidden sm:inline text-white">Nuevo</span>
            </button>
            
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-md flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 pb-24">
          
          {/* CARDS RESUMEN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            
            {/* 1. CARD BALANCE */}
            <div className="bg-card p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100/50 hover:shadow-md transition-all relative overflow-hidden">
              <div className={`absolute right-0 top-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 z-0 ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 md:mb-4">
                  <h3 className="text-tmuted font-medium text-xs md:text-sm uppercase tracking-wider">Balance ({monthNames[selectedMonth]})</h3>
                  <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                </div>
                <p className={`text-2xl md:text-3xl font-extrabold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}${monthlyBalance.toFixed(2)}
                </p>
                <p className="text-xs text-tmuted mt-1">
                   {isPositive ? 'Ahorro neto este mes 🎉' : 'Has gastado más de lo que ingresó ⚠️'}
                </p>
              </div>
            </div>

            {/* 2. CARD INGRESOS */}
            <div className="bg-card p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100/50">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <h3 className="text-tmuted font-medium text-xs md:text-sm uppercase tracking-wider">Ingresos ({monthNames[selectedMonth]})</h3>
                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><ArrowUpRight size={18} /></div>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-green-600">+${financeData.income.toFixed(2)}</p>
            </div>

            {/* 3. CARD GASTOS */}
            <div className="bg-card p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100/50">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <h3 className="text-tmuted font-medium text-xs md:text-sm uppercase tracking-wider">Gastos ({monthNames[selectedMonth]})</h3>
                <div className="p-2 bg-red-100 text-red-600 rounded-lg"><ArrowDownLeft size={18} /></div>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-red-600">-${financeData.expense.toFixed(2)}</p>
            </div>
          </div>

          {/* GRID: GRÁFICO DONA + LISTA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* GRÁFICO DONA (ExpenseChart) */}
            <div className="bg-card p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col min-h-[400px] md:min-h-auto">
               <ExpenseChart data={financeData.chartData} />
            </div>

            {/* LISTA DE MOVIMIENTOS */}
            <div className="lg:col-span-2 bg-card rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200/50 flex justify-between items-center">
                <h3 className="text-base md:text-lg font-bold text-tmain">Movimientos de {monthNames[selectedMonth]}</h3>
                <button 
                  onClick={() => navigate('/transactions')} 
                  className="text-xs md:text-sm text-primary font-medium hover:underline"
                >
                  Ver todo
                </button>
              </div>
              
              <div className="divide-y divide-gray-200/50">
                {financeData.transactions.length === 0 ? (
                  <div className="p-10 text-center text-tmuted flex flex-col items-center">
                    <Calendar size={48} className="mb-4 opacity-50" />
                    <p>No hay movimientos en este mes.</p>
                  </div>
                ) : (
                  financeData.transactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="p-4 md:p-5 flex items-center justify-between hover:bg-main/50 transition-colors group">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-xl shadow-sm 
                          ${t.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {t.type === 'INCOME' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-tmain text-sm md:text-base group-hover:text-primary transition-colors">
                            {t.description || "Sin descripción"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-tmuted">
                            <span className="bg-main px-2 py-0.5 rounded font-medium">{t.category?.name || "General"}</span>
                            <span className="hidden sm:inline">• {formatDate(t.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-4">
                        <p className={`font-bold text-sm md:text-lg ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'INCOME' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                        </p>
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(t)} className="p-1.5 md:p-2 text-tmuted hover:text-primary bg-main rounded-full transition-colors"><Pencil size={16} /></button>
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 md:p-2 text-tmuted hover:text-red-500 bg-main rounded-full transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* GRÁFICA DE PRESUPUESTOS */}
          {financeData.budgets.length > 0 && (
             <div className="mt-6">
                {/* --- CORRECCIÓN AQUÍ: budgets={financeData.budgets} --- */}
                <BudgetChart budgets={financeData.budgets} />
             </div>
          )}

        </div>
      </main>

      <TransactionModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        userId={user?.id || 0} wallets={financeData.wallets} categories={financeData.categories}
        onSuccess={() => user && fetchDashboardData(user.id, selectedMonth, selectedYear)} transactionToEdit={transactionToEdit}
      />
    </div>
  );
};

export default Dashboard;