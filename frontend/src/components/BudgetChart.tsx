import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BudgetChartProps {
  budgets: any[];
}

const BudgetChart = ({ budgets }: BudgetChartProps) => {
  // Transformar datos para el gráfico
  const data = budgets.map((b) => ({
    name: b.category,
    gastado: b.spent,
    limite: b.limit,
    restante: b.limit - b.spent,
    color: b.spent > b.limit ? '#EF4444' : '#3B82F6' // Rojo si se pasa, Azul si no
  }));

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 text-sm bg-card rounded-2xl border border-gray-100/20">
        No hay presupuestos activos
      </div>
    );
  }

  return (
    <div className="w-full bg-card p-6 rounded-2xl shadow-sm border border-gray-100/20">
      <h3 className="font-bold text-lg mb-6 text-tmain">Progreso de Presupuestos</h3>
      
      {/* --- AQUÍ ESTÁ EL ARREGLO: Altura explícita --- */}
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" opacity={0.5} />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100} 
              tick={{ fill: '#6B7280', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
  cursor={{ fill: 'transparent' }}
  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
  // CORRECCIÓN AQUÍ: Cambiamos (value: number) por (value: any)
  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Monto']}
/>
            <Bar dataKey="gastado" name="Gastado" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
            {/* Barra de fondo (Límite) visual opcional */}
            <Bar dataKey="restante" stackId="a" fill="#F3F4F6" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BudgetChart;