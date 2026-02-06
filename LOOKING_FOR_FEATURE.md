# Looking For Category Feature

## Overview
Added a new "Looking For" category field to user profiles that allows users to specify what type of connection they're seeking. The system now filters matches based on mutual interests.

## Categories Available
1. **💕 Romantic** - Looking for dating/romantic relationships
2. **🤝 Friendship** - Looking for platonic friendships
3. **📚 Study Buddy** - Looking for academic collaboration partners
4. **💼 Networking** - Looking for professional networking connections
5. **✨ Everyone** - Open to all types of connections

## Database Changes

### Migration File: `add_looking_for_field.sql`

**Action Required:** Run this SQL in your Supabase SQL Editor

```sql
-- Add the column with ENUM type
ALTER TABLE profiles 
ADD COLUMN looking_for TEXT DEFAULT 'Romantic' CHECK (looking_for IN ('Romantic', 'Friendship', 'Study Buddy', 'Networking', 'Everyone'));

-- Create index for faster filtering
CREATE INDEX idx_profiles_looking_for ON profiles(looking_for);

-- Update existing profiles to have a default value
UPDATE profiles SET looking_for = 'Romantic' WHERE looking_for IS NULL;
```

## How It Works

### 1. Profile Setup
- Users select their "Looking For" preference when creating/editing their profile
- The field appears below "Interested In" (gender preference)
- Default value is "Romantic"
- Options displayed as a dropdown selection

### 2. Matching Algorithm
The system filters candidates based on mutual "looking_for" preferences:

**Filtering Logic:**
- If you select a **specific category** (e.g., "Romantic"):
  - You will see profiles that selected the **same category** OR "Everyone"
  - Example: If you're looking for "Study Buddy", you'll see others looking for "Study Buddy" or "Everyone"

- If you select **"Everyone"**:
  - You will see all profiles regardless of their "looking_for" preference
  - This means you're open to any type of connection

**Combined with Gender Preference:**
The matching algorithm now considers BOTH gender preferences AND looking_for categories:
1. Gender filter (mutual gender interest)
2. Looking_for filter (matching connection type)
3. Limit: 50 candidates

### 3. Profile Display
- The "Looking For" category is prominently displayed on profile cards
- Appears below the user's college and gender information
- Shown as a colored badge with emoji icon:
  - 💕 Romantic (pink/red gradient)
  - 🤝 Friendship (pink/red gradient)
  - 📚 Study Buddy (pink/red gradient)
  - 💼 Networking (pink/red gradient)
  - ✨ Open to Everything (pink/red gradient)

## Files Modified

### 1. `add_looking_for_field.sql` (NEW)
- Database migration to add the looking_for column
- Creates index for performance
- Sets default value for existing profiles

### 2. `types/supabase.ts`
- Added `looking_for` field to profiles Row, Insert, and Update types
- Type: `'Romantic' | 'Friendship' | 'Study Buddy' | 'Networking' | 'Everyone' | null`

### 3. `app/profile-setup/page.tsx`
- Added `LookingFor` type definition
- Added `LOOKING_FOR_OPTIONS` constant array
- Added `looking_for` to formData state (default: 'Romantic')
- Added UI dropdown for looking_for selection
- Included looking_for in profile upsert operation

### 4. `app/home/page.tsx`
- Updated fetchCandidates function with looking_for filter
- Added looking_for badge display on profile cards
- Shows emoji + text based on selected category

## Setup Instructions

1. **Run the SQL Migration:**
   ```bash
   # Open Supabase Dashboard → SQL Editor
   # Copy and paste contents of add_looking_for_field.sql
   # Click "Run"
   ```

2. **Verify the Changes:**
   - Check that the `looking_for` column exists in the profiles table
   - Verify the index was created: `idx_profiles_looking_for`
   - Confirm existing profiles have default value "Romantic"

3. **Test the Feature:**
   - Create/edit a profile and select different "Looking For" options
   - Verify the selection is saved correctly
   - Check that profile cards display the looking_for badge
   - Test matching: Create profiles with different looking_for values and verify filtering works

## User Experience

### Before:
- Users could only filter by gender preference
- No way to specify the type of connection sought
- All approved profiles shown (gender-filtered only)

### After:
- Users specify both gender preference AND connection type
- Matches are filtered by mutual interest in connection type
- Clear visibility of what each person is looking for
- More relevant matches based on intent

## Examples

**Example 1: Study Buddy Matching**
- User A: Looking for "Study Buddy"
- User B: Looking for "Study Buddy"
- User C: Looking for "Everyone"
- User D: Looking for "Romantic"

Result: User A will see User B and User C (not User D)

**Example 2: Open to Everything**
- User A: Looking for "Everyone"
- User B: Looking for "Romantic"
- User C: Looking for "Friendship"
- User D: Looking for "Study Buddy"

Result: User A will see Users B, C, and D (everyone)

**Example 3: Romantic Matching**
- User A: Looking for "Romantic"
- User B: Looking for "Romantic"
- User C: Looking for "Everyone"
- User D: Looking for "Friendship"

Result: User A will see User B and User C (not User D)

## Additional Notes

- The feature is fully integrated with existing gender preference filtering
- Both filters work together (AND logic)
- Performance optimized with database index
- No breaking changes to existing profiles (default value applied)
- Fully type-safe with TypeScript definitions

## Future Enhancements

Potential improvements:
- Allow multiple "Looking For" selections (e.g., both Romantic AND Friendship)
- Add custom categories
- Analytics on popular connection types
- Filter toggles in the UI to temporarily broaden search
