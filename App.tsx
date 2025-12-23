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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'syncing'>('idle');
  const [alertMed, setAlertMed] = useState<Medication | null>(null);
  // Fix: Changed NodeJS.Timeout to ReturnType<typeof setTimeout> to fix "Cannot find namespace 'NodeJS'" error in browser
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [globalAlert, setGlobalAlert] = useState<{ open: boolean, title: string, msg: string }>({ open: false, title: '', msg: '' });

  const showAlert = (title: string, msg: string) => {
    setGlobalAlert({ open: true, title, msg });
  };

  const closeAlert = () => {
    setGlobalAlert({ ...globalAlert, open: false });
  };

  useEffect(() => {
    let currentData = loadState();
    setState({ ...currentData, isAuthenticated: !!currentData.currentUser });

    const fetchCloud = async () => {
        if (currentData.currentUser) {
            setSaveStatus('syncing');
            const remoteData = await loadRemoteState();
            if (remoteData) {
                // Ao carregar da nuvem, mesclamos com o estado local atual
                setState(prev => {
                  const merged = { ...remoteData, isAuthenticated: true, currentUser: prev?.currentUser || remoteData.currentUser };
                  saveState(merged); // Atualiza localmente
                  return merged;
                });
                setSaveStatus('saved');
            } else {
                setSaveStatus('idle');
            }
        }
    };
    fetchCloud();

    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Debounced Save to Cloud
  const triggerSave = (newState: AppState) => {
    // 1. Salva localmente de forma síncrona/imediata
    localStorage.setItem('cuida_senior_db_v1', JSON.stringify(newState));

    // 2. Debounce para o Supabase (nuvem)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(async () => {
      await saveState(newState);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1500); // Aguarda 1.5s de inatividade nos inputs antes de enviar para o servidor
  };

  useEffect(() => {
    if (!state || !state.isAuthenticated) return;
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      
      let stateChanged = false;
      
      const updatedMeds = (state.medications || []).map(m => {
        if (m.time === timeStr && !m.takenToday) {
           const lastNotified = m.lastNotified ? new Date(m.lastNotified) : null;
           const alreadyNotified = lastNotified && (now.getTime() - lastNotified.getTime() < 60000);
           
           if (!alreadyNotified) {
              if (!alertMed || alertMed.id !== m.id) {
                setAlertMed(m);
              }
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Hora de ${m.name}`, { 
                    body: `Dose: ${m.dosage}`,
                    tag: `med-${m.id}`
                });
              }
              stateChanged = true;
              return { ...m, lastNotified: now.toISOString() };
           }
        }
        return m;
      });

      const updatedAppts = (state.appointments || []).map(appt => {
         if (appt.notify && !appt.notified) {
             const apptTime = new Date(appt.datetime).getTime();
             const diffMs = apptTime - now.getTime();
             const diffMins = diffMs / 60000;

             if (diffMins > 0 && diffMins <= 60) {
                 if ('Notification' in window && Notification.permission === 'granted') {
                     const timeStr = new Date(appt.datetime).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
                     new Notification(`Lembrete de Consulta`, { 
                         body: `Sua consulta de ${appt.specialty} é em breve (às ${timeStr}).`,
                         tag: `appt-${appt.id}`
                     });
                 }
                 stateChanged = true;
                 return { ...appt, notified: true };
             }
         }
         return appt;
      });

      if (stateChanged) {
          const newState = { ...state, medications: updatedMeds, appointments: updatedAppts };
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

  const handleLogin = (user: Caregiver, elderData?: { name: string, cpf: string }) => {
    if (!state) return;

    let newProfile = { ...state.profile };
    if (elderData) {
      newProfile.name = elderData.name;
      newProfile.cpf = elderData.cpf;
      
      const cleanCPF = elderData.cpf.replace(/\D/g, '');
      const autoKey = `CUIDA-${cleanCPF}`;
      setSyncId(autoKey);
    }

    const newState = { 
      ...state,
      currentUser: user, 
      isAuthenticated: true,
      profile: newProfile 
    };
    
    setState(newState);
    triggerSave(newState);
    
    showAlert('Bem-vindo!', `Olá ${user.name}, vamos cuidar do ${elderData ? elderData.name.split(' ')[0] : 'idoso'} hoje?`);
  };

  const handleLogout = () => {
    updateState({ currentUser: null, isAuthenticated: false });
    setView('dashboard');
  };

  const handleConfirmDose = () => {
    if (!alertMed || !state) return;
    const updatedMeds = (state.medications || []).map(m => 
      m.id === alertMed.id ? { ...m, takenToday: true } : m
    );
    updateState({ medications: updatedMeds });
    setAlertMed(null);
  };

  if (!state) return <div className="flex h-screen items-center justify-center text-teal-600"><i className="fas fa-circle-notch fa-spin text-2xl"></i></div>;

  if (!state.isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderView = () => {
    const props = { state, updateState, showAlert, onLogout: handleLogout };
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
      {/* Save Status Overlay */}
      <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-[60] transition-all duration-300 ${saveStatus === 'idle' ? '-translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="bg-gray-800/90 backdrop-blur-md text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <i className={`fas ${saveStatus === 'saving' || saveStatus === 'syncing' ? 'fa-circle-notch fa-spin' : 'fa-cloud-upload-alt'} text-teal-400`}></i>
          {saveStatus === 'saving' ? 'AGUARDANDO...' : saveStatus === 'syncing' ? 'SINCRONIZANDO...' : 'SINCRONIZADO'}
        </div>
      </div>

      {/* Profile/Menu Header Access */}
      <div className="absolute top-0 right-0 p-4 z-50">
         <button 
           onClick={() => setView('profile')} 
           className="h-10 w-10 bg-white shadow-xl rounded-full flex items-center justify-center border-2 border-teal-500 overflow-hidden active:scale-95 transition-transform"
         >
           {state.currentUser?.photo ? (
             <img src={state.currentUser.photo} alt="Profile" className="h-full w-full object-cover" />
           ) : state.profile.photo ? (
             <img src={state.profile.photo} alt="Profile" className="h-full w-full object-cover" />
           ) : (
             <i className="fas fa-user text-teal-600"></i>
           )}
         </button>
      </div>

      {globalAlert.open && (
        <GlobalAlert title={globalAlert.title} message={globalAlert.msg} onClose={closeAlert} />
      )}

      {alertMed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-bounce-slow">
            <div className="bg-teal-500 p-6 text-center relative">
              <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                <i className="fas fa-pills text-4xl text-teal-500 animate-pulse"></i>
              </div>
              <h2 className="text-white text-xl font-bold">Hora do Medicamento!</h2>
              <p className="text-teal-100 text-sm">Atenção ao horário</p>
            </div>
            <div className="p-6 text-center space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{alertMed.name}</h3>
                <p className="text-gray-500 font-medium text-lg">{alertMed.dosage}</p>
                <div className="inline-block bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-bold mt-2">
                  <i className="far fa-clock mr-1"></i> {alertMed.time}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 pt-2">
                <button onClick={handleConfirmDose} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-teal-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <i className="fas fa-check-circle"></i> Já Tomei
                </button>
                <button onClick={() => setAlertMed(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 py-3 rounded-xl font-medium transition-colors">
                  Lembrar Depois
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden relative">
        {renderView()}
      </main>

      <nav className="bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center text-gray-400 z-50 pb-6 shrink-0">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-teal-600' : ''}`}>
          <i className="fas fa-home text-xl"></i>
          <span className="text-[10px] font-bold">Início</span>
        </button>
        
        <button onClick={() => setView('tasks')} className={`flex flex-col items-center gap-1 ${view === 'tasks' ? 'text-teal-600' : ''}`}>
          <i className="fas fa-clipboard-check text-xl"></i>
          <span className="text-[10px] font-bold">Avisos</span>
        </button>
        
        <div className="relative -top-6 flex flex-col items-center group">
          <button onClick={() => setView('health')} className="h-14 w-14 bg-teal-600 rounded-full flex items-center justify-center shadow-lg text-white active:scale-95 transition-transform border-4 border-gray-50">
            <i className="fas fa-heartbeat text-2xl"></i>
          </button>
          <span className={`text-[10px] font-bold mt-1 ${view.startsWith('health') ? 'text-teal-600' : 'text-gray-400'}`}>Saúde</span>
        </div>
        
        <button onClick={() => setView('daily')} className={`flex flex-col items-center gap-1 ${view === 'daily' ? 'text-teal-600' : ''}`}>
          <i className="fas fa-list-alt text-xl"></i>
          <span className="text-[10px] font-bold">Rotina</span>
        </button>
        
        <button onClick={() => setView('chat')} className={`flex flex-col items-center gap-1 ${view === 'chat' ? 'text-teal-600' : ''}`}>
          <div className="relative">
            <i className="fas fa-comment-dots text-xl"></i>
            {state.chat.length > 0 && <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></div>}
          </div>
          <span className="text-[10px] font-bold">Chat</span>
        </button>
      </nav>
    </div>
  );
};

export default App;