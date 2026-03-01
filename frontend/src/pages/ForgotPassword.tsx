import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/users/forgot-password', { email });
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Error al enviar el correo.');
    }
  };

  return (
    <div className="min-h-screen bg-main text-tmain flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-card p-8 rounded-3xl shadow-xl border border-gray-200/20">
        <button onClick={() => navigate('/login')} className="flex items-center text-sm text-tmuted hover:text-blue-600 transition mb-6">
          <ArrowLeft size={16} className="mr-2" /> Volver al Login
        </button>

        <h2 className="text-3xl font-extrabold text-center mb-2">Recuperar Acceso</h2>
        <p className="text-center text-tmuted mb-8">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>

        {status === 'success' ? (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <CheckCircle size={64} className="text-green-500 mb-4" />
            <p className="text-lg font-bold text-green-700 mb-2">¡Correo enviado!</p>
            <p className="text-tmuted mb-6">Revisa tu bandeja de entrada o la carpeta de spam.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-tmuted uppercase mb-1 block">Correo Electrónico</label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-3.5 text-gray-400" />
                <input 
                  type="email" required placeholder="tu@email.com"
                  className="w-full pl-10 p-3 rounded-xl bg-main border border-gray-200/30 outline-none focus:ring-2 focus:ring-blue-500 text-tmain"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {status === 'error' && <p className="text-red-500 text-sm text-center font-medium">{errorMessage}</p>}

            <button 
              type="submit" disabled={status === 'loading'}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
            >
              {status === 'loading' ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;