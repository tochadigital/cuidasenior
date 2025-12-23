
import React, { useMemo } from 'react';
import { AppState } from '../types';

interface Props {
  state: AppState;
  onNavigate: (view: string) => void;
  showAlert: (title: string, msg: string) => void;
}

export const Dashboard: React.FC<Props> = ({ state, onNavigate, showAlert }) => {
  const pendingMeds = state.medications.filter(m => !m.takenToday).length;
  const nextAppt = state.appointments
    .filter(a => new Date(a.datetime) > new Date())
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())[0];

  const nextExam = (state.exams || [])
    .filter(e => new Date(e.datetime) > new Date())
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())[0];

  // Select a random rule from the houseRules array
  const randomRule = useMemo(() => {
    const rules = state.profile.houseRules || [];
    if (rules.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * rules.length);
    return rules[randomIndex];
  }, [state.profile.houseRules]); // Only re-calculate if rules change

  const categoryLabels: Record<string, string> = { 
    attention: 'Atenção', 
    routines: 'Rotina', 
    hygiene: 'Higiene' 
  };

  return (
    <div className="h-full overflow-y-auto space-y-6 pb-6 bg-gray-50">
      {/* Header */}
      <div className="bg-teal-600 text-white p-6 rounded-b-3xl shadow-lg pt-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Olá, Cuidador(a)</h1>
            <p className="text-teal-100">Cuidando de {state.profile.name}</p>
          </div>
          {/* Spacer for Profile Icon which is overlaid in App.tsx */}
          <div className="w-12"></div> 
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div onClick={() => onNavigate('health')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer">
            <div className="h-10 w-10 bg-rose-100 rounded-full flex items-center justify-center mb-3">
              <i className="fas fa-pills text-rose-500"></i>
            </div>
            <h3 className="font-bold text-gray-800">{pendingMeds} Pendentes</h3>
            <p className="text-xs text-gray-500">Medicamentos</p>
          </div>

          <div onClick={() => onNavigate('health_appts')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer">
            <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center mb-3">
              <i className="fas fa-calendar-check text-teal-500"></i>
            </div>
            <h3 className="font-bold text-gray-800">{nextAppt ? new Date(nextAppt.datetime).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'}) : 'Nada'}</h3>
            <p className="text-xs text-gray-500">Próxima Consulta</p>
          </div>
        </div>

        {/* Vitals & Exams Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Recent Vitals */}
          <div onClick={() => onNavigate('health_vitals')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
               <i className="fas fa-heartbeat text-teal-500 text-xs"></i>
               <h2 className="font-bold text-sm text-gray-800">Sinais Vitais</h2>
            </div>
            
            {state.vitals && state.vitals.length > 0 ? (
              <div>
                <div className="mb-2">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Pressão</p>
                  <p className="text-lg font-bold text-gray-800 leading-none">
                    {state.vitals[state.vitals.length-1].systolic}/{state.vitals[state.vitals.length-1].diastolic}
                  </p>
                </div>
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">SpO2</p>
                      <p className="text-sm font-bold text-teal-600">{state.vitals[state.vitals.length-1].oxygen}%</p>
                   </div>
                   <p className="text-[10px] text-gray-400 font-medium">
                     {new Date(state.vitals[state.vitals.length-1].date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                   </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                 <p className="text-gray-300 text-xs">Sem registros</p>
              </div>
            )}
          </div>

          {/* Next Exam */}
          <div onClick={() => onNavigate('health_exams')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
               <i className="fas fa-file-medical text-indigo-500 text-xs"></i>
               <h2 className="font-bold text-sm text-gray-800">Exames</h2>
            </div>
            
            {nextExam ? (
              <div>
                <div className="mb-2">
                   <p className="text-[10px] text-gray-400 uppercase font-bold">Próximo</p>
                   <p className="text-sm font-bold text-gray-800 leading-tight truncate" title={nextExam.examTypes.join(', ')}>
                     {nextExam.examTypes[0]}
                   </p>
                   {nextExam.examTypes.length > 1 && <span className="text-[9px] text-indigo-500 font-bold">+{nextExam.examTypes.length - 1} outros</span>}
                </div>
                <div className="flex flex-col">
                   <p className="text-xs font-bold text-indigo-600">
                     {new Date(nextExam.datetime).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                   </p>
                   <p className="text-[10px] text-gray-400 font-medium">
                     {new Date(nextExam.datetime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                   </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                 <p className="text-gray-300 text-xs">Nenhum</p>
              </div>
            )}
          </div>
        </div>

        {/* Health Conditions Grid */}
        <div className="grid grid-cols-2 gap-4">
            {/* Allergies Alert */}
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm">
              <h2 className="font-bold text-xs text-rose-500 mb-2 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i> Alergias
              </h2>
              <p className="text-gray-700 text-xs font-medium leading-relaxed bg-white/50 p-2 rounded-lg border border-rose-100 min-h-[3rem]">
                {state.profile.allergies || 'Nenhuma conhecida'}
              </p>
            </div>

            {/* Chronic Conditions */}
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 shadow-sm">
              <h2 className="font-bold text-xs text-orange-500 mb-2 flex items-center gap-2">
                <i className="fas fa-heart-pulse"></i> Doenças
              </h2>
              <p className="text-gray-700 text-xs font-medium leading-relaxed bg-white/50 p-2 rounded-lg border border-orange-100 min-h-[3rem]">
                {state.profile.chronicConditions || 'Nenhuma conhecida'}
              </p>
            </div>
        </div>

        {/* Daily Guidelines Preview (Random Rule) */}
        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
          <h2 className="font-bold text-lg text-amber-800 mb-2 flex items-center justify-between">
            <span><i className="fas fa-lightbulb mr-2"></i>Orientações do Dia</span>
            {randomRule && (
               <span className="text-[10px] bg-white/60 px-2 py-1 rounded-lg text-amber-700 uppercase font-bold">
                 {categoryLabels[randomRule.category]}
               </span>
            )}
          </h2>
          <p className="text-amber-900/80 text-sm italic leading-relaxed">
            {randomRule ? `"${randomRule.text}"` : "Nenhuma orientação cadastrada. Adicione regras no menu de Perfil."}
          </p>
        </div>
      </div>
    </div>
  );
};
