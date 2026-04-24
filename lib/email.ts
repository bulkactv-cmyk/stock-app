import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAlertEmail({
  to,
  symbol,
  price,
  target,
}: {
  to: string;
  symbol: string;
  price: number;
  target: number;
}) {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject: `🚨 Alert: ${symbol} достигна ${target}`,
    html: `
      <div style="font-family:sans-serif">
        <h2>🚨 Ценови Alert</h2>
        <p><strong>${symbol}</strong> достигна целевата цена.</p>
        <p>Текуща цена: <b>${price}</b></p>
        <p>Таргет: <b>${target}</b></p>
      </div>
    `,
  });
}