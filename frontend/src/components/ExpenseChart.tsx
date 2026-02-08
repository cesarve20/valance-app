import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

interface ExpenseChartProps {
  data: any[];
}

const ExpenseChart = ({ data }: ExpenseChartProps) => {
  // Si no hay datos, mostramos un mensaje bonito
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400 text-sm">
        No hay gastos para mostrar
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px]"> {/* <--- AQUÍ ESTÁ EL ARREGLO (min-h) */}
      <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Gastos por Categoría</h3>
      
      {/* Contenedor con altura explícita para evitar el error de Recharts */}
      <div style={{ width: '100%', height: 300 }}> 
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => ( // Usamos _ para ignorar la variable no usada
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
                formatter={(value: any) => `$${Number(value).toLocaleString('es-AR')}`}
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseChart;