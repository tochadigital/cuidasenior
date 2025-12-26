
import React, { useState, useEffect, useRef } from 'react';
import { AppState, ChatMessage } from '../types';

interface Props {
  state: AppState;
  updateState: (s: Partial<AppState>) => void;
  showAlert: (title: string, msg: string) => void;
}

export const ChatView: React.FC<Props> = ({ state, updateState, showAlert }) => {
  const [input, setInput] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('all');
  const [showRecipientMenu, setShowRecipientMenu] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chat]);

  const guardians = state.profile.guardians || [];
  const caregivers = (state.caregivers || []).filter(c => c.name);
  const relief = state.reliefCaregiver?.name ? [state.reliefCaregiver] : [];
  
  const recipients = [
    { id: 'all', name: 'Todos', photo: undefined, type: 'all' },
    ...guardians.map(g => ({ ...g, type: 'guardian' })),
    ...caregivers.map(c => ({ ...c, type: 'caregiver' })),
    ...relief.map(r => ({ ...r, type: 'relief' }))
  ];

  const selectedRecipient = recipients.find(r => r.id === selectedRecipientId) || recipients[0];

  const send = () => {
    if (!input.trim()) return;
    
    // Identidade obrigatória do cuidador ativo vinda do login
    const senderName = state.currentUser?.name || 'Cuidador';
    const senderId = state.currentUser?.id || 'unknown';

    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: senderId,
      senderName: senderName, 
      text: input,
      timestamp: new Date().toISOString(),
      recipientId: selectedRecipientId === 'all' ? undefined : selectedRecipientId,
      recipientName: selectedRecipientId === 'all' ? undefined : selectedRecipient.name
    };

    updateState({ chat: [...state.chat, msg] });
    setInput('');
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 relative">
      <div className="bg-white p-4 pr-16 shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <h2 className="font-bold text-lg text-teal-900">Chat da Equipe</h2>
        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span> 
          Logado como: {state.currentUser?.name}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={() => setShowRecipientMenu(false)}>
        {state.chat.length === 0 && (
          <div className="text-center text-gray-400 mt-12 animate-fade-in">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <i className="far fa-comments text-2xl text-teal-200"></i>
            </div>
            <p className="text-sm font-medium">Nenhuma mensagem.</p>
          </div>
        )}

        {state.chat.map(msg => {
          const isMe = msg.senderId === state.currentUser?.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-scale-up origin-bottom`}>
              
              <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm relative ${isMe ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                
                {/* NOME DO REMETENTE (Sempre o nome real) */}
                <div className={`text-[10px] font-black mb-1 uppercase tracking-tight ${isMe ? 'text-teal-200' : 'text-teal-600'}`}>
                  {msg.senderName}
                </div>

                {/* Indicação de Privado (Se houver) */}
                {msg.recipientName && (
                  <p className={`text-[9px] font-bold mb-1 italic flex items-center gap-1 opacity-70`}>
                    <i className="fas fa-reply text-[8px]"></i> para {msg.recipientName}
                  </p>
                )}

                <p className="text-sm leading-relaxed pr-10">{msg.text}</p>
                
                {/* Horário no Canto Inferior */}
                <div className={`text-[9px] absolute bottom-2 right-2 font-medium opacity-60`}>
                  {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <div className="p-3 bg-white border-t border-gray-100 flex gap-2 w-full z-20 shadow-lg relative pb-8">
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowRecipientMenu(!showRecipientMenu); }}
            className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden hover:bg-gray-100 transition-all active:scale-90"
          >
            {selectedRecipientId === 'all' ? (
              <i className="fas fa-users text-gray-400 text-sm"></i>
            ) : (
              <span className="text-xs font-black text-teal-600">
                {selectedRecipient.name.charAt(0).toUpperCase()}
              </span>
            )}
          </button>

          {showRecipientMenu && (
            <div className="absolute bottom-14 left-0 bg-white rounded-2xl shadow-2xl border border-gray-100 w-64 overflow-hidden animate-scale-up z-30">
              <div className="bg-teal-600 px-4 py-3">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Enviar Mensagem Para:</p>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {recipients.map(r => (
                  <button 
                    key={r.id}
                    onClick={() => {
                      setSelectedRecipientId(r.id);
                      setShowRecipientMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-teal-50 border-b border-gray-50 last:border-0 ${selectedRecipientId === r.id ? 'bg-teal-50' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                       <span className="text-xs font-bold text-gray-600">
                         {r.type === 'relief' ? <i className="fas fa-star text-[8px] text-indigo-400 mr-1"></i> : null}
                         {r.name.charAt(0).toUpperCase()}
                       </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">{r.name}</p>
                      {r.type === 'relief' && <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-tighter">Coringa</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <input 
          type="text" 
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 outline-none focus:bg-white focus:border-teal-500 transition-all text-sm"
          placeholder="Digite aqui..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button onClick={send} className="h-10 w-10 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all">
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
      
      <style>{`
        @keyframes scale-up {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scale-up { animation: scale-up 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};
