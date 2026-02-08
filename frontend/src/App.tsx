import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/AuthForm'; 
import Dashboard from './pages/Dashboard';
import Wallets from './pages/Wallets';
import Budgets from './pages/Budgets';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';
import Landing from './pages/Landing'; 

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* LA RUTA RAÍZ AHORA ES LA LANDING */}
        <Route path="/" element={<Landing />} />
        
        {/* LA RUTA DE LOGIN AHORA ES ESPECÍFICA */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas Protegidas (Dashboard, etc.) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wallets" element={<Wallets />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/groups" element={<Groups />} />
        
        {/* --- AQUÍ ESTABA EL ERROR --- */}
        {/* Agregamos '/detail' para que coincida con tu URL */}
        <Route path="/groups/detail/:id" element={<GroupDetail />} />
        
        <Route path="/settings" element={<Settings />} />
        <Route path="/transactions" element={<Transactions />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;