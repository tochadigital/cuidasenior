
import React, { useState, useRef, useEffect } from 'react';
import { AppState, GeneralTask, Repair, ShoppingItem, Expense } from '../types';
import { analyzeReceipt } from '../services/geminiService';

interface Props {
  state: AppState;
  updateState: (s: Partial<AppState>) => void;
  showAlert: (title: string, msg: string) => void;
}

export const TasksView: React.FC<Props> = ({ state, updateState, showAlert }) => {
  const [tab, setTab] = useState<'tasks' | 'repairs' | 'shopping' | 'expenses'>('tasks');
  
  // Inputs
  const [taskInput, setTaskInput] = useState('');
  const [repairInput, setRepairInput] = useState('');
  const [shoppingInput, setShoppingInput] = useState('');
  const [shoppingCat, setShoppingCat] = useState<'Meds' | 'Market'>('Market');
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Task Recipient State
  const [taskRecipientId, setTaskRecipientId] = useState<string>('all');
  const [showTaskRecipientMenu, setShowTaskRecipientMenu] = useState(false);

  // Expenses State
  const [receiptImg, setReceiptImg] = useState<string | null>(null);
  const [expenseData, setExpenseData] = useState<Partial<Expense>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  // Zoom State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const getCurrentAuthor = () => {
     return "Eu"; 
  };

  // Calculate Total Expenses
  const totalExpenses = state.expenses.reduce((sum, item) => sum + item.amount, 0);

  // Prepare Recipients List
  const guardians = state.profile.guardians || [];
  const caregivers = (state.caregivers || []).filter(c => c.name);
  
  const taskRecipients = [
    { id: 'all', name: 'Todos', photo: undefined, type: 'all' },
    ...guardians.map(g => ({ ...g, type: 'guardian' })),
    ...caregivers.map(c => ({ ...c, type: 'caregiver' }))
  ];

  const selectedTaskRecipient = taskRecipients.find(r => r.id === taskRecipientId) || taskRecipients[0];

  // Reset zoom when opening a new receipt
  useEffect(() => {
    if (viewingReceipt) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [viewingReceipt]);

  // --- Generic Edit Logic ---
  const startEditing = (item: any) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = (type: 'task' | 'repair' | 'shopping' | 'expense') => {
    if (type === 'task') {
        const updated = state.tasks.map(t => t.id === editingId ? { ...t, text: editForm.text } : t);
        updateState({ tasks: updated });
    } else if (type === 'repair') {
        const updated = state.repairs.map(r => r.id === editingId ? { ...r, description: editForm.description } : r);
        updateState({ repairs: updated });
    } else if (type === 'shopping') {
        const updated = state.shoppingList.map(s => s.id === editingId ? { ...s, item: editForm.item } : s);
        updateState({ shoppingList: updated });
    } else if (type === 'expense') {
        const updated = state.expenses.map(e => e.id === editingId ? { 
            ...e, 
            description: editForm.description,
            amount: parseFloat(editForm.amount),
            date: editForm.date
        } : e);
        updateState({ expenses: updated });
    }
    setEditingId(null);
    setEditForm({});
  };

  // --- Task Logic ---
  const addTask = () => {
    if (!taskInput.trim()) return;
    
    let finalText = taskInput;
    if (taskRecipientId !== 'all') {
        finalText = `[Para: ${selectedTaskRecipient.name}] ${taskInput}`;
    }

    const newTask: GeneralTask = {
      id: Date.now().toString(),
      text: finalText,
      author: getCurrentAuthor(),
      date: new Date().toISOString(),
      completed: false
    };
    updateState({ tasks: [newTask, ...state.tasks] });
    setTaskInput('');
    setTaskRecipientId('all');
  };

  const toggleTask = (id: string) => {
    updateState({ tasks: state.tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t) });
  };

  const deleteTask = (id: string) => {
    updateState({ tasks: state.tasks.filter(t => t.id !== id) });
  };

  // --- Repair Logic ---
  const addRepair = () => {
    if (!repairInput.trim()) return;
    const newRepair: Repair = {
      id: Date.now().toString(),
      description: repairInput,
      author: getCurrentAuthor(),
      date: new Date().toISOString(),
      status: 'pending'
    };
    updateState({ repairs: [newRepair, ...state.repairs] });
    setRepairInput('');
  };

  const toggleRepairStatus = (id: string) => {
    updateState({ repairs: state.repairs.map(r => r.id === id ? {...r, status: r.status === 'pending' ? 'fixed' : 'pending'} : r) });
  };
  
  const deleteRepair = (id: string) => {
    updateState({ repairs: state.repairs.filter(r => r.id !== id) });
  };

  // --- Shopping Logic ---
  const addShoppingItem = () => {
    if (!shoppingInput.trim()) return;
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      item: shoppingInput,
      category: shoppingCat,
      author: getCurrentAuthor(),
      date: new Date().toISOString(),
      purchased: false
    };
    updateState({ shoppingList: [newItem, ...state.shoppingList] });
    setShoppingInput('');
  };

  const toggleShoppingItem = (id: string) => {
    updateState({ shoppingList: state.shoppingList.map(i => i.id === id ? {...i, purchased: !i.purchased} : i) });
  };

  const deleteShoppingItem = (id: string) => {
     updateState({ shoppingList: state.shoppingList.filter(i => i.id !== id) });
  };

  // --- Expense Logic ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnalyzing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setReceiptImg(base64);
        
        // Call Gemini
        const result = await analyzeReceipt(base64);
        if (result) {
          setExpenseData({
            amount: result.amount,
            date: result.date,
            description: result.description
          });
        }
        setAnalyzing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveExpense = () => {
    if (!expenseData.amount || !expenseData.description) return;
    const newExp: Expense = {
      id: Date.now().toString(),
      date: expenseData.date || new Date().toISOString(),
      amount: expenseData.amount,
      description: expenseData.description,
      receiptImage: receiptImg || undefined
    };
    updateState({ expenses: [newExp, ...state.expenses] });
    setExpenseData({});
    setReceiptImg(null);
  };

  const deleteExpense = (id: string) => {
    updateState({ expenses: state.expenses.filter(e => e.id !== id) });
  };

  // --- Zoom Logic ---
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.5, scale + delta), 4);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const zoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const zoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const resetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };


  const tabLabels = { tasks: 'Avisos', repairs: 'Reparos', shopping: 'Compras', expenses: 'Despesas' };

  return (
    <div className="h-full flex flex-col bg-gray-50" onClick={() => setShowTaskRecipientMenu(false)}>
      {/* Tab Nav - Updated to match HealthView style */}
      <div className="bg-white shadow-sm p-4 pr-16 sticky top-0 z-10">
        <div className="flex p-1 bg-gray-100 rounded-lg">
            {['tasks', 'repairs', 'shopping', 'expenses'].map(t => (
              <button 
                key={t}
                onClick={() => setTab(t as any)}
                className={`flex-1 py-2 px-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${tab === t ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}
              >
                {tabLabels[t as keyof typeof tabLabels]}
              </button>
            ))}
         </div>
      </div>

      {viewingReceipt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in overflow-hidden" onClick={() => setViewingReceipt(null)}>
          <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
             <button onClick={() => setViewingReceipt(null)} className="bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center backdrop-blur-md hover:bg-white/30 transition-colors">
                <i className="fas fa-times"></i>
              </button>
          </div>
          
          {/* Zoom Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex gap-4 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md" onClick={e => e.stopPropagation()}>
            <button onClick={zoomOut} className="text-white hover:text-teal-400 transition-colors p-2"><i className="fas fa-minus"></i></button>
            <button onClick={resetZoom} className="text-white text-xs font-bold px-2 border-l border-r border-gray-500">
               {Math.round(scale * 100)}%
            </button>
            <button onClick={zoomIn} className="text-white hover:text-teal-400 transition-colors p-2"><i className="fas fa-plus"></i></button>
          </div>

          <div 
            className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-move"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={e => e.stopPropagation()} 
          >
            <img 
              ref={imgRef}
              src={viewingReceipt} 
              alt="Comprovante" 
              className="max-w-none transition-transform duration-100 ease-out origin-center select-none pointer-events-none"
              style={{ 
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                maxHeight: '80vh',
                maxWidth: '90vw'
              }} 
              draggable={false}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 pb-6">
        
        {/* --- AVISOS (TAREFAS) --- */}
        {tab === 'tasks' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm flex gap-2 relative z-20">
               {/* Recipient Selector */}
               <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowTaskRecipientMenu(!showTaskRecipientMenu); }}
                    className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden hover:bg-gray-200 transition-colors active:scale-95"
                    title={`Para: ${selectedTaskRecipient.name}`}
                  >
                    {taskRecipientId === 'all' ? (
                      <i className="fas fa-users text-gray-500 text-xs"></i>
                    ) : selectedTaskRecipient.photo ? (
                      <img src={selectedTaskRecipient.photo} alt={selectedTaskRecipient.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-teal-700">
                        {selectedTaskRecipient.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>

                  {showTaskRecipientMenu && (
                    <div className="absolute top-12 left-0 bg-white rounded-xl shadow-xl border border-gray-100 w-64 overflow-hidden animate-fade-in z-30">
                      <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase">Enviar para:</p>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {taskRecipients.map(r => (
                          <button 
                            key={r.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskRecipientId(r.id);
                              setShowTaskRecipientMenu(false);
                            }}
                            className={`w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-0 ${taskRecipientId === r.id ? 'bg-teal-50' : ''}`}
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
                              <p className={`text-sm font-medium truncate ${taskRecipientId === r.id ? 'text-teal-700' : 'text-gray-700'}`}>{r.name}</p>
                              {r.type !== 'all' && (
                                <p className="text-[10px] text-gray-400 capitalize">{r.type === 'guardian' ? 'Responsável' : 'Cuidador'}</p>
                              )}
                            </div>
                            {taskRecipientId === r.id && <i className="fas fa-check text-teal-600 text-xs"></i>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
               </div>

               <input 
                 type="text" 
                 placeholder={`Novo aviso ${taskRecipientId === 'all' ? '' : `para ${selectedTaskRecipient.name.split(' ')[0]}`}...`}
                 className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
                 value={taskInput}
                 onChange={e => setTaskInput(e.target.value)}
               />
               <button onClick={addTask} className="bg-teal-600 text-white w-10 rounded-lg flex items-center justify-center"><i className="fas fa-plus"></i></button>
            </div>

            <div className="space-y-2">
              {state.tasks.map(task => (
                <div key={task.id} className={`p-3 rounded-xl border flex justify-between items-start bg-white ${task.completed ? 'border-teal-200 bg-teal-50/30' : 'border-gray-200'}`}>
                  <div className="flex gap-3 items-start flex-1">
                    <button onClick={() => toggleTask(task.id)} className={`mt-1 h-5 w-5 rounded border flex items-center justify-center shrink-0 ${task.completed ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-300 text-transparent'}`}>
                      <i className="fas fa-check text-xs"></i>
                    </button>
                    <div className="flex-1">
                      {editingId === task.id ? (
                        <div className="flex gap-2">
                           <input 
                             className="flex-1 p-2 border rounded text-sm bg-white text-gray-900"
                             value={editForm.text} 
                             onChange={e => setEditForm({...editForm, text: e.target.value})}
                           />
                           <button onClick={() => saveEdit('task')} className="text-green-600"><i className="fas fa-check"></i></button>
                           <button onClick={cancelEdit} className="text-gray-400"><i className="fas fa-times"></i></button>
                        </div>
                      ) : (
                        <>
                          <p className={`text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'}`}>{task.text}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            Por {task.author} • {new Date(task.date).toLocaleDateString('pt-BR')}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  {!editingId && (
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => startEditing(task)} className="text-gray-300 hover:text-blue-400 p-1"><i className="fas fa-edit"></i></button>
                      <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-400 p-1"><i className="fas fa-times"></i></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- REPAROS --- */}
        {tab === 'repairs' && (
          <div className="space-y-4">
             <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 shadow-sm">
               <h3 className="text-xs font-bold text-orange-600 uppercase mb-2">Novo Reparo</h3>
               <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ex: Torneira pingando..." 
                    className="flex-1 bg-white border border-orange-200 rounded-lg px-3 py-2 outline-none focus:border-orange-400 placeholder-orange-300 text-orange-900"
                    value={repairInput}
                    onChange={e => setRepairInput(e.target.value)}
                  />
                  <button onClick={addRepair} className="bg-orange-500 text-white w-10 rounded-lg flex items-center justify-center"><i className="fas fa-wrench"></i></button>
               </div>
            </div>

            <div className="space-y-2">
              {state.repairs.map(repair => (
                <div key={repair.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                       {editingId === repair.id ? (
                          <div className="flex gap-2 mb-2">
                             <input 
                               className="flex-1 p-2 border rounded text-sm bg-white text-gray-900"
                               value={editForm.description} 
                               onChange={e => setEditForm({...editForm, description: e.target.value})}
                             />
                             <button onClick={() => saveEdit('repair')} className="text-green-600"><i className="fas fa-check"></i></button>
                             <button onClick={cancelEdit} className="text-gray-400"><i className="fas fa-times"></i></button>
                          </div>
                       ) : (
                          <p className="font-bold text-gray-800">{repair.description}</p>
                       )}
                    </div>
                    <button 
                      onClick={() => toggleRepairStatus(repair.id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase shrink-0 ${repair.status === 'fixed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}
                    >
                      {repair.status === 'fixed' ? 'Resolvido' : 'Pendente'}
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] text-gray-400">
                        Por {repair.author} • {new Date(repair.date).toLocaleDateString('pt-BR')}
                    </p>
                    {!editingId && (
                      <div className="flex gap-1">
                        <button onClick={() => startEditing(repair)} className="text-gray-300 hover:text-blue-400 text-xs p-1"><i className="fas fa-edit"></i></button>
                        <button onClick={() => deleteRepair(repair.id)} className="text-gray-300 hover:text-red-400 text-xs p-1"><i className="fas fa-trash"></i></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- COMPRAS --- */}
        {tab === 'shopping' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
               <div className="flex gap-2 mb-3">
                  <button onClick={() => setShoppingCat('Market')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${shoppingCat === 'Market' ? 'bg-teal-100 text-teal-600' : 'bg-gray-50 text-gray-400'}`}>Mercado</button>
                  <button onClick={() => setShoppingCat('Meds')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${shoppingCat === 'Meds' ? 'bg-rose-100 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>Farmácia</button>
               </div>
               <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder={shoppingCat === 'Meds' ? "Nome do medicamento..." : "Item de mercado..."}
                    className="flex-1 bg-gray-50 border border-teal-400 rounded-lg px-3 py-2 outline-none focus:border-teal-400"
                    value={shoppingInput}
                    onChange={e => setShoppingInput(e.target.value)}
                  />
                  <button onClick={addShoppingItem} className="bg-teal-600 text-white w-10 rounded-lg flex items-center justify-center"><i className="fas fa-plus"></i></button>
               </div>
            </div>

            <div className="space-y-2">
              {state.shoppingList.map(item => (
                <div key={item.id} className={`p-3 rounded-xl border flex justify-between items-center bg-white ${item.purchased ? 'opacity-60' : ''}`}>
                   <div className="flex items-center gap-3 flex-1">
                      <button onClick={() => toggleShoppingItem(item.id)} className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${item.purchased ? 'bg-teal-400 border-teal-400 text-white' : 'border-gray-300'}`}>
                        {item.purchased && <i className="fas fa-check text-xs"></i>}
                      </button>
                      <div className="flex-1 min-w-0">
                         {editingId === item.id ? (
                            <div className="flex gap-2">
                               <input 
                                 className="flex-1 p-2 border rounded text-sm bg-white text-gray-900"
                                 value={editForm.item} 
                                 onChange={e => setEditForm({...editForm, item: e.target.value})}
                               />
                               <button onClick={() => saveEdit('shopping')} className="text-green-600"><i className="fas fa-check"></i></button>
                               <button onClick={cancelEdit} className="text-gray-400"><i className="fas fa-times"></i></button>
                            </div>
                         ) : (
                           <>
                             <p className={`text-sm font-medium ${item.purchased ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.item}</p>
                             <p className="text-[10px] text-gray-400 flex items-center gap-1">
                               <span className={`w-2 h-2 rounded-full ${item.category === 'Meds' ? 'bg-rose-400' : 'bg-teal-400'}`}></span>
                               {item.category === 'Meds' ? 'Farmácia' : 'Mercado'} • {item.author}
                             </p>
                           </>
                         )}
                      </div>
                   </div>
                   {!editingId && (
                     <div className="flex gap-1 ml-2">
                        <button onClick={() => startEditing(item)} className="text-gray-300 hover:text-blue-400 p-1"><i className="fas fa-edit"></i></button>
                        <button onClick={() => deleteShoppingItem(item.id)} className="text-gray-300 hover:text-red-400 p-1"><i className="fas fa-trash"></i></button>
                     </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- DESPESAS --- */}
        {tab === 'expenses' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-dashed border-gray-200 text-center">
              <input type="file" accept="image/*" id="receiptInput" className="hidden" onChange={handleFileChange} />
              <label htmlFor="receiptInput" className="cursor-pointer block">
                <div className="h-12 w-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-camera text-xl"></i>
                </div>
                <p className="text-sm font-bold text-gray-600">Escanear Comprovante com IA</p>
              </label>
            </div>

            {analyzing && (
              <div className="flex items-center justify-center gap-2 text-teal-600 bg-teal-50 p-3 rounded-lg">
                <i className="fas fa-circle-notch fa-spin"></i> Analisando...
              </div>
            )}

            {(receiptImg || expenseData.amount) && (
              <div className="bg-white p-4 rounded-2xl shadow-lg animate-fade-in">
                {receiptImg && <img src={receiptImg} className="w-full h-32 object-cover rounded-lg mb-4 opacity-80" alt="Receipt" />}
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Descrição" 
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none" 
                    value={expenseData.description || ''} 
                    onChange={e => setExpenseData({...expenseData, description: e.target.value})} 
                  />
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Valor" 
                      className="flex-1 p-3 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none" 
                      value={expenseData.amount || ''} 
                      onChange={e => setExpenseData({...expenseData, amount: parseFloat(e.target.value)})} 
                    />
                    <input 
                      type="date" 
                      className="flex-1 p-3 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none" 
                      value={expenseData.date || ''} 
                      onChange={e => setExpenseData({...expenseData, date: e.target.value})} 
                    />
                  </div>
                  <button onClick={saveExpense} className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold shadow-lg shadow-teal-200">Salvar Despesa</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {state.expenses.map(exp => (
                <div key={exp.id} className="flex flex-col bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  {editingId === exp.id ? (
                     <div className="space-y-3">
                        <input 
                          className="w-full p-2 border rounded text-sm bg-white text-gray-900"
                          value={editForm.description}
                          onChange={e => setEditForm({...editForm, description: e.target.value})}
                          placeholder="Descrição"
                        />
                        <div className="flex gap-2">
                           <input 
                             type="number"
                             className="flex-1 p-2 border rounded text-sm bg-white text-gray-900"
                             value={editForm.amount}
                             onChange={e => setEditForm({...editForm, amount: e.target.value})}
                             placeholder="Valor"
                           />
                           <input 
                             type="date"
                             className="flex-1 p-2 border rounded text-sm bg-white text-gray-900"
                             value={editForm.date}
                             onChange={e => setEditForm({...editForm, date: e.target.value})}
                           />
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => saveEdit('expense')} className="flex-1 bg-green-500 text-white py-1 rounded text-sm font-bold">Salvar</button>
                           <button onClick={cancelEdit} className="flex-1 bg-gray-200 text-gray-600 py-1 rounded text-sm font-bold">Cancelar</button>
                        </div>
                     </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {exp.receiptImage ? (
                            <button 
                              onClick={() => setViewingReceipt(exp.receiptImage!)}
                              className="h-10 w-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 active:scale-95 transition-colors shrink-0"
                              title="Ver Comprovante"
                            >
                              <i className="fas fa-file-invoice-dollar"></i>
                            </button>
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-300 flex items-center justify-center shrink-0">
                              <i className="fas fa-receipt"></i>
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-800 truncate">{exp.description}</p>
                          <p className="text-xs text-gray-400">
                              {new Date(exp.date).toLocaleDateString('pt-BR')} • Por {getCurrentAuthor()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-2">
                         <p className="font-bold text-red-500 whitespace-nowrap">-R$ {exp.amount.toFixed(2)}</p>
                         <div className="flex gap-1">
                            <button onClick={() => startEditing(exp)} className="text-gray-300 hover:text-blue-400 p-1"><i className="fas fa-edit"></i></button>
                            <button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-400 p-1"><i className="fas fa-trash"></i></button>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {state.expenses.length > 0 && (
              <div className="bg-gray-100 p-4 rounded-xl flex justify-between items-center mt-4 border border-gray-200">
                  <span className="font-bold text-gray-600 text-sm uppercase">Total Acumulado</span>
                  <span className="font-bold text-red-600 text-xl">-R$ {totalExpenses.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
