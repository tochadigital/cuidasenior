
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

  // Combine Guardians and Caregivers for the list
  const guardians = state.profile.guardians || [];
  const caregivers = (state.caregivers || []).filter(c => c.name); // Filter out empty caregivers
  
  const recipients = [
    { id: 'all', name: 'Todos', photo: undefined, type: 'all' },
    ...guardians.map(g => ({ ...g, type: 'guardian' })),
    ...caregivers.map(c => ({ ...c, type: 'caregiver' }))
  ];

  const selectedRecipient = recipients.find(r => r.id === selectedRecipientId) || recipients[0];

  const send = () => {
    if (!input.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'current', // Simulating logged in user
      senderName: 'Eu',
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
      <div className="bg-white p-4 pr-16 shadow-sm sticky top-0 z-10">
        <h2 className="font-bold text-lg">Chat dos Cuidadores</h2>
        <p className="text-xs text-green-600 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span> 
          {caregivers.length} cuidadores ativos
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={() => setShowRecipientMenu(false)}>
        {state.chat.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <i className="far fa-comments text-4xl mb-2"></i>
            <p>Coordene os cuidados por aqui.</p>
          </div>
        )}
        {state.chat.map(msg => {
          const isMe = msg.senderId === 'current';
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                {msg.recipientName && (
                  <p className={`text-[10px] font-bold mb-1 ${isMe ? 'text-teal-200' : 'text-teal-600'}`}>
                    <i className="fas fa-reply mr-1"></i>Para: {msg.recipientName}
                  </p>
                )}
                <p className="text-sm">{msg.text}</p>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">
                {!isMe && <span className="font-bold mr-1">{msg.senderName}</span>}
                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
              </span>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t flex gap-2 w-full z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative">
        
        {/* Recipient Selector Button */}
        <div className="relative">
          <button 
            onClick={() => setShowRecipientMenu(!showRecipientMenu)}
            className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden hover:bg-gray-200 transition-colors active:scale-95"
            title={`Enviar para: ${selectedRecipient.name}`}
          >
            {selectedRecipientId === 'all' ? (
              <i className="fas fa-users text-gray-500 text-sm"></i>
            ) : selectedRecipient.photo ? (
              <img src={selectedRecipient.photo} alt={selectedRecipient.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-teal-700">
                {selectedRecipient.name.charAt(0).toUpperCase()}
              </span>
            )}
          </button>

          {/* Recipient Menu Popup */}
          {showRecipientMenu && (
            <div className="absolute bottom-12 left-0 bg-white rounded-xl shadow-xl border border-gray-100 w-64 overflow-hidden animate-fade-in z-30">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase">Enviar para:</p>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {recipients.map(r => (
                  <button 
                    key={r.id}
                    onClick={() => {
                      setSelectedRecipientId(r.id);
                      setShowRecipientMenu(false);
                    }}
                    className={`w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-0 ${selectedRecipientId === r.id ? 'bg-teal-50' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${r.id === 'all' ? 'bg-teal-100 text-teal-600' : 'bg-gray-200'}`}>
                       {r.id === 'all' ? (
                         <i className="fas fa-users text-xs"></i>
                       ) : r.photo ? (
                         <img src={r.photo} alt={r.name} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-xs font-bold text-gray-600">{r.name.charAt(0).toUpperCase()}</span>
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${selectedRecipientId === r.id ? 'text-teal-700' : 'text-gray-700'}`}>{r.name}</p>
                      {r.type !== 'all' && (
                        <p className="text-[10px] text-gray-400 capitalize">{r.type === 'guardian' ? 'Responsável' : 'Cuidador'}</p>
                      )}
                    </div>
                    {selectedRecipientId === r.id && <i className="fas fa-check text-teal-600 text-xs"></i>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <input 
          type="text" 
          className="flex-1 bg-gray-100 rounded-full px-4 outline-none focus:ring-2 ring-teal-500 transition-all text-sm"
          placeholder={`Mensagem para ${selectedRecipientId === 'all' ? 'todos' : selectedRecipient.name.split(' ')[0]}...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button onClick={send} className="h-10 w-10 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};
