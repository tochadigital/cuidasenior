
import { AppState, BloodType } from '../types';

const STORAGE_KEY = 'cuida_senior_db_v1';
const SYNC_KEY_NAME = 'cuida_senior_sync_id';

const SUPABASE_URL = 'https://lhdsyjhhxldytexldirw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Z2eoO-z_xGvwhVmvzWYhDQ_hYV7cVKr';

export const defaultState: AppState = {
  profile: {
    name: 'João Silva',
    age: 82,
    weight: 75,
    height: 172,
    bloodType: BloodType.A_POS,
    allergies: 'Nenhuma conhecida',
    chronicConditions: 'Nenhuma conhecida', 
    notes: 'O paciente prefere ler pela manhã.',
    houseRules: [], 
    guardians: [],
    emergencyContacts: []
  },
  caregivers: [
    { id: '1', name: 'Maria (Manhã)', phone: '5511999999999' },
    { id: '2', name: 'Ana (Noite)', phone: '5511888888888' }
  ],
  medications: [], 
  appointments: [],
  exams: [], 
  vitals: [], 
  routine: [],
  meals: [],
  expenses: [],
  chat: [],
  tasks: [],
  repairs: [],
  shoppingList: [],
  reimbursements: [],
  currentUser: null,
  isAuthenticated: false
};

export const getSyncId = (): string | null => {
  return localStorage.getItem(SYNC_KEY_NAME);
};

export const setSyncId = (id: string) => {
  localStorage.setItem(SYNC_KEY_NAME, id);
};

export const loadLocalState = (): AppState | null => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      const parsed = JSON.parse(serialized);
      // Garantir que carregamos o currentUser se existir
      return { ...defaultState, ...parsed };
    }
  } catch (e) {
    console.error("Erro ao carregar estado local", e);
  }
  return null;
};

export const loadRemoteState = async (): Promise<AppState | null> => {
  const syncId = getSyncId();
  if (!syncId) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/care_sync?sync_id=eq.${syncId}&select=data`, {
      method: 'GET',
      headers: { 
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Accept': 'application/json' 
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result && result.length > 0) {
        return result[0].data;
      }
    }
  } catch (e) {
    console.error("Erro ao carregar dados do Supabase:", e);
  }
  return null;
};

export const loadState = (): AppState => {
  const local = loadLocalState();
  return local || defaultState;
};

export const saveState = async (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Falha ao salvar localmente", e);
  }

  const syncId = getSyncId();
  if (syncId) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/care_sync`, {
        method: 'POST',
        headers: { 
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates' 
        },
        body: JSON.stringify({ 
          sync_id: syncId, 
          data: state,
          updated_at: new Date().toISOString()
        })
      });
    } catch (e) {
      console.warn("Offline: Sincronização em nuvem pendente.");
    }
  }
};
