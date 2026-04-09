import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function POST(request) {
  try {
    const body = await request.json();
    const updates = Array.isArray(body.updates) ? body.updates : [];
    if (!updates.length) return NextResponse.json({ error: 'No RSVP updates provided.' }, { status: 400 });

    for (const item of updates) {
      const attending = item.attending === 'Attending' ? 'Attending' : 'Not attending';
      const { error } = await supabase.from('guests').update({ attending }).eq('id', item.id);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to save RSVP.' }, { status: 500 });
  }
}
