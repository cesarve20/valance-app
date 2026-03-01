import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/axios'; 
import Loader from './Loader';
import './AuthForm.css';

const AuthForm = () => {
  const navigate = useNavigate();
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  
  // --- ESTADO DE CARGA ---
  const [isLoading, setIsLoading] = useState(false); 

  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [registerData, setRegisterData] = useState({ 
    name: '', email: '', password: '', confirmPassword: '', currency: 'ARS' 
  });
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState<string | null>(null);

  const getBrowserName = () => {
    const agent = navigator.userAgent.toLowerCase();
    if (agent.includes('brave')) return 'Brave';
    if (agent.includes('edg')) return 'Edge';
    if (agent.includes('chrome')) return 'Chrome';
    if (agent.includes('firefox')) return 'Firefox';
    if (agent.includes('safari')) return 'Safari';
    return 'Otro';
  };

  const validatePassword = (pass: string) => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*.,]).{8,}$/.test(pass);
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  // --- LÓGICA GOOGLE CON LOADER ---
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setMessage(null);
    setIsLoading(true); 
    try {
        const res = await api.post('/users/google', {
            token: credentialResponse.credential
        });

        // GUARDAMOS USUARIO Y TOKEN JUNTOS
        localStorage.setItem('valance_user', JSON.stringify({ 
            ...res.data.user, 
            token: res.data.token // Importante: Guardar el token aquí
        }));
        
        setMessage(`✅ ¡Bienvenido con Google, ${res.data.user.name}!`);
        setTimeout(() => navigate('/dashboard'), 1500);

    } catch (error) {
        console.error("Error login google", error);
        setMessage("❌ Falló el inicio de sesión con Google");
        setIsLoading(false); 
    }
  };

  // --- LÓGICA REGISTRO CON LOADER ---
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateEmail(registerData.email)) return setMessage('❌ Email inválido');
    if (!validatePassword(registerData.password)) return setMessage('❌ Contraseña débil (min 8 car., letras, num, simbolo)');
    if (registerData.password !== registerData.confirmPassword) return setMessage('❌ Las contraseñas no coinciden');

    setIsLoading(true); 
    try {
      const payload = {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        browser: getBrowserName(),
        currency: registerData.currency
      };
      
      await api.post('/users', payload); 
      
      setMessage('✅ ¡Cuenta creada! Inicia sesión.');
      setRegisterData({ name: '', email: '', password: '', confirmPassword: '', currency: 'ARS' });
      setTimeout(() => setIsRightPanelActive(false), 2000);
      
      setIsLoading(false); 
    } catch (error: any) {
      setMessage(error.response?.data?.error ? `❌ ${error.response.data.error}` : '❌ Error al registrarse.');
      setIsLoading(false); 
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  // --- LÓGICA LOGIN CON LOADER ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); 
    try {
      const response = await api.post('/users/login', loginData); 
      
      // GUARDAMOS USUARIO Y TOKEN JUNTOS
      localStorage.setItem('valance_user', JSON.stringify({ 
          ...response.data.user, 
          token: response.data.token // Importante: Guardar el token aquí
      }));

      setMessage(`✅ ¡Hola, ${response.data.user.name}!`);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error: any) {
      setMessage(error.response?.data?.error ? `❌ ${error.response.data.error}` : '❌ Credenciales inválidas');
      setIsLoading(false); 
    }
  };

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.243L9.88 9.88" />
    </svg>
  );

  return (
    <div className="flex justify-center items-center h-screen w-full bg-main transition-colors duration-300">
      
      {isLoading && <Loader />}

      <div className={`auth-container ${isRightPanelActive ? "right-panel-active" : ""}`}>
        
        {/* --- FORMULARIO REGISTRO --- */}
        <div className="form-container sign-up-container">
          <form className="form-content px-8 h-full flex flex-col justify-center" onSubmit={handleRegisterSubmit}>
            {/* LOGO EN REGISTRO */}
            <img src="/valance-logo.png" alt="Valance" className="h-10 md:h-12 mb-4 object-contain mx-auto" />
            <h1 className="text-2xl font-bold mb-2">Crear Cuenta</h1>
            <span className="text-xs text-gray-400 mb-2">Usa tu email principal</span>
            
            <input 
              type="text" name="name" placeholder="Nombre" 
              value={registerData.name} onChange={handleRegisterChange}
              className="bg-gray-100 border-none p-2 my-1 w-full rounded text-sm text-gray-900 placeholder-gray-500" required 
            />
            <input 
              type="email" name="email" placeholder="Email" 
              value={registerData.email} onChange={handleRegisterChange}
              className="bg-gray-100 border-none p-2 my-1 w-full rounded text-sm text-gray-900 placeholder-gray-500" required 
            />
            
            <div className="relative w-full">
              <input 
                type={showRegisterPassword ? "text" : "password"} name="password" placeholder="Contraseña" 
                value={registerData.password} onChange={handleRegisterChange}
                className="bg-gray-100 border-none p-2 my-1 w-full rounded pr-8 text-sm text-gray-900 placeholder-gray-500" required
              />
              <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                {showRegisterPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <div className="relative w-full">
              <input 
                type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirmar" 
                value={registerData.confirmPassword} onChange={handleRegisterChange}
                className="bg-gray-100 border-none p-2 my-1 w-full rounded pr-8 text-sm text-gray-900 placeholder-gray-500" required
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <div className="w-full my-1">
              <div className="relative">
                <select
                  name="currency" value={registerData.currency} onChange={handleRegisterChange}
                  className="bg-gray-100 border-none p-2 w-full rounded appearance-none cursor-pointer font-medium text-sm text-gray-900"
                >
                  <option value="ARS">🇦🇷 ARS (Arg)</option>
                  <option value="USD">🇺🇸 USD (Dólar)</option>
                  <option value="EUR">🇪🇺 EUR (Euro)</option>
                  <option value="COP">🇨🇴 COP (Col)</option>
                  <option value="MXN">🇲🇽 MXN (Mex)</option>
                  <option value="CLP">🇨🇱 CLP (Chi)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            
            <button className="mt-3 bg-blue-600 text-white font-bold py-2 px-8 rounded-full hover:bg-blue-700 transition uppercase text-xs tracking-wider shadow-md">
              Registrarse
            </button>

            {/* --- GOOGLE BUTTON (REGISTRO) --- */}
            <div className="mt-2 scale-75 transform origin-top">
                <p className="text-[10px] text-gray-400 mb-1">- ó -</p>
                <GoogleLogin 
                    onSuccess={handleGoogleSuccess} 
                    onError={() => { console.log('Register Failed'); setIsLoading(false); }} 
                    size="medium"
                    text="signup_with"
                    shape="pill"
                />
            </div>

            {message && (
              <div className="mt-2 w-full p-1.5 bg-white rounded border border-gray-200 shadow-sm">
                <p className={`text-[10px] font-bold text-center leading-tight ${message.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
                  {message}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* --- FORMULARIO LOGIN --- */}
        <div className="form-container sign-in-container">
          <form className="form-content px-10" onSubmit={handleLoginSubmit}>
            {/* LOGO EN LOGIN */}
            <img src="/valance-logo.png" alt="Valance" className="h-10 md:h-12 mb-4 object-contain mx-auto" />
            <h1 className="text-3xl font-bold mb-4">Iniciar Sesión</h1>
            <span className="text-sm text-gray-400 mb-6">Ingresa a tu cuenta Valance</span>
            
            <input 
              type="email" name="email" placeholder="Email" 
              value={loginData.email} onChange={handleLoginChange}
              className="bg-gray-100 border-none p-3 my-2 w-full rounded text-gray-900 placeholder-gray-500" 
            />
            
            <div className="relative w-full">
              <input 
                type={showLoginPassword ? "text" : "password"} name="password" placeholder="Contraseña" 
                value={loginData.password} onChange={handleLoginChange}
                className="bg-gray-100 border-none p-3 my-2 w-full rounded pr-10 text-gray-900 placeholder-gray-500" 
              />
              <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {showLoginPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* --- BOTÓN OLVIDÉ MI CONTRASEÑA --- */}
            <div className="flex justify-end w-full mt-1 mb-2">
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')} 
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition bg-transparent border-none p-0 cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            
            <button className="mt-4 bg-blue-600 text-white font-bold py-3 px-10 rounded-full hover:bg-blue-700 transition uppercase text-xs tracking-wider shadow-lg">
              Ingresar
            </button>
            
            {/* --- GOOGLE BUTTON (LOGIN) --- */}
            <div className="mt-4 flex flex-col items-center">
                <p className="text-xs text-gray-400 mb-2">- ó continúa con -</p>
                <div className="scale-90 origin-top">
                    <GoogleLogin 
                        onSuccess={handleGoogleSuccess} 
                        onError={() => { console.log('Login Failed'); setIsLoading(false); }}
                        theme="filled_blue"
                        shape="pill"
                        size="large"
                    />
                </div>
            </div>

            {message && (
              <div className="mt-4 w-full p-2 bg-white rounded border border-gray-200">
                <p className={`text-xs font-bold text-center leading-tight ${message.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
                  {message}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* --- OVERLAY --- */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1 className="text-3xl font-bold text-white mb-4">¡Bienvenido!</h1>
              <p className="text-white mb-8 text-sm">Conéctate para ver tus finanzas.</p>
              <button className="bg-transparent border border-white text-white font-bold py-3 px-10 rounded-full hover:bg-white hover:text-blue-600 transition uppercase text-xs tracking-wider" onClick={() => setIsRightPanelActive(false)}>Iniciar Sesión</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="text-3xl font-bold text-white mb-4">Hola, Amigo</h1>
              <p className="text-white mb-8 text-sm">Empieza tu viaje financiero con Valance.</p>
              <button className="bg-transparent border border-white text-white font-bold py-3 px-10 rounded-full hover:bg-white hover:text-blue-600 transition uppercase text-xs tracking-wider" onClick={() => setIsRightPanelActive(true)}>Registrarse</button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default AuthForm;