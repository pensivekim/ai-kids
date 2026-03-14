import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from './firebase';
import type { KidsUser, UserRole, PlanTier } from '../types';

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

// Firestore 유저 문서 조회
export async function getUserDoc(uid: string): Promise<KidsUser | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as KidsUser;
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

// 선생님 승인
export async function approveUser(uid: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'users', uid), { status: 'active' });
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
  plan: PlanTier,
) {
  const db = getFirebaseDb();
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const centerRef = doc(collection(db, 'centers'));

  await setDoc(centerRef, {
    name: centerName,
    code,
    plan,
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

// 로그아웃
export async function logout() {
  await signOut(getFirebaseAuth());
}
