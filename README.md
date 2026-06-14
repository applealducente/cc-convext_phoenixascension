# Phoenix Sales Script Guide

A sales script guide with a built-in admin panel for editing tabs, scripts,
and calculator rates without touching code.

## What's in this project

- `public/index.html` + `public/script.js` + `public/styles.css`: the live
  site agents use during calls.
- `public/admin.html` + `public/admin.js` + `public/admin.css`: the
  password-protected admin panel for editing content.
- `public/content.json`: the default content (used the first time the site
  loads, before any admin edits are saved).
- `api/content.js`: serverless function that serves the current content
  (from Vercel KV if available, otherwise the bundled `content.json`) and
  saves new content when the admin clicks "Save & publish live".
- `api/login.js`: checks the admin password.
- `api/reset.js`: clears saved edits, reverting the live site to
  `content.json`.

## One-time setup

### 1. Push this folder to GitHub

Replace the contents of your existing repo with everything in this folder
(keeping the same folder structure: `public/`, `api/`, `package.json`,
`vercel.json`).

### 2. Create a Vercel account and import the repo

1. Go to vercel.com and sign in with your GitHub account (free).
2. Click "Add New" -> "Project".
3. Select your repo and click "Import".
4. Leave the default settings and click "Deploy". Vercel will build and
   give you a live URL (e.g. `https://your-project.vercel.app`).

### 3. Enable Vercel KV (for shared admin edits)

1. In your Vercel project dashboard, go to the "Storage" tab.
2. Click "Create Database" and choose "KV" (the free tier is enough for
   this).
3. Once created, click "Connect" and select this project. Vercel will
   automatically add the required environment variables
   (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.) to your project.
4. Redeploy the project (Vercel usually prompts you to do this, or go to
   "Deployments" -> click the "..." menu on the latest deployment ->
   "Redeploy").

Without this step, the site still works, but admin edits won't be saved
permanently (the "Save & publish live" button will show an error).

### 4. Set the admin password

1. In your Vercel project, go to "Settings" -> "Environment Variables".
2. Add a new variable:
   - Name: `ADMIN_PASSWORD`
   - Value: pick any password you want (e.g. `phoenix2026`)
   - Environment: Production (and Preview/Development if you want to test
     locally)
3. Save, then redeploy the project for the variable to take effect.

## Using the admin panel

1. Go to `https://your-project.vercel.app/admin.html`.
2. Enter the password you set in `ADMIN_PASSWORD`.
3. Edit tabs, scripts, calculator rates, or the floating toolbar buttons.
4. Click "Save & publish live". Changes appear on the live site for
   everyone immediately (no GitHub upload needed).
5. "Reset to defaults" clears all saved edits and reverts to the
   `content.json` bundled in the repo (useful if something goes wrong).

## Editing tabs and scripts

Each tab has:

- **Nav label**: the text on the pill button at the top.
- **Page title**: the heading shown at the top of the tab's content.
- **Script content (HTML)**: the body of the tab. Basic HTML is supported:
  - `<p class="hint">...</p>` for the intro/explanation line
  - `<h3>...</h3>` for sub-headings
  - `<div class="script-block">...</div>` for a script box (use
    `class="script-block alt"` for the alternate-colored variant)
  - `<ul><li>...</li></ul>` for bullet lists
  - `<strong>`, `<em>` for bold/italic text within scripts

You can reorder tabs with "Move up" / "Move down", delete tabs, or add new
ones with "+ Add new tab".

## Editing calculator rates

The "Calculator Rates" section controls the numbers used by all four
calculators on the live site (DHJ Voucher, ETF, One-Time/Trial,
Negotiation). Changing a rate here updates every calculator that uses it,
no code changes needed.

## Notes

- The "Notes" feature on the live site (bottom-right toolbar) saves to each
  user's own browser only, it is not shared or editable from the admin
  panel.
- If you ever lose the admin password, update the `ADMIN_PASSWORD`
  environment variable in Vercel and redeploy.
