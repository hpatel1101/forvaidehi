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

function buildScore(row, query) {
  const full = row.fullName.toLowerCase();
  const first = row.firstName.toLowerCase();
  const last = row.lastName.toLowerCase();
  const party = row.partyName.toLowerCase();

  if (full === query) return 100;
  if (first === query || last === query) return 90;
  if (party === query) return 80;
  if (full.startsWith(query)) return 70;
  if (first.startsWith(query) || last.startsWith(query)) return 60;
  if (party.startsWith(query)) return 50;
  if (full.includes(query)) return 40;
  if (first.includes(query) || last.includes(query)) return 30;
  if (party.includes(query)) return 20;
  return 0;
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
      return {
        id: row.id,
        fullName,
        firstName,
        lastName,
        partyName: partyName || fullName,
        attending: row.attending ?? '',
      };
    });

    const matchedRows = rows
      .map((row) => ({ row, score: buildScore(row, query) }))
      .filter((item) => item.score > 0);

    if (!matchedRows.length) return NextResponse.json({ parties: [] });

    const partyMap = new Map();

    for (const item of matchedRows) {
      const key = item.row.partyName.toLowerCase();
      if (!partyMap.has(key)) {
        partyMap.set(key, {
          partyName: item.row.partyName,
          matchedGuests: [],
          members: rows
            .filter((member) => member.partyName.toLowerCase() === key)
            .map((member) => ({
              id: member.id,
              fullName: member.fullName,
              attending: member.attending,
            })),
          score: item.score,
        });
      }

      const entry = partyMap.get(key);
      entry.score = Math.max(entry.score, item.score);
      if (!entry.matchedGuests.includes(item.row.fullName)) {
        entry.matchedGuests.push(item.row.fullName);
      }
    }

    const parties = Array.from(partyMap.values())
      .sort((a, b) => b.score - a.score || a.partyName.localeCompare(b.partyName))
      .map(({ score, ...party }) => party);

    return NextResponse.json({ parties });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to search guest list.' }, { status: 500 });
  }
}
