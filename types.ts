
export enum BloodType {
  A_POS = 'A+', A_NEG = 'A-',
  B_POS = 'B+', B_NEG = 'B-',
  AB_POS = 'AB+', AB_NEG = 'AB-',
  O_POS = 'O+', O_NEG = 'O-'
}

export interface Guardian {
  id: string;
  name: string;
  phone: string;
  photo?: string;
}

export type RuleCategory = 'attention' | 'routines' | 'hygiene';

export interface Rule {
  id: string;
  text: string;
  category: RuleCategory;
  author: string;
  date: string;
}

export interface ElderProfile {
  name: string;
  cpf?: string;
  age: number;
  weight: number;
  height: number;
  bloodType: BloodType | string;
  allergies?: string;
  chronicConditions?: string; 
  notes: string; 
  houseRules: Rule[]; 
  photo?: string; 
  guardians?: Guardian[];
  emergencyContacts?: Guardian[]; 
}

export interface Caregiver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  photo?: string; 
}

export interface AppState {
  profile: ElderProfile;
  caregivers: Caregiver[];
  reliefCaregiver?: Caregiver | null;
  medications: Medication[];
  appointments: Appointment[];
  exams: Exam[]; 
  vitals: VitalLog[];
  routine: RoutineTask[];
  meals: MealLog[];
  expenses: Expense[];
  chat: ChatMessage[];
  tasks: GeneralTask[];
  repairs: Repair[];
  shoppingList: ShoppingItem[];
  reimbursements: Reimbursement[];
  currentUser: Caregiver | null;
  isAuthenticated: boolean;
}

// Interfaces auxiliares mantidas para compatibilidade
export interface Medication { id: string; name: string; dosage: string; time: string; takenToday: boolean; lastNotified?: string; days?: string[]; startDate?: string; endDate?: string; }
export interface Appointment { id: string; specialty: string; doctorName?: string; address: string; phone?: string; datetime: string; notify: boolean; notified?: boolean; }
export interface Exam { id: string; doctorName: string; examTypes: string[]; locationName: string; address: string; datetime: string; }
export interface VitalLog { id: string; date: string; systolic: number; diastolic: number; oxygen: number; }
export interface RoutineTask { id: string; type: 'Physical' | 'Cognitive' | 'Memory' | 'Physio' | 'Other'; description: string; completed: boolean; date: string; }
export interface MealLog { id: string; type: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner'; description: string; date: string; }
export interface Expense { id: string; date: string; description: string; amount: number; receiptImage?: string; }
export interface ChatMessage { id: string; senderId: string; senderName: string; text: string; timestamp: string; recipientId?: string; recipientName?: string; }
export interface GeneralTask { id: string; text: string; author: string; date: string; completed: boolean; }
export interface Repair { id: string; description: string; author: string; date: string; status: 'pending' | 'fixed'; }
export interface ShoppingItem { id: string; item: string; category: 'Meds' | 'Market'; author: string; date: string; purchased: boolean; }
export interface Recipe { day: string; title: string; ingredients: string[]; instructions: string; benefits: string; }
export interface MemoryCard { id: number; icon: string; isFlipped: boolean; isMatched: boolean; }
export interface Reimbursement { id: string; type: string; requesterName: string; amount: number; receiptPhoto?: string; date: string; status: 'pending' | 'paid'; }
