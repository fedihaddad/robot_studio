import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { config, t } = useAppStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(false);

    // Simulate a small delay for premium feel
    setTimeout(() => {
      if (password === config.password || !config.passwordEnabled) {
        onLogin();
      } else {
        setError(true);
        setIsSubmitting(false);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0c] overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />

      <div className="relative w-full max-w-md p-8 mx-4">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse" />
            <div className="relative p-5 bg-gradient-to-br from-[#1a1a1e] to-[#0d0d0f] border border-white/10 rounded-3xl shadow-2xl">
              <Cpu className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
            {config.robotName} <span className="text-blue-500">DASHBOARD</span>
          </h1>
          <p className="text-gray-400 font-medium">Control Interface Authentication</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-700">
          <div className="flex items-center gap-3 mb-8 text-blue-400">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-widest">{t('login.secure_access', 'Secure Access')}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.enter_password', 'Enter Password')}
                className={`w-full bg-[#121216] border ${error ? 'border-red-500/50' : 'border-white/10'} focus:border-blue-500/50 rounded-2xl py-4 pl-12 pr-4 text-white outline-none transition-all placeholder:text-gray-600 focus:ring-4 focus:ring-blue-500/10`}
                autoFocus
              />
              {error && (
                <p className="absolute -bottom-6 left-1 text-xs text-red-400 font-medium animate-in fade-in slide-in-from-top-1">
                  {t('login.incorrect_password', 'Invalid credentials. Access denied.')}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="relative w-full group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t('login.unlock_interface', 'Unlock Interface')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm font-medium">
            © 2026 AXEL Robotic Systems • Built with Gemini ER
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
