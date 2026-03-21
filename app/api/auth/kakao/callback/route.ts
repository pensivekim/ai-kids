import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', req.url));
    }

    const REST_API_KEY = process.env.KAKAO_REST_API_KEY;
    if (!REST_API_KEY) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent('KAKAO_REST_API_KEY not set')}`, req.url));
    }

    const redirectUri = `${req.nextUrl.origin}/api/auth/kakao/callback`;

    // 1. code → access_token
    const tokenParams: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: REST_API_KEY,
      redirect_uri: redirectUri,
      code,
    };
    const clientSecret = process.env.KAKAO_CLIENT_SECRET;
    if (clientSecret) tokenParams.client_secret = clientSecret;

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(tokenParams).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Kakao token error:', errText, 'redirectUri:', redirectUri);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errText.slice(0, 200))}`, req.url));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. 사용자 정보 조회
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/login?error=user_info', req.url));
    }

    const userData = await userRes.json();
    const kakaoId = String(userData.id);
    const nickname = userData.properties?.nickname || '';

    // 3. 카카오 정보를 쿼리 파라미터로 전달 → 클라이언트에서 Firebase 인증 처리
    const params = new URLSearchParams({ kakaoId, nickname });
    return NextResponse.redirect(new URL(`/login?kakao=1&${params.toString()}`, req.url));
  } catch (err) {
    console.error('Kakao callback error:', err);
    return NextResponse.redirect(new URL('/login?error=server', req.url));
  }
}
