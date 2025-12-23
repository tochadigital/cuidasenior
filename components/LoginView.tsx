
import React, { useState, useEffect } from 'react';
import { Caregiver } from '../types';

interface Props {
  onLogin: (user: Caregiver, elderData?: { name: string, cpf: string }) => void;
}

type LoginStep = 'initial' | 'selection' | 'manual' | 'elder_setup';

const ACCOUNTS_STORAGE_KEY = 'cuida_senior_device_accounts';

export const LoginView: React.FC<Props> = ({ onLogin }) => {
  const [step, setStep] = useState<LoginStep>('initial');
  const [loading, setLoading] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<Caregiver[]>([]);
  
  // Dados do Cuidador (Formulário)
  const [currentUser, setCurrentUser] = useState<Caregiver | null>(null);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');

  // Dados do Idoso
  const [elderName, setElderName] = useState('');
  const [elderCPF, setElderCPF] = useState('');

  // Carregar contas salvas no dispositivo ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (saved) {
      try {
        setSavedAccounts(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar contas do dispositivo", e);
      }
    }
  }, []);

  const saveAccountToDevice = (user: Caregiver) => {
    const exists = savedAccounts.find(a => a.email === user.email);
    if (!exists) {
      const newList = [...savedAccounts, user];
      setSavedAccounts(newList);
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(newList));
    }
  };

  const handleSelectAccount = (acc: Caregiver) => {
    setCurrentUser(acc);
    setStep('elder_setup');
  };

  const handleRemoveAccount = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    const newList = savedAccounts.filter(a => a.email !== email);
    setSavedAccounts(newList);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(newList));
  };

  const handleManualUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail || !manualName) return;
    
    const user: Caregiver = {
      id: manualEmail,
      name: manualName,
      email: manualEmail,
      phone: '',
      photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(manualName)}&background=0D9488&color=fff&bold=true`
    };
    
    saveAccountToDevice(user);
    setCurrentUser(user);
    setStep('elder_setup');
  };

  const handleElderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!elderName || !elderCPF || !currentUser) return;
    
    setLoading(true);
    setTimeout(() => {
      onLogin(currentUser, { name: elderName, cpf: elderCPF });
    }, 1200);
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col items-center justify-between p-8 font-sans overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-teal-50 to-white rounded-b-[80px] -z-10 animate-fade-in-down"></div>
      
      <div className="mt-12 text-center space-y-4 animate-fade-in">
        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mx-auto mb-6 border border-teal-50 transform rotate-3">
           <i className="fas fa-heartbeat text-teal-500 text-4xl"></i>
        </div>
        <h1 className="text-4xl font-black text-teal-900 tracking-tight">
          CuidaSenior<span className="text-teal-500 font-light">AI</span>
        </h1>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-[0.2em]">Cuidado com Propósito</p>
      </div>

      <div className="w-full max-w-sm z-10 animate-fade-in-up mb-12">
        {step === 'initial' && (
          <div className="space-y-6">
            <button 
              onClick={() => setStep(savedAccounts.length > 0 ? 'selection' : 'manual')}
              className="w-full bg-white border border-gray-200 py-4 rounded-2xl flex items-center justify-center gap-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all group"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              <span className="font-bold text-gray-700">Entrar com Google</span>
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-300 font-bold">ou</span></div>
            </div>
            <button 
              onClick={() => setStep('manual')}
              className="w-full py-2 text-sm text-teal-600 font-bold hover:text-teal-700 transition-colors"
            >
              Usar uma conta legítima
            </button>
          </div>
        )}

        {step === 'selection' && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-gray-50 animate-scale-up">
            <div className="text-center mb-6">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-8 h-8 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-gray-800">Escolha uma conta</h3>
              <p className="text-xs text-gray-400">contas logadas neste dispositivo</p>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {savedAccounts.map(acc => (
                <div 
                  key={acc.email}
                  className="w-full p-3 rounded-2xl hover:bg-teal-50 border border-gray-50 flex items-center gap-3 transition-all group relative cursor-pointer"
                  onClick={() => handleSelectAccount(acc)}
                >
                  <img src={acc.photo} alt={acc.name} className="w-10 h-10 rounded-full border border-white shadow-sm" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{acc.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{acc.email}</p>
                  </div>
                  <button 
                    onClick={(e) => handleRemoveAccount(e, acc.email!)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                </div>
              ))}

              <button 
                onClick={() => setStep('manual')}
                className="w-full p-3 rounded-2xl hover:bg-gray-50 border border-dashed border-gray-200 flex items-center gap-3 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-teal-500 transition-colors">
                  <i className="fas fa-user-plus text-sm"></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-600">Usar outra conta</p>
                </div>
              </button>
            </div>
            
            <button 
              type="button" 
              onClick={() => setStep('initial')} 
              className="w-full text-xs text-gray-400 font-bold py-4 hover:text-gray-600"
            >
              Voltar
            </button>
          </div>
        )}

        {step === 'manual' && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-gray-50 animate-scale-up">
            <div className="text-center mb-6">
               <h3 className="text-xl font-bold text-gray-800">Login Legítimo</h3>
               <p className="text-xs text-gray-400">Insira sua conta do Google</p>
            </div>
            <form onSubmit={handleManualUserSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Seu Nome</label>
                <input 
                  type="text" required placeholder="Nome Completo"
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-teal-500 focus:bg-white outline-none transition-all text-sm font-medium"
                  value={manualName} onChange={e => setManualName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">E-mail Legítimo</label>
                <input 
                  type="email" required placeholder="exemplo@gmail.com"
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-teal-500 focus:bg-white outline-none transition-all text-sm font-medium"
                  value={manualEmail} onChange={e => setManualEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all flex items-center justify-center gap-2">
                Próximo <i className="fas fa-arrow-right text-xs"></i>
              </button>
              <button 
                type="button" 
                onClick={() => setStep(savedAccounts.length > 0 ? 'selection' : 'initial')} 
                className="w-full text-xs text-gray-400 font-bold py-2 hover:text-gray-600"
              >
                Cancelar
              </button>
            </form>
          </div>
        )}

        {step === 'elder_setup' && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-gray-50 animate-scale-up">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-2">
                 <i className="fas fa-user-elderly text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Dados do Idoso</h3>
              <p className="text-xs text-gray-400">Identificação para os cuidados</p>
            </div>

            <form onSubmit={handleElderSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Nome do Idoso</label>
                <input 
                  type="text" required placeholder="Ex: João Silva"
                  className="w-full p-4 bg-gray-50 border border-transparent focus:border-teal-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-medium"
                  value={elderName} onChange={e => setElderName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">CPF do Idoso</label>
                <input 
                  type="text" required placeholder="000.000.000-00"
                  className="w-full p-4 bg-gray-50 border border-transparent focus:border-teal-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-medium"
                  value={elderCPF} onChange={e => setElderCPF(formatCPF(e.target.value))}
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-teal-100 hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-check-circle"></i>}
                {loading ? 'Finalizando...' : 'Concluir Cadastro'}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="text-center animate-fade-in mb-4">
        <p className="text-[10px] text-gray-300 px-6 leading-relaxed">
          Sua privacidade é nossa prioridade. <br/>
          As contas são gerenciadas localmente no dispositivo.
        </p>
      </div>

      <style>{`
        @keyframes fade-in-down { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};
