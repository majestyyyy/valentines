# Mission Filtering System

## Overview
The mission system now filters missions based on the relationship type (`looking_for` field) to ensure appropriate mission content for different types of connections.

## Problem Solved
Previously, users looking for "Friendship" could receive romantic missions like "Marriage Booth Ceremony", which would be awkward and inappropriate. This update ensures missions are contextually appropriate.

## Implementation

### 1. Mission Interface Update
Added `suitableFor` field to the `Mission` interface in `lib/missions.ts`:
```typescript
export interface Mission {
  id: number;
  title: string;
  description: string;
  location: string;
  difficulty: 'easy' | 'medium' | 'hard';
  emoji: string;
  category: 'booth' | 'campus' | 'food' | 'academic' | 'creative';
  suitableFor: ('Romantic' | 'Friendship' | 'Study Buddy' | 'Networking')[];
}
```

### 2. Mission Categorization
All 19 campus missions have been categorized:

#### Romantic-Only Missions:
- **Marriage Booth Ceremony** (ID 2) - Clearly romantic content

#### Universal Missions (suitable for all types):
- Jail Booth Challenge
- Friendship Booth Memory
- Library Study Session
- SFC Lobby Selfie
- Canteen Food Challenge
- College Building Tour
- Art Wall Photo
- Coffee Shop Chat
- etc.

#### Romantic + Friendship Only:
- Campus Walk & Talk (deep conversations)
- Garden Picnic (potentially intimate)
- Campus Sunset Watch (romantic setting)

#### Study/Networking Focus:
- Study Group Session (Study Buddy, Friendship, Networking)

### 3. Function Update
Updated `get3RandomMissions()` to filter by relationship type:
```typescript
export function get3RandomMissions(
  lookingFor: 'Romantic' | 'Friendship' | 'Study Buddy' | 'Networking'
): [Mission, Mission, Mission] {
  // Filter missions that are suitable for the relationship type
  const suitableMissions = CAMPUS_MISSIONS.filter(mission => 
    mission.suitableFor.includes(lookingFor)
  );
  
  // Shuffle and return 3 random missions
  const shuffled = [...suitableMissions].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1], shuffled[2]];
}
```

### 4. Integration in Matching Logic
When a match is created in `app/home/page.tsx`, missions are now assigned based on the user's relationship preference:
```typescript
// Determine relationship type for missions
const relationshipType = myProfile?.looking_for || 'Friendship';

// Assign 3 random missions appropriate for the relationship type
const [mission1, mission2, mission3] = get3RandomMissions(relationshipType as any);
```

## Mission Coverage

### Looking For: Romantic
- **Available missions**: 17 out of 19
- **Excluded**: None (all missions suitable for romantic relationships or universal)

### Looking For: Friendship
- **Available missions**: 18 out of 19
- **Excluded**: Marriage Booth Ceremony (ID 2)

### Looking For: Study Buddy
- **Available missions**: 14 out of 19
- **Focus**: Academic, networking, and casual activities
- **Excluded**: Marriage Booth, Garden Picnic, Campus Walk & Talk, Campus Sunset Watch, Create TikTok/Reel

### Looking For: Networking
- **Available missions**: 13 out of 19
- **Focus**: Professional networking, group activities
- **Excluded**: Marriage Booth, Campus Walk & Talk, Garden Picnic, Gym Buddy, Sports Court, Campus Sunset Watch

## Benefits

1. **Contextually Appropriate**: Missions match the relationship intent
2. **No Awkward Situations**: Friendship seekers won't get romantic missions
3. **Better User Experience**: Missions align with what users are looking for
4. **Inclusive Design**: All relationship types have adequate mission variety

## Testing Recommendations

1. Create test accounts with different `looking_for` values
2. Match accounts with same relationship type
3. Verify assigned missions are appropriate
4. Ensure friendship matches never receive "Marriage Booth Ceremony"
5. Confirm romantic matches can receive all missions

## Future Enhancements

- Consider creating relationship-type-specific missions
- Add more study/networking-focused missions for those categories
- Implement mission recommendations based on past completions
- Add user feedback on mission appropriateness
