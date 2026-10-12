# Buddy Learning 🧸

**Buddy Learning** is a learning app for young children from **FS1 to Year 1 (ages 3 to 6)**. It follows the British **EYFS** (FS1 and FS2) and the **Year 1 National Curriculum**. It has four subjects: **English, Maths, Science and Arabic**. **Buddy**, a friendly talking speech bubble, explains everything out loud, so children don't need to read.

It also keeps **English Buddy**, the voice tutor for older children and grown-ups, so the whole family can use one app. It works on iPhone and Android, and installs on your home screen like a normal app.

## ✨ What's new

- 🏠 **A home screen made for little hands:** four big subject tiles (🔤 English, 🔢 Maths, 🔬 Science, 🌙 العربية) and **Talk to Buddy**.
- 🔊 **Audio first:** every instruction and question is spoken aloud, with a big yellow **🔊 hear again** button. Children who can't read yet can still play.
- 👆 **Tap, drag and trace:** picture choices, drag-and-drop sorting, putting things in order, and tracing letters with a finger.
- 🌟 **Short and happy:** each game has 4 to 6 questions, then stars ⭐, a new sticker 🏅 and a celebration. Buddy never says "wrong". It says **"Let's try again!"** and gives a hint. After two tries, the right answer gently glows.
- 🎓 **Year groups:** each child is set to **FS1, FS2 or Year 1**. Topics match that year, and every topic adjusts itself: it gets harder after a great game and easier if a game was tricky.
- 📚 **Built-in lessons, no AI needed:** 62 topics with at least 30 different questions each. All games work offline and cost nothing to run.
- 🌙 **Arabic (Modern Standard Arabic):** right-to-left screens, spoken with an Arabic voice (UAE or Saudi when your phone has one), with optional English help.
- 💬 **Talk to Buddy:** a voice chat in **English or Arabic** with very short, simple sentences for young children.
- 👨‍👩‍👧 **Parent area (PIN protected):** time spent, stars, progress per subject and topic, strengths, topics to practise, Buddy chats, a **weekly summary with charts**, and settings for daily screen time (default 20 minutes), subjects, year group and voice speed.
- ⏰ **"Time to rest!"** When today's screen time is used up, your child sees a sleepy Buddy. Only a parent PIN can add more time.

### What's inside each subject

| | FS1 (age 3–4) | FS2 (age 4–5) | Year 1 (age 5–6) |
|---|---|---|---|
| 🔤 **English** | listening games, rhymes, first sounds, animal and object names | Phase 2 and 3 sounds, letter–sound matching, blending CVC words, Phase 4 words, tricky words, letter tracing | Phase 5 sounds, reading sentences, story questions, building sentences, tracing, tricky words |
| 🔢 **Maths** | counting to 5 then 10, matching numbers, shapes, colours, big and small, patterns | numbers to 20, one more and one less, adding and taking away with pictures, 2D and 3D shapes, more or fewer, patterns | numbers to 100, adding and subtracting within 20, counting in 2s, 5s and 10s, halves and quarters, telling the time (o'clock, half past), money in **UAE dirhams**, measuring |
| 🔬 **Science** | animal homes and babies, my body, five senses, weather, day and night, growing, healthy food | (same topics, with harder questions and sorting games) | animal groups, what animals eat, our bodies, plants and trees, materials, seasons |
| 🌙 **Arabic** | letter sounds, colours, numbers 1–10, family and animal words | all 28 letters with pictures, letter tracing, short vowels (fatha, kasra, damma), Arabic numbers, colours, numbers, family and animals | letter shapes (beginning, middle, end), long vowels, reading words and short sentences, everyday words, letters, tracing, short vowels |

### For older children and grown-ups (English Buddy)

Choose the **"Older"** year group for a profile to get the English Buddy voice tutor:

- 🎤 **Hold the mic button and talk.** The tutor answers out loud and also shows the text, with a 🔊 replay button.
- 🎯 **5 practice modes:** Free Talk, Role Play, Word of the Day, Story Time and Pronunciation.
- 🗣️ **Tutor characters and accents:** British, American, Australian, Indian, Irish and South African.
- ⭐ **Progress:** stars, badges, streaks, minutes practised, words learned and common mistakes.

**Safe for kids:** Buddy stays on learning, never asks for personal details and never shares links. **Free to run:** it uses Google Gemini's free tier, Cloudflare's free plan and GitHub Pages.

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
4. Open **Buddy Learning** from your home screen. The first time you talk, allow microphone access.

**Android**
1. Open the app link in **Chrome**.
2. Tap **Install app** if a banner appears. Otherwise tap the **⋮** menu, then **Install app** (or **Add to Home screen**).
3. Open **Buddy Learning** from your home screen and allow microphone access.

### Step 9: First start

1. Tap **Let's start!** and type the **family code**.
2. Create a profile for the first learner. Choose **FS1, FS2 or Year 1** for young children (Buddy Learning) or **Older** for the English tutor.
3. Open the **Parents** tab and create a **parent PIN** (4–8 digits). There you can add more family members, set daily limits and screen time, choose subjects and read conversations.

🎉 That's it!

---

## Using Buddy Learning with your child

1. **Create a child profile:** Parents tab → **➕ Add family member** (or the profile button at the top → **Add**). Choose the year group: **FS1** (ages 3–4), **FS2** (ages 4–5) or **Year 1** (ages 5–6). Young children don't need an age or level.
2. **Hand over the phone.** Buddy says hello. Your child taps a big subject tile, then a game picture.
3. **In a game:**
   - Buddy reads the question aloud. Tap the yellow **🔊** to hear it again.
   - Counting questions: tap each object to count it out loud.
   - Sorting games: drag each picture into the right box (or tap a picture, then tap a box).
   - Ordering games: tap the pictures or words in the right order. Tap a placed one to take it back.
   - Tracing: follow the grey letter with a finger. **🔄 Start again** clears it.
   - The **✕** at the top leaves the game.
4. **After each game:** stars (1 to 3) and a new sticker. Stickers are in the **🏅 Stickers** tab.
5. **Talk to Buddy:** tap the purple **Talk to Buddy** tile (or the **💬 Buddy** tab). Hold the big button and speak. Switch between **English** and **العربية** at the top.

> 🔈 **Sound tips:** turn the volume up and switch off silent mode. For the best Arabic voice: on iPhone, go to Settings → Accessibility → Spoken Content → Voices → Arabic and download a voice. On Android, go to Settings → Accessibility → Text-to-speech → Speech Services by Google → ⚙️ → Install voice data → Arabic. If there is no Arabic voice, the phone may read Arabic with a different voice, and the text is always shown too.

## The parent area

Tap **👨‍👩‍👧 Parents** and enter your PIN. You create the PIN the first time. For each child you see:

- **Today:** minutes used out of the daily limit, and stars earned.
- **Totals:** minutes, stars, stickers and the day streak.
- **Progress per subject:** how many of this year's topics your child has tried, and how often they answered correctly on the first try.
- **💪 Strengths** (topics with 80% or more correct on the first try) and **🌱 Needs practice** (below 60%).
- **📊 Weekly summary:** charts of minutes and stars for each of the last 7 days, time per subject, and a table of this week's topics with their level (1 to 3). Hover or tap a bar to see its number. There is also a plain table view.
- **💬 Buddy chats:** recent Talk to Buddy conversations.
- **⚙️ Settings:**
  - **Year group:** FS1, FS2 or Year 1, or Older for the English Buddy tutor.
  - **Daily screen time:** default 20 minutes. When it runs out, your child sees **"Time to rest!"**. To give extra time, open **Grown-ups** on that screen and enter your PIN to add 10 minutes for today.
  - **Subjects:** turn English, Maths, Science, Arabic or Talk to Buddy on or off.
  - **Voice speed:** slower is better for the youngest children.
  - **Say Arabic instructions in English too:** on by default.
  - **Buddy AI cheers after games:** a short spoken "well done" from the AI after each game. It uses the internet and counts towards the daily AI message limit. Games work without it.
  - **Daily AI message limit:** for Talk to Buddy.

Leaving the Parents tab locks it again. Everything is stored **only on this phone**. Each phone keeps its own profiles and progress.

**How topics adjust:** every topic has 3 levels. A game with 85% or more correct on the first try moves the topic up a level. A game with 50% or less moves it down. Parents see the level in the weekly summary.

---

## Using English Buddy (older learners)

This section is for profiles set to the **Older** year group.

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
| Arabic is read with an English-sounding voice, or not at all | The phone has no Arabic voice. Install one (see the **Sound tips** above). On a computer, Microsoft Edge has Arabic voices. |
| **"Time to rest!"** appears | Today's screen time is used up. Open **Grown-ups** on that screen and enter the parent PIN for 10 more minutes, or change **Daily screen time** in Parents → ⚙️ Settings. |
| Games don't open without internet | Open the app once while online, so it can save the games on the phone. After that, all games work offline. Only Talk to Buddy and the AI cheers need the internet. |
| My child sees the wrong topics | Check the year group in Parents → ⚙️ Settings. |
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
  js/content.js      English Buddy topics, word lists, sentences, badges, tutors
  js/kids.js         Buddy Learning screens: home, subjects, results, stickers, rest, parent views, weekly charts
  js/learn/core.js   subjects, year groups, the topic catalogue, random helpers
  js/learn/engine.js runs a game: choice, drag-and-drop sorting, ordering, finger tracing, celebrations
  js/learn/visuals.js SVG pictures: Buddy, shapes, clocks, UAE coins, fractions, scales, plant
  js/learn/english.js, maths.js, science.js, arabic.js   question banks (loaded only when needed)
  test/banks.test.mjs checks every topic: valid questions and 30+ different items per level
worker/              Cloudflare Worker
  src/index.js       routes, family code, CORS, limits
  src/prompt.js      Buddy's system prompt (shared by both providers)
  src/providers.js   Gemini + Claude calls
  src/limiter.js     Durable Object: daily counts + rate limiting
  test/              unit tests (npm test)
tests/e2e.mjs        browser test of the English Buddy flows (Playwright)
tests/kids-e2e.mjs   browser test of Buddy Learning: every topic in every year group, drag, trace, rest screen, parent area
tools/make-icons.mjs regenerates icons and splash screens
.github/workflows/deploy.yml   test → deploy Worker → publish Pages
```

- Worker tests: `cd worker && npm ci && npm test`
- Run the Worker locally: create `worker/.dev.vars` with `FAMILY_CODE=...`, `GEMINI_API_KEY=...` and `ALLOWED_ORIGIN=http://localhost:5173`. Then run `npx wrangler dev`. Serve `web/` on port 5173 and set `workerUrl` in `web/config.js` to `http://localhost:8787`.
- Question bank tests: `node --test web/test/banks.test.mjs` (no install needed; these also run in GitHub Actions).
- Browser tests: `node tests/e2e.mjs` and `node tests/kids-e2e.mjs` (need `playwright` installed). The Worker, microphone and voices are simulated.
- Worker API: `GET /health`, `GET /usage` and `POST /chat` (the last two need the `X-Family-Code` header and an allowed `Origin`). Chat modes: `free`, `roleplay`, `words`, `story` (older learners), `kids` (Talk to Buddy, with `lang` set to `en` or `ar`) and `cheer` (one sentence of praise after a game).
- Replies are capped at about 250 tokens (350 for the opening of a story). Only the last 12 messages are sent. Rate-limit errors from the provider come back as HTTP 429, and the app shows "Buddy needs a short break" and then retries once automatically.
