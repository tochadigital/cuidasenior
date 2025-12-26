
import React, { useState, useEffect, useRef } from 'react';
import { loadState, loadRemoteState, saveState, getSyncId, setSyncId } from './services/storageService';
import { AppState, Medication, Caregiver } from './types';
import { Dashboard } from './components/Dashboard';
import { HealthView } from './components/HealthView';
import { DailyView } from './components/DailyView';
import { AdminView } from './components/AdminView';
import { TasksView } from './components/TasksView';
import { ChatView } from './components/ChatView';
import { LoginView } from './components/LoginView';

const GlobalAlert = ({ title, message, onClose }: { title: string, message: string, onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center relative animate-scale-up">
        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-info text-teal-600 text-xl"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <button onClick={onClose} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all">
            Entendi
        </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [view, setView] = useState<string>('dashboard');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'syncing' | 'error'>('idle');
  const [alertMed, setAlertMed] = useState<Medication | null>(null);
  const [isApiKeySelected, setIsApiKeySelected] = useState<boolean | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncHashRef = useRef<string>('');
  
  const [globalAlert, setGlobalAlert] = useState<{ open: boolean, title: string, msg: string }>({ open: false, title: '', msg: '' });

  const showAlert = (title: string, msg: string) => {
    setGlobalAlert({ open: true, title, msg });
  };

  const closeAlert = () => {
    setGlobalAlert({ ...globalAlert, open: false });
  };

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsApiKeySelected(hasKey);
      } else {
        setIsApiKeySelected(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setIsApiKeySelected(true);
    }
  };

  useEffect(() => {
    if (isApiKeySelected === false) return;
    let currentData = loadState();
    setState({ ...currentData, isAuthenticated: !!currentData.currentUser });
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, [isApiKeySelected]);

  // MECANISMO DE REAL-TIME SYNC (5 SEGUNDOS)
  useEffect(() => {
    if (!state?.isAuthenticated || isApiKeySelected === false) return;

    const backgroundSync = async () => {
      // Evita sincronizar se o usuário estiver salvando ativamente ou se a aba estiver oculta
      if (saveStatus === 'saving' || document.hidden) return;

      try {
        const remoteData = await loadRemoteState();
        if (remoteData) {
          const remoteHash = JSON.stringify(remoteData);
          // Só atualiza o estado se houver mudança real nos dados remotos
          if (remoteHash !== lastSyncHashRef.current) {
            lastSyncHashRef.current = remoteHash;
            setState(prev => {
              if (!prev) return remoteData;
              // Mesclagem cuidadosa para manter a sessão local
              const merged = { 
                ...remoteData, 
                isAuthenticated: true, 
                currentUser: prev.currentUser 
              };
              localStorage.setItem('cuida_senior_db_v1', JSON.stringify(merged));
              return merged;
            });
            setSaveStatus('syncing');
            setTimeout(() => setSaveStatus('idle'), 1000);
          }
        }
      } catch (e) {
        console.warn("Background sync delay");
      }
    };

    backgroundSync();
    // Intervalo de 5 segundos para parecer "imediato"
    const syncInterval = setInterval(backgroundSync, 5000);
    return () => clearInterval(syncInterval);
  }, [state?.isAuthenticated, isApiKeySelected, saveStatus]);

  const triggerSave = (newState: AppState) => {
    localStorage.setItem('cuida_senior_db_v1', JSON.stringify(newState));
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveState(newState);
        // Atualiza o hash local após salvar para evitar que a sincronização automática 
        // tente baixar o que acabamos de enviar
        lastSyncHashRef.current = JSON.stringify(newState);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        setSaveStatus('error');
      }
    }, 800); // Reduzido tempo de debounce para salvar mais rápido
  };

  useEffect(() => {
    if (!state || !state.isAuthenticated) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      let stateChanged = false;
      const updatedMeds = (state.medications || []).map(m => {
        if (m.time === timeStr && !m.takenToday) {
           const lastNotified = m.lastNotified ? new Date(m.lastNotified) : null;
           if (!lastNotified || (now.getTime() - lastNotified.getTime() > 60000)) {
              if (!alertMed || alertMed.id !== m.id) setAlertMed(m);
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Hora de ${m.name}`, { body: `Dose: ${m.dosage}` });
              }
              stateChanged = true;
              return { ...m, lastNotified: now.toISOString() };
           }
        }
        return m;
      });

      if (stateChanged) {
          const newState = { ...state, medications: updatedMeds };
          setState(newState);
          triggerSave(newState);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [state, alertMed]);

  const updateState = (updates: Partial<AppState>) => {
    if (!state) return;
    const newState = { ...state, ...updates };
    setState(newState);
    triggerSave(newState);
  };

  const handleLogin = async (user: Caregiver, elderData?: { name: string, cpf: string }) => {
    if (!state) return;
    setSaveStatus('syncing');
    const cleanCPF = elderData?.cpf.replace(/\D/g, '') || '00000000000';
    const syncId = `CUIDA-${cleanCPF}`;
    setSyncId(syncId);

    const remoteData = await loadRemoteState(syncId);
    let newState: AppState;

    if (remoteData) {
      newState = { ...remoteData, currentUser: user, isAuthenticated: true };
      showAlert('Dados Sincronizados', `Informações de ${remoteData.profile.name} carregadas via CPF.`);
    } else {
      let newProfile = { ...state.profile };
      if (elderData) {
        newProfile.name = elderData.name;
        newProfile.cpf = elderData.cpf;
      }
      newState = { ...state, currentUser: user, isAuthenticated: true, profile: newProfile };
      showAlert('Bem-vindo!', `Novo cadastro criado para ${elderData?.name.split(' ')[0]}.`);
    }

    setState(newState);
    await saveState(newState);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  if (isApiKeySelected === false) {
    return (
      <div className="h-screen w-full bg-white flex flex-col items-center justify-center p-8 text-center space-y-8 animate-fade-in">
        <div className="w-24 h-24 bg-teal-500 rounded-[2.5rem] shadow-2xl flex items-center justify-center transform rotate-6 mb-4">
           <i className="fas fa-heartbeat text-white text-5xl"></i>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-teal-900">CuidaSenior AI</h1>
          <p className="text-gray-500 text-sm">Configuração de Ambiente GCP</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 max-w-xs text-center">
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Para habilitar a inteligência artificial e o banco de dados compartilhado, vincule sua conta do Google Cloud.
          </p>
          <button 
            onClick={handleOpenSelectKey}
            className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-teal-100 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <i className="fas fa-key"></i> VINCULAR PROJETO
          </button>
        </div>
      </div>
    );
  }

  if (!state) return <div className="flex h-screen items-center justify-center text-teal-600 bg-white"><i className="fas fa-circle-notch fa-spin text-4xl"></i></div>;
  if (!state.isAuthenticated) return <LoginView onLogin={handleLogin} />;

  const renderView = () => {
    const props = { state, updateState, showAlert, onLogout: () => updateState({ currentUser: null, isAuthenticated: false }) };
    switch(view) {
      case 'dashboard': return <Dashboard state={state} onNavigate={setView} showAlert={showAlert} />;
      case 'health': return <HealthView {...props} initialTab="meds" />;
      case 'health_vitals': return <HealthView {...props} initialTab="vitals" />;
      case 'health_appts': return <HealthView {...props} initialTab="appts" />; 
      case 'health_exams': return <HealthView {...props} initialTab="exams" />;
      case 'daily': return <DailyView {...props} />;
      case 'tasks': return <TasksView {...props} />; 
      case 'profile': return <AdminView {...props} />; 
      case 'chat': return <ChatView {...props} />;
      default: return <Dashboard state={state} onNavigate={setView} showAlert={showAlert} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 h-screen overflow-hidden relative shadow-2xl flex flex-col">
      {/* STATUS INDICATOR - Agora mais discreto durante sync automático */}
      <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-[60] transition-all duration-300 ${saveStatus === 'idle' ? '-translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className={`${saveStatus === 'error' ? 'bg-red-600' : 'bg-gray-800/80'} backdrop-blur-md text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2`}>
          <i className={`fas ${saveStatus === 'saving' || saveStatus === 'syncing' ? 'fa-circle-notch fa-spin' : saveStatus === 'error' ? 'fa-exclamation-triangle' : 'fa-cloud-upload-alt'} ${saveStatus === 'error' ? 'text-white' : 'text-teal-400'}`}></i>
          {saveStatus === 'saving' ? 'ENVIANDO...' : saveStatus === 'syncing' ? 'SINCRONIZANDO...' : saveStatus === 'error' ? 'ERRO DE REDE' : 'SALVO'}
        </div>
      </div>

      <div className="absolute top-0 right-0 p-4 z-50">
         <button onClick={() => setView('profile')} className="h-10 w-10 bg-white shadow-xl rounded-full flex items-center justify-center border-2 border-teal-500 overflow-hidden active:scale-95 transition-transform">
           {state.currentUser?.photo || state.profile.photo ? <img src={state.currentUser?.photo || state.profile.photo} className="h-full w-full object-cover" /> : <i className="fas fa-user text-teal-600"></i>}
         </button>
      </div>

      {globalAlert.open && <GlobalAlert title={globalAlert.title} message={globalAlert.msg} onClose={closeAlert} />}

      {alertMed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-bounce-slow text-center p-6 space-y-4">
              <div className="h-20 w-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto shadow-lg"><i className="fas fa-pills text-4xl text-white"></i></div>
              <h2 className="text-gray-800 text-xl font-bold">Hora do Medicamento: {alertMed.name}</h2>
              <button onClick={() => { updateState({ medications: state.medications.map(m => m.id === alertMed.id ? { ...m, takenToday: true } : m) }); setAlertMed(null); }} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">Já Tomei</button>
              <button onClick={() => setAlertMed(null)} className="w-full text-gray-400 font-medium">Lembrar Depois</button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden relative">{renderView()}</main>

      <nav className="bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center text-gray-400 z-50 pb-6 shrink-0">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-teal-600' : ''}`}><i className="fas fa-home text-xl"></i><span className="text-[10px] font-bold">Início</span></button>
        <button onClick={() => setView('tasks')} className={`flex flex-col items-center gap-1 ${view === 'tasks' ? 'text-teal-600' : ''}`}><i className="fas fa-clipboard-check text-xl"></i><span className="text-[10px] font-bold">Avisos</span></button>
        <div className="relative -top-6 flex flex-col items-center group"><button onClick={() => setView('health')} className="h-14 w-14 bg-teal-600 rounded-full flex items-center justify-center shadow-lg text-white border-4 border-gray-50"><i className="fas fa-heartbeat text-2xl"></i></button><span className="text-[10px] font-bold mt-1">Saúde</span></div>
        <button onClick={() => setView('daily')} className={`flex flex-col items-center gap-1 ${view === 'daily' ? 'text-teal-600' : ''}`}><i className="fas fa-list-alt text-xl"></i><span className="text-[10px] font-bold">Rotina</span></button>
        <button onClick={() => setView('chat')} className={`flex flex-col items-center gap-1 ${view === 'chat' ? 'text-teal-600' : ''}`}><i className="fas fa-comment-dots text-xl"></i><span className="text-[10px] font-bold">Chat</span></button>
      </nav>
    </div>
  );
};

export default App;
