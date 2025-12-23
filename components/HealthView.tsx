
import React, { useState, useEffect } from 'react';
import { AppState, Medication, VitalLog, Appointment, Exam } from '../types';

interface Props {
  state: AppState;
  updateState: (s: Partial<AppState>) => void;
  initialTab?: 'meds' | 'vitals' | 'appts' | 'exams';
  showAlert: (title: string, msg: string) => void;
}

const WEEKDAYS = [
  { id: 'seg', label: 'SEG' },
  { id: 'ter', label: 'TER' },
  { id: 'qua', label: 'QUA' },
  { id: 'qui', label: 'QUI' },
  { id: 'sex', label: 'SEX' },
  { id: 'sab', label: 'SAB' },
  { id: 'dom', label: 'DOM' },
];

export const HealthView: React.FC<Props> = ({ state, updateState, initialTab = 'meds', showAlert }) => {
  const [activeTab, setActiveTab] = useState<'meds' | 'vitals' | 'appts' | 'exams'>(initialTab);
  
  // Meds Form State
  const [newMed, setNewMed] = useState<Partial<Medication>>({
    days: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Frequency Logic
  const [frequencyMode, setFrequencyMode] = useState<'single' | 'interval'>('single');
  const [intervalHours, setIntervalHours] = useState<number>(8);

  // Vitals Form State
  const [newVital, setNewVital] = useState({ systolic: 120, diastolic: 80, oxygen: 98 });
  
  // Appointments Form State
  const [apptForm, setApptForm] = useState({ specialty: '', doctor: '', address: '', date: '', time: '' });
  const [showApptForm, setShowApptForm] = useState(false);
  const [editingApptId, setEditingApptId] = useState<string | null>(null);

  // Exams Form State
  const [examForm, setExamForm] = useState({ doctor: '', location: '', address: '', date: '', time: '' });
  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [currentExamTypeInput, setCurrentExamTypeInput] = useState('');
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [showExamForm, setShowExamForm] = useState(false);

  const [showMedForm, setShowMedForm] = useState(false);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const toggleMed = (id: string) => {
    const updated = (state.medications || []).map(m => 
      m.id === id ? { ...m, takenToday: !m.takenToday } : m
    );
    updateState({ medications: updated });
  };

  const deleteMedication = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = (state.medications || []).filter(m => m.id !== id);
    updateState({ medications: updated });
  };

  const saveMedication = () => {
    if (!newMed.name || !newMed.time) {
        showAlert('Campos Faltando', 'Por favor, insira o nome e o horário do medicamento.');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (newMed.startDate && newMed.startDate < today) {
      showAlert('Atenção', 'A data de início não pode ser anterior ao dia de hoje.');
      return;
    }

    if (newMed.endDate) {
      if (newMed.endDate < today) {
        showAlert('Atenção', 'A data de término não pode ser anterior ao dia de hoje.');
        return;
      }
      if (newMed.startDate && newMed.endDate < newMed.startDate) {
         showAlert('Atenção', 'A data de término não pode ser anterior à data de início.');
         return;
      }
    }

    let medsToSave: Medication[] = [];
    const currentMeds = state.medications || [];

    if (editingId) {
      const updatedMeds = currentMeds.map(m =>
        m.id === editingId
          ? {
              ...m,
              name: newMed.name!,
              dosage: newMed.dosage || '',
              time: newMed.time!,
              days: newMed.days,
              startDate: newMed.startDate,
              endDate: newMed.endDate
            }
          : m
      );
      updateState({ medications: updatedMeds });
      setEditingId(null);
    } else {
      if (frequencyMode === 'single') {
        medsToSave.push({
          id: Date.now().toString(),
          name: newMed.name,
          dosage: newMed.dosage || '',
          time: newMed.time,
          takenToday: false,
          days: newMed.days,
          startDate: newMed.startDate,
          endDate: newMed.endDate
        });
      } else {
        const [startH, startM] = newMed.time.split(':').map(Number);
        const interval = Math.max(1, intervalHours); 
        
        for (let i = 0; i < (24 / interval); i++) {
          let nextH = startH + (i * interval);
          let realH = nextH % 24; 
          
          if (i > 0 && realH === startH) break;

          const timeStr = `${realH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
          
          medsToSave.push({
            id: (Date.now() + i).toString(), 
            name: newMed.name,
            dosage: newMed.dosage || '',
            time: timeStr,
            takenToday: false,
            days: newMed.days,
            startDate: newMed.startDate,
            endDate: newMed.endDate
          });
        }
      }
      
      updateState({ medications: [...currentMeds, ...medsToSave] });
    }

    setNewMed({ days: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] });
    setFrequencyMode('single');
    setShowMedForm(false);
  };

  const startEditing = (e: React.MouseEvent, med: Medication) => {
    e.preventDefault();
    e.stopPropagation();
    setNewMed({
      name: med.name,
      dosage: med.dosage,
      time: med.time,
      days: med.days,
      startDate: med.startDate,
      endDate: med.endDate
    });
    setFrequencyMode('single');
    setEditingId(med.id);
    setShowMedForm(true);
  };

  const cancelEdit = () => {
    setNewMed({ days: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] });
    setEditingId(null);
    setFrequencyMode('single');
    setShowMedForm(false);
  };

  const toggleDay = (dayId: string) => {
    const currentDays = newMed.days || [];
    if (currentDays.includes(dayId)) {
      setNewMed({ ...newMed, days: currentDays.filter(d => d !== dayId) });
    } else {
      setNewMed({ ...newMed, days: [...currentDays, dayId] });
    }
  };

  const addVital = () => {
    const vital: VitalLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...newVital
    };
    updateState({ vitals: [...(state.vitals || []), vital] });
    showAlert('Sucesso', 'Sinal vital registrado com sucesso.');
  };

  // Appointment Functions
  const saveAppointment = () => {
    if (!apptForm.specialty || !apptForm.date || !apptForm.time) {
        showAlert('Campos Obrigatórios', 'Por favor, preencha a Especialidade, Data e Hora da consulta.');
        return;
    }

    if (editingApptId) {
        const updated = state.appointments.map(a => 
            a.id === editingApptId ? {
                ...a,
                specialty: apptForm.specialty,
                doctorName: apptForm.doctor,
                address: apptForm.address,
                datetime: `${apptForm.date}T${apptForm.time}`
            } : a
        ).sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
        updateState({ appointments: updated });
        setEditingApptId(null);
    } else {
        const newAppt: Appointment = {
          id: Date.now().toString(),
          specialty: apptForm.specialty,
          doctorName: apptForm.doctor,
          address: apptForm.address,
          datetime: `${apptForm.date}T${apptForm.time}`,
          notify: true,
          notified: false
        };
        const updated = [...state.appointments, newAppt].sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
        updateState({ appointments: updated });
    }
    
    setApptForm({ specialty: '', doctor: '', address: '', date: '', time: '' });
    setShowApptForm(false);
  };

  const startEditingAppt = (appt: Appointment) => {
    setApptForm({
      specialty: appt.specialty,
      doctor: appt.doctorName || '',
      address: appt.address,
      date: appt.datetime.split('T')[0],
      time: appt.datetime.split('T')[1].slice(0, 5)
    });
    setEditingApptId(appt.id);
    setShowApptForm(true);
  };

  const cancelApptEdit = () => {
    setApptForm({ specialty: '', doctor: '', address: '', date: '', time: '' });
    setEditingApptId(null);
    setShowApptForm(false);
  };

  const deleteAppointment = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    updateState({ appointments: state.appointments.filter(a => a.id !== id) });
  };

  const toggleReminder = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const appt = state.appointments.find(a => a.id === id);
    if (!appt) return;

    const willNotify = !appt.notify;
    if (willNotify && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const updated = state.appointments.map(a => 
      a.id === id ? { ...a, notify: willNotify, notified: false } : a
    );
    updateState({ appointments: updated });

    if (willNotify) {
        showAlert('Lembrete Ativado', 'Você será notificado 1 hora antes da consulta.');
    }
  };

  // Exams Functions
  const addExamType = () => {
    if (currentExamTypeInput.trim()) {
      setExamTypes([...examTypes, currentExamTypeInput.trim()]);
      setCurrentExamTypeInput('');
    }
  };

  const removeExamType = (index: number) => {
    setExamTypes(examTypes.filter((_, i) => i !== index));
  };

  const saveExam = () => {
    if (!examForm.doctor || examTypes.length === 0 || !examForm.date || !examForm.time) {
      showAlert('Dados Incompletos', 'Preencha o médico, adicione pelo menos um tipo de exame, data e hora.');
      return;
    }

    if (editingExamId) {
        const updatedExams = (state.exams || []).map(e => 
            e.id === editingExamId ? {
                ...e,
                doctorName: examForm.doctor,
                examTypes: [...examTypes],
                locationName: examForm.location,
                address: examForm.address,
                datetime: `${examForm.date}T${examForm.time}`
            } : e
        ).sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
        updateState({ exams: updatedExams });
        setEditingExamId(null);
    } else {
        const newExam: Exam = {
          id: Date.now().toString(),
          doctorName: examForm.doctor,
          examTypes: [...examTypes],
          locationName: examForm.location,
          address: examForm.address,
          datetime: `${examForm.date}T${examForm.time}`
        };
        const updated = [...(state.exams || []), newExam].sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
        updateState({ exams: updated });
    }
    
    setExamForm({ doctor: '', location: '', address: '', date: '', time: '' });
    setExamTypes([]);
    setShowExamForm(false);
  };

  const deleteExam = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    updateState({ exams: (state.exams || []).filter(e => e.id !== id) });
  };

  const startEditingExam = (exam: Exam) => {
    setExamForm({
      doctor: exam.doctorName,
      location: exam.locationName,
      address: exam.address,
      date: exam.datetime.split('T')[0],
      time: exam.datetime.split('T')[1].slice(0, 5)
    });
    setExamTypes([...exam.examTypes]);
    setEditingExamId(exam.id);
    setShowExamForm(true);
  };

  const cancelExamEdit = () => {
    setExamForm({ doctor: '', location: '', address: '', date: '', time: '' });
    setExamTypes([]);
    setEditingExamId(null);
    setShowExamForm(false);
  };

  const todayDate = new Date().toISOString().split('T')[0];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <style>{`
        input[type="time"]::-webkit-calendar-picker-indicator,
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(130deg) brightness(91%) contrast(86%);
          cursor: pointer;
        }
      `}</style>

      <div className="bg-white shadow-sm p-4 pr-16 sticky top-0 z-10">
        <div className="flex p-1 bg-gray-100 rounded-lg">
          <button 
            onClick={() => setActiveTab('meds')}
            className={`flex-1 py-2 px-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'meds' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}
          >
            Medicamentos
          </button>
          <button 
            onClick={() => setActiveTab('vitals')}
            className={`flex-1 py-2 px-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'vitals' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}
          >
            Sinais
          </button>
          <button 
            onClick={() => setActiveTab('appts')}
            className={`flex-1 py-2 px-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'appts' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}
          >
            Consultas
          </button>
          <button 
            onClick={() => setActiveTab('exams')}
            className={`flex-1 py-2 px-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'exams' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}
          >
            Exames
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-6">
        {activeTab === 'meds' && (
          <div className="space-y-4">
            {!showMedForm && (
              <button 
                onClick={() => {
                  setNewMed({ days: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] });
                  setEditingId(null);
                  setFrequencyMode('single');
                  setShowMedForm(true);
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <i className="fas fa-plus"></i> Adicionar Medicamento
              </button>
            )}

            {showMedForm && (
              <div className="bg-white p-4 rounded-xl shadow-sm space-y-4 animate-fade-in">
                <div>
                  <label className="text-xs text-gray-500 font-bold mb-1 block">Nome do Medicamento</label>
                  <input 
                    type="text"
                    className="w-full p-3 bg-white rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    value={newMed.name || ''} onChange={e => setNewMed({...newMed, name: e.target.value})}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 font-bold mb-1 block">Dose</label>
                    <input 
                      type="text" placeholder="Ex: 50mg" 
                      className="w-full p-3 bg-white rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      value={newMed.dosage || ''} onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                    />
                  </div>
                </div>

                {!editingId && (
                   <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <label className="text-xs text-gray-500 font-bold mb-2 block">Frequência</label>
                      <div className="flex gap-2 mb-3">
                         <button 
                           onClick={() => setFrequencyMode('single')}
                           className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${frequencyMode === 'single' ? 'bg-teal-600 text-white shadow' : 'bg-white text-gray-500 border border-gray-200'}`}
                         >
                           Horário Único
                         </button>
                         <button 
                           onClick={() => setFrequencyMode('interval')}
                           className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${frequencyMode === 'interval' ? 'bg-teal-600 text-white shadow' : 'bg-white text-gray-500 border border-gray-200'}`}
                         >
                           Intervalos
                         </button>
                      </div>

                      <div className="flex gap-3 items-end">
                         <div className="flex-1">
                            <label className="text-xs text-gray-400 font-bold mb-1 block">
                              {frequencyMode === 'single' ? 'Horário' : '1ª Dose'}
                            </label>
                            <input 
                              type="time" 
                              className="w-full p-3 bg-white rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                              style={{ colorScheme: 'light' }}
                              onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                              value={newMed.time || ''} onChange={e => setNewMed({...newMed, time: e.target.value})}
                            />
                         </div>
                         {frequencyMode === 'interval' && (
                           <div className="flex-1">
                             <label className="text-xs text-gray-400 font-bold mb-1 block">Repetir a cada</label>
                             <div className="relative">
                               <input 
                                 type="number" 
                                 min="1"
                                 max="24"
                                 className="w-full p-3 bg-white rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                 value={intervalHours} onChange={e => setIntervalHours(parseInt(e.target.value))}
                               />
                               <span className="absolute right-3 top-3.5 text-xs text-gray-400 font-bold">horas</span>
                             </div>
                           </div>
                         )}
                      </div>
                   </div>
                )}

                {editingId && (
                  <div>
                    <label className="text-xs text-gray-500 font-bold mb-1 block">Horário</label>
                    <input 
                      type="time" 
                      className="w-full p-3 bg-white rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      style={{ colorScheme: 'light' }}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      value={newMed.time || ''} onChange={e => setNewMed({...newMed, time: e.target.value})}
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-500 font-bold mb-2 block uppercase tracking-wider">Repetir Medicação</label>
                  <div className="flex flex-nowrap gap-1">
                    {WEEKDAYS.map(day => {
                      const isSelected = newMed.days?.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          onClick={() => toggleDay(day.id)}
                          className={`h-10 flex-1 rounded-lg text-xs font-bold transition-all border ${isSelected ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-bold mb-1 block">Data Início</label>
                    <input 
                      type="date"
                      min={todayDate} 
                      className="w-full p-3 bg-white rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm"
                      style={{ colorScheme: 'light' }}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      value={newMed.startDate || ''} onChange={e => setNewMed({...newMed, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-bold mb-1 block">Data Término (Opcional)</label>
                    <input 
                      type="date" 
                      min={todayDate}
                      className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm"
                      style={{ colorScheme: 'light' }}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      value={newMed.endDate || ''} onChange={e => setNewMed({...newMed, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
                  <button onClick={saveMedication} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium shadow-lg shadow-teal-200 transition-all active:scale-95">
                    {editingId ? 'Atualizar' : 'Salvar'}
                  </button>
                  <button onClick={cancelEdit} className="px-4 text-gray-500 font-medium hover:bg-gray-50 rounded-lg">Cancelar</button>
                </div>
              </div>
            )}

            {[...(state.medications || [])].sort((a,b) => (a.time || '').localeCompare(b.time || '')).map(med => (
              <div key={med.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between group relative cursor-pointer" onClick={(e) => startEditing(e, med)}>
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors shrink-0 ${med.takenToday ? 'bg-green-100 text-green-600' : 'bg-rose-50 text-rose-500'}`}>
                    <i className={`fas ${med.takenToday ? 'fa-check' : 'fa-capsules'} text-lg`}></i>
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-lg truncate ${med.takenToday ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{med.name}</h3>
                    <p className="text-sm text-gray-500">{med.dosage} • <i className="far fa-clock ml-1"></i> {med.time}</p>
                    
                    {(med.startDate || med.endDate) && (
                      <p className="text-[10px] text-teal-600 font-medium mt-0.5">
                          <i className="far fa-calendar-alt mr-1"></i>
                          {med.startDate ? new Date(med.startDate).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: '2-digit'}) : '...'} 
                          {med.endDate ? ` até ${new Date(med.endDate).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: '2-digit'})}` : ''}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(!med.days || med.days.length === 7) ? (
                         <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">Todos os dias</span>
                      ) : (
                          WEEKDAYS.map(d => (
                             med.days?.includes(d.id) && <span key={d.id} className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{d.label}</span>
                          ))
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 relative z-10 shrink-0">
                  <button onClick={(e) => deleteMedication(e, med.id)} className="h-10 w-10 rounded-full bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center shadow-sm cursor-pointer z-20">
                    <i className="fas fa-trash"></i>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleMed(med.id); }} className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all active:scale-95 cursor-pointer ${med.takenToday ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 text-gray-300 hover:border-teal-500 hover:text-teal-500'}`}>
                    <i className="fas fa-check"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="space-y-6">
             <div className="bg-white p-5 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Registrar Sinais Vitais</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Sistólica</label>
                  <input type="number" className="w-full p-2 bg-white rounded-lg text-center font-bold border border-gray-200 text-gray-900" 
                    value={newVital.systolic} onChange={e => setNewVital({...newVital, systolic: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Diastólica</label>
                  <input type="number" className="w-full p-2 bg-white rounded-lg text-center font-bold border border-gray-200 text-gray-900" 
                    value={newVital.diastolic} onChange={e => setNewVital({...newVital, diastolic: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">SpO2 %</label>
                  <input type="number" className="w-full p-2 bg-white rounded-lg text-center font-bold border border-gray-200 text-gray-900" 
                    value={newVital.oxygen} onChange={e => setNewVital({...newVital, oxygen: parseInt(e.target.value)})} />
                </div>
              </div>
              <button onClick={addVital} className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium shadow-lg shadow-teal-200">Salvar Registro</button>
            </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm overflow-hidden">
              <h3 className="font-bold text-gray-700 mb-4 text-sm">Histórico Completo</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-teal-50 text-teal-800 text-xs uppercase tracking-wider border-b border-teal-100">
                      <th className="py-3 px-2 text-left rounded-tl-lg">Data</th>
                      <th className="py-3 px-2 text-left">Hora</th>
                      <th className="py-3 px-2 text-center">Pressão</th>
                      <th className="py-3 px-2 text-center rounded-tr-lg">SpO2</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {[...(state.vitals || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(vital => (
                       <tr key={vital.id} className="hover:bg-gray-50 transition-colors">
                         <td className="py-3 px-2 text-gray-800 font-medium">
                           {new Date(vital.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}
                         </td>
                         <td className="py-3 px-2 text-gray-500">
                           {new Date(vital.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                         </td>
                         <td className="py-3 px-2 text-center font-bold text-gray-800">
                           {vital.systolic}/{vital.diastolic}
                         </td>
                         <td className="py-3 px-2 text-center font-bold text-teal-600">
                           {vital.oxygen}%
                         </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appts' && (
           <div className="space-y-4">
            {!showApptForm && (
               <div className="bg-teal-50 p-4 rounded-2xl border border-teal-200 shadow-sm flex justify-between items-center">
                  <h3 className="text-teal-800 font-bold text-lg">Agendar Consulta</h3>
                  <button 
                    onClick={() => {
                      setApptForm({ specialty: '', doctor: '', address: '', date: '', time: '' });
                      setEditingApptId(null);
                      setShowApptForm(true);
                    }}
                    className="bg-teal-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md hover:bg-teal-700 active:scale-95 transition-all"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
               </div>
            )}

            {showApptForm && (
              <div className="bg-teal-50 p-5 rounded-2xl border border-teal-200 shadow-sm animate-fade-in">
                 <h3 className="text-teal-800 font-bold mb-3 text-lg">
                   {editingApptId ? 'Atualizar Consulta' : 'Agendar Consulta'}
                 </h3>
                 
                 <label className="text-xs text-teal-600 font-bold ml-1 mb-1 block">Especialidade</label>
                 <input 
                   type="text" 
                   placeholder="Ex: Cardiologista" 
                   className="w-full p-3 mb-3 rounded-xl border border-teal-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" 
                   value={apptForm.specialty}
                   onChange={e => setApptForm({...apptForm, specialty: e.target.value})}
                 />

                 <label className="text-xs text-teal-600 font-bold ml-1 mb-1 block">Médico</label>
                 <input 
                   type="text" 
                   placeholder="Ex: Dr. Santos" 
                   className="w-full p-3 mb-3 rounded-xl border border-teal-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" 
                   value={apptForm.doctor}
                   onChange={e => setApptForm({...apptForm, doctor: e.target.value})}
                 />

                 <label className="text-xs text-teal-600 font-bold ml-1 mb-1 block">Endereço</label>
                 <input 
                   type="text" 
                   placeholder="Ex: Av. Paulista, 1000 - CJ 42" 
                   className="w-full p-3 mb-3 rounded-xl border border-teal-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" 
                   value={apptForm.address}
                   onChange={e => setApptForm({...apptForm, address: e.target.value})}
                 />
                 
                 <div className="flex gap-3">
                   <div className="flex-1">
                      <label className="text-xs text-teal-600 font-bold ml-1 mb-1 block">Data</label>
                      <input 
                          type="date" 
                          className="w-full p-3 rounded-xl border border-teal-200 bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" 
                          style={{ colorScheme: 'light' }}
                          onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                          value={apptForm.date}
                          onChange={e => setApptForm({...apptForm, date: e.target.value})}
                      />
                   </div>
                   <div className="w-1/3">
                      <label className="text-xs text-teal-600 font-bold ml-1 mb-1 block">Hora</label>
                      <input 
                          type="time" 
                          className="w-full p-3 rounded-xl border border-teal-200 bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" 
                          style={{ colorScheme: 'light' }}
                          onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                          value={apptForm.time}
                          onChange={e => setApptForm({...apptForm, time: e.target.value})}
                      />
                   </div>
                 </div>
                 
                 <div className="flex gap-2 mt-4">
                   <button onClick={saveAppointment} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-teal-200 transition-all active:scale-95">
                     {editingApptId ? 'Atualizar' : 'Agendar'}
                   </button>
                   <button onClick={cancelApptEdit} className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-bold transition-all">
                     Cancelar
                   </button>
                 </div>
              </div>
            )}
            
            <div className="space-y-3">
                <h3 className="font-bold text-gray-700 ml-1">Próximas Consultas</h3>
                <p className="text-[10px] text-gray-400 ml-1 mb-2 italic">Toque em uma consulta para editá-la</p>
                {state.appointments.map(appt => (
                    <div 
                        key={appt.id} 
                        className="bg-white p-4 rounded-xl border-l-4 border-teal-500 shadow-sm flex justify-between items-center cursor-pointer active:bg-gray-50 transition-colors"
                        onClick={() => startEditingAppt(appt)}
                    >
                        <div className="overflow-hidden flex-1 pr-2">
                            <h4 className="font-bold text-gray-800 truncate">
                                {appt.specialty} 
                                {appt.doctorName && <span className="text-teal-600 font-normal text-sm ml-1">- {appt.doctorName}</span>}
                            </h4>
                            {appt.address && (
                                <p className="text-xs text-gray-500 mb-1 truncate">
                                    <i className="fas fa-map-marker-alt text-teal-400 mr-1"></i>{appt.address}
                                </p>
                            )}
                            <p className="text-sm text-gray-500">
                                {new Date(appt.datetime).toLocaleDateString('pt-BR')} às {new Date(appt.datetime).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                             className={`p-2 rounded-full w-10 h-10 flex items-center justify-center transition-colors active:scale-95 ${appt.notify ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'}`}
                             onClick={(e) => toggleReminder(e, appt.id)}
                             title="Definir Lembrete (1h antes)"
                          >
                              <i className="fas fa-bell"></i>
                          </button>
                          <button className="p-2 rounded-full w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 active:scale-95" onClick={(e) => deleteAppointment(e, appt.id)}>
                              <i className="fas fa-trash"></i>
                          </button>
                        </div>
                    </div>
                ))}
                {state.appointments.length === 0 && <p className="text-center text-gray-400 py-4 bg-white rounded-xl border border-gray-100">Nenhuma consulta agendada.</p>}
            </div>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="space-y-4">
            {!showExamForm && (
               <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 shadow-sm flex justify-between items-center">
                  <h3 className="text-indigo-800 font-bold text-lg">Agendar Exame</h3>
                  <button 
                    onClick={() => {
                        setExamForm({ doctor: '', location: '', address: '', date: '', time: '' });
                        setExamTypes([]);
                        setEditingExamId(null);
                        setShowExamForm(true);
                    }}
                    className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
               </div>
            )}

            {showExamForm && (
              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-200 shadow-sm animate-fade-in">
                 <h3 className="text-indigo-800 font-bold mb-3 text-lg">
                   {editingExamId ? 'Atualizar Exame' : 'Agendar Exame'}
                 </h3>
                 
                 <label className="text-xs text-indigo-600 font-bold ml-1 mb-1 block">Médico</label>
                 <input 
                   type="text" 
                   placeholder="Ex: Dr. Silva" 
                   className="w-full p-3 mb-3 rounded-xl border border-indigo-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" 
                   value={examForm.doctor}
                   onChange={e => setExamForm({...examForm, doctor: e.target.value})}
                 />

                 <label className="text-xs text-indigo-600 font-bold ml-1 mb-1 block">Tipos de Exame</label>
                 <div className="flex gap-2 mb-2">
                   <input 
                     type="text" 
                     placeholder="Ex: Hemograma, Raio-X..." 
                     className="flex-1 p-3 rounded-xl border border-indigo-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" 
                     value={currentExamTypeInput}
                     onChange={e => setCurrentExamTypeInput(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && addExamType()}
                   />
                   <button onClick={addExamType} className="bg-indigo-600 text-white w-12 rounded-xl flex items-center justify-center shadow-md hover:bg-indigo-700">
                     <i className="fas fa-plus"></i>
                   </button>
                 </div>
                 <div className="flex flex-wrap gap-2 mb-3">
                   {examTypes.map((type, index) => (
                     <span key={index} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                       {type}
                       <button onClick={() => removeExamType(index)} className="hover:text-red-500"><i className="fas fa-times"></i></button>
                     </span>
                   ))}
                 </div>

                 <label className="text-xs text-indigo-600 font-bold ml-1 mb-1 block">Local</label>
                 <input 
                   type="text" 
                   placeholder="Ex: Lab. Delboni" 
                   className="w-full p-3 mb-3 rounded-xl border border-indigo-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" 
                   value={examForm.location}
                   onChange={e => setExamForm({...examForm, location: e.target.value})}
                 />

                 <label className="text-xs text-indigo-600 font-bold ml-1 mb-1 block">Endereço</label>
                 <input 
                   type="text" 
                   placeholder="Ex: Av. Brasil, 500" 
                   className="w-full p-3 mb-3 rounded-xl border border-indigo-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" 
                   value={examForm.address}
                   onChange={e => setExamForm({...examForm, address: e.target.value})}
                 />
                 
                 <div className="flex gap-3">
                   <div className="flex-1">
                      <label className="text-xs text-indigo-600 font-bold ml-1 mb-1 block">Data</label>
                      <input 
                          type="date" 
                          className="w-full p-3 rounded-xl border border-indigo-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" 
                          style={{ colorScheme: 'light' }}
                          onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                          value={examForm.date}
                          onChange={e => setExamForm({...examForm, date: e.target.value})}
                      />
                   </div>
                   <div className="w-1/3">
                      <label className="text-xs text-indigo-600 font-bold ml-1 mb-1 block">Hora</label>
                      <input 
                          type="time" 
                          className="w-full p-3 rounded-xl border border-indigo-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" 
                          style={{ colorScheme: 'light' }}
                          onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                          value={examForm.time}
                          onChange={e => setExamForm({...examForm, time: e.target.value})}
                      />
                   </div>
                 </div>
                 
                 <div className="flex gap-2 mt-4">
                   <button onClick={saveExam} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95">
                     {editingExamId ? 'Atualizar' : 'Agendar Exame'}
                   </button>
                   <button onClick={cancelExamEdit} className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-bold transition-all">
                     Cancelar
                   </button>
                 </div>
              </div>
            )}
            
            <div className="space-y-3">
                <h3 className="font-bold text-gray-700 ml-1">Exames Agendados</h3>
                {(state.exams || []).map(exam => (
                    <div key={exam.id} className="bg-white p-4 rounded-xl border-l-4 border-indigo-500 shadow-sm flex justify-between items-center cursor-pointer active:bg-gray-50 transition-colors" onClick={() => startEditingExam(exam)}>
                        <div className="overflow-hidden flex-1 pr-2">
                            <div className="flex flex-wrap gap-1 mb-1">
                               {exam.examTypes.map((t, i) => (
                                 <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">{t}</span>
                               ))}
                            </div>
                            <h4 className="font-bold text-gray-800 truncate text-sm">
                                Dr(a). {exam.doctorName}
                            </h4>
                            {exam.locationName && (
                                <p className="text-xs text-gray-500 font-medium truncate">
                                    {exam.locationName}
                                </p>
                            )}
                            {exam.address && (
                                <p className="text-xs text-gray-400 mb-1 truncate">
                                    <i className="fas fa-map-marker-alt text-indigo-400 mr-1"></i>{exam.address}
                                </p>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date(exam.datetime).toLocaleDateString('pt-BR')} às {new Date(exam.datetime).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                        <div className="flex gap-1">
                          <button className="p-2 rounded-full w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 active:scale-95 shrink-0" onClick={(e) => deleteExam(e, exam.id)}>
                                <i className="fas fa-trash"></i>
                          </button>
                        </div>
                    </div>
                ))}
                {(!state.exams || state.exams.length === 0) && <p className="text-center text-gray-400 py-4 bg-white rounded-xl border border-gray-100">Nenhum exame agendado.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
