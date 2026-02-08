import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  ArrowLeft, Plus, Receipt, 
  UserPlus, AlertCircle, CheckCircle2,
  Pencil, X, Mail
} from 'lucide-react';

interface Member { id: number; name: string; userId?: number; }
interface Split { id: number; amount: number; memberId: number; member: Member; }
interface Expense { 
  id: number; description: string; amount: number; date: string; 
  paidBy: Member; splits: Split[]; 
}
interface GroupData { 
  id: number; name: string; icon: string; 
  members: Member[]; expenses: Expense[]; 
}

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupData | null>(null);
  
  // FECHAS
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // MODALES
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // FORMULARIO GASTO (CREAR / EDITAR)
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState<number>(0);
  const [splitType, setSplitType] = useState<'EQUAL' | 'FULL_REIMBURSE'>('EQUAL'); 

  // FORMULARIO MIEMBRO
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    fetchGroupData();
  }, [id, selectedMonth, selectedYear]); 

  const fetchGroupData = async () => {
    try {
      const res = await api.get(`/groups/detail/${id}`, {
        params: { month: selectedMonth, year: selectedYear }
      });
      setGroup(res.data);
      if (res.data.members.length > 0 && payerId === 0) setPayerId(res.data.members[0].id);
    } catch (error) {
      console.error("Error cargando grupo", error);
    }
  };

  const handleOpenCreate = () => {
      setEditingExpenseId(null);
      setDesc('');
      setAmount('');
      setSplitType('EQUAL');
      if (group && group.members.length > 0) setPayerId(group.members[0].id);
      setIsExpenseModalOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
      setEditingExpenseId(expense.id);
      setDesc(expense.description);
      setAmount(expense.amount.toString());
      setPayerId(expense.paidBy.id);
      
      const payerSplit = expense.splits.find(s => s.memberId === expense.paidBy.id);
      if (payerSplit && Number(payerSplit.amount) === 0) {
          setSplitType('FULL_REIMBURSE');
      } else {
          setSplitType('EQUAL');
      }
      
      setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !payerId) return;

    const totalAmount = Number(amount);
    let payload: any = {
        groupId: id,
        description: desc,
        amount: totalAmount,
        paidById: payerId,
    };

    if (splitType === 'FULL_REIMBURSE') {
        const debtors = group?.members.filter(m => m.id !== payerId) || [];
        if (debtors.length === 0) { alert("Necesitas más miembros"); return; }
        const amountPerPerson = totalAmount / debtors.length;
        
        payload.customSplits = group?.members.map(m => ({
            memberId: m.id,
            amount: m.id === payerId ? 0 : amountPerPerson 
        }));
    } else {
        payload.memberIds = [];
    }

    try {
      if (editingExpenseId) {
          await api.put(`/groups/expense/${editingExpenseId}`, payload);
      } else {
          await api.post('/groups/expense', payload);
      }
      
      setIsExpenseModalOpen(false);
      fetchGroupData();
    } catch (error) {
      alert("Error al guardar gasto");
    }
  };

  // ESTA FUNCIÓN AHORA SÍ SE USA
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName && !newMemberEmail) return;
    try {
      await api.post('/groups/member', {
        groupId: id,
        name: newMemberName,
        email: newMemberEmail || undefined 
      });
      setIsMemberModalOpen(false);
      setNewMemberName(''); setNewMemberEmail('');
      fetchGroupData();
    } catch (error: any) {
        alert(error.response?.data?.error || "Error agregando miembro");
    }
  };

  const handleSettleUp = () => {
     setEditingExpenseId(null);
     setDesc(`Liquidación ${monthNames[selectedMonth]}`);
     setAmount(outstandingBalance.toString()); 
     setSplitType('FULL_REIMBURSE');
     setIsExpenseModalOpen(true);
  };

  if (!group) return <div className="p-10 text-center text-tmuted">Cargando...</div>;

  const totalExpenses = group.expenses
    .filter(e => !e.description.toLowerCase().includes('liquidación'))
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  const totalReimbursed = group.expenses
    .filter(e => e.description.toLowerCase().includes('liquidación'))
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  const outstandingBalance = Math.max(0, totalExpenses - totalReimbursed);

  return (
    <div className="flex h-screen bg-main text-tmain font-sans overflow-hidden">
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full bg-main">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/groups')} className="p-2 bg-card hover:bg-gray-200/20 rounded-xl transition-colors text-tmuted hover:text-tmain">
              <ArrowLeft />
            </button>
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                {group.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-tmain">{group.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                 <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-transparent text-sm font-medium text-tmuted outline-none cursor-pointer hover:text-primary transition-colors"
                  >
                    {monthNames.map((m, i) => <option key={i} value={i} className="bg-main text-tmain">{m}</option>)}
                  </select>
                  <span className="text-tmuted text-sm">/</span>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-transparent text-sm font-medium text-tmuted outline-none cursor-pointer hover:text-primary transition-colors"
                  >
                    <option value={2024} className="bg-main text-tmain">2024</option>
                    <option value={2025} className="bg-main text-tmain">2025</option>
                    <option value={2026} className="bg-main text-tmain">2026</option>
                  </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button 
                onClick={() => setIsMemberModalOpen(true)}
                className="px-4 py-2 bg-card border border-gray-200/20 text-tmain rounded-xl font-medium hover:bg-gray-200/10 transition-colors flex items-center gap-2"
            >
                <UserPlus size={18}/> <span className="hidden sm:inline">Invitar</span>
            </button>
            <button 
                onClick={handleOpenCreate}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200/50 transition-all flex items-center gap-2 flex-1 md:flex-none justify-center"
            >
                <Plus size={20}/> Nuevo Gasto
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* IZQUIERDA: LISTA DE GASTOS */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xl flex items-center gap-2 text-tmain">
                        <Receipt size={20} className="text-primary"/> Historial de {monthNames[selectedMonth]}
                    </h3>
                </div>
                
                {group.expenses.length === 0 ? (
                    <div className="bg-card p-10 rounded-2xl border border-gray-100/20 text-center text-tmuted flex flex-col items-center">
                        <AlertCircle className="mb-2 opacity-50" />
                        <p>No hay gastos en {monthNames[selectedMonth]}.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {group.expenses.map(expense => (
                            <div key={expense.id} className="bg-card p-4 rounded-xl shadow-sm border border-gray-100/20 flex justify-between items-center group hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold text-xs border 
                                        ${expense.description.toLowerCase().includes('liquidación') ? 'bg-green-100 text-green-600 border-green-200' : 'bg-main text-tmuted border-gray-200/20'}`}>
                                        <span className="text-sm">{new Date(expense.date).getDate()}</span>
                                        <span className="text-[10px] uppercase">{new Date(expense.date).toLocaleString('default', { month: 'short' })}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-tmain text-lg">{expense.description}</p>
                                        <p className="text-xs text-tmuted">
                                            Pagó <span className="font-bold text-primary">{expense.paidBy.name}</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className={`font-bold text-lg ${expense.description.toLowerCase().includes('liquidación') ? 'text-green-600' : 'text-tmain'}`}>
                                            ${Number(expense.amount).toLocaleString('es-AR')}
                                        </p>
                                        <div className="flex flex-col items-end">
                                        {expense.splits.map(s => (
                                            <p key={s.id} className="text-[10px] text-tmuted">
                                            {s.member.name}: <span className={s.amount > 0 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                                                ${Number(s.amount).toLocaleString('es-AR')}
                                            </span>
                                            </p>
                                        ))}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleOpenEdit(expense)}
                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        title="Editar Gasto"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* DERECHA: RESUMEN Y MIEMBROS */}
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-blue-100 text-sm font-medium mb-1">Deuda Pendiente ({monthNames[selectedMonth]})</p>
                        <h2 className="text-4xl font-extrabold">${outstandingBalance.toLocaleString('es-AR')}</h2>
                        
                        {outstandingBalance === 0 ? (
                            <div className="mt-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                                <CheckCircle2 size={16} /> ¡Todo al día!
                            </div>
                        ) : (
                             <button 
                                onClick={handleSettleUp}
                                className="mt-4 w-full py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                             >
                                <CheckCircle2 size={16} /> Liquidar / Registrar Pago
                             </button>
                        )}
                    </div>
                    <Receipt className="absolute -right-4 -bottom-4 text-white opacity-10 w-32 h-32" />
                </div>

                <div className="bg-card p-5 rounded-2xl border border-gray-100/20">
                    <h3 className="font-bold mb-4 text-tmain">Miembros</h3>
                    <div className="space-y-3">
                        {group.members.map(member => (
                            <div key={member.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white ${member.userId ? 'bg-green-500' : 'bg-gray-400'}`}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-tmain">{member.name}</p>
                                        {member.userId && <p className="text-[10px] text-green-600 font-medium">Usuario Verificado</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* --- MODAL (CREAR / EDITAR) --- */}
        {isExpenseModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100/10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-tmain">
                            {editingExpenseId ? 'Editar Gasto' : 'Agregar Gasto / Pago'}
                        </h3>
                        <button onClick={() => setIsExpenseModalOpen(false)} className="text-tmuted hover:text-tmain">
                            <X size={20}/>
                        </button>
                    </div>

                    <form onSubmit={handleSaveExpense}>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-tmuted uppercase">Descripción</label>
                                <input autoFocus type="text" className="w-full p-3 bg-main text-tmain rounded-xl border border-gray-200/20 outline-none focus:ring-2 focus:ring-primary" placeholder="Ej: Supermercado o Liquidación" value={desc} onChange={e => setDesc(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-tmuted uppercase">Monto</label>
                                <input type="number" className="w-full p-3 bg-main text-tmain rounded-xl border border-gray-200/20 outline-none focus:ring-2 focus:ring-primary" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-tmuted uppercase">¿Quién paga?</label>
                                    <select 
                                        className="w-full p-3 bg-main text-tmain rounded-xl border border-gray-200/20 outline-none"
                                        value={payerId}
                                        onChange={e => setPayerId(Number(e.target.value))}
                                    >
                                        {group.members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-tmuted uppercase">Tipo</label>
                                    <select 
                                        className="w-full p-3 bg-main text-tmain rounded-xl border border-gray-200/20 outline-none"
                                        value={splitType}
                                        onChange={e => setSplitType(e.target.value as any)}
                                    >
                                        <option value="EQUAL">Gasto Compartido</option>
                                        <option value="FULL_REIMBURSE">Reembolso (Liquidar)</option>
                                    </select>
                                </div>
                            </div>
                            
                            {splitType === 'FULL_REIMBURSE' && (
                                <p className="text-xs text-blue-500 bg-blue-500/10 p-2 rounded-lg">
                                    ℹ️ Quien paga recupera el dinero. Resta de la deuda total.
                                </p>
                            )}

                        </div>
                        <div className="flex gap-3 mt-6">
                            <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 py-3 text-tmuted hover:bg-main rounded-xl font-medium">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200/50">
                                {editingExpenseId ? 'Guardar Cambios' : 'Crear Gasto'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- MODAL NUEVO MIEMBRO (AGREGADO) --- */}
        {isMemberModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100/10">
                    <h3 className="text-xl font-bold mb-4 text-tmain">Agregar Persona</h3>
                    <form onSubmit={handleAddMember}>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-tmuted uppercase">Opción 1: Email (Usuario Real)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-tmuted" size={18} />
                                    <input type="email" className="w-full pl-10 p-3 bg-main text-tmain rounded-xl border border-gray-200/20 outline-none focus:ring-2 focus:ring-primary" placeholder="correo@ejemplo.com" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="text-center text-xs text-tmuted font-bold">- O -</div>

                            <div>
                                <label className="text-xs font-bold text-tmuted uppercase">Opción 2: Nombre (Solo visual)</label>
                                <input type="text" className="w-full p-3 bg-main text-tmain rounded-xl border border-gray-200/20 outline-none focus:ring-2 focus:ring-primary" placeholder="Ej: Juan" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsMemberModalOpen(false)} className="flex-1 py-3 text-tmuted hover:bg-main rounded-xl font-medium">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200/50">Agregar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default GroupDetail;