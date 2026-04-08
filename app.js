const CONFIG = {
  guestListPath: 'data/guest-list.sample.json',
  googleForm: {
    formId: 'PASTE_GOOGLE_FORM_ID',
    entryGuestLookup: 'entry.1111111111',
    entryPartyName: 'entry.2222222222',
    entryResponses: 'entry.3333333333'
  }
};

const state = {
  households: [],
  currentHousehold: null
};

const lookupForm = document.getElementById('lookupForm');
const guestSearchInput = document.getElementById('guestSearch');
const lookupMessage = document.getElementById('lookupMessage');
const partyCard = document.getElementById('partyCard');
const partyName = document.getElementById('partyName');
const partyGuests = document.getElementById('partyGuests');
const partySizeBadge = document.getElementById('partySizeBadge');
const guestRows = document.getElementById('guestRows');
const rsvpForm = document.getElementById('rsvpForm');
const rsvpMessage = document.getElementById('rsvpMessage');

init();

async function init() {
  try {
    const response = await fetch(CONFIG.guestListPath, { cache: 'no-store' });
    const data = await response.json();
    state.households = (data.households || []).map((household) => ({
      ...household,
      searchBlob: [household.displayName, ...(household.members || [])].join(' | ').toLowerCase()
    }));
  } catch (error) {
    console.error(error);
    setMessage(lookupMessage, 'Could not load the guest list. Please refresh and try again.', 'error');
  }
}

lookupForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = guestSearchInput.value.trim().toLowerCase();

  if (!query) {
    setMessage(lookupMessage, 'Please enter your name.', 'error');
    return;
  }

  const match = state.households.find((household) => household.searchBlob.includes(query));
  if (!match) {
    state.currentHousehold = null;
    partyCard.classList.add('hidden');
    setMessage(lookupMessage, 'No matching invitation was found. Please try a full first and last name.', 'error');
    return;
  }

  state.currentHousehold = match;
  renderHousehold(match);
  setMessage(lookupMessage, 'Invitation found. Please select attending or not attending for each guest.', 'success');
});

rsvpForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!state.currentHousehold) {
    setMessage(rsvpMessage, 'Please find your party first.', 'error');
    return;
  }

  const selections = [];
  for (const guest of state.currentHousehold.members) {
    const checked = rsvpForm.querySelector(`input[name="${cssEscape(guest)}"]:checked`);
    if (!checked) {
      setMessage(rsvpMessage, `Please choose attending or not attending for ${guest}.`, 'error');
      return;
    }
    selections.push(`${guest}: ${checked.value}`);
  }

  if (!isGoogleFormConfigured()) {
    setMessage(rsvpMessage, 'The Google Form is not configured yet. Add the form ID and entry IDs in app.js.', 'error');
    return;
  }

  const formUrl = buildGoogleFormUrl({
    guestLookup: guestSearchInput.value.trim(),
    partyName: state.currentHousehold.displayName,
    responses: selections.join(' | ')
  });

  window.open(formUrl, '_blank', 'noopener');
  setMessage(rsvpMessage, 'Your RSVP has been transferred into the Google Form. Complete the final submit there.', 'success');
});

function renderHousehold(household) {
  partyName.textContent = household.displayName;
  partyGuests.textContent = household.members.join(', ');
  partySizeBadge.textContent = `${household.members.length} guest${household.members.length === 1 ? '' : 's'}`;

  guestRows.innerHTML = '';
  for (const guest of household.members) {
    const wrap = document.createElement('div');
    wrap.className = 'guest-row';
    wrap.innerHTML = `
      <div>
        <p class="guest-name">${escapeHtml(guest)}</p>
      </div>
      <div class="radio-row">
        <label><input type="radio" name="${escapeAttr(guest)}" value="Attending"> Attending</label>
        <label><input type="radio" name="${escapeAttr(guest)}" value="Not attending"> Not attending</label>
      </div>
    `;
    guestRows.appendChild(wrap);
  }

  partyCard.classList.remove('hidden');
}

function buildGoogleFormUrl(values) {
  const base = `https://docs.google.com/forms/d/e/${CONFIG.googleForm.formId}/viewform`;
  const params = new URLSearchParams();
  params.set(CONFIG.googleForm.entryGuestLookup, values.guestLookup);
  params.set(CONFIG.googleForm.entryPartyName, values.partyName);
  params.set(CONFIG.googleForm.entryResponses, values.responses);
  return `${base}?${params.toString()}`;
}

function isGoogleFormConfigured() {
  return CONFIG.googleForm.formId && !CONFIG.googleForm.formId.includes('PASTE_');
}

function setMessage(element, text, type) {
  element.textContent = text;
  element.className = 'form-message';
  if (type) element.classList.add(type);
}

function cssEscape(value) {
  return value.replace(/(["\\])/g, '\\$1');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}
