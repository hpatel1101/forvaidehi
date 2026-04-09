import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient() {
  if (!url || !serviceRoleKey) throw new Error('Missing Supabase environment variables.');
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalize(value) {
  return (value ?? '').trim().toLowerCase();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = normalize(searchParams.get('q'));
    if (!query) return NextResponse.json({ error: 'Missing search query.' }, { status: 400 });

    const supabase = getClient();
    const { data, error } = await supabase.from('guests').select('*').order('id', { ascending: true });
    if (error) throw error;

    const rows = (data ?? []).map((row) => {
      const firstName = row['First Name'] ?? '';
      const lastName = row['Last Name'] ?? '';
      const partyName = row['Party (Optional)'] ?? '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
      return { id: row.id, fullName, firstName, lastName, partyName: partyName || fullName, attending: row.attending ?? '' };
    });

    const matched = rows.find((row) => [row.fullName, row.firstName, row.lastName, row.partyName].join(' | ').toLowerCase().includes(query));
    if (!matched) return NextResponse.json({ party: null });

    const members = rows.filter((row) => row.partyName.toLowerCase() === matched.partyName.toLowerCase());
    return NextResponse.json({
      party: {
        partyName: matched.partyName,
        members: members.map((member) => ({ id: member.id, fullName: member.fullName, attending: member.attending })),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to search guest list.' }, { status: 500 });
  }
}
