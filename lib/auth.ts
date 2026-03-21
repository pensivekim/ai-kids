import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp,
  collection, query, where, getDocs, increment,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from './firebase';
import type { KidsUser, UserRole } from '../types';

// 이메일 로그인
export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return cred.user;
}

// 이메일 회원가입 + 원 코드 연결
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  centerCode?: string,
) {
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  await updateProfile(cred.user, { displayName });

  let centerId: string | undefined;
  let centerName: string | undefined;

  if (centerCode) {
    const linked = await linkCenterByCode(cred.user.uid, centerCode);
    centerId = linked?.centerId;
    centerName = linked?.centerName;
  }

  const db = getFirebaseDb();
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    email,
    displayName,
    role: 'teacher' as UserRole,
    status: 'pending',
    centerId: centerId ?? null,
    centerName: centerName ?? null,
    tokenUsed: 0,
    createdAt: serverTimestamp(),
  });

  return cred.user;
}

// 원 코드로 어린이집 연결
export async function linkCenterByCode(uid: string, code: string) {
  const db = getFirebaseDb();
  const q = query(collection(db, 'centers'), where('code', '==', code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('유효하지 않은 원 코드입니다.');
  const d = snap.docs[0];
  const centerId = d.id;
  const centerName = (d.data() as { name: string }).name;
  await setDoc(doc(db, 'users', uid), { centerId, centerName }, { merge: true });
  return { centerId, centerName };
}

// Firestore 유저 문서 조회 (super_admin 자동 생성)
export async function getUserDoc(uid: string, email?: string): Promise<KidsUser | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) return snap.data() as KidsUser;

  // admin@genomic.cc 는 문서 없으면 자동 super_admin 생성
  if (email === 'admin@genomic.cc') {
    const adminDoc: KidsUser = {
      uid,
      email,
      displayName: '관리자',
      role: 'super_admin',
      status: 'active',
      tokenUsed: 0,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', uid), adminDoc);
    return adminDoc;
  }

  return null;
}

// 승인 대기 선생님 목록
export async function getPendingTeachers(centerId: string): Promise<KidsUser[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, 'users'),
    where('centerId', '==', centerId),
    where('status', '==', 'pending'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as KidsUser);
}

// 선생님 승인 (seatCount +1)
export async function approveUser(uid: string): Promise<void> {
  const db = getFirebaseDb();
  const userSnap = await getDoc(doc(db, 'users', uid));
  const centerId = userSnap.data()?.centerId;
  await updateDoc(doc(db, 'users', uid), { status: 'active' });
  if (centerId) {
    await updateDoc(doc(db, 'centers', centerId), { seatCount: increment(1) });
  }
}

// 선생님 거절
export async function rejectUser(uid: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'users', uid), { status: 'rejected' });
}

// 원 구성원 전체 조회
export async function getCenterMembers(centerId: string): Promise<KidsUser[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, 'users'), where('centerId', '==', centerId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as KidsUser)
    .filter((u) => u.status !== 'pending' && u.status !== 'rejected');
}

// 원장님 원 등록 (가입 시 신규 원 생성)
export async function createCenter(
  uid: string,
  email: string,
  displayName: string,
  centerName: string,
) {
  const db = getFirebaseDb();
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const centerRef = doc(collection(db, 'centers'));

  await setDoc(centerRef, {
    name: centerName,
    code,
    seatCount: 0,
    tokenUsed: 0,
    status: 'pending',
    adminUid: uid,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, 'users', uid), {
    uid,
    email,
    displayName,
    role: 'center_admin' as UserRole,
    status: 'pending',
    centerId: centerRef.id,
    centerName,
    tokenUsed: 0,
    createdAt: serverTimestamp(),
  });

  return { centerId: centerRef.id, code };
}

// 카카오 로그인 (Firebase 계정 자동 생성/로그인)
const KAKAO_EMAIL_SUFFIX = '@kakao.aikids.local';
const KAKAO_PW_PREFIX = 'kk_aikids_';

export async function loginWithKakao(kakaoId: string, nickname: string) {
  const email = `k${kakaoId}${KAKAO_EMAIL_SUFFIX}`;
  const password = `${KAKAO_PW_PREFIX}${kakaoId}_2026`;
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  let uid: string;
  let isNew = false;

  try {
    // 기존 계정 로그인
    const cred = await signInWithEmailAndPassword(auth, email, password);
    uid = cred.user.uid;
  } catch {
    // 없으면 새로 생성
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: nickname });
    uid = cred.user.uid;
    isNew = true;

    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      displayName: nickname,
      kakaoId,
      role: 'teacher' as UserRole,
      status: 'pending',
      centerId: null,
      centerName: null,
      phone: null,
      tokenUsed: 0,
      createdAt: serverTimestamp(),
    });
  }

  // 유저 문서 확인
  const userDoc = await getUserDoc(uid);
  return { uid, isNew, userDoc };
}

// 전화번호로 사전등록된 선생님 매칭
export async function matchPhoneToCenter(uid: string, phone: string): Promise<{ matched: boolean; centerName?: string }> {
  const db = getFirebaseDb();
  const normalized = phone.replace(/[^0-9]/g, '');

  // preregistered_teachers 컬렉션에서 전화번호 검색
  const q = query(
    collection(db, 'preregistered_teachers'),
    where('phone', '==', normalized),
    where('linked', '==', false),
  );
  const snap = await getDocs(q);

  if (snap.empty) return { matched: false };

  const preDoc = snap.docs[0];
  const data = preDoc.data() as { centerId: string; centerName: string; name: string };

  // 유저 문서에 어린이집 연결 + 자동 승인(active)
  await updateDoc(doc(db, 'users', uid), {
    centerId: data.centerId,
    centerName: data.centerName,
    displayName: data.name,
    phone: normalized,
    status: 'active',
  });

  // 사전등록 문서를 linked 처리
  await updateDoc(doc(db, 'preregistered_teachers', preDoc.id), {
    linked: true,
    linkedUid: uid,
    linkedAt: serverTimestamp(),
  });

  // seatCount 증가
  await updateDoc(doc(db, 'centers', data.centerId), { seatCount: increment(1) });

  return { matched: true, centerName: data.centerName };
}

// 원장님이 선생님 사전등록
export async function preregisterTeacher(centerId: string, centerName: string, name: string, phone: string) {
  const db = getFirebaseDb();
  const normalized = phone.replace(/[^0-9]/g, '');
  const ref = doc(collection(db, 'preregistered_teachers'));
  await setDoc(ref, {
    centerId,
    centerName,
    name,
    phone: normalized,
    linked: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// 사전등록 선생님 목록 조회
export async function getPreregisteredTeachers(centerId: string) {
  const db = getFirebaseDb();
  const q = query(collection(db, 'preregistered_teachers'), where('centerId', '==', centerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
    id: string; name: string; phone: string; linked: boolean; linkedUid?: string;
  }[];
}

// 사전등록 선생님 삭제
export async function deletePreregisteredTeacher(docId: string) {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(getFirebaseDb(), 'preregistered_teachers', docId));
}

// 로그아웃
export async function logout() {
  await signOut(getFirebaseAuth());
}

// 쿠키 삭제 (클라이언트 전용)
export function clearAuthCookies() {
  const opts = 'path=/; max-age=0';
  document.cookie = `kids_role=; ${opts}`;
  document.cookie = `kids_status=; ${opts}`;
  document.cookie = `kids_org_status=; ${opts}`;
}

// 로그아웃 + 쿠키 삭제 통합
export async function logoutAndClear() {
  await logout();
  clearAuthCookies();
}
