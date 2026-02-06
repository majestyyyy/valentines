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
}

export const CAMPUS_MISSIONS: Mission[] = [
  // Booth Missions (4)
  {
    id: 1,
    title: "Jail Booth Challenge",
    description: "Visit the Jail Booth together and take a fun mugshot photo!",
    location: "Jail Booth",
    difficulty: 'easy',
    emoji: '🚔',
    category: 'booth'
  },
  {
    id: 2,
    title: "Marriage Booth Ceremony",
    description: "Get 'married' at the Marriage Booth and take a wedding photo together!",
    location: "Marriage Booth",
    difficulty: 'easy',
    emoji: '💍',
    category: 'booth'
  },
  {
    id: 3,
    title: "Friendship Booth Memory",
    description: "Make friendship bracelets or take a BFF photo at the Friendship Booth!",
    location: "Friendship Booth",
    difficulty: 'easy',
    emoji: '🤝',
    category: 'booth'
  },
  {
    id: 4,
    title: "Confession Booth Secret",
    description: "Share a secret or confession at the Confession Booth and bond over honesty!",
    location: "Confession Booth",
    difficulty: 'medium',
    emoji: '🙏',
    category: 'booth'
  },

  // Campus Missions (14)
  {
    id: 5,
    title: "Library Study Session",
    description: "Study together at the library for at least 30 minutes and share your favorite book!",
    location: "UE Library",
    difficulty: 'easy',
    emoji: '📚',
    category: 'academic'
  },
  {
    id: 6,
    title: "SFC Lobby Selfie",
    description: "Take a creative selfie at the SFC Lobby!",
    location: "SFC Lobby",
    difficulty: 'easy',
    emoji: '🤳',
    category: 'campus'
  },
  {
    id: 7,
    title: "Canteen Food Challenge",
    description: "Try 3 different food items from the canteen and rate them together!",
    location: "UE Canteen",
    difficulty: 'medium',
    emoji: '🍽️',
    category: 'food'
  },
  {
    id: 8,
    title: "Campus Walk & Talk",
    description: "Walk around the entire campus perimeter while having a deep conversation!",
    location: "UE Campus",
    difficulty: 'medium',
    emoji: '🚶',
    category: 'campus'
  },
  {
    id: 9,
    title: "College Building Tour",
    description: "Visit each other's college buildings and learn about your programs!",
    location: "Various Colleges",
    difficulty: 'medium',
    emoji: '🏫',
    category: 'academic'
  },
  {
    id: 10,
    title: "Gym Buddy Session",
    description: "Work out together at the campus gym or do a quick exercise routine!",
    location: "UE Gym",
    difficulty: 'medium',
    emoji: '💪',
    category: 'campus'
  },
  {
    id: 11,
    title: "Garden Picnic",
    description: "Have a mini picnic at the campus garden or green space!",
    location: "Campus Garden",
    difficulty: 'easy',
    emoji: '🌳',
    category: 'campus'
  },
  {
    id: 12,
    title: "Art Wall Photo",
    description: "Find the campus art wall or mural and create a creative photo together!",
    location: "Art Wall",
    difficulty: 'easy',
    emoji: '🎨',
    category: 'creative'
  },
  {
    id: 13,
    title: "Coffee Shop Chat",
    description: "Have coffee or drinks at the campus coffee shop and share life goals!",
    location: "Campus Coffee Shop",
    difficulty: 'easy',
    emoji: '☕',
    category: 'food'
  },
  {
    id: 14,
    title: "Sports Court Game",
    description: "Play a quick game (basketball, volleyball, etc.) at the sports court!",
    location: "Sports Court",
    difficulty: 'hard',
    emoji: '🏀',
    category: 'campus'
  },
  {
    id: 15,
    title: "Study Group Session",
    description: "Form a mini study group and help each other with homework or projects!",
    location: "Study Area",
    difficulty: 'medium',
    emoji: '✏️',
    category: 'academic'
  },
  {
    id: 16,
    title: "Campus Scavenger Hunt",
    description: "Find 5 iconic UE landmarks together and take photos at each!",
    location: "Entire Campus",
    difficulty: 'hard',
    emoji: '🔍',
    category: 'campus'
  },
  {
    id: 17,
    title: "Create a TikTok/Reel",
    description: "Make a fun TikTok or Instagram Reel together on campus!",
    location: "Anywhere on Campus",
    difficulty: 'medium',
    emoji: '🎥',
    category: 'creative'
  },
  {
    id: 18,
    title: "Share Your Playlist",
    description: "Exchange Spotify playlists and listen to each other's favorite songs together!",
    location: "Anywhere",
    difficulty: 'easy',
    emoji: '🎵',
    category: 'creative'
  },
  {
    id: 19,
    title: "Campus Sunset Watch",
    description: "Watch the sunset together from the best view on campus!",
    location: "Campus Rooftop/View",
    difficulty: 'easy',
    emoji: '🌅',
    category: 'campus'
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
 */
export function get3RandomMissions(): [Mission, Mission, Mission] {
  const shuffled = [...CAMPUS_MISSIONS].sort(() => Math.random() - 0.5);
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
