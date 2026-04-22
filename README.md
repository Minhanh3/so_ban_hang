<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# So Ban Hang

## Run locally

Prerequisites: Node.js

1. Install dependencies with `npm install`.
2. Create `.env.local` from `.env.example`.
3. Fill `GEMINI_API_KEY` if you use the AI assistant.
4. Fill the `VITE_FIREBASE_*` variables to enable Cloud Firestore.
5. Start the app with `npm run dev`.

## Firebase notes

- The app now reads and writes business data through Cloud Firestore when Firebase config is present.
- Data is scoped under `users/{userId}/app_data/{datasetKey}` using the existing local auth user id.
- If Firebase env vars are missing, the app falls back to `localStorage` so local development still works.
- Existing local data is used as the initial seed for Firestore the first time a dataset is loaded and no remote document exists yet.
