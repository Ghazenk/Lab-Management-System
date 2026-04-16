# Vercel Deployment Guide for Helix Laboratory OS

If you are experiencing a "white screen" or database errors after deploying to Vercel, follow these steps:

## 1. Environment Variables
Vite requires environment variables to be prefixed with `VITE_` to be accessible in the browser.

1. Go to your **Vercel Dashboard**.
2. Select your project.
3. Go to **Settings** > **Environment Variables**.
4. Add the following variables:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL (found in Project Settings > API).
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key (found in Project Settings > API).
   - `GEMINI_API_KEY`: (Optional) Your Google Gemini API Key.

**Important:** After adding these variables, you must **Redeploy** your project for the changes to take effect.

## 2. Database Setup (PGRST205 Errors)
The error `Could not find the table 'public.notifications' in the schema cache` means the tables do not exist in your Supabase project.

1. Go to your **Supabase Dashboard**.
2. Select your project.
3. Open the **SQL Editor** from the left sidebar.
4. Click **New Query**.
5. Copy the contents of the `supabase-setup.sql` file (found in the root of this project) and paste it into the editor.
6. Click **Run**.
7. Once the tables are created, click the **"Seed Laboratory Data"** button on the Dashboard of your app to populate it with initial data.

## 3. Realtime Configuration
To enable real-time updates (like the equipment alerts and specimen tracking), ensure that **Realtime** is enabled for your tables in the Supabase dashboard (the SQL script handles this, but you can verify it under Database > Replication).

## 4. Troubleshooting White Screen
If you still see a white screen:
- Open the browser's **Developer Tools** (F12 or Right-click > Inspect).
- Check the **Console** tab for specific error messages.
- Common issues include:
  - `VITE_SUPABASE_URL` is undefined (check Vercel env vars).
  - Mixed content errors (ensure you are using `https`).
  - Build failures (check Vercel deployment logs).
