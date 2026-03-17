-- ============================================================
-- ai-kids-ops D1 Schema
-- ============================================================

-- Feature 1: 원아 정보 (공통 기준 테이블)
CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL,
  name TEXT NOT NULL,
  birth_date TEXT,
  class_name TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  allergies TEXT DEFAULT '[]',  -- JSON array of allergen strings
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_children_center ON children(center_id);

-- Feature 1: 출결 기록
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  date TEXT NOT NULL,           -- YYYY-MM-DD
  check_in TEXT,                -- ISO timestamp
  check_out TEXT,               -- ISO timestamp
  method TEXT DEFAULT 'manual', -- 'qr' | 'nfc' | 'manual'
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_att_center_date ON attendance_records(center_id, date);

-- Feature 2: 원비 청구
CREATE TABLE IF NOT EXISTS tuition_accounts (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  year_month TEXT NOT NULL,     -- YYYY-MM
  base_amount INTEGER NOT NULL DEFAULT 0,
  subsidy_amount INTEGER DEFAULT 0,
  net_amount INTEGER NOT NULL DEFAULT 0,
  due_date TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'paid' | 'overdue' | 'waived'
  virtual_account TEXT,
  pg_tid TEXT,
  paid_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tuition_center ON tuition_accounts(center_id, year_month);

-- Feature 2: 원비 결제 이력
CREATE TABLE IF NOT EXISTS tuition_payments (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  method TEXT DEFAULT 'cash',   -- 'virtual_account' | 'kakaopay' | 'card' | 'cash'
  pg_response TEXT,             -- JSON blob from PG
  created_at TEXT DEFAULT (datetime('now'))
);

-- Feature 3: 투약 의뢰
CREATE TABLE IF NOT EXISTS medication_requests (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  child_name TEXT NOT NULL,
  requested_by TEXT NOT NULL,   -- 부모 이름
  requester_phone TEXT,
  date TEXT NOT NULL,           -- YYYY-MM-DD
  drug_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  timing TEXT NOT NULL,         -- 예: '점심 식후'
  note TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'confirmed' | 'completed' | 'rejected'
  confirmed_by TEXT,            -- 교사 이름
  confirmed_at TEXT,
  signature_data TEXT,          -- base64 canvas signature
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_med_center_date ON medication_requests(center_id, date);

-- Feature 4: CCTV 열람 요청
CREATE TABLE IF NOT EXISTS cctv_requests (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  requester_relation TEXT,      -- '부모' | '법정대리인'
  child_name TEXT NOT NULL,
  requested_date TEXT NOT NULL, -- 영상 날짜
  requested_time_from TEXT,
  requested_time_to TEXT,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'denied' | 'viewed' | 'expired'
  reviewed_by TEXT,
  review_note TEXT,
  view_deadline TEXT,           -- 열람 기한 ISO timestamp
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cctv_center ON cctv_requests(center_id, status);

-- Feature 5: 재난·소방 훈련 기록
CREATE TABLE IF NOT EXISTS drill_records (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL,
  drill_type TEXT NOT NULL,     -- 'fire' | 'earthquake' | 'evacuation' | 'lockdown'
  drill_date TEXT NOT NULL,     -- YYYY-MM-DD
  start_time TEXT,
  end_time TEXT,
  participant_count INTEGER,
  evacuation_time_seconds INTEGER,
  scenario TEXT,
  findings TEXT,
  improvements TEXT,
  supervisor_name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_drill_center ON drill_records(center_id, drill_date);

-- Feature 6: 급식 메뉴
CREATE TABLE IF NOT EXISTS meal_menus (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL,
  menu_date TEXT NOT NULL,      -- YYYY-MM-DD
  meal_type TEXT DEFAULT 'lunch', -- 'breakfast' | 'lunch' | 'snack' | 'dinner'
  items TEXT NOT NULL,          -- JSON: [{name, allergens:[]}]
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_menu_center_date ON meal_menus(center_id, menu_date);

-- Feature 6: 알레르기 경보
CREATE TABLE IF NOT EXISTS meal_allergy_alerts (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  menu_id TEXT NOT NULL,
  allergen TEXT NOT NULL,
  meal_item TEXT NOT NULL,
  notified_at TEXT,
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_alert_center ON meal_allergy_alerts(center_id, acknowledged_at);

-- Feature 7: 교사 근태
CREATE TABLE IF NOT EXISTS staff_attendance (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL,
  user_uid TEXT NOT NULL,
  user_name TEXT,
  date TEXT NOT NULL,           -- YYYY-MM-DD
  clock_in TEXT,                -- ISO timestamp
  clock_out TEXT,
  break_minutes INTEGER DEFAULT 60,
  late_minutes INTEGER DEFAULT 0,
  note TEXT,
  method TEXT DEFAULT 'app',    -- 'app' | 'manual'
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_staff_att_center ON staff_attendance(center_id, date);

-- Feature 7: 급여 기록
CREATE TABLE IF NOT EXISTS payroll_records (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL,
  user_uid TEXT NOT NULL,
  user_name TEXT,
  year_month TEXT NOT NULL,     -- YYYY-MM
  base_salary INTEGER DEFAULT 0,
  hourly_wage INTEGER DEFAULT 0,
  overtime_pay INTEGER DEFAULT 0,
  deductions INTEGER DEFAULT 0,
  net_pay INTEGER DEFAULT 0,
  work_days INTEGER DEFAULT 0,
  total_hours INTEGER DEFAULT 0,
  late_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',  -- 'draft' | 'confirmed' | 'paid'
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payroll_center ON payroll_records(center_id, year_month);

-- Feature 7: 교사 급여 설정
CREATE TABLE IF NOT EXISTS staff_config (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL,
  user_uid TEXT NOT NULL,
  user_name TEXT,
  position TEXT,                -- '담임교사' | '보조교사' | '원장' 등
  employment_type TEXT DEFAULT 'full', -- 'full' | 'part'
  base_salary INTEGER DEFAULT 0,
  hourly_wage INTEGER DEFAULT 0,
  work_hours_per_day REAL DEFAULT 8.0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(center_id, user_uid)
);

-- Feature 8: 평가인증 카테고리
CREATE TABLE IF NOT EXISTS accreditation_categories (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Feature 8: 평가인증 지표 체크리스트
CREATE TABLE IF NOT EXISTS accreditation_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  center_id TEXT NOT NULL,
  indicator_code TEXT,          -- 예: '1-1-1'
  description TEXT NOT NULL,
  status TEXT DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'ready' | 'submitted'
  evidence_urls TEXT DEFAULT '[]',   -- JSON array
  notes TEXT,
  due_date TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_accred_center ON accreditation_items(center_id);

-- Feature 9: 상담 슬롯
CREATE TABLE IF NOT EXISTS consultation_slots (
  id TEXT PRIMARY KEY,
  center_id TEXT NOT NULL,
  teacher_uid TEXT NOT NULL,
  teacher_name TEXT,
  slot_date TEXT NOT NULL,      -- YYYY-MM-DD
  slot_time TEXT NOT NULL,      -- HH:MM
  duration_minutes INTEGER DEFAULT 30,
  is_available INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_slot_center ON consultation_slots(center_id, slot_date);

-- Feature 9: 상담 예약
CREATE TABLE IF NOT EXISTS consultation_bookings (
  id TEXT PRIMARY KEY,
  slot_id TEXT NOT NULL,
  center_id TEXT NOT NULL,
  child_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  topic TEXT,
  status TEXT DEFAULT 'booked', -- 'booked' | 'cancelled' | 'completed'
  notes TEXT,
  summary TEXT,                 -- AI 생성 요약
  created_at TEXT DEFAULT (datetime('now'))
);
