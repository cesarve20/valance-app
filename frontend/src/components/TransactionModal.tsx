import { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Save, Calendar, DollarSign, FileText, Tag, Wallet } from 'lucide-react';

interface Category { id: number; name: string; }
interface Wallet { id: number; name: string; currency: string; }
interface Transaction { id: number; amount: number; description: string; date: string; type: 'INCOME' | 'EXPENSE'; walletId: number; categoryId: number; }

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  wallets: Wallet[];
  categories: Category[];
  onSuccess: () => void;
  transactionToEdit?: Transaction;
}

const TransactionModal = ({ isOpen, onClose, userId, wallets, categories, onSuccess, transactionToEdit }: Props) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE',
    walletId: '',
    categoryId: ''
  });

  const [loading, setLoading] = useState(false);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        amount: String(transactionToEdit.amount),
        description: transactionToEdit.description || '',
        date: new Date(transactionToEdit.date).toISOString().split('T')[0],
        type: transactionToEdit.type,
        walletId: String(transactionToEdit.walletId),
        categoryId: String(transactionToEdit.categoryId)
      });
    } else {
      // Resetear si es nuevo
      setFormData({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'EXPENSE',
        walletId: '', // Resetear wallet
        categoryId: '' // Resetear categoria
      });
    }
  }, [transactionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        userId,
        amount: Number(formData.amount),
        description: formData.description,
        date: new Date(formData.date), // Convertir string a Date
        type: formData.type,
        walletId: Number(formData.walletId),
        categoryId: Number(formData.categoryId)
      };

      if (transactionToEdit) {
        // EDITAR
        await axios.put(`http://localhost:3000/api/users/transaction/${transactionToEdit.id}`, payload);
      } else {
        // CREAR
        await axios.post('http://localhost:3000/api/users/transaction', payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al guardar la transacción");
    } finally {
      setLoading(false);
    }
  };

  // Clases CSS compartidas para Inputs (MODO OSCURO READY)
  const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all " +
                     "bg-gray-50 border-gray-200 text-gray-900 " + 
                     "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";

  const labelClass = "block text-xs font-bold uppercase mb-1 text-gray-500 dark:text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {transactionToEdit ? 'Editar Movimiento' : 'Nuevo Movimiento'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition text-gray-500 dark:text-gray-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Toggle Tipo */}
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'EXPENSE' ? 'bg-white dark:bg-gray-600 text-red-500 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
            >
              Gasto
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'INCOME' ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setFormData({ ...formData, type: 'INCOME' })}
            >
              Ingreso
            </button>
          </div>

          {/* Monto */}
          <div>
            <label className={labelClass}>Monto</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className={inputClass}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                autoFocus={!transactionToEdit}
              />
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className={labelClass}>Fecha</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="date"
                className={inputClass} // input[type="date"] ya hereda estilos
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className={labelClass}>Descripción</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Ej: Supermercado, Netflix..."
                className={inputClass}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Categoría */}
            <div>
              <label className={labelClass}>Categoría</label>
              <div className="relative">
                <div className="absolute left-3 top-3.5 text-gray-400 pointer-events-none">
                    <Tag size={18} />
                </div>
                <select
                  className={`${inputClass} appearance-none cursor-pointer`}
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
                  <option value="" className="dark:bg-gray-800">Elegir...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="dark:bg-gray-800">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Billetera */}
            <div>
              <label className={labelClass}>Billetera</label>
              <div className="relative">
                <div className="absolute left-3 top-3.5 text-gray-400 pointer-events-none">
                    <Wallet size={18} />
                </div>
                <select
                  className={`${inputClass} appearance-none cursor-pointer`}
                  value={formData.walletId}
                  onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                  required
                >
                  <option value="" className="dark:bg-gray-800">Elegir...</option>
                  {wallets.map(wallet => (
                    <option key={wallet.id} value={wallet.id} className="dark:bg-gray-800">
                      {wallet.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Guardando...' : (
                <>
                  <Save size={20} />
                  {transactionToEdit ? 'Guardar Cambios' : 'Guardar Movimiento'}
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TransactionModal;