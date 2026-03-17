// ============================================================
// Operational Data Types for ai-kids D1 features
// ============================================================

// --- Feature 1: Children & Attendance ---
export interface Child {
  id: string;
  center_id: string;
  name: string;
  birth_date?: string;
  class_name?: string;
  parent_name?: string;
  parent_phone?: string;
  allergies: string[];   // parsed from JSON
  is_active: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  center_id: string;
  child_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  method: 'qr' | 'nfc' | 'manual';
  note?: string;
  created_at: string;
}

// --- Feature 2: Tuition ---
export type TuitionStatus = 'pending' | 'paid' | 'overdue' | 'waived';

export interface TuitionAccount {
  id: string;
  center_id: string;
  child_id: string;
  year_month: string;
  base_amount: number;
  subsidy_amount: number;
  net_amount: number;
  due_date?: string;
  status: TuitionStatus;
  virtual_account?: string;
  pg_tid?: string;
  paid_at?: string;
  created_at: string;
}

// --- Feature 3: Medication ---
export type MedicationStatus = 'pending' | 'confirmed' | 'completed' | 'rejected';

export interface MedicationRequest {
  id: string;
  center_id: string;
  child_id: string;
  child_name: string;
  requested_by: string;
  requester_phone?: string;
  date: string;
  drug_name: string;
  dosage: string;
  timing: string;
  note?: string;
  status: MedicationStatus;
  confirmed_by?: string;
  confirmed_at?: string;
  signature_data?: string;
  created_at: string;
}

// --- Feature 4: CCTV ---
export type CctvStatus = 'pending' | 'approved' | 'denied' | 'viewed' | 'expired';

export interface CctvRequest {
  id: string;
  center_id: string;
  requester_name: string;
  requester_phone: string;
  requester_relation?: string;
  child_name: string;
  requested_date: string;
  requested_time_from?: string;
  requested_time_to?: string;
  reason: string;
  status: CctvStatus;
  reviewed_by?: string;
  review_note?: string;
  view_deadline?: string;
  created_at: string;
}

// --- Feature 5: Drill ---
export type DrillType = 'fire' | 'earthquake' | 'evacuation' | 'lockdown';

export interface DrillRecord {
  id: string;
  center_id: string;
  drill_type: DrillType;
  drill_date: string;
  start_time?: string;
  end_time?: string;
  participant_count?: number;
  evacuation_time_seconds?: number;
  scenario?: string;
  findings?: string;
  improvements?: string;
  supervisor_name?: string;
  created_at: string;
}

export interface DrillCompliance {
  year: number;
  fire: number;
  earthquake: number;
  evacuation: number;
  fire_required: number;
  earthquake_required: number;
  evacuation_required: number;
  fire_ok: boolean;
  earthquake_ok: boolean;
  evacuation_ok: boolean;
  all_ok: boolean;
}

// --- Feature 6: Allergy ---
export interface MealItem {
  name: string;
  allergens: string[];
}

export interface MealMenu {
  id: string;
  center_id: string;
  menu_date: string;
  meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  items: MealItem[];
  created_at: string;
}

export interface AllergyAlert {
  id: string;
  center_id: string;
  child_id: string;
  menu_id: string;
  allergen: string;
  meal_item: string;
  notified_at?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

// --- Feature 7: Staff ---
export interface StaffAttendance {
  id: string;
  center_id: string;
  user_uid: string;
  user_name?: string;
  date: string;
  clock_in?: string;
  clock_out?: string;
  break_minutes: number;
  late_minutes: number;
  note?: string;
  method: 'app' | 'manual';
  created_at: string;
}

export interface StaffConfig {
  id: string;
  center_id: string;
  user_uid: string;
  user_name?: string;
  position?: string;
  employment_type: 'full' | 'part';
  base_salary: number;
  hourly_wage: number;
  work_hours_per_day: number;
  is_active: number;
}

export interface PayrollRecord {
  id: string;
  center_id: string;
  user_uid: string;
  user_name?: string;
  year_month: string;
  base_salary: number;
  hourly_wage: number;
  overtime_pay: number;
  deductions: number;
  net_pay: number;
  work_days: number;
  total_hours: number;
  late_count: number;
  status: 'draft' | 'confirmed' | 'paid';
  notes?: string;
  created_at: string;
}

// --- Feature 8: Accreditation ---
export type AccreditationStatus = 'not_started' | 'in_progress' | 'ready' | 'submitted';

export interface AccreditationItem {
  id: string;
  category_id: string;
  center_id: string;
  indicator_code?: string;
  description: string;
  status: AccreditationStatus;
  evidence_urls: string[];
  notes?: string;
  due_date?: string;
  updated_at: string;
}

export interface AccreditationCategory {
  id: string;
  center_id: string;
  label: string;
  sort_order: number;
  items?: AccreditationItem[];
}

// --- Feature 9: Consultations ---
export interface ConsultationSlot {
  id: string;
  center_id: string;
  teacher_uid: string;
  teacher_name?: string;
  slot_date: string;
  slot_time: string;
  duration_minutes: number;
  is_available: number;
  created_at: string;
  booking?: ConsultationBooking;
}

export interface ConsultationBooking {
  id: string;
  slot_id: string;
  center_id: string;
  child_name: string;
  parent_name: string;
  parent_phone: string;
  topic?: string;
  status: 'booked' | 'cancelled' | 'completed';
  notes?: string;
  summary?: string;
  created_at: string;
}
