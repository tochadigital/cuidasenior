
import React, { useState } from 'react';
import { AppState, BloodType } from '../types';

interface Props {
  state: AppState;
  updateState: (s: Partial<AppState>) => void;
  showAlert: (title: string, msg: string) => void;
  onLogout: () => void;
}

export const AdminView: React.FC<Props> = ({ state, updateState, showAlert, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'caregivers' | 'rules'>('profile');

  const saveProfile = (key: string, val: any) => {
    updateState({ profile: { ...state.profile, [key]: val } });
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        saveProfile('photo', reader.result as string);
      };
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

  const handleCaregiverUpdate = (index: number, field: 'name' | 'phone', value: string) => {
    const newCaregivers = [...state.caregivers];
    newCaregivers[index] = { ...newCaregivers[index], [field]: value };
    updateState({ caregivers: newCaregivers });
  };

  const bloodTypes = Object.values(BloodType);

  return (
    <div className="h-full flex flex-col bg-gray-50">
       {/* Tab Sub-navigation - pr-14 gives space for the profile button in the top right */}
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
               </div>

               {/* Logout Section at the bottom of Profile */}
               <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-gray-800">Sessão e Segurança</h3>
                  <button 
                    onClick={onLogout}
                    className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm flex items-center justify-center gap-3 border border-red-100 active:scale-95 transition-all shadow-sm"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    SAIR DA CONTA
                  </button>
                  <p className="text-[10px] text-gray-400 text-center">
                    Você precisará fazer login novamente para acessar os dados sincronizados.
                  </p>
               </div>
             </div>
           )}

           {activeTab === 'caregivers' && (
             <div className="space-y-6">
                 <div className="bg-white p-6 rounded-2xl shadow-sm">
                   <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4 border-gray-100"><i className="fas fa-user-nurse text-teal-600"></i> Equipe de Cuidados</h3>
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
                           <input placeholder="Nome do Cuidador" className="w-full p-2 bg-white rounded-lg border border-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-100" value={state.caregivers[idx]?.name || ''} onChange={e => handleCaregiverUpdate(idx, 'name', e.target.value)} />
                           <input placeholder="Telefone de Contato" className="w-full p-2 bg-white rounded-lg border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-teal-100" value={state.caregivers[idx]?.phone || ''} onChange={e => handleCaregiverUpdate(idx, 'phone', e.target.value)} />
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
             </div>
           )}

           {activeTab === 'rules' && (
             <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-4 border-gray-100">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-book text-lg"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Regras e Orientações</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Manual da Residência</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 leading-relaxed italic">
                  Adicione lembretes importantes sobre a rotina da casa, preferências do idoso ou procedimentos específicos que devem ser seguidos por todos.
                </p>
                
                <div className="mt-4 p-5 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-sm shadow-inner">
                   <div className="flex items-start gap-3">
                      <i className="fas fa-info-circle mt-1"></i>
                      <p>Estas regras serão exibidas de forma aleatória no <strong>Dashboard</strong> para reforçar as orientações diárias aos cuidadores.</p>
                   </div>
                </div>

                <button className="w-full py-3 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold text-xs uppercase hover:bg-gray-50 transition-colors">
                  <i className="fas fa-plus mr-2"></i> Adicionar Nova Regra
                </button>
             </div>
           )}
       </div>
    </div>
  );
};
