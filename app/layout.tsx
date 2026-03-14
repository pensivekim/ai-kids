import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';

export const metadata: Metadata = {
  title: 'AI Kids — 어린이집 AI 도우미',
  description: '가정통신문, 보육일지, 계획안, SNS 문구까지 — 어린이집 선생님을 위한 AI 올인원 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
