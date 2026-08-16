import { Resend } from "resend";

// Odesílání e-mailů přes Resend. Když RESEND_API_KEY není nastaven, funkce se
// elegantně přeskočí (sdílení na e-mail funguje i tak — příjemce bod uvidí po
// registraci; e-mail je jen navíc upozornění).

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Skrytokraj <onboarding@resend.dev>";
const appUrl = process.env.AUTH_URL ?? "";

export function isEmailConfigured(): boolean {
  return !!apiKey;
}

interface InviteOpts {
  to: string;
  inviterName: string;
  pointName: string;
  typeLabel: string; // "Poklad" / "Schránka se vzkazem"
}

export async function sendPrivateShareInvite(
  opts: InviteOpts,
): Promise<{ sent: boolean; reason?: string }> {
  if (!apiKey) return { sent: false, reason: "no-api-key" };

  const resend = new Resend(apiKey);
  const registerUrl = `${appUrl}/registrace`;
  const typeLower = opts.typeLabel.toLowerCase();
  const subject = `Ve Skrytokraji na tebe čeká ${typeLower}`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#0f1512;color:#e7ecdf;padding:28px;border-radius:14px;max-width:520px;margin:auto">
    <p style="letter-spacing:.16em;text-transform:uppercase;color:#6f8a86;font-size:12px;margin:0 0 10px">Skrytokraj</p>
    <h1 style="font-size:22px;margin:0 0 14px">${escapeHtml(opts.inviterName)} pro tebe něco schoval(a)</h1>
    <p style="color:#9fb0a0;line-height:1.6;margin:0 0 18px">
      Ve Skrytokraji — hře na pomezí krajiny a příběhu — na tebe čeká
      <strong style="color:#e9d9a4">${typeLower}</strong>${
        opts.pointName ? `: „${escapeHtml(opts.pointName)}"` : ""
      }, nasdílený jen tobě. Až si založíš účet se stejným e-mailem, uvidíš ho na mapě.
    </p>
    <a href="${registerUrl}" style="display:inline-block;background:#cde0b8;color:#0f1512;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">Založit účet a najít ho</a>
    <p style="color:#6f8a86;font-size:12px;margin:22px 0 0">Pokud tě to nezajímá, e-mail klidně ignoruj.</p>
  </div>`;

  try {
    await resend.emails.send({ from, to: opts.to, subject, html });
    return { sent: true };
  } catch (e) {
    console.error("Resend: odeslání pozvánky selhalo:", e);
    return { sent: false, reason: "send-error" };
  }
}

interface ReportOpts {
  pointName: string;
  category: string;
  message: string;
  reporterName: string;
}

// Upozornění adminovi na nové nahlášení nevhodného obsahu.
export async function sendReportNotification(
  opts: ReportOpts,
): Promise<{ sent: boolean }> {
  const to = process.env.REPORT_NOTIFY_EMAIL || "daasa.d@seznam.cz";
  if (!apiKey) return { sent: false };

  const resend = new Resend(apiKey);
  const adminUrl = `${appUrl}/admin/nahlaseni`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:560px">
    <h2>Skrytokraj — nové nahlášení</h2>
    <p><strong>Objekt:</strong> ${escapeHtml(opts.pointName)}</p>
    <p><strong>Důvod:</strong> ${escapeHtml(opts.category)}</p>
    <p><strong>Popis:</strong><br>${escapeHtml(opts.message).replace(/\n/g, "<br>")}</p>
    <p><strong>Nahlásil(a):</strong> ${escapeHtml(opts.reporterName)}</p>
    <p><a href="${adminUrl}">Otevřít přehled nahlášení →</a></p>
  </div>`;

  try {
    await resend.emails.send({
      from,
      to,
      subject: `Skrytokraj — nahlášení: ${opts.pointName}`,
      html,
    });
    return { sent: true };
  } catch (e) {
    console.error("Resend: odeslání nahlášení selhalo:", e);
    return { sent: false };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
