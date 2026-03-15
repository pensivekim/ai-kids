// 사용자 역할
export type UserRole = 'super_admin' | 'center_admin' | 'teacher';

// 승인 상태
export type UserStatus = 'pending' | 'active' | 'rejected' | 'inactive';

// 요금 정책 (인당 과금)
export const SEAT_PRICE = 9900;  // 원/월/인
export const MIN_SEATS = 3;      // 최소 청구 인원

// 사용 가능한 AI 모델 목록 (표시용)
export const AI_MODELS_DISPLAY = [
  { id: 'gemini-flash',  name: 'Gemini 2.0 Flash',  badge: 'Google' },
  { id: 'claude-haiku',  name: 'Claude Haiku 4.5',   badge: 'Anthropic' },
  { id: 'claude-sonnet', name: 'Claude Sonnet 4.5',  badge: 'Anthropic' },
  { id: 'gpt-4o-mini',   name: 'GPT-4o mini',        badge: 'OpenAI' },
];

// 기관 (어린이집)
export interface Center {
  id: string;
  name: string;
  code: string;           // 선생님 가입 시 입력하는 원 코드 (6자리)
  seatCount: number;      // 현재 활성 선생님 수 (= 청구 인원)
  tokenUsed: number;
  status: 'active' | 'suspended' | 'pending';
  adminUid: string;       // center_admin uid
  createdAt: string;
}

// 사용자 프로필
export interface KidsUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  centerId?: string;
  centerName?: string;
  tokenUsed: number;
  createdAt: string;
}

// AI 모델
export type AIModel =
  | 'claude-haiku'
  | 'claude-sonnet'
  | 'gpt-4o-mini'
  | 'gemini-flash';

// 채팅 메시지
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: AIModel;
  tokens?: number;
  createdAt: string;
}

// 역할별 홈 경로
export const ROLE_HOME: Record<UserRole, string> = {
  super_admin:  '/admin',
  center_admin: '/dashboard',
  teacher:      '/tools',
};

// AI 도구 카테고리
export type ToolCategory = 'admin-doc' | 'edu-content' | 'sns' | 'parent' | 'management';

export const TOOL_CATEGORIES: {
  id: ToolCategory;
  label: string;
  icon: string;
  desc: string;
  color: string;
  tools: { id: string; label: string }[];
}[] = [
  {
    id: 'admin-doc',
    label: '행정·문서',
    icon: '📋',
    desc: '가정통신문, 보육일지, 계획안 등 반복 문서를 AI가 대신 작성',
    color: 'teal',
    tools: [
      { id: 'newsletter', label: '가정통신문' },
      { id: 'diary', label: '보육일지·관찰일지' },
      { id: 'plan', label: '월간·연간 계획안' },
      { id: 'letter', label: '공문·민원 답변' },
      { id: 'guide', label: '입소·식단 안내문' },
    ],
  },
  {
    id: 'edu-content',
    label: '보육·교육 콘텐츠',
    icon: '👶',
    desc: '활동 계획, 동화 창작, 놀이 추천 등 교육 콘텐츠 자동 생성',
    color: 'orange',
    tools: [
      { id: 'activity', label: '활동 계획안' },
      { id: 'story', label: '동화 스토리' },
      { id: 'ideas', label: '미술·요리·체육 아이디어' },
      { id: 'play', label: '발달 단계별 놀이' },
    ],
  },
  {
    id: 'sns',
    label: 'SNS·홍보',
    icon: '📱',
    desc: '인스타그램, 블로그, 카드뉴스 문구를 클릭 한 번으로 완성',
    color: 'pink',
    tools: [
      { id: 'post', label: '인스타·블로그 포스팅' },
      { id: 'intro', label: '원 소개 콘텐츠' },
      { id: 'cardnews', label: '카드뉴스 텍스트' },
    ],
  },
  {
    id: 'parent',
    label: '학부모 소통',
    icon: '👨‍👩‍👧',
    desc: '상담 요약, 민감한 사안 답변, 개인화 알림장 문구 생성',
    color: 'blue',
    tools: [
      { id: 'consult', label: '상담 내용 요약' },
      { id: 'sensitive', label: '민감한 사안 답변' },
      { id: 'notification', label: '개인화 알림장' },
    ],
  },
  {
    id: 'management',
    label: '운영·경영',
    icon: '📊',
    desc: '보조금 신청서, 면접 질문, 회의록 요약 등 경영 문서 자동화',
    color: 'purple',
    tools: [
      { id: 'subsidy', label: '보조금 신청서 초안' },
      { id: 'interview', label: '교직원 면접 질문지' },
      { id: 'checklist', label: '시설 점검 체크리스트' },
      { id: 'minutes', label: '회의록 요약' },
    ],
  },
];
