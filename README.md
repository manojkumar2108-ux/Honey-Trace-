# HoneyTrace Prototype

## Current build
This package keeps the existing HoneyTrace UI and functions. The important fixes for the prototype submission are:

- QR generation is available only inside the Seller dashboard after login.
- There is no QR generator on the Home page.
- Public QR verification remains available when a QR verification URL is opened.
- The accidental raw JavaScript text that was appearing on the page has been removed by restoring the missing `<script>` boundary and deleting the duplicated print-QR fragment.
- Buyer, Seller, and Beekeeper profiles are stored separately in Supabase.
- Logged-in users see their own profile name and contact details.
- Additional profile fields can be entered after login and saved.
- Current user's profile, batches, hives, sensor readings, bee-audio analysis, and hive-health records can be exported to `.xlsx` from the dashboard.
- Seller batch creation stores a SHA-256 hash in `honey_batches.blockchain_hash` and generates a verification QR.
- The AI assistant remains in the existing UI and calls the Supabase Edge Function `honeytrace-ai`.

## Files

- `index.html` - active website page. Existing UI plus all current inline application logic.
- `app(5).js` - included backup/reference auth file. The active page does not load this file, so duplicate function definitions do not interfere with the UI.
- `supabase-config.js` - Supabase project URL and publishable key.
- `supabase_schema.sql` - database schema, role-specific profile tables, trigger, RLS, honey batches, QR verification data, and IoT tables.
- `supabase/functions/honeytrace-ai/index.ts` - Gemini-backed Edge Function source.
- `RUN_LOCAL.bat` - starts a local web server.
- `SUBMIT_CHECKLIST.txt` - final prototype test checklist.

## Supabase setup

1. Open Supabase SQL Editor and run `supabase_schema.sql`.
   - For the existing HoneyTrace project, the role/profile database changes have already been applied and verified.
2. In Authentication > Providers, keep Email enabled and make sure email confirmation is enabled for the submission flow.
3. In Authentication > URL Configuration, set your Site URL and add the URL used to open `index.html` as an allowed redirect URL. The page sends `emailRedirectTo` during email signup.
4. Do not put a service-role or secret key in `supabase-config.js`.

## Run locally

Double-click `RUN_LOCAL.bat` and open the local URL it prints, or use VS Code Live Server.

Do not open `app(5).js` directly. Open `index.html`.

## Required prototype flow

### Buyer / Seller / Beekeeper

1. Click Login.
2. Select the role.
3. Register with name, email, and password.
4. Check the email verification message.
5. Click the verification link.
6. Return to the site and login.
7. The dashboard should show the logged-in user's real profile name.
8. Fill the role-specific profile details and save them.
9. Click Download My Data (Excel).

### Seller QR

1. Login as Seller.
2. Open the Seller dashboard.
3. Fill Honey Type, Quantity, Harvest Date, and Origin.
4. Click `Generate Honey Batch & QR`.
5. Confirm the batch is saved and QR is shown in the Seller dashboard.
6. Download or print the QR.
7. Scan the QR or open its verification URL in another browser window.
8. The verification page should show the batch details and compare the stored SHA-256 hash.

## AI setup

The AI assistant uses the deployed `honeytrace-ai` Edge Function. Keep `GEMINI_API_KEY` only in Supabase Edge Function secrets.

Example CLI setup:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase functions deploy honeytrace-ai
```

## Prototype note

The `blockchain_hash` value is a SHA-256 data-integrity hash stored in Supabase. This prototype is not a real on-chain blockchain transaction. A production blockchain version would store a real smart-contract/network transaction hash as well.


## Prototype quick verification
1. Run `index.html` with VS Code Live Server.
2. Register a Seller with a fresh email and complete email verification.
3. Log in, complete the Seller profile, and click **Save Profile Details**.
4. In Seller Dashboard, add a honey batch and click **Generate Honey Batch & QR**.
5. The generated QR points to the current page with `?verify=<batch-id>`.
6. Click **Download QR** or **Print QR**.
7. Click **Download My Data (Excel)** to generate an `.xlsx` workbook.

The browser client uses only the Supabase publishable key. Do not put a service-role/secret key in `supabase-config.js`.


## AI FIX NOTE
The frontend invokes the deployed function slug `ai-assistant`. The function returns its generated text in the `reply` field, and the UI accepts that response.
