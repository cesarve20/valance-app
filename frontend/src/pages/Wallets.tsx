import { useEffect, useState } from 'react';
import api from '../api/axios'; // Reemplazo de axios
import { Plus, ArrowLeft, Trash2, Pencil, Save, X, CreditCard, Building2, Coins, Bitcoin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Diccionario de colores por Banco (Puedes agregar más)
const bankColors: any = {
  BBVA: 'bg-blue-900',
  GALICIA: 'bg-orange-600',
  SANTANDER: 'bg-red-600',
  MERCADOPAGO: 'bg-blue-500',
  LEMON: 'bg-green-400',
  BRUBANK: 'bg-purple-600',
  EFECTIVO: 'bg-green-700',
  CRYPTO: 'bg-gray-800',
  OTRO: 'bg-gray-500'
};

const Wallets = () => {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<any[]>([]);
  const [user, setUser] = useState<{ id: number } | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estado ampliado
  const [walletData, setWalletData] = useState({ 
    name: '', 
    currency: 'ARS', 
    balance: '',
    type: 'DEBIT', // 'DEBIT', 'CREDIT', 'CASH', 'CRYPTO'
    bank: 'OTRO',  // 'BBVA', 'GALICIA', etc.
    creditLimit: '' 
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('valance_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchWallets(parsed.id);
    }
  }, []);

  const fetchWallets = async (userId: number) => {
    try {
      const res = await api.get(`/users/${userId}/wallets`);
      setWallets(res.data);
    } catch (error) { console.error(error); }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setWalletData({ name: '', currency: 'ARS', balance: '', type: 'DEBIT', bank: 'OTRO', creditLimit: '' });
    setIsFormOpen(true);
  };

  const handleEdit = (wallet: any) => {
    setEditingId(wallet.id);
    setWalletData({ 
      name: wallet.name, 
      currency: wallet.currency, 
      balance: wallet.balance,
      type: wallet.type || 'DEBIT',
      bank: wallet.bank || 'OTRO',
      creditLimit: wallet.creditLimit || ''
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Borrar esta billetera y sus movimientos?")) return;
    try {
      await api.delete(`/users/wallet/${id}`);
      if (user) fetchWallets(user.id);
    } catch (error) { alert("Error al eliminar"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const payload = {
        ...walletData,
        balance: Number(walletData.balance),
        creditLimit: walletData.type === 'CREDIT' ? Number(walletData.creditLimit) : 0
      };

      if (editingId) {
        await api.put(`/users/wallet/${editingId}`, payload);
      } else {
        await api.post('/users/wallet', { ...payload, userId: user.id });
      }
      
      setIsFormOpen(false);
      setEditingId(null);
      fetchWallets(user.id);
    } catch (error) { alert("Error al guardar"); }
  };

  const getIcon = (type: string) => {
    if (type === 'CASH') return <Coins className="text-white/80" size={32} />;
    if (type === 'CRYPTO') return <Bitcoin className="text-white/80" size={32} />;
    if (type === 'CREDIT') return <CreditCard className="text-white/80" size={32} />;
    return <Building2 className="text-white/80" size={32} />;
  };

  // Clases CSS compartidas para Inputs y Selects (MODO OSCURO FIX)
  const inputClass = "w-full p-3 border rounded-xl bg-gray-50 outline-none font-medium focus:ring-2 focus:ring-blue-500 transition-colors " +
                     "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 font-sans transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition text-gray-600 dark:text-gray-300">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Mis Billeteras</h1>
        </div>
        {!isFormOpen && (
          <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none">
            <Plus size={20} /> Nueva
          </button>
        )}
      </div>

      <div className="max-w-5xl mx-auto">
        {/* FORMULARIO */}
        {isFormOpen && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl mb-8 animate-fade-in-down border-2 border-blue-100 dark:border-gray-700 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 dark:text-white text-xl">{editingId ? 'Editar Billetera' : 'Nueva Billetera'}</h3>
              <button onClick={() => setIsFormOpen(false)}><X size={24} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Tipo de Cuenta */}
              <div className="col-span-full md:col-span-1">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-300 uppercase block mb-1">Tipo</label>
                <select className={inputClass} 
                  value={walletData.type} onChange={e => setWalletData({...walletData, type: e.target.value})}>
                  <option value="DEBIT">Cuenta Bancaria / Débito</option>
                  <option value="CREDIT">Tarjeta de Crédito</option>
                  <option value="CASH">Efectivo</option>
                  <option value="CRYPTO">Criptomonedas</option>
                </select>
              </div>

              {/* Institución / Banco */}
              {(walletData.type !== 'CASH') && (
                 <div className="col-span-full md:col-span-1">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-300 uppercase block mb-1">Institución</label>
                  <select className={inputClass} 
                    value={walletData.bank} onChange={e => setWalletData({...walletData, bank: e.target.value})}>
                    <option value="OTRO">Otro / Genérico</option>
                    <option value="BBVA">BBVA Francés</option>
                    <option value="GALICIA">Banco Galicia</option>
                    <option value="SANTANDER">Santander</option>
                    <option value="MERCADOPAGO">Mercado Pago</option>
                    <option value="BRUBANK">Brubank</option>
                    <option value="LEMON">Lemon Cash</option>
                  </select>
                </div>
              )}

              {/* Nombre */}
              <div className="col-span-full md:col-span-1">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-300 uppercase block mb-1">Nombre (Alias)</label>
                <input type="text" placeholder="Ej: Visa Black, Ahorros..." className={inputClass}
                  value={walletData.name} onChange={e => setWalletData({...walletData, name: e.target.value})} required />
              </div>

              {/* Moneda */}
              <div>
                <label className="text-xs font-bold text-gray-400 dark:text-gray-300 uppercase block mb-1">Moneda</label>
                <select className={inputClass} 
                  value={walletData.currency} onChange={e => setWalletData({...walletData, currency: e.target.value})}>
                  <option value="ARS">🇦🇷 ARS (Pesos)</option>
                  <option value="USD">🇺🇸 USD (Dólares)</option>
                  <option value="EUR">🇪🇺 EUR (Euros)</option>
                  <option value="USDT">🪙 USDT (Cripto)</option>
                </select>
              </div>

              {/* Saldo Actual */}
              <div>
                <label className="text-xs font-bold text-gray-400 dark:text-gray-300 uppercase block mb-1">Saldo Actual</label>
                <input type="number" placeholder="0.00" className={inputClass}
                  value={walletData.balance} onChange={e => setWalletData({...walletData, balance: e.target.value})} />
              </div>

              {/* Límite de Crédito (Solo si es TC) */}
              {walletData.type === 'CREDIT' && (
                <div>
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-300 uppercase block mb-1">Límite de Crédito</label>
                  <input type="number" placeholder="Ej: 500000" className={inputClass + " text-red-600 dark:text-red-400"}
                    value={walletData.creditLimit} onChange={e => setWalletData({...walletData, creditLimit: e.target.value})} />
                </div>
              )}

              <div className="col-span-full mt-2">
                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex justify-center gap-2 shadow-lg dark:shadow-none transition-transform active:scale-[0.98]">
                  <Save size={20} /> Guardar Billetera
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LISTA DE TARJETAS (ESTILO CARDS REALES) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet) => {
            // Determinar color de fondo
            let bgColor = bankColors[wallet.bank] || bankColors['OTRO'];
            if (wallet.type === 'CASH') bgColor = bankColors['EFECTIVO'];

            return (
              <div key={wallet.id} className={`${bgColor} p-6 rounded-2xl shadow-xl dark:shadow-none text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 h-52 flex flex-col justify-between border border-white/10`}>
                
                {/* Patrón de fondo decorativo */}
                <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute left-0 bottom-0 w-32 h-32 bg-white/5 rounded-full -ml-10 -mb-10 pointer-events-none"></div>

                {/* Header Card */}
                <div className="flex justify-between items-start relative z-10">
                   <div className="flex items-center gap-2 opacity-90">
                      {getIcon(wallet.type)}
                      <span className="font-medium text-sm tracking-wider uppercase">{wallet.bank === 'OTRO' ? 'Cartera' : wallet.bank}</span>
                   </div>
                   
                   {/* Acciones (Editar/Borrar) */}
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 p-1 rounded-lg backdrop-blur-sm">
                      <button onClick={() => handleEdit(wallet)} className="p-1.5 hover:text-blue-300"><Pencil size={16}/></button>
                      <button onClick={() => handleDelete(wallet.id)} className="p-1.5 hover:text-red-300"><Trash2 size={16}/></button>
                   </div>
                </div>

                {/* Saldo y Nombre */}
                <div className="relative z-10">
                   <p className="text-white/60 text-xs uppercase mb-1">{wallet.name}</p>
                   <p className="text-3xl font-bold tracking-tight">
                     {wallet.currency === 'USD' ? 'US$ ' : '$ '} 
                     {Number(wallet.balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                   </p>
                </div>

                {/* Footer Card (Límite o Info) */}
                <div className="relative z-10 border-t border-white/20 pt-3 flex justify-between items-center text-xs text-white/70">
                   <span>
                      {wallet.type === 'CREDIT' 
                        ? `Límite: $${Number(wallet.creditLimit).toLocaleString('es-AR')}` 
                        : wallet.type === 'DEBIT' ? 'Cuenta Débito' : 'Efectivo'}
                   </span>
                   <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-[10px]">{wallet.currency}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Wallets;