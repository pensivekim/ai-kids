'use client';
import { useState, useEffect, useRef } from 'react';
import AppNav from '../../../../components/AppNav';

export default function QRScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [type, setType] = useState<'in' | 'out'>('in');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScan = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      // Use BarcodeDetector API (Chrome/Edge) or fallback message
      if ('BarcodeDetector' in window) {
        const detector = new (window as unknown as { BarcodeDetector: new (opts: object) => { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({ formats: ['qr_code'] });
        const scan = async () => {
          if (!scanning && !videoRef.current) return;
          try {
            if (videoRef.current) {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                const childId = codes[0].rawValue;
                stopScan();
                await punchChild(childId);
                return;
              }
            }
          } catch {}
          if (streamRef.current) requestAnimationFrame(scan);
        };
        scan();
      }
    } catch {
      setError('카메라 접근 권한이 필요합니다.');
    }
  };

  const stopScan = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const punchChild = async (childId: string) => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, type, method: 'qr' }),
    });
    if (res.ok) {
      setResult(`✅ ${type === 'in' ? '등원' : '하원'} 처리 완료`);
    } else {
      setResult('❌ 처리 실패');
    }
    setTimeout(() => { setResult(''); }, 3000);
  };

  useEffect(() => () => stopScan(), []);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <AppNav />
      <main style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontWeight: 900, fontSize: '1.5rem', marginBottom: '1.5rem' }}>QR 출결 스캔</h1>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
          {(['in', 'out'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)}
              style={{ background: type === t ? '#22c55e' : '#1e293b', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.6rem 1.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>
              {t === 'in' ? '🌅 등원' : '🌙 하원'}
            </button>
          ))}
        </div>

        <div style={{ background: '#1e293b', borderRadius: '1rem', overflow: 'hidden', aspectRatio: '1', marginBottom: '1rem', position: 'relative' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
          {!scanning && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '3rem' }}>📷</span>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>카메라를 시작하세요</p>
            </div>
          )}
          {scanning && (
            <div style={{ position: 'absolute', inset: 0, border: '3px solid #22c55e', borderRadius: '1rem', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '60%', height: '60%', border: '2px dashed rgba(255,255,255,0.5)', borderRadius: '0.5rem' }} />
            </div>
          )}
        </div>

        {result && <div style={{ background: result.includes('✅') ? '#dcfce7' : '#fee2e2', color: result.includes('✅') ? '#166534' : '#991b1b', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>{result}</div>}
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}

        {typeof window !== 'undefined' && !('BarcodeDetector' in window) && scanning && (
          <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
            이 브라우저는 QR 자동 인식을 지원하지 않습니다. Chrome을 사용해 주세요.
          </div>
        )}

        <button onClick={scanning ? stopScan : startScan}
          style={{ width: '100%', background: scanning ? '#ef4444' : '#22c55e', color: 'white', border: 'none', borderRadius: '0.75rem', padding: '0.85rem', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>
          {scanning ? '⏹ 스캔 중지' : '▶ 스캔 시작'}
        </button>
      </main>
    </div>
  );
}
