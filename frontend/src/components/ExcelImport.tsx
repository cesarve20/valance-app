import { useRef, useState, useEffect } from 'react';
import readXlsxFile from 'read-excel-file';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, Check, X, Loader2, CreditCard, Wallet, AlertTriangle, Sparkles } from 'lucide-react';
// 1. CAMBIO: Importamos nuestra instancia configurada de axios
import api from '../api/axios'; 

interface Category { id: number; name: string; }
interface Wallet { id: number; name: string; type: string; bank: string | null; currency: string; }

interface ImportedRow {
  Date: Date;
  Description: string;
  Amount: number;
  Currency: 'ARS' | 'USD';
  matchId?: number;
}

interface Props {
  userId: number;
  categories: Category[];
  wallets: Wallet[];
  onSuccess: () => void;
}

const ExcelImport = ({ userId, categories, wallets, onSuccess }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewData, setPreviewData] = useState<ImportedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); 
  
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [isCreditCardMode, setIsCreditCardMode] = useState(false);

  useEffect(() => {
    if (selectedWalletId) {
      const wallet = wallets.find(w => w.id === Number(selectedWalletId));
      if (wallet && wallet.type === 'CREDIT') setIsCreditCardMode(true);
      else setIsCreditCardMode(false);
    }
  }, [selectedWalletId, wallets]);

  const cleanText = (str: any): string => {
    if (!str) return "Sin descripción";
    return String(str).replace(/\0/g, '').trim();
  };

  const cleanNumber = (val: any): number => {
    if (!val) return 0;
    let str = String(val).trim();
    if (str === '' || str === 'null' || str === 'undefined') return 0;
    str = str.replace(/[^\d.,-]/g, '');
    if (str.includes(',')) {
      str = str.replace(/\./g, '');
      str = str.replace(',', '.'); 
    } 
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const findCategoryMatch = (description: string): number => {
    const desc = description.toLowerCase();
    const match = categories.find(cat => desc.includes(cat.name.toLowerCase()));
    if (match) return match.id;
    return 0; 
  };

  const processRows = (rows: any[]) => {
    let headerRowIndex = -1;
    let headers: string[] = [];

    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const rowStr = rows[i].map((c: any) => String(c).toLowerCase()).join(' ');
      if (rowStr.includes('fecha') && (rowStr.includes('establecimiento') || rowStr.includes('concepto') || rowStr.includes('descrip'))) {
        headerRowIndex = i;
        headers = rows[i].map((h: any) => String(h).toLowerCase().trim());
        break;
      }
    }

    if (headerRowIndex === -1) { alert("No encontré la cabecera."); return; }

    const dateIdx = headers.findIndex(h => h.includes('fecha'));
    const descIdx = headers.findIndex(h => h.includes('establecimiento') || h.includes('concepto') || h.includes('descrip'));
    const amountArsIdx = headers.findIndex(h => h.includes('importe en $') || h === 'importe' || h === 'monto' || h === 'pesos');
    const amountUsdIdx = headers.findIndex(h => h.includes('importe en u$s') || h.includes('dolares') || h.includes('usd'));

    const mappedData: ImportedRow[] = [];

    rows.slice(headerRowIndex + 1).forEach((row: any) => {
      if (!row[dateIdx]) return;
      const rawDate = row[dateIdx];
      const description = cleanText(row[descIdx]);
      if (!description) return;

      let finalDate = new Date();
      if (rawDate instanceof Date) finalDate = rawDate;
      else if (typeof rawDate === 'string') {
        const parts = rawDate.split(/[-/]/);
        if (parts.length === 3) finalDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        else finalDate = new Date(rawDate);
      }
      
      if (isNaN(finalDate.getTime())) return;

      if (amountArsIdx !== -1 && row[amountArsIdx]) {
        const val = cleanNumber(row[amountArsIdx]);
        if (val !== 0) mappedData.push({ Date: finalDate, Description: description, Amount: val, Currency: 'ARS', matchId: findCategoryMatch(description) });
      }
      if (amountUsdIdx !== -1 && row[amountUsdIdx]) {
        const val = cleanNumber(row[amountUsdIdx]);
        if (val !== 0) mappedData.push({ Date: finalDate, Description: description + " (USD)", Amount: val, Currency: 'USD', matchId: findCategoryMatch(description) });
      }
    });

    setPreviewData(mappedData);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv';
    const isXlsx = file.name.endsWith('.xlsx');

    if (isCsv) {
        Papa.parse(file, { complete: (results) => { if (results.data?.length) processRows(results.data); }, error: () => alert("Error CSV") });
    } else if (isXlsx) {
        try { const rows = await readXlsxFile(file); processRows(rows); } catch (err) { alert("Error Excel"); }
    } else {
        Papa.parse(file, { complete: (results) => { if (results.data?.length > 5) processRows(results.data); else alert("Formato inválido"); }});
    }
  };

  // --- FUNCIÓN MAGICA DE IA (CORREGIDA) ---
  const handleAICategorization = async () => {
    if (previewData.length === 0) return;
    setIsAnalyzing(true);
    
    try {
      const descriptions = previewData.map(row => row.Description);
      
      // 2. CAMBIO: Usamos api.post con ruta relativa
      const res = await api.post('/ai/categorize', {
        descriptions,
        userId
      });

      const { categoryIds } = res.data;

      const newData = previewData.map((row, index) => ({
        ...row,
        matchId: categoryIds[index] || row.matchId 
      }));

      setPreviewData(newData);
      alert("✨ ¡Análisis completado! La IA ha categorizado tus gastos.");

    } catch (error) {
      console.error(error);
      alert("Error al conectar con la IA. Verifica tu conexión.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedWalletId) { alert("⚠️ Selecciona una billetera."); return; }
    
    setIsUploading(true);
    const fallbackCategory = categories.find(c => ['varios', 'general', 'otros'].includes(c.name.toLowerCase()));
    const fallbackId = fallbackCategory ? fallbackCategory.id : (categories[0]?.id || 0);

    try {
      let importedCount = 0;
      for (const row of previewData) {
        const type = isCreditCardMode ? (row.Amount > 0 ? 'EXPENSE' : 'INCOME') : (row.Amount < 0 ? 'EXPENSE' : 'INCOME');
        const amount = Math.abs(row.Amount);
        const categoryId = (row.matchId && row.matchId !== 0) ? row.matchId : fallbackId;

        // 3. CAMBIO: Usamos api.post con ruta relativa
        await api.post('/users/transaction', {
          amount, description: row.Description, date: row.Date, type, categoryId, walletId: Number(selectedWalletId), userId
        });
        importedCount++;
      }
      
      alert(`¡Éxito! Importados: ${importedCount}`);
      setPreviewData([]);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
      onSuccess(); 
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally { setIsUploading(false); }
  };

  const cardClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
  const textClass = "text-gray-800 dark:text-white";
  const mutedClass = "text-gray-500 dark:text-gray-400";
  const inputClass = "w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="mb-6 animate-fade-in-down">
      {!previewData.length ? (
        <div className={`p-6 rounded-2xl shadow-sm border ${cardClass}`}>
          {/* ... (Todo el UI sigue igual) ... */}
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet className="text-green-600" size={24} />
            <h3 className={`font-bold text-lg ${textClass}`}>Importar Movimientos</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`text-xs font-bold uppercase mb-1 block ${mutedClass}`}>Destino</label>
              <div className="relative">
                <select className={inputClass} value={selectedWalletId} onChange={(e) => setSelectedWalletId(e.target.value)}>
                  <option value="">Selecciona billetera...</option>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>)}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-gray-400"><Wallet size={18} /></div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 h-full">
                <div className={`p-2 rounded-lg transition-colors ${isCreditCardMode ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                    <CreditCard size={20} />
                </div>
                <div className="flex flex-col flex-1">
                    <span className={`text-sm font-bold ${textClass}`}>Modo Tarjeta</span>
                    <span className="text-xs text-gray-400">Positivo = Gasto</span>
                </div>
                <input type="checkbox" checked={isCreditCardMode} onChange={(e) => setIsCreditCardMode(e.target.checked)} className="w-5 h-5 accent-purple-600" />
            </div>
          </div>
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-all">
            <Upload size={32} className="mb-2" />
            <p className="font-bold">Subir Excel / CSV</p>
            <input type="file" accept=".xlsx, .xls, .csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          </div>
        </div>
      ) : (
        <div className={`p-6 rounded-2xl shadow-lg border ${cardClass}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`font-bold text-xl ${textClass}`}>Vista Previa ({previewData.length})</h3>
            <div className="flex gap-2">
                {/* BOTÓN MÁGICO DE IA */}
                <button 
                    onClick={handleAICategorization}
                    disabled={isAnalyzing}
                    className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 flex items-center gap-2 shadow-lg shadow-purple-200 dark:shadow-none disabled:opacity-50"
                >
                    {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {isAnalyzing ? 'Analizando...' : 'Categorizar con IA'}
                </button>
                <button onClick={() => { setPreviewData([]); setSelectedWalletId(""); }} className="text-red-500 hover:bg-red-50 p-2 rounded-xl"><X size={24} /></button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto mb-6 border border-gray-200 dark:border-gray-700 rounded-xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 sticky top-0 z-10">
                <tr><th className="p-3">Fecha</th><th className="p-3">Concepto</th><th className="p-3">Monto</th><th className="p-3">Cat.</th></tr>
              </thead>
              <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${textClass}`}>
                {previewData.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className={`p-3 whitespace-nowrap text-xs ${mutedClass}`}>{row.Date.toLocaleDateString()}</td>
                        <td className="p-3 truncate max-w-[200px]">{row.Description}</td>
                        <td className="p-3 font-bold">${Math.abs(row.Amount).toLocaleString('es-AR')}</td>
                        <td className="p-3">
                        {row.matchId ? (
                            <span className="text-green-600 font-bold text-xs flex gap-1"><Check size={12}/> {categories.find(c => c.id === row.matchId)?.name}</span>
                        ) : <span className="text-orange-400 text-xs flex gap-1"><AlertTriangle size={12}/> Varios</span>}
                        </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3">
             <button onClick={() => setPreviewData([])} className={`px-6 py-3 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700 ${textClass}`}>Cancelar</button>
             <button onClick={handleSave} disabled={isUploading || isAnalyzing} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />} Importar
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelImport;