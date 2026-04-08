# Hardik & Vaidehi engagement site

This branch contains a static GitHub Pages website for the engagement celebration.

## What it does

- Shows a polished home page for Hardik & Vaidehi
- Displays the date: **August 8, 2026**
- Displays the time: **5:00 PM**
- Displays the location: **Cartersville, GA**
- Lets guests search by name
- Shows the whole party together
- Lets each guest be marked **Attending** or **Not attending**
- Sends the RSVP into a Google Form, which can save responses to Google Forms and to a linked Google Sheet. Google Forms also supports email notifications for new responses. citeturn154446search0turn154446search1

## Important files

- `index.html` — site content
- `style.css` — site styling
- `app.js` — guest lookup + Google Form handoff
- `data/guest-list.sample.json` — sample lookup data
- `.nojekyll` — deploy raw static files on GitHub Pages

## Google Form setup

Create a Google Form with these fields:

1. **Guest lookup** — short answer
2. **Party name** — short answer
3. **Responses** — paragraph

Then:

1. Open the Google Form
2. Click **Responses**
3. Use **Select destination for responses** to send the results to a Google Sheet. citeturn154446search0
4. Optionally turn on **Get email notifications for new responses** in the form’s Responses menu. citeturn154446search1
5. Use a prefilled link and inspect the URL to find the `entry.xxxxx` field IDs for each question
6. Update `app.js`:
   - `formId`
   - `entryGuestLookup`
   - `entryPartyName`
   - `entryResponses`

## Guest list data

The repo currently includes only a **sample** guest list file.

To use your real guest list, create `data/guest-list.json` in this format:

```json
{
  "households": [
    {
      "inviteCode": "HV001",
      "displayName": "Patel Family",
      "members": ["Krish Patel", "Parita Patel", "Dhaval Patel"]
    }
  ]
}
```

`app.js` currently points to `data/guest-list.sample.json`. Change that to `data/guest-list.json` after you add your real file.

## GitHub Pages

GitHub Pages is a static hosting service for HTML, CSS, and JavaScript files from your repository. citeturn108396search0turn108396search1

To publish:

1. Merge this branch into `main`
2. Go to **Settings → Pages**
3. Set the source to the root of the `main` branch
4. Save

## Privacy note

If you publish real guest names in a JSON file on GitHub Pages, that data is public to anyone who can access the site. Keep that in mind before adding the full real list.
