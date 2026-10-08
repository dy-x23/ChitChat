# CHIT 🤫 — Anonymous Chit Guessing Social Game

A real-time multiplayer social party game built with **Next.js**, **Node.js**, **Express**, **Socket.IO**, **Prisma ORM**, and **Tailwind CSS**.

Friends join a room using a 4-character code, answer thought-provoking or hilarious prompts anonymously, and then try to deduce who wrote each mystery chit!

---

## 🎮 Game Flow

```text
       ┌───────────┐
       │   LOBBY   │  Create / Join room (3–8 players), set rounds & game mode
       └─────┬─────┘
             ▼
       ┌───────────┐
       │  WRITING  │  Everyone anonymously folds and submits their chit
       └─────┬─────┘
             ▼
       ┌───────────┐
       │ SHUFFLING │  Guaranteed derangement shuffle (nobody gets their own chit!)
       └─────┬─────┘
             ▼
       ┌───────────┐
       │ GUESSING  │  Deduce author + Confidence bonus + "Why do you think so?"
       └─────┬─────┘
             ▼
       ┌───────────┐
       │  REVEAL   │  Dramatic unmasking, reasoning, score gains & ❤️ 😂 😲 🤯 reacts
       └─────┬─────┘
             ▼
    (Repeat for N Rounds)
             ▼
       ┌───────────┐
       │  RESULTS  │  Podium 🥇🥈🥉, Awards ("Sherlock Holmes", etc.) & Chit Wall
       └───────────┘
```

---

## 🚀 Quick Start

### 1. Start the Realtime Backend (Port 4000)
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

### 2. Start the Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 Instant Solo / Demo Testing

Want to test without gathering 4 friends or opening 4 windows?
1. Enter your name and click **"Host New Game Room"**.
2. In the lobby, click **"+ Add Bot Friend"** 2 or 3 times (adds AI friends like *Rahul (Gossip Guy)*, *Sneha (Night Owl)*, *Vikram (Gym Bro)*).
3. Click **"Start Game Now"** and enjoy the full real-time game loop!

---

## 🛡️ Security & Integrity

- **Server-Side Truth**: All scores, phase timers, and author assignments are strictly managed by the backend state machine.
- **Payload Sanitization**: During the `GUESSING` phase, the backend strips out all `authorId` metadata from the assigned chit payloads. Players cannot inspect the network tab to cheat.
- **Guaranteed Derangement**: Uses a Fisher-Yates cycle derangement algorithm so no player ever receives their own chit.

---

## 🌟 Game Modes

1. **Mixed Blend**: Balanced mix of funny, personal, and deep questions.
2. **Fun & Silly**: Guilty pleasures, 2 AM habits, hilarious regrets.
3. **Deep & Psychological**: Misunderstandings, green flags, dreams, and hidden sides.
4. **Pure Random**: Chaotic, off-the-wall questions.
5. **Who Would?**: Vote on which friend in the room is most likely to do something.
6. **2 Truths, 1 Lie**: Submit 3 statements anonymously. Guess the author AND uncover the lie for bonus points!

---

## 🔊 Sound Effects & Audio

Powered by zero-dependency **Web Audio API** synthesized chimes, countdown ticks, card flip whooshes, reveal gongs, and victory fanfares. Toggle mute anytime with the speaker icon in the header.
