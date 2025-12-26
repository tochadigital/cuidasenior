
import React, { useState } from 'react';
import { AppState, BloodType, Caregiver, Guardian, Rule, RuleCategory } from '../types';

interface Props {
  state: AppState;
  updateState: (s: Partial<AppState>) => void;
  showAlert: (title: string, msg: string) => void;
  onLogout: () => void;
}

export const AdminView: React.FC<Props> = ({ state, updateState, showAlert, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'caregivers' | 'rules'>('profile');
  
  // Profile/Contact States
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);

  // Rules States
  const [newRuleText, setNewRuleText] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<RuleCategory>('routines');
  const [showAddRule, setShowAddRule] = useState(false);

  const saveProfile = (key: string, val: any) => {
    updateState({ profile: { ...state.profile, [key]: val } });
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => saveProfile('photo', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCaregiverPhotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newCaregivers = [...state.caregivers];
        newCaregivers[index] = { ...newCaregivers[index], photo: reader.result as string };
        updateState({ caregivers: newCaregivers });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReliefCaregiverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const current = state.reliefCaregiver || { id: 'relief', name: '', phone: '' };
        updateState({ reliefCaregiver: { ...current, photo: reader.result as string } });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaregiverUpdate = (index: number, field: 'name' | 'phone', value: string) => {
    const newCaregivers = [...state.caregivers];
    newCaregivers[index] = { ...newCaregivers[index], [field]: value };
    updateState({ caregivers: newCaregivers });
  };

  const handleReliefCaregiverUpdate = (field: 'name' | 'phone', value: string) => {
    const current = state.reliefCaregiver || { id: 'relief', name: '', phone: '' };
    updateState({ reliefCaregiver: { ...current, [field]: value } });
  };

  const addEmergencyContact = () => {
    if (!newContactName || !newContactPhone) {
      showAlert('Campos Faltando', 'Por favor, insira o nome e o telefone do contato.');
      return;
    }
    const newContact: Guardian = { id: Date.now().toString(), name: newContactName, phone: newContactPhone };
    const currentContacts = state.profile.emergencyContacts || [];
    saveProfile('emergencyContacts', [...currentContacts, newContact]);
    setNewContactName(''); setNewContactPhone(''); setShowAddContact(false);
  };

  const removeEmergencyContact = (id: string) => {
    const currentContacts = state.profile.emergencyContacts || [];
    saveProfile('emergencyContacts', currentContacts.filter(c => c.id !== id));
  };

  const addRule = () => {
    if (!newRuleText.trim()) return;
    const rule: Rule = {
      id: Date.now().toString(),
      text: newRuleText,
      category: newRuleCategory,
      author: state.currentUser?.name || 'Admin',
      date: new Date().toISOString()
    };
    const currentRules = state.profile.houseRules || [];
    saveProfile('houseRules', [rule, ...currentRules]);
    setNewRuleText('');
    setShowAddRule(false);
  };

  const removeRule = (id: string) => {
    const currentRules = state.profile.houseRules || [];
    saveProfile('houseRules', currentRules.filter(r => r.id !== id));
  };

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
  };

  const bloodTypes = Object.values(BloodType);
  const categoryLabels: Record<string, string> = { attention: 'Atenção', routines: 'Rotina', hygiene: 'Higiene' };

  return (
    <div className="h-full flex flex-col bg-gray-50">
       <div className="bg-white shadow-sm p-4 pr-14 sticky top-0 z-10">
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button onClick={() => setActiveTab('profile')} className={`flex-1 py-2 px-3 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}>Perfil</button>
            <button onClick={() => setActiveTab('caregivers')} className={`flex-1 py-2 px-3 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'caregivers' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}>Cuidadores</button>
            <button onClick={() => setActiveTab('rules')} className={`flex-1 py-2 px-3 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'rules' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}>Regras</button>
          </div>
       </div>

       <div className="p-4 overflow-y-auto flex-1 pb-10">
           {activeTab === 'profile' && (
             <div className="space-y-4">
               <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
                  <div className="text-center">
                    <div className="relative w-28 h-28 mx-auto mb-4">
                      <input type="file" id="profilePhotoInput" accept="image/*" className="hidden" onChange={handleProfilePhotoChange} />
                      <label htmlFor="profilePhotoInput" className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gray-100 cursor-pointer border-4 border-white shadow-xl relative group">
                        {state.profile.photo ? <img src={state.profile.photo} className="w-full h-full object-cover" /> : <i className="fas fa-user text-4xl text-gray-300"></i>}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <i className="fas fa-camera text-white"></i>
                        </div>
                      </label>
                    </div>
                    <div className="relative group">
                       <input 
                         type="text" 
                         className="text-2xl font-black text-center w-full p-2 rounded-xl bg-transparent border-2 border-transparent focus:border-teal-500 outline-none transition-all" 
                         value={state.profile.name} 
                         onChange={e => saveProfile('name', e.target.value)} 
                       />
                    </div>
                    <p className="text-xs text-gray-400 font-bold mt-1 bg-gray-50 inline-block px-3 py-1 rounded-full border border-gray-100">CPF: {state.profile.cpf || 'Não informado'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-black uppercase ml-1">Idade</label>
                      <input type="number" className="w-full p-3 bg-gray-50 rounded-xl font-bold text-gray-700 border border-transparent focus:border-teal-500 outline-none" value={state.profile.age} onChange={e => saveProfile('age', parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-black uppercase ml-1">Tipo Sanguíneo</label>
                      <select className="w-full p-3 bg-gray-50 rounded-xl font-bold text-gray-700 border border-transparent focus:border-teal-500 outline-none" value={state.profile.bloodType} onChange={e => saveProfile('bloodType', e.target.value)}>
                        {bloodTypes.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-red-400 font-black uppercase ml-1">Alergias Conhecidas</label>
                    <textarea className="w-full p-4 bg-red-50/50 border border-red-100 rounded-2xl text-sm font-medium text-red-900 outline-none min-h-[100px] focus:ring-2 focus:ring-red-100" value={state.profile.allergies} onChange={e => saveProfile('allergies', e.target.value)} />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-orange-500 font-black uppercase ml-1">Condições Crônicas / Doenças</label>
                    <textarea className="w-full p-4 bg-orange-50/50 border border-orange-100 rounded-2xl text-sm font-medium text-orange-900 outline-none min-h-[100px] focus:ring-2 focus:ring-orange-100" value={state.profile.chronicConditions} onChange={e => saveProfile('chronicConditions', e.target.value)} />
                  </div>

                  {/* SEÇÃO DE CONTATOS DE EMERGÊNCIA */}
                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                          <i className="fas fa-phone-alt text-xs"></i>
                        </div>
                        <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Contatos de Emergência</h4>
                      </div>
                      <button 
                        onClick={() => setShowAddContact(!showAddContact)}
                        className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 active:scale-90 transition-all border border-rose-100 shadow-sm"
                      >
                        <i className={`fas ${showAddContact ? 'fa-minus' : 'fa-plus'} text-xs`}></i>
                      </button>
                    </div>

                    {showAddContact && (
                      <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl mb-4 space-y-3 animate-fade-in shadow-inner">
                        <input 
                          type="text" 
                          placeholder="Nome do Responsável"
                          className="w-full p-3 bg-white border border-rose-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-200"
                          value={newContactName}
                          onChange={e => setNewContactName(e.target.value)}
                        />
                        <input 
                          type="tel" 
                          placeholder="Telefone (00) 00000-0000"
                          className="w-full p-3 bg-white border border-rose-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-200"
                          value={newContactPhone}
                          onChange={e => setNewContactPhone(formatPhone(e.target.value))}
                        />
                        <button 
                          onClick={addEmergencyContact}
                          className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold text-xs uppercase shadow-lg shadow-rose-100 active:scale-95 transition-all"
                        >
                          Salvar Contato
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {(state.profile.emergencyContacts || []).length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                           <i className="fas fa-user-shield text-gray-300 text-2xl mb-2"></i>
                           <p className="text-[10px] text-gray-400 italic">Nenhum contato cadastrado.</p>
                        </div>
                      ) : (
                        (state.profile.emergencyContacts || []).map(contact => (
                          <div key={contact.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-rose-200 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                                <i className="fas fa-user text-xs"></i>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-800 leading-none mb-0.5">{contact.name}</p>
                                <p className="text-[11px] text-gray-500 font-medium">{contact.phone}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <a href={`tel:${contact.phone}`} className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center active:scale-90 transition-all border border-green-100 shadow-sm">
                                <i className="fas fa-phone-alt text-[10px]"></i>
                              </a>
                              <button 
                                onClick={() => removeEmergencyContact(contact.id)}
                                className="w-8 h-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center active:scale-90 transition-all border border-red-100 shadow-sm"
                              >
                                <i className="fas fa-trash-alt text-[10px]"></i>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
               </div>
               
               {/* Logout */}
               <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-gray-800">Sessão e Segurança</h3>
                  <button onClick={onLogout} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm flex items-center justify-center gap-3 border border-red-100 active:scale-95 transition-all shadow-sm">
                    <i className="fas fa-sign-out-alt"></i> SAIR DA CONTA
                  </button>
               </div>
             </div>
           )}

           {activeTab === 'caregivers' && (
             <div className="space-y-6">
                 <div className="bg-white p-6 rounded-2xl shadow-sm">
                   <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4 border-gray-100"><i className="fas fa-user-nurse text-teal-600"></i> Equipe Fixa</h3>
                   <div className="space-y-8">
                     {[0, 1, 2].map(idx => (
                       <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                         <div className="relative shrink-0">
                           <input type="file" id={`cg-${idx}`} className="hidden" onChange={(e) => handleCaregiverPhotoChange(idx, e)} />
                           <label htmlFor={`cg-${idx}`} className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden shadow-sm hover:border-teal-500 transition-colors">
                             {state.caregivers[idx]?.photo ? <img src={state.caregivers[idx].photo} className="w-full h-full object-cover" /> : <i className="fas fa-camera text-gray-200"></i>}
                           </label>
                           <span className="absolute -top-2 -left-2 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">#{idx+1}</span>
                         </div>
                         <div className="flex-1 space-y-3">
                           <input placeholder="Nome do Cuidador" className="w-full p-2 bg-white rounded-lg border border-gray-100 text-sm font-bold outline-none focus:border-teal-400" value={state.caregivers[idx]?.name || ''} onChange={e => handleCaregiverUpdate(idx, 'name', e.target.value)} />
                           <input placeholder="Telefone" className="w-full p-2 bg-white rounded-lg border border-gray-100 text-sm outline-none focus:border-teal-400" value={state.caregivers[idx]?.phone || ''} onChange={e => handleCaregiverUpdate(idx, 'phone', formatPhone(e.target.value))} />
                         </div>
                       </div>
                     ))}

                     {/* Cuidador Coringa */}
                     <div className="pt-6 mt-6 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                           <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                              <i className="fas fa-star text-xs"></i>
                           </div>
                           <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Cuidador Coringa (Reserva)</h4>
                        </div>
                        <div className="flex items-start gap-4 p-5 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] shadow-sm animate-fade-in">
                          <div className="relative shrink-0">
                            <input type="file" id="relief-cg" className="hidden" onChange={handleReliefCaregiverPhotoChange} />
                            <label htmlFor="relief-cg" className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-indigo-200 flex items-center justify-center cursor-pointer overflow-hidden shadow-sm hover:border-indigo-500 transition-colors">
                              {state.reliefCaregiver?.photo ? <img src={state.reliefCaregiver.photo} className="w-full h-full object-cover" /> : <i className="fas fa-user-plus text-indigo-200 text-2xl"></i>}
                            </label>
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                               <label className="text-[10px] text-indigo-400 font-bold uppercase ml-1">Nome Completo</label>
                               <input className="w-full p-3 bg-white rounded-xl border border-indigo-100 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200" value={state.reliefCaregiver?.name || ''} onChange={e => handleReliefCaregiverUpdate('name', e.target.value)} />
                            </div>
                            <div>
                               <label className="text-[10px] text-indigo-400 font-bold uppercase ml-1">Telefone / WhatsApp</label>
                               <input className="w-full p-3 bg-white rounded-xl border border-indigo-100 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-200" value={state.reliefCaregiver?.phone || ''} onChange={e => handleReliefCaregiverUpdate('phone', formatPhone(e.target.value))} />
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-[10px] text-indigo-400 text-center italic">Este contato é acionado para folgas, feriados ou emergências.</p>
                     </div>
                   </div>
                 </div>
             </div>
           )}

           {activeTab === 'rules' && (
             <div className="space-y-4">
               <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><i className="fas fa-scroll text-amber-500"></i> Regras da Casa</h3>
                    <button onClick={() => setShowAddRule(!showAddRule)} className="bg-amber-100 text-amber-600 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all">
                      {showAddRule ? 'Fechar' : 'Nova Regra'}
                    </button>
                  </div>

                  {showAddRule && (
                    <div className="bg-amber-50 p-4 rounded-xl mb-6 border border-amber-100 animate-fade-in">
                       <div className="flex gap-2 mb-3">
                          {(['attention', 'routines', 'hygiene'] as RuleCategory[]).map(cat => (
                            <button 
                              key={cat} 
                              onClick={() => setNewRuleCategory(cat)}
                              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${newRuleCategory === cat ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-400 border-gray-100'}`}
                            >
                              {categoryLabels[cat]}
                            </button>
                          ))}
                       </div>
                       <textarea 
                          className="w-full p-3 bg-white border border-amber-100 rounded-xl text-sm font-medium outline-none min-h-[80px] focus:ring-2 focus:ring-amber-200 mb-3"
                          placeholder="Ex: Não oferecer café após as 18h..."
                          value={newRuleText}
                          onChange={e => setNewRuleText(e.target.value)}
                       />
                       <button onClick={addRule} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-xs uppercase shadow-md active:scale-95">Salvar Regra</button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {(state.profile.houseRules || []).length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                         <i className="fas fa-lightbulb text-gray-200 text-4xl mb-3"></i>
                         <p className="text-xs text-gray-400 font-medium">Nenhuma regra cadastrada ainda.</p>
                      </div>
                    ) : (
                      (state.profile.houseRules || []).map(rule => (
                        <div key={rule.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl relative group">
                           <div className="flex items-center gap-2 mb-2">
                             <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${rule.category === 'attention' ? 'bg-rose-100 text-rose-600' : rule.category === 'routines' ? 'bg-teal-100 text-teal-600' : 'bg-blue-100 text-blue-600'}`}>
                                {categoryLabels[rule.category]}
                             </span>
                             <span className="text-[9px] text-gray-300 font-bold">{new Date(rule.date).toLocaleDateString()}</span>
                           </div>
                           <p className="text-sm font-medium text-gray-700 leading-relaxed pr-6 italic">"{rule.text}"</p>
                           <button onClick={() => removeRule(rule.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1">
                              <i className="fas fa-trash-alt text-xs"></i>
                           </button>
                        </div>
                      ))
                    )}
                  </div>
               </div>
             </div>
           )}
       </div>
    </div>
  );
};
