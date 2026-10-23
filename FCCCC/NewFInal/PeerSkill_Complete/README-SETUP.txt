PEERSKILL - PEER CONNECTION FEATURES

FILES
- index.html: website and dashboard interface
- style.css: styles for Find People, requests and chat
- script.js: Supabase profile discovery, learning requests and messaging
- supabase-config.js: Supabase project URL and publishable key
- supabase-setup.sql: database tables, indexes, trigger and Row Level Security policies

ONE-TIME SUPABASE SETUP
1. Open https://supabase.com/dashboard and select your PeerSkill project.
2. Open SQL Editor -> New query.
3. Open supabase-setup.sql from this folder, copy its entire contents, paste into SQL Editor and click Run.
4. Open Project Settings -> API Keys (or Connect) and copy the Publishable key (starts with sb_publishable_).
5. Open supabase-config.js and replace YOUR_SUPABASE_ANON_KEY with that Publishable key. The project URL has already been filled in from the URL you provided.
6. In Authentication -> URL Configuration, set Site URL to the actual Live Server URL, commonly http://127.0.0.1:5500, and add that URL plus /** to Redirect URLs. Use the exact port shown by Live Server.
7. Run index.html with VS Code Live Server. Do not open the file directly with file://.

HOW TO USE
1. Register/login. Confirm your email if Supabase email confirmation is enabled.
2. Open My profile and complete your name, bio and learning interests.
3. Open My skills and add comma-separated skills you can teach.
4. Open Find people, search for a skill/name/interest, and click Request to learn.
5. The recipient opens Learning requests and accepts or declines.
6. Once accepted, either person can open Messages and start chatting.

IMPORTANT
- Every student must create an account and complete a profile before they appear in Find people.
- Chat is available only after a learning request is accepted.
- Use only the Supabase Publishable key in browser code. Never use the secret/service_role key.
- This project uses Supabase Auth + Postgres with Row Level Security. The SQL setup is mandatory; frontend code alone cannot create a secure shared user directory.
- The app has been syntax-checked, but a live end-to-end test requires running the SQL in your Supabase project and adding your Publishable key.
