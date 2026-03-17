// NHN Cloud 알림톡 유틸
// env: NHN_APPKEY, NHN_SECRET_KEY, NHN_SENDER_KEY

interface AlimtalkPayload {
  senderKey: string;
  templateCode: string;
  recipientList: { recipientNo: string; templateParameter?: Record<string, string> }[];
}

export async function sendAlimtalk(
  env: { NHN_APPKEY?: string; NHN_SECRET_KEY?: string; NHN_SENDER_KEY?: string },
  templateCode: string,
  phone: string,
  params: Record<string, string> = {}
): Promise<boolean> {
  const { NHN_APPKEY, NHN_SECRET_KEY, NHN_SENDER_KEY } = env;
  if (!NHN_APPKEY || !NHN_SECRET_KEY || !NHN_SENDER_KEY) return false;

  const payload: AlimtalkPayload = {
    senderKey: NHN_SENDER_KEY,
    templateCode,
    recipientList: [{ recipientNo: phone.replace(/-/g, ''), templateParameter: params }],
  };

  const res = await fetch(
    `https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys/${NHN_APPKEY}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Key': NHN_SECRET_KEY,
      },
      body: JSON.stringify(payload),
    }
  );
  return res.ok;
}
