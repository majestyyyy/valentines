/**
 * Campus Mission System
 * 15+ fun missions for matched users to complete together on campus
 */

export interface Mission {
  id: number;
  title: string;
  description: string;
  location: string;
  difficulty: 'easy' | 'medium' | 'hard';
  emoji: string;
  category: 'booth' | 'campus' | 'food' | 'academic' | 'creative';
  suitableFor: ('Romantic' | 'Friendship' | 'Study Buddy' | 'Networking')[]; // What relationship types this mission is suitable for
}

export const CAMPUS_MISSIONS: Mission[] = [
  // Booth Missions
  {
    id: 1,
    title: "Jail Booth Challenge",
    description: "Puntahan together ang Jail Booth at kumuha ng fun mugshot photo!",
    location: "Jail Booth",
    difficulty: 'easy',
    emoji: '🚔',
    category: 'booth',
    suitableFor: ['Romantic', 'Friendship', 'Study Buddy', 'Networking']
  },
  {
    id: 2,
    title: "Marriage Booth Ceremony",
    description: "Mag-pa'kasal' sa Marriage Booth at kumuha ng wedding photo together!",
    location: "Marriage Booth",
    difficulty: 'easy',
    emoji: '💍',
    category: 'booth',
    suitableFor: ['Romantic']
  },
  {
    id: 3,
    title: "Friendship Booth Memory",
    description: "Gumawa ng friendship bracelets o mag-take ng BFF photo sa Friendship Booth!",
    location: "Friendship Booth",
    difficulty: 'easy',
    emoji: '🤝',
    category: 'booth',
    suitableFor: ['Friendship', 'Study Buddy', 'Networking', 'Romantic']
  },
  {
    id: 4,
    title: "Confession Booth Secret",
    description: "Mag-share ng secret or confession sa Confession Booth at mag-bond over honesty!",
    location: "Confession Booth",
    difficulty: 'medium',
    emoji: '🙏',
    category: 'booth',
    suitableFor: ['Romantic', 'Friendship']
  },

  // Campus Missions
  {
    id: 5,
    title: "SFC Lobby Selfie",
    description: "Kumuha ng creative selfie sa SFC Lobby!",
    location: "SFC Lobby",
    difficulty: 'easy',
    emoji: '🤳',
    category: 'campus',
    suitableFor: ['Romantic', 'Friendship', 'Study Buddy', 'Networking']
  },
  {
    id: 6,
    title: "Canteen Food Challenge",
    description: "Try 3 different food items sa canteen at i-rate nyo together!",
    location: "UE Canteen",
    difficulty: 'medium',
    emoji: '🍽️',
    category: 'food',
    suitableFor: ['Romantic', 'Friendship', 'Study Buddy', 'Networking']
  },
  {
    id: 7,
    title: "Campus Walk & Talk",
    description: "Mag-lakad around the entire campus perimeter habang nag-uusap ng malalim!",
    location: "UE Campus",
    difficulty: 'medium',
    emoji: '🚶',
    category: 'campus',
    suitableFor: ['Romantic', 'Friendship']
  },
  {
    id: 8,
    title: "College Building Tour",
    description: "Puntahan ang college buildings nyo at alamin ang programs ninyo!",
    location: "Various Colleges",
    difficulty: 'medium',
    emoji: '🏫',
    category: 'academic',
    suitableFor: ['Study Buddy', 'Networking', 'Friendship', 'Romantic']
  },
  {
    id: 9,
    title: "Gym Buddy Session",
    description: "Mag-work out together sa campus gym o gumawa ng quick exercise routine!",
    location: "UE Gym",
    difficulty: 'medium',
    emoji: '💪',
    category: 'campus',
    suitableFor: ['Friendship', 'Romantic', 'Study Buddy']
  },
  {
    id: 10,
    title: "Garden Picnic",
    description: "Mag-mini picnic sa campus garden or green space!",
    location: "Campus Garden",
    difficulty: 'easy',
    emoji: '🌳',
    category: 'campus',
    suitableFor: ['Romantic', 'Friendship']
  },
  {
    id: 11,
    title: "Coffee Shop Chat",
    description: "Mag-kape or drinks sa coffee shop at mag-share ng life goals!",
    location: "Campus Coffee Shop",
    difficulty: 'easy',
    emoji: '☕',
    category: 'food',
    suitableFor: ['Romantic', 'Friendship', 'Networking', 'Study Buddy']
  },
  {
    id: 12,
    title: "Campus Scavenger Hunt",
    description: "Hanapin ang 5 iconic UE landmarks together at mag-take ng photos sa each!",
    location: "Entire Campus",
    difficulty: 'hard',
    emoji: '🔍',
    category: 'campus',
    suitableFor: ['Romantic', 'Friendship', 'Study Buddy']
  },
  {
    id: 13,
    title: "Create a TikTok/Reel",
    description: "Gumawa ng fun TikTok or Instagram Reel together sa campus!",
    location: "Anywhere on Campus",
    difficulty: 'medium',
    emoji: '🎥',
    category: 'creative',
    suitableFor: ['Romantic', 'Friendship', 'Networking']
  },
  {
    id: 14,
    title: "Share Your Playlist",
    description: "Mag-exchange ng Spotify playlists at pakinggan ang favorite songs nyo!",
    location: "Anywhere",
    difficulty: 'easy',
    emoji: '🎵',
    category: 'creative',
    suitableFor: ['Romantic', 'Friendship', 'Study Buddy']
  },
  {
    id: 15,
    title: "Campus Sunset Watch",
    description: "Panoorin ang sunset together sa best view on campus!",
    location: "Campus Rooftop/View",
    difficulty: 'easy',
    emoji: '🌅',
    category: 'campus',
    suitableFor: ['Romantic', 'Friendship']
  },
  {
    id: 16,
    title: "Flash Mob Dance",
    description: "Matuto ng simple dance routine at i-perform together sa public campus area!",
    location: "Campus Plaza",
    difficulty: 'hard',
    emoji: '💃',
    category: 'creative',
    suitableFor: ['Romantic', 'Friendship']
  },
  {
    id: 17,
    title: "Book Exchange",
    description: "Mag-exchange ng favorite books at pag-usapan kung bakit nyo gusto!",
    location: "Library or Anywhere",
    difficulty: 'easy',
    emoji: '📖',
    category: 'academic',
    suitableFor: ['Study Buddy', 'Friendship', 'Networking', 'Romantic']
  },
  {
    id: 18,
    title: "Career Goals Workshop",
    description: "I-share ang 5-year career plans nyo at mag-bigayan ng advice!",
    location: "Study Area or Coffee Shop",
    difficulty: 'medium',
    emoji: '💼',
    category: 'academic',
    suitableFor: ['Networking', 'Study Buddy', 'Friendship']
  },
  {
    id: 19,
    title: "Campus History Tour",
    description: "Mag-research at puntahan ang 3 historical spots sa campus at alamin ang stories nila!",
    location: "Historical Campus Sites",
    difficulty: 'medium',
    emoji: '🏛️',
    category: 'academic',
    suitableFor: ['Study Buddy', 'Friendship', 'Networking', 'Romantic']
  },
  {
    id: 20,
    title: "Compliment Challenge",
    description: "Bigyan ang isa't isa ng 5 genuine compliments in person!",
    location: "Anywhere",
    difficulty: 'easy',
    emoji: '😊',
    category: 'campus',
    suitableFor: ['Romantic', 'Friendship']
  },
  {
    id: 21,
    title: "Photo Booth Marathon",
    description: "Kumuha ng silly photos sa 3 different spots on campus with different themes!",
    location: "Multiple Locations",
    difficulty: 'medium',
    emoji: '📸',
    category: 'creative',
    suitableFor: ['Romantic', 'Friendship', 'Study Buddy', 'Networking']
  },
  {
    id: 22,
    title: "Campus Radio Shoutout",
    description: "Puntahan ang campus radio station at mag-dedicate ng kanta sa isa't isa!",
    location: "Campus Radio Station",
    difficulty: 'medium',
    emoji: '📻',
    category: 'creative',
    suitableFor: ['Romantic', 'Friendship']
  },
  {
    id: 23,
    title: "Sketch Each Other",
    description: "Subukan i-draw or i-sketch ang isa't isa - hindi kailangan magaling sa art!",
    location: "Art Room or Garden",
    difficulty: 'easy',
    emoji: '✏️',
    category: 'creative',
    suitableFor: ['Romantic', 'Friendship', 'Study Buddy']
  },
  {
    id: 24,
    title: "Campus Mystery Box",
    description: "Gumawa ng mystery gift boxes para sa isa't isa with items under ₱100!",
    location: "Anywhere",
    difficulty: 'medium',
    emoji: '🎁',
    category: 'campus',
    suitableFor: ['Romantic', 'Friendship']
  },
  {
    id: 25,
    title: "Debate Challenge",
    description: "Pumili ng fun topic at mag-debate ng friendly for 10 minutes!",
    location: "Study Area",
    difficulty: 'medium',
    emoji: '⚖️',
    category: 'academic',
    suitableFor: ['Study Buddy', 'Networking', 'Friendship', 'Romantic']
  },
  {
    id: 26,
    title: "Campus Clean-Up",
    description: "Mag-spend ng 30 minutes picking up litter together at gawing maganda ang campus!",
    location: "Campus Grounds",
    difficulty: 'medium',
    emoji: '♻️',
    category: 'campus',
    suitableFor: ['Friendship', 'Study Buddy', 'Networking', 'Romantic']
  },
  {
    id: 27,
    title: "Origami Session",
    description: "Matuto at gumawa ng origami together - at least 3 different designs!",
    location: "Library or Study Area",
    difficulty: 'easy',
    emoji: '🦢',
    category: 'creative',
    suitableFor: ['Romantic', 'Friendship', 'Study Buddy']
  },
  {
    id: 28,
    title: "Campus Vlog Day",
    description: "Gumawa ng day-in-the-life vlog together showcasing your campus experience!",
    location: "Entire Campus",
    difficulty: 'hard',
    emoji: '🎬',
    category: 'creative',
    suitableFor: ['Romantic', 'Friendship', 'Networking']
  },
  {
    id: 29,
    title: "Time Capsule Creation",
    description: "Gumawa ng digital or physical time capsule with memories to open in 1 year!",
    location: "Anywhere",
    difficulty: 'medium',
    emoji: '⏰',
    category: 'creative',
    suitableFor: ['Romantic', 'Friendship']
  },
  {
    id: 30,
    title: "Campus Food Crawl",
    description: "Tikman ang food from 3 different campus food stalls or vendors!",
    location: "Campus Food Areas",
    difficulty: 'hard',
    emoji: '🍜',
    category: 'food',
    suitableFor: ['Romantic', 'Friendship', 'Study Buddy', 'Networking']
  },
  {
    id: 31,
    title: "Study Technique Exchange",
    description: "I-share ang best study techniques at productivity hacks nyo!",
    location: "Library or Study Area",
    difficulty: 'easy',
    emoji: '📝',
    category: 'academic',
    suitableFor: ['Study Buddy', 'Networking', 'Friendship']
  },
  {
    id: 32,
    title: "Campus Photography Walk",
    description: "Kumuha ng 5 artistic photos around campus with different themes!",
    location: "Entire Campus",
    difficulty: 'medium',
    emoji: '📷',
    category: 'creative',
    suitableFor: ['Romantic', 'Friendship', 'Study Buddy', 'Networking']
  },
  {
    id: 33,
    title: "Gratitude Circle",
    description: "Mag-share ng 5 things na grateful kayo and bakit!",
    location: "Quiet Campus Spot",
    difficulty: 'easy',
    emoji: '🙏',
    category: 'campus',
    suitableFor: ['Romantic', 'Friendship', 'Study Buddy']
  },
  {
    id: 34,
    title: "Campus Meme Creation",
    description: "Gumawa ng 3 funny memes about campus life together!",
    location: "Anywhere",
    difficulty: 'easy',
    emoji: '😂',
    category: 'creative',
    suitableFor: ['Friendship', 'Study Buddy', 'Networking', 'Romantic']
  },
  {
    id: 35,
    title: "Board Game Battle",
    description: "Mag-laro ng board game or card game together sa Library!",
    location: "PODCIT 4th floor",
    difficulty: 'easy',
    emoji: '🎲',
    category: 'campus',
    suitableFor: ['Romantic', 'Friendship', 'Study Buddy', 'Networking']
  },
  {
    id: 36,
    title: "Campus Podcast Episode",
    description: "Mag-record ng short podcast episode together about your college experience!",
    location: "Quiet Area",
    difficulty: 'hard',
    emoji: '🎙️',
    category: 'creative',
    suitableFor: ['Friendship', 'Networking', 'Romantic']
  },
  {
    id: 37,
    title: "Future Letter Exchange",
    description: "Sumulat ng letters sa future selves nyo at mag-exchange para basahin in 6 months!",
    location: "Anywhere",
    difficulty: 'medium',
    emoji: '✉️',
    category: 'creative',
    suitableFor: ['Romantic', 'Friendship']
  }
];

/**
 * Get a random mission (ensures different missions for different matches)
 */
export function getRandomMission(): Mission {
  const randomIndex = Math.floor(Math.random() * CAMPUS_MISSIONS.length);
  return CAMPUS_MISSIONS[randomIndex];
}

/**
 * Get 3 unique random missions for a new match
 * Filters missions based on the relationship type (looking_for)
 */
export function get3RandomMissions(lookingFor: 'Romantic' | 'Friendship' | 'Study Buddy' | 'Networking'): [Mission, Mission, Mission] {
  // Filter missions that are suitable for the relationship type
  const suitableMissions = CAMPUS_MISSIONS.filter(mission => 
    mission.suitableFor.includes(lookingFor)
  );
  
  // Shuffle and return 3 random missions
  const shuffled = [...suitableMissions].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1], shuffled[2]];
}

/**
 * Get mission by ID
 */
export function getMissionById(id: number): Mission | undefined {
  return CAMPUS_MISSIONS.find(mission => mission.id === id);
}

/**
 * Get mission difficulty color
 */
export function getMissionDifficultyColor(difficulty: Mission['difficulty']): string {
  switch (difficulty) {
    case 'easy': return 'text-green-600 bg-green-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'hard': return 'text-red-600 bg-red-50';
  }
}

/**
 * Get mission category color
 */
export function getMissionCategoryColor(category: Mission['category']): string {
  switch (category) {
    case 'booth': return 'text-purple-600 bg-purple-50';
    case 'campus': return 'text-blue-600 bg-blue-50';
    case 'food': return 'text-orange-600 bg-orange-50';
    case 'academic': return 'text-indigo-600 bg-indigo-50';
    case 'creative': return 'text-pink-600 bg-pink-50';
  }
}
