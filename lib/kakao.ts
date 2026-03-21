// Kakao JS SDK helper

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '';

let loaded = false;

export function loadKakaoSDK(): Promise<void> {
  if (loaded && window.Kakao) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_JS_KEY);
      loaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
    script.onload = () => {
      if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_JS_KEY);
      loaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Kakao SDK load failed'));
    document.head.appendChild(script);
  });
}

interface KakaoProfile {
  id: number;
  properties?: { nickname?: string; profile_image?: string };
  kakao_account?: { email?: string };
}

export async function kakaoLogin(): Promise<{ kakaoId: string; nickname: string; email: string }> {
  await loadKakaoSDK();
  return new Promise((resolve, reject) => {
    window.Kakao.Auth.login({
      success: async () => {
        try {
          const profile: KakaoProfile = await new Promise((res, rej) => {
            window.Kakao.API.request({
              url: '/v2/user/me',
              success: res,
              fail: rej,
            });
          });
          resolve({
            kakaoId: String(profile.id),
            nickname: profile.properties?.nickname || '',
            email: profile.kakao_account?.email || '',
          });
        } catch (err) {
          reject(err);
        }
      },
      fail: reject,
    });
  });
}

// TypeScript global declaration
declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Auth: {
        login: (options: {
          success: () => void;
          fail: (err: unknown) => void;
        }) => void;
      };
      API: {
        request: (options: {
          url: string;
          success: (res: KakaoProfile) => void;
          fail: (err: unknown) => void;
        }) => void;
      };
    };
  }
}
