import { GameMode } from '../types/index.js';

export const PROMPTS_BY_MODE: Record<GameMode, string[]> = {
  STANDARD_FUN: [
    "What is something you secretly enjoy but would never admit publicly?",
    "What is your go-to guilty pleasure snack at 2 AM?",
    "What is the most embarrassing thing you've ever laughed at?",
    "What is a bizarre habit you only do when completely alone?",
    "If nobody could judge you, what ridiculous outfit or look would you rock?",
    "What is a lie you told as a kid that you still remember vividly?",
    "What movie or TV show do you pretend to hate, but secretly watch?",
    "What is your most irrational pet peeve that instantly annoys you?",
    "What childish thing do you still do regularly?",
    "What is the weirdest internet rabbit hole you fell down recently?",
    "If you could get away with one harmless prank on everyone in this room, what would it be?",
    "What is something that sounds like a scam, but you genuinely fell for it?"
  ],
  STANDARD_DEEP: [
    "What is one thing people consistently misunderstand about you at first glance?",
    "What is your biggest personal green flag that you're proud of?",
    "If you could disappear completely for a whole month, where would you go and what would you do?",
    "What is something you genuinely wish your closest friends knew about you?",
    "What is a belief or opinion you held 5 years ago that you completely reversed?",
    "What is your biggest irrational fear that makes no logical sense?",
    "Describe what an absolute 10/10 dream weekend looks like for you.",
    "What piece of advice changed your life, even if you resisted it at first?",
    "What is something simple that never fails to cheer you up on a tough day?",
    "What is a personal compliment someone gave you that you never forgot?"
  ],
  WHO_WOULD: [
    "Who in this room would survive the longest in a zombie apocalypse?",
    "Who in this room would accidentally become famous overnight?",
    "Who in this room would get hopelessly lost on a vacation even with Google Maps?",
    "Who in this room is most likely to start a weirdly successful startup?",
    "Who would betray everyone in Monopoly or a board game without hesitation?",
    "Who in this room would secretly make the best detective or spy?",
    "Who is most likely to forget their own birthday or an anniversary?",
    "Who would be the first to crack under an FBI interrogation over something silly?",
    "Who in this room would win in an escape room within 15 minutes?",
    "Who would spend their entire paycheck in 48 hours on impulse shopping?"
  ],
  TWO_TRUTHS_LIE: [
    "Write 2 truths and 1 lie about your childhood or school days.",
    "Write 2 truths and 1 lie about your travel experiences or strange encounters.",
    "Write 2 truths and 1 lie about hidden talents or weird things you have done.",
    "Write 2 truths and 1 lie about food, cooking, or eating habits.",
    "Write 2 truths and 1 lie about jobs, bosses, or working mishaps you've had."
  ],
  STANDARD_RANDOM: [
    "What is the strangest compliment you have ever received?",
    "If you were a ghost, how would you mildly inconvenience people?",
    "What is something you bought that was a total waste of money, yet you kept it?",
    "If you could master any useless talent instantly, what would it be?",
    "What is a hill you are surprisingly willing to die on?",
    "What is your favorite conspiracy theory that you secretly hope is true?"
  ],
  STANDARD_MIXED: [] // Combined dynamically from Fun, Deep, Who Would, Random
};

// Fill mixed mode from all
PROMPTS_BY_MODE.STANDARD_MIXED = [
  ...PROMPTS_BY_MODE.STANDARD_FUN,
  ...PROMPTS_BY_MODE.STANDARD_DEEP,
  ...PROMPTS_BY_MODE.STANDARD_RANDOM
];

export function getRandomPrompt(mode: GameMode, usedPrompts: Set<string> = new Set()): string {
  const pool = PROMPTS_BY_MODE[mode] || PROMPTS_BY_MODE.STANDARD_MIXED;
  const available = pool.filter((p) => !usedPrompts.has(p));
  const list = available.length > 0 ? available : pool;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

// Bot personalities and automated answers for demo / solo testing / filling missing players
export const BOT_TEMPLATES = [
  {
    name: "Rahul (Gossip Guy)",
    avatarSeed: "rahul_bot",
    answers: {
      "What is something you secretly enjoy": "Lurking on group chats without replying just to absorb the drama.",
      "go-to guilty pleasure snack": "Eating raw instant noodles with seasoning at 3:15 AM in pitch dark.",
      "most embarrassing thing": "Waved aggressively back at someone who was waving to the person right behind me.",
      "zombie apocalypse": "I would survive because I'd sacrifice my gym buddies first.",
      "irrational pet peeve": "People who send 15 separate one-word WhatsApp messages instead of one sentence.",
      "misunderstand about you": "People think I'm extroverted, but my social battery dies in 45 minutes flat.",
      "biggest personal green flag": "I remember everyone's dietary restrictions and obscure food allergies.",
      "hill you are surprisingly willing to die on": "Pineapple on pizza is actually top-tier culinary innovation.",
      default: "I have a playlist specifically for dramatic walking in the rain."
    },
    reactions: [
      "This is 100% them, they literally talk like this in real life 😂",
      "No doubt about it, classic behavior right here.",
      "I feel like this has their chaotic energy written all over it."
    ]
  },
  {
    name: "Sneha (Night Owl)",
    avatarSeed: "sneha_bot",
    answers: {
      "What is something you secretly enjoy": "Rewatching the same comfort show for the 14th time while ignoring my to-do list.",
      "go-to guilty pleasure snack": "Nutella straight out of the jar with a giant soup spoon.",
      "most embarrassing thing": "Trip and fall over absolutely flat ground while trying to look cool.",
      "zombie apocalypse": "I would negotiate with the zombies and get eaten in under 2 minutes.",
      "irrational pet peeve": "When someone leaves 3 seconds on the microwave and doesn't hit reset.",
      "misunderstand about you": "I'm not mad, this is just my default resting face.",
      "biggest personal green flag": "I will send you photos of every cute dog and cat I encounter in the wild.",
      "hill you are surprisingly willing to die on": "Cold leftover pizza is superior to freshly heated pizza.",
      default: "I have over 300 unread emails and I sleep like a baby every night."
    },
    reactions: [
      "They definitely did this, it matches their vibe completely!",
      "I remember them mentioning something just like this once!",
      "This has their signature aesthetic stamped all over it."
    ]
  },
  {
    name: "Vikram (Gym Bro)",
    avatarSeed: "vikram_bot",
    answers: {
      "What is something you secretly enjoy": "Singing dramatic high notes in the car when the windows are rolled up.",
      "go-to guilty pleasure snack": "Protein shake mixed with peanut butter and crushed cookies.",
      "most embarrassing thing": "Accidentally walked into the wrong restroom while looking at my phone.",
      "zombie apocalypse": "I'd try to deadlift the zombies and immediately get infected.",
      "irrational pet peeve": "People walking excruciatingly slow in narrow supermarket aisles.",
      "misunderstand about you": "I look intense when thinking, but I'm usually just daydreaming about tacos.",
      "biggest personal green flag": "Always hype up friends in the comments and celebrate their small wins.",
      "hill you are surprisingly willing to die on": "Cereal is technically cold soup.",
      default: "I check my reflection in car windows when I think nobody is watching."
    },
    reactions: [
      "Total telltale sign! This could only be one person.",
      "I knew it the second I read the first three words 😂",
      "Pure unfiltered energy, definitely them."
    ]
  },
  {
    name: "Anya (The Detective)",
    avatarSeed: "anya_bot",
    answers: {
      "What is something you secretly enjoy": "Doing full background OSINT research on people before casual meetings.",
      "go-to guilty pleasure snack": "Spicy chips dipped into cold yogurt.",
      "most embarrassing thing": "Liked a photo from 6 years ago while stalking someone's profile at 1 AM.",
      "zombie apocalypse": "I would set up a fortified rooftop base with organized rations.",
      "irrational pet peeve": "Unsharpened pencils and crooked picture frames.",
      "misunderstand about you": "I'm observant, not judging you (okay, maybe just a little).",
      "biggest personal green flag": "I always return borrowed items in better condition than I received them.",
      "hill you are surprisingly willing to die on": "Audiobooks count as reading books.",
      default: "I Google the plot of scary movies before watching so I don't get surprised."
    },
    reactions: [
      "The precision of this confession points directly to them!",
      "Only someone with this exact brain would write that.",
      "100% detective deduction: this belongs to them."
    ]
  }
];
