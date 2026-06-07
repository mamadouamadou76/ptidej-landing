export const prerender = false;

export async function POST({ request }) {
  try {
    console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'présente' : 'MANQUANTE');
    console.log('BREVO_LIST_ID:', process.env.BREVO_LIST_ID);
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Email invalide.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const BREVO_LIST_ID = Number(process.env.BREVO_LIST_ID);

    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        listIds: [BREVO_LIST_ID],
        updateEnabled: true,
        attributes: {
          SOURCE: 'ptidej-waitlist',
          SIGNUP_DATE: new Date().toISOString().split('T')[0],
        },
      }),
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      // 400 avec code 'duplicate_parameter' = déjà inscrit, on traite ça comme un succès
      if (err.code === 'duplicate_parameter') {
        return new Response(JSON.stringify({ success: true, already: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error('Brevo error:', err);
      return new Response(JSON.stringify({ error: 'Erreur Brevo.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('API error:', e);
    return new Response(JSON.stringify({ error: 'Erreur serveur.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
