# English Buddy 💬

**English Buddy** is a voice-based English tutor app for the whole family. You talk to **Buddy**, a friendly AI tutor. Buddy answers out loud, gently corrects mistakes and keeps the conversation going. It works on iPhone and Android, and you can install it on your home screen like a normal app.

- 🎤 **Hold the mic button and talk.** Buddy answers out loud and also shows the text, with a 🔊 replay button.
- 👨‍👩‍👧 **Family profiles:** name, avatar, age and English level (Beginner, Elementary, Intermediate or Advanced). Buddy changes its words, sentence length and speaking speed for each person.
- 🎯 **5 practice modes:** Free Talk, Role Play, Word of the Day, Story Time and Pronunciation.
- ⭐ **Progress:** stars, badges, streaks, minutes practised, words learned and common mistakes.
- 🔒 **Parents area with a PIN:** progress for each person, recent conversations and daily limits.
- 🛡️ **Safe for kids:** Buddy stays on English learning, never asks for personal details and never shares links.
- 💸 **Free to run:** it uses Google Gemini's free tier, Cloudflare's free plan and GitHub Pages.

---

## How it works (in one minute)

```
Phone (the app)  ──►  Your Cloudflare Worker (tiny free server)  ──►  Google Gemini AI
 GitHub Pages          keeps API keys secret, checks the family code,       (or Claude)
                       enforces daily limits
```

- The **app** is a website on GitHub Pages. You can install it on your phone.
- The **Worker** is a tiny free Cloudflare server. It keeps your AI key secret, so the key is never in the app or in this repository.
- Every time you change the `main` branch, GitHub Actions **deploys everything automatically**. This includes copying your secrets into the Worker and telling the app where the Worker is.

---

## Setup, step by step (about 20 minutes, one time only)

You need 3 free accounts: **GitHub** (you already have one), **Google** (for Gemini) and **Cloudflare**.

### Step 1: Get a free Gemini API key

1. Go to **https://aistudio.google.com/apikey** and sign in with a Google account.
2. Click **Create API key**. If it asks, pick or create a project.
3. Copy the key (it starts with `AIza…`) and keep it somewhere safe for a few minutes.

### Step 2: Create a Cloudflare account and an API token

1. Go to **https://dash.cloudflare.com/sign-up** and create a free account. Confirm your email.
2. In the left menu, click **Workers & Pages** once. This sets up your free `workers.dev` address. If it asks you to choose a subdomain name, pick any name (for example your family name).
3. Click your profile icon (top right), then **My Profile**, then **API Tokens**, then **Create Token**.
4. Next to the template **"Edit Cloudflare Workers"**, click **Use template**.
5. Under **Account Resources**, choose your account. Under **Zone Resources**, choose **All zones**.
6. Click **Continue to summary**, then **Create Token**.
7. Copy the token. You will only see it once.

### Step 3: Choose a family code

Choose a **family code**, like a simple password, for example `blue-pancake-42`. Everyone in the family types it once on their phone. It stops strangers from using your AI quota if they find the app's address.

### Step 4: Add the 3 secrets to GitHub

1. Open this repository on GitHub.
2. Click **Settings** (top menu), then **Secrets and variables**, then **Actions**.
3. On the **Secrets** tab, click **New repository secret** and add these 3 secrets (the name must match exactly):

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the Cloudflare token from Step 2 |
| `GEMINI_API_KEY` | the Gemini key from Step 1 |
| `FAMILY_CODE` | your family code from Step 3 |

> 🔐 GitHub keeps these values secret. They are never shown again and never put into the app's code.

### Step 5: Turn on GitHub Pages

1. In the repository, click **Settings**, then **Pages** (left menu).
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.

### Step 6: Deploy

The app deploys every time the `main` branch changes.

- If these files are not on `main` yet (for example they are in a pull request), **merge the pull request into `main`**. The deployment starts automatically.
- Or start it by hand: click the **Actions** tab, then **Deploy English Buddy** (left), then **Run workflow**, then the green **Run workflow** button.

Wait about 2–3 minutes until the run has a green ✅.

### Step 7: Open the app

Your app link is:

```
https://<your-github-username>.github.io/<repository-name>/
```

For this repository that is **https://mhmd9929.github.io/english-tutor-/**.

You can also find the link here:
- the **Actions** tab: open the latest **Deploy English Buddy** run. The link is in the summary ("English Buddy is live").
- **Settings → Pages**: "Your site is live at …".

### Step 8: Install it on each phone

**iPhone / iPad**
1. Open the app link in **Safari**. This must be Safari, not Chrome.
2. Tap the **Share** button (the square with an arrow ⬆️).
3. Scroll down and tap **Add to Home Screen**, then **Add**.
4. Open **English Buddy** from your home screen. The first time you talk, allow microphone access.

**Android**
1. Open the app link in **Chrome**.
2. Tap **Install app** if a banner appears. Otherwise tap the **⋮** menu, then **Install app** (or **Add to Home screen**).
3. Open **English Buddy** from your home screen and allow microphone access.

### Step 9: First start

1. Tap **Let's start!** and type the **family code**.
2. Create a profile for the first learner.
3. Open the **Parents** tab and create a **parent PIN** (4–8 digits). There you can add more family members, set daily limits, choose Buddy's voice and read conversations.

🎉 That's it!

---

## Using the app

| Mode | What happens |
|---|---|
| 💬 **Free Talk** | Pick a topic (school, family, food, animals, sports, travel, hobbies) and chat. |
| 🎭 **Role Play** | Practise real situations: restaurant, shopping, doctor, meeting a new friend, airport. |
| 📚 **Word of the Day** | 5 new words for your level. Make a sentence with each word, and Buddy checks it. Every word you use earns ⭐ and goes into "Words learned". |
| 📖 **Story Time** | Buddy tells a short story for your level, then asks 3 questions about it. |
| 🎤 **Pronunciation** | Listen to a sentence, then say it. The app compares what it heard: green words were right, red words need practice. |

- **Hold to talk:** press and hold the big pink button while you speak, then let go. Or tap once to start and tap again to stop.
- **⌨️ Type instead:** tap the keyboard button. If a phone or browser has no voice input, the app switches to typing automatically.
- **🔊 Replay:** tap the speaker under any Buddy message.
- **Speaking speed:** go to Parents, then ✏️ Edit, then "Buddy's speaking speed". Young children get a slower voice automatically.
- **Dark mode:** tap 🌙 / ☀️ at the top, or choose Auto, Light or Dark in Parents → Settings.

### Choosing a tutor, accent and voice

On the **Home** screen, tap **Your tutor → Change**. Each family member can pick their own tutor:

| Tutor | Accent | Personality |
|---|---|---|
| 🤖 Buddy | 🇺🇸 American | cheerful robot friend (great for little kids) |
| 👩‍🏫 Emma / 👨‍🏫 Oliver | 🇬🇧 British | teachers from London and Manchester |
| 👩 Lily / 🧑 Jack | 🇺🇸 American | teacher from California, coach from New York |
| 👱‍♀️ Chloe | 🇦🇺 Australian | teacher from Sydney |
| 👩🏽 Priya | 🇮🇳 Indian | teacher from Bangalore |
| 🧔 Seán | 🇮🇪 Irish | storyteller from Dublin |
| 👩🏾 Thandi | 🇿🇦 South African | teacher from Cape Town |

- The tutor talks like a real teacher in that accent and uses its words (British tutors say *holiday*, *mum* and *biscuit*; American tutors say *vacation*, *mom* and *cookie*).
- Tap 🔊 to hear a tutor. Under **Voice** you can pick any voice installed on the phone, grouped by accent, or leave it on **Automatic**.
- Add **Likes & interests** to a profile (Parents → ✏️ Edit), and the tutor will chat about them.
- **For the most natural, human-sounding voices**, install better voices on the phone. They are free:
  - **iPhone/iPad:** Settings → Accessibility → Spoken Content → Voices → English. Download voices marked **Enhanced** or **Premium** (for example British "Serena" or "Daniel").
  - **Android:** Settings → Accessibility → Text-to-speech → Speech Services by Google → ⚙️ → Install voice data → English. Pick the accents you want.
  - **Computer:** Microsoft Edge has very natural "Online (Natural)" voices built in.

Profiles, progress and conversations are saved **on each phone**. They are not shared between phones.

---

## Optional settings

Change these under **Settings → Secrets and variables → Actions**. Use the **Variables** tab for variables and the **Secrets** tab for secrets. After changing anything, start the deployment again (**Actions → Deploy English Buddy → Run workflow**).

| Variable | Default | What it does |
|---|---|---|
| `AI_PROVIDER` | `gemini` | Which AI to use: `gemini` or `claude` |
| `DAILY_LIMIT` | `60` | Maximum messages per family member per day. Parents can set a lower limit per person in the app. |
| `FAMILY_DAILY_LIMIT` | `400` | Maximum messages per day for the whole family |
| `GEMINI_MODEL` | `gemini-flash-lite-latest` | Which Gemini model to use. The default automatically follows Google's newest free Flash-Lite model. |
| `CLAUDE_MODEL` | `claude-haiku-5-5` | Which Claude model to use when `AI_PROVIDER` is `claude` |
| `ALLOWED_ORIGIN` | `https://<username>.github.io` | The only website allowed to use your Worker. Change it only if you use a custom domain. |
| `WORKER_URL` | (automatic) | Only needed if the app can't find the Worker by itself, e.g. `https://english-buddy.yourname.workers.dev` |

| Optional secret | When you need it |
|---|---|
| `ANTHROPIC_API_KEY` | Only if you switch to Claude (see below) |
| `CLOUDFLARE_ACCOUNT_ID` | Only if your Cloudflare login can see more than one account. Find it in the Cloudflare dashboard under **Workers & Pages**, on the right ("Account ID"). |

### Switching to Claude later

Claude (by Anthropic) is a paid option. It is very cheap with the small `claude-haiku-5-5` model, and it uses *prompt caching* to save money.

1. Create an API key at **https://console.anthropic.com/settings/keys**. You need to add a little credit under Billing.
2. Add a GitHub **secret** named `ANTHROPIC_API_KEY` with that key.
3. Add a GitHub **variable** (Variables tab) named `AI_PROVIDER` with the value `claude`.
4. Click **Actions → Deploy English Buddy → Run workflow**.

To go back to Gemini, change `AI_PROVIDER` to `gemini` and run the workflow again. Buddy's personality and rules are the same with both providers.

---

## Troubleshooting

| Problem | What to do |
|---|---|
| The **Actions** run is red with **"Missing secrets"** | One of the 3 secrets is missing or misspelled. Check Step 4. The names must match exactly. |
| Red ❌ at **Deploy Worker**, with a message about **workers.dev subdomain** | Open **dash.cloudflare.com → Workers & Pages** once (Step 2.2), then run the workflow again. |
| Red ❌ at **Deploy Worker**, with **"Authentication error"** / **10000** | The Cloudflare token is wrong or was made without the "Edit Cloudflare Workers" template. Create a new token (Step 2) and update the `CLOUDFLARE_API_TOKEN` secret. |
| Red ❌ mentioning **"more than one account"** | Add the `CLOUDFLARE_ACCOUNT_ID` secret (see Optional settings). |
| Red ❌ at **Deploy to GitHub Pages** | Make sure **Settings → Pages → Source** is set to **GitHub Actions** (Step 5), then run the workflow again. |
| The app link shows **404** | Wait a few minutes after the first green deployment, then reload. Check the link in Settings → Pages. |
| **"The family code is not correct"** | Type it exactly like the `FAMILY_CODE` secret (upper/lower case matters). If you changed the secret, run the workflow again. |
| **"Too many wrong codes"** | Wait 10 minutes, then try again. |
| **"The app is not connected to its Worker yet"** | The Worker deployment failed. Fix the red step in Actions and run it again, or set the `WORKER_URL` variable. |
| **"This app address is not allowed"** | The Worker only accepts requests from `https://<your-username>.github.io`. If the app lives at a different address (for example a custom domain), set the variable `ALLOWED_ORIGIN` to that address, e.g. `https://english.example.com`, and run the workflow again. |
| **"GEMINI_API_KEY is not set"** or **"rejected the API key"** | Check the `GEMINI_API_KEY` secret (Step 1 and 4) and run the workflow again. |
| **"Buddy needs a short break"** keeps appearing | The free Gemini quota is being used up (per minute or per day). Wait a minute, or try again tomorrow. You can also lower `DAILY_LIMIT`, or switch to Claude. |
| **"Gemini model … was not found"** | Google renamed or retired the model. Set the variable `GEMINI_MODEL` to a current model name from https://ai.google.dev/gemini-api/docs/models (for example `gemini-flash-latest`) and run the workflow again. |
| Google says the free tier **isn't available in your country** | Turn on billing for your Google AI project (usage stays very cheap), or switch to Claude. |
| The **mic button doesn't work** | Allow microphone access. iPhone: **Settings → Safari → Microphone** (or Settings → Privacy → Microphone). Android: hold the app icon, tap **App info**, then **Permissions → Microphone**. Some browsers (like Firefox) have no voice input, so the app shows a text box instead. Voice input also needs an internet connection. |
| **No sound** from Buddy | Turn the volume up and switch off silent mode (iPhone side switch). Then tap 🔊 on a message. In Parents → Settings you can choose another voice. |
| Buddy's voice sounds robotic | In Parents → Settings, choose a different voice. On iPhone you can download better voices in **Settings → Accessibility → Spoken Content → Voices → English** (look for "Enhanced" or "Premium"). |
| **Forgot the parent PIN** | The PIN is stored only on that phone. Clear the website's data (iPhone: Settings → Safari → Advanced → Website Data; Android: Chrome → Settings → Site settings). This also deletes that phone's profiles and progress. |
| The app didn't update after a change | Close the app completely and open it again, maybe twice. |

---

## Privacy and safety

- The app keeps profiles, progress, conversations and the parent PIN (stored as a scrambled hash) **only on your phone**.
- Only the current conversation (the last 12 messages, plus the learner's first name, age and level) is sent through your Worker to the AI provider.
- Gemini free tier: Google may use free-tier conversations to improve its products. To avoid that, use a paid Gemini project or switch to Claude.
- Buddy's rules tell it to never ask for personal details (full name, address, school, phone, photos), never share links, stay on age-appropriate topics and redirect anything inappropriate. The Worker also removes any links from replies. For children, Gemini's content filters are set to the strictest level.
- AI can still make mistakes. For young children, keep an eye on the conversations in the Parents area.

---

## For developers

```
web/                 the app (plain HTML/CSS/JS, no build step)
  index.html, styles.css, config.js (workerUrl - filled in on deploy), sw.js, manifest.webmanifest
  js/app.js          screens + conversation flow
  js/api.js          talks to the Worker
  js/speech.js       Web Speech API (listening + speaking)
  js/diff.js         pronunciation comparison
  js/store.js        local storage: profiles, progress, transcripts
  js/content.js      topics, word lists, sentences, badges
worker/              Cloudflare Worker
  src/index.js       routes, family code, CORS, limits
  src/prompt.js      Buddy's system prompt (shared by both providers)
  src/providers.js   Gemini + Claude calls
  src/limiter.js     Durable Object: daily counts + rate limiting
  test/              unit tests (npm test)
tests/e2e.mjs        browser test of the main flows (Playwright)
tools/make-icons.mjs regenerates icons and splash screens
.github/workflows/deploy.yml   test → deploy Worker → publish Pages
```

- Worker tests: `cd worker && npm ci && npm test`
- Run the Worker locally: create `worker/.dev.vars` with `FAMILY_CODE=...`, `GEMINI_API_KEY=...` and `ALLOWED_ORIGIN=http://localhost:5173`. Then run `npx wrangler dev`. Serve `web/` on port 5173 and set `workerUrl` in `web/config.js` to `http://localhost:8787`.
- Browser tests: `node tests/e2e.mjs` (needs `playwright` installed). The Worker, microphone and voice are simulated.
- Worker API: `GET /health`, `GET /usage` and `POST /chat` (the last two need the `X-Family-Code` header and an allowed `Origin`).
- Replies are capped at about 250 tokens (350 for the opening of a story). Only the last 12 messages are sent. Rate-limit errors from the provider come back as HTTP 429, and the app shows "Buddy needs a short break" and then retries once automatically.
