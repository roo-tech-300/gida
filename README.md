Gida

Getting Started

1. Clone the repo
```bash
git clone https://github.com/yourname/your-app.git
cd your-app

2. Install dependencies
npm install
or
yarn install

3. Go to the WhatsApp group and copy the env file there and add it to the root of the project.

5. Run the app
npx expo start
Scan the QR code with Expo Go on your phone, or press `a` for Android emulator / `i` for iOS simulator.

Tech Stack
- *Frontend:* Expo / React Native
- *Backend:* Supabase
- *Language:* TypeScript

Notes for Devs
- After pulling new code, run `npm install` if `package.json` changed
- Get Supabase keys from the WhatsApp group. Do not share them outside the team
- If you get stuck, ask in the group chat

`.env.example` - put this in root too
```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
*`.gitignore`* - make sure this is in there
.env
.env.local
node_modules
.expo
