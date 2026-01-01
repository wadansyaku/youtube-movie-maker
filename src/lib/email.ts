import { Resend } from "resend";

// Lazy initialization to avoid build errors when API key is not set
const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, email sending will be disabled");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
};

interface SendVerificationRequestParams {
  identifier: string;
  url: string;
  provider: { from: string };
}

export async function sendVerificationRequest({
  identifier,
  url,
  provider,
}: SendVerificationRequestParams) {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn("Email sending disabled - no API key");
      return;
    }

    await resend.emails.send({
      from: provider.from,
      to: identifier,
      subject: "YouTube Movie Maker - サインイン",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">YouTube Movie Maker</h1>
          <p>以下のボタンをクリックしてサインインしてください。</p>
          <a href="${url}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            サインイン
          </a>
          <p style="color: #666; font-size: 14px;">
            このリンクは24時間有効です。<br/>
            心当たりがない場合は、このメールを無視してください。
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Failed to send verification email");
  }
}
