import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { Lock, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const { id, token } = useParams(); // Leemos el ID y Token de la URL
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('error');
      return setErrorMessage('Las contraseñas no coinciden.');
    }

    setStatus('loading');
    try {
      await api.post(`/users/reset-password/${id}/${token}`, { password });
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Error al restablecer contraseña.');
    }
  };

  return (
    <div className="min-h-screen bg-main text-tmain flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-card p-8 rounded-3xl shadow-xl border border-gray-200/20">
        
        {status === 'success' ? (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <CheckCircle size={64} className="text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">¡Contraseña Actualizada!</h2>
            <p className="text-tmuted mb-8">Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <button onClick={() => navigate('/login')} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">
              Ir al Login
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                <Lock size={32} />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-center mb-2">Nueva Contraseña</h2>
            <p className="text-center text-tmuted mb-8">Escribe una contraseña segura que puedas recordar.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-tmuted uppercase mb-1 block">Nueva Contraseña</label>
                <input 
                  type="password" required placeholder="••••••••"
                  className="w-full p-3 rounded-xl bg-main border border-gray-200/30 outline-none focus:ring-2 focus:ring-blue-500 text-tmain"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-tmuted uppercase mb-1 block">Confirmar Contraseña</label>
                <input 
                  type="password" required placeholder="••••••••"
                  className="w-full p-3 rounded-xl bg-main border border-gray-200/30 outline-none focus:ring-2 focus:ring-blue-500 text-tmain"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              {status === 'error' && <p className="text-red-500 text-sm text-center font-medium">{errorMessage}</p>}

              <button 
                type="submit" disabled={status === 'loading'}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
              >
                {status === 'loading' ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;