// Kakao REST API OAuth (redirect 방식)

export function kakaoLogin() {
  const REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const redirectUri = `${window.location.origin}/api/auth/kakao/callback`;
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  window.location.href = kakaoAuthUrl;
}
