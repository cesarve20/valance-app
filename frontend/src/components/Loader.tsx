import { Loader2 } from 'lucide-react';

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in duration-300">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
        <p className="text-gray-600 font-bold text-sm animate-pulse">Procesando...</p>
      </div>
    </div>
  );
};

export default Loader;