'use client';
import { useState, useEffect, useCallback } from 'react';
import AppNav from '../../../components/AppNav';

interface Alert { id: string; child_name: string; class_name: string; allergen: string; meal_item: string; acknowledged_at?: string; }
interface Child { id: string; name: string; class_name: string; allergies: string[]; }
interface MenuItem { name: string; allergens: string[]; }

const COMMON_ALLERGENS = ['난류','우유','메밀','땅콩','대두','밀','고등어','게','새우','돼지고기','복숭아','토마토'];

export default function AllergyPage() {
  const [tab, setTab] = useState<'alerts' | 'menu' | 'children'>('alerts');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unread, setUnread] = useState(0);
  const [children, setChildren] = useState<Child[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([{ name: '', allergens: [] }]);
  const [mealType, setMealType] = useState('lunch');
  const [msg, setMsg] = useState('');
  const [editChild, setEditChild] = useState<Child | null>(null);

  const loadAlerts = useCallback(async () => {
    const res = await fetch(`/api/allergies/alert?date=${date}`);
    if (res.ok) { const d = await res.json() as { alerts: Alert[]; unacknowledged: number }; setAlerts(d.alerts); setUnread(d.unacknowledged); }
  }, [date]);

  const loadChildren = useCallback(async () => {
    const res = await fetch('/api/allergies');
    if (res.ok) setChildren(await res.json() as Child[]);
  }, []);

  useEffect(() => { loadAlerts(); loadChildren(); }, [loadAlerts, loadChildren]);

  const ack = async (alertId: string) => {
    await fetch('/api/allergies/alert', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alertId }) });
    loadAlerts();
  };

  const submitMenu = async () => {
    const res = await fetch('/api/allergies/menu', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuDate: date, mealType, items: menuItems.filter((i) => i.name) }),
    });
    if (res.ok) {
      const d = await res.json() as { alertCount: number };
      setMsg(`메뉴 저장 완료 · 알레르기 경보 ${d.alertCount}건 생성`);
      loadAlerts(); setTimeout(() => setMsg(''), 3000);
    }
  };

  const saveAllergies = async () => {
    if (!editChild) return;
    await fetch('/api/allergies', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editChild.id, allergies: editChild.allergies }) });
    setEditChild(null); loadChildren(); setMsg('저장됨'); setTimeout(() => setMsg(''), 2000);
  };

  const toggleAllergen = (allergen: string) => {
    if (!editChild) return;
    const current = editChild.allergies || [];
    setEditChild({ ...editChild, allergies: current.includes(allergen) ? current.filter((a) => a !== allergen) : [...current, allergen] });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.6rem' }}>⚠️</span>
          <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>
            알레르기 급식 관리
            {unread > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '1rem', padding: '0.15rem 0.6rem', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{unread}건</span>}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[['alerts', '⚠️ 경보'], ['menu', '🍱 메뉴 등록'], ['children', '👶 원아 알레르기']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v as typeof tab)}
              style={{ background: tab === v ? '#ef4444' : '#f1f5f9', color: tab === v ? 'white' : '#374151', border: 'none', borderRadius: '0.5rem', padding: '0.45rem 1rem', cursor: 'pointer', fontWeight: 600 }}>
              {l}
            </button>
          ))}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            style={{ marginLeft: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.4rem 0.75rem' }} />
        </div>

        {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>{msg}</div>}

        {/* 알레르기 경보 탭 */}
        {tab === 'alerts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {alerts.map((a) => (
              <div key={a.id} style={{ background: a.acknowledged_at ? 'white' : '#fff7ed', border: `2px solid ${a.acknowledged_at ? '#e2e8f0' : '#fed7aa'}`, borderRadius: '0.75rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{a.child_name}</span>
                  <span style={{ color: '#64748b', marginLeft: '0.5rem', fontSize: '0.85rem' }}>({a.class_name})</span>
                  <div style={{ fontSize: '0.85rem', color: '#ea580c', marginTop: '0.2rem' }}>
                    🚫 <strong>{a.meal_item}</strong> 에 <strong>{a.allergen}</strong> 포함
                  </div>
                  {a.acknowledged_at && <div style={{ fontSize: '0.8rem', color: '#22c55e' }}>✓ 확인됨</div>}
                </div>
                {!a.acknowledged_at && (
                  <button onClick={() => ack(a.id)} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.45rem 0.9rem', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>확인</button>
                )}
              </div>
            ))}
            {alerts.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>오늘 알레르기 경보가 없습니다 ✅</div>}
          </div>
        )}

        {/* 메뉴 등록 탭 */}
        {tab === 'menu' && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {[['breakfast','아침'],['lunch','점심'],['snack','간식'],['dinner','저녁']].map(([v,l]) => (
                <button key={v} onClick={() => setMealType(v)}
                  style={{ background: mealType === v ? '#6366f1' : '#f1f5f9', color: mealType === v ? 'white' : '#374151', border: 'none', borderRadius: '0.4rem', padding: '0.35rem 0.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  {l}
                </button>
              ))}
            </div>
            {menuItems.map((item, idx) => (
              <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.5rem' }}>
                <input placeholder="음식 이름" value={item.name} onChange={(e) => { const n = [...menuItems]; n[idx].name = e.target.value; setMenuItems(n); }}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem', marginBottom: '0.5rem', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {COMMON_ALLERGENS.map((a) => (
                    <button key={a} onClick={() => { const n = [...menuItems]; n[idx].allergens = n[idx].allergens.includes(a) ? n[idx].allergens.filter((x) => x !== a) : [...n[idx].allergens, a]; setMenuItems(n); }}
                      style={{ background: item.allergens.includes(a) ? '#ef4444' : '#f1f5f9', color: item.allergens.includes(a) ? 'white' : '#374151', border: 'none', borderRadius: '1rem', padding: '0.2rem 0.55rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setMenuItems([...menuItems, { name: '', allergens: [] }])}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600 }}>
                + 음식 추가
              </button>
              <button onClick={submitMenu}
                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 700 }}>
                저장 · 경보 자동 생성
              </button>
            </div>
          </div>
        )}

        {/* 원아 알레르기 탭 */}
        {tab === 'children' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
              {children.map((c) => (
                <div key={c.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{c.class_name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                        {(c.allergies || []).map((a) => <span key={a} style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: '1rem' }}>{a}</span>)}
                        {(!c.allergies || c.allergies.length === 0) && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>없음</span>}
                      </div>
                    </div>
                    <button onClick={() => setEditChild(c)}
                      style={{ background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      수정
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 알레르기 수정 모달 */}
        {editChild && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', maxWidth: '460px', width: '90%' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>{editChild.name} 알레르기 설정</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                {COMMON_ALLERGENS.map((a) => (
                  <button key={a} onClick={() => toggleAllergen(a)}
                    style={{ background: editChild.allergies?.includes(a) ? '#ef4444' : '#f1f5f9', color: editChild.allergies?.includes(a) ? 'white' : '#374151', border: 'none', borderRadius: '1rem', padding: '0.35rem 0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                    {a}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setEditChild(null)} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.6rem', cursor: 'pointer' }}>취소</button>
                <button onClick={saveAllergies} style={{ flex: 2, background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.6rem', cursor: 'pointer', fontWeight: 700 }}>저장</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
