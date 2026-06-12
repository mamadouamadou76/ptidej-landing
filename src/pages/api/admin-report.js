export const prerender = false;

export async function POST({ request }) {
  try {
    const { token, stats } = await request.json();

    if (!token || !Array.isArray(stats)) {
      return new Response(JSON.stringify({ error: 'Paramètres manquants.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify Firebase ID token
    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
    if (!FIREBASE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Configuration serveur manquante.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!lookupRes.ok) {
      return new Response(JSON.stringify({ error: 'Token invalide.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { users } = await lookupRes.json();
    if (!users?.[0]) {
      return new Response(JSON.stringify({ error: 'Utilisateur introuvable.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'mamadouamadou76@gmail.com';
    if (users[0].email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: 'Accès refusé.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build email HTML
    const totalConnexions = stats.reduce((s, d) => s + (d.connexions ?? 0), 0);
    const totalNouveaux = stats.reduce((s, d) => s + (d.nouveaux ?? 0), 0);
    const rows = stats
      .map(
        d => `<tr>
          <td style="padding:8px 16px;font-family:monospace;color:#78716c">${d.date}</td>
          <td style="padding:8px 16px;text-align:right;font-weight:bold;color:#1c1917">${d.connexions ?? 0}</td>
          <td style="padding:8px 16px;text-align:right;font-weight:bold;color:#d97706">${d.nouveaux ?? 0}</td>
        </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Rapport P'tit Déj</title></head>
<body style="font-family:system-ui,sans-serif;background:#fafaf9;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e7e5e4;border-radius:12px;overflow:hidden">
    <div style="background:#f59e0b;padding:20px 24px">
      <h1 style="margin:0;color:#fff;font-size:20px">☕ Rapport P'tit Déj</h1>
      <p style="margin:4px 0 0;color:#fff8;font-size:13px">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    <div style="padding:24px">
      <div style="display:flex;gap:16px;margin-bottom:24px">
        <div style="flex:1;background:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#1c1917">${totalConnexions}</div>
          <div style="font-size:12px;color:#78716c;margin-top:4px">Connexions (7j)</div>
        </div>
        <div style="flex:1;background:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#d97706">${totalNouveaux}</div>
          <div style="font-size:12px;color:#78716c;margin-top:4px">Nouveaux (7j)</div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:2px solid #e7e5e4">
            <th style="padding:8px 16px;text-align:left;font-size:11px;color:#78716c;font-weight:600;text-transform:uppercase">Date</th>
            <th style="padding:8px 16px;text-align:right;font-size:11px;color:#78716c;font-weight:600;text-transform:uppercase">Connexions</th>
            <th style="padding:8px 16px;text-align:right;font-size:11px;color:#78716c;font-weight:600;text-transform:uppercase">Nouveaux</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="border-top:2px solid #e7e5e4;background:#fafaf9">
            <td style="padding:10px 16px;font-weight:700;color:#1c1917;font-size:13px">Total</td>
            <td style="padding:10px 16px;text-align:right;font-weight:700;color:#1c1917">${totalConnexions}</td>
            <td style="padding:10px 16px;text-align:right;font-weight:700;color:#d97706">${totalNouveaux}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div style="padding:12px 24px;background:#fafaf9;border-top:1px solid #e7e5e4;font-size:11px;color:#a8a29e;text-align:center">
      Rapport généré automatiquement par P'tit Déj Admin
    </div>
  </div>
</body>
</html>`;

    // Send via Brevo transactional
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: 'Clé Brevo manquante.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "P'tit Déj", email: ADMIN_EMAIL },
        to: [{ email: ADMIN_EMAIL, name: 'Admin P\'tit Déj' }],
        subject: `Rapport P'tit Déj — ${new Date().toLocaleDateString('fr-FR')}`,
        htmlContent: html,
      }),
    });

    if (!brevoRes.ok) {
      const err = await brevoRes.json().catch(() => ({}));
      console.error('Brevo error:', err);
      return new Response(JSON.stringify({ error: 'Erreur envoi email.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('admin-report error:', e);
    return new Response(JSON.stringify({ error: 'Erreur serveur.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
