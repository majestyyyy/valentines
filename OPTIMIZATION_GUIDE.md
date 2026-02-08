# System Optimization Guide

## 🚀 Critical Optimizations for Production

### 1. **Database Query Optimization**

#### Problem: N+1 Queries in Chat List
```tsx
// ❌ BAD: Multiple separate queries
const enrichedMatches = await Promise.all(matchData.map(async (m: any) => {
  const partnerId = m.user1_id === user.id ? m.user2_id : m.user1_id;
  const { data: partner } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', partnerId)
    .single();
  return { ...m, partner };
}));
```

**Fix: Use JOIN instead**
```sql
-- Create a view for efficient match fetching
CREATE VIEW match_details AS
SELECT 
  m.*,
  p1.nickname as user1_nickname,
  p1.photo_urls as user1_photos,
  p2.nickname as user2_nickname,
  p2.photo_urls as user2_photos
FROM matches m
LEFT JOIN profiles p1 ON m.user1_id = p1.id
LEFT JOIN profiles p2 ON m.user2_id = p2.id;
```

Then query once:
```tsx
// ✅ GOOD: Single query with JOIN
const { data: matchData } = await supabase
  .from('match_details')
  .select('*')
  .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
```

---

### 2. **Real-time Subscription Consolidation**

#### Problem: Multiple Channels Per User
Currently: 3-4 channels per user = **3,000 connections with 1,000 users**

**Fix: Combine into single channel**
```tsx
// ❌ BAD: Multiple channels
const profileChannel = supabase.channel('profiles-changes');
const matchChannel = supabase.channel('matches-updates');
const notifChannel = supabase.channel('notifications-updates');

// ✅ GOOD: Single combined channel
const channel = supabase
  .channel(`user-${userId}`)
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'profiles',
    filter: `id=eq.${userId}` 
  }, handleProfileChange)
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'matches',
    filter: `user1_id=eq.${userId},user2_id=eq.${userId}` 
  }, handleMatch)
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'notifications',
    filter: `user_id=eq.${userId}` 
  }, handleNotification)
  .subscribe();
```

---

### 3. **Image Loading Optimization**

#### Add Progressive Image Loading
```tsx
// Add to profile cards
<Image 
  src={photo}
  alt="Profile"
  loading="lazy"
  placeholder="blur"
  blurDataURL={generateBlurDataURL(photo)}
  sizes="(max-width: 768px) 100vw, 500px"
/>
```

#### Implement CDN caching headers
```sql
-- In Supabase Storage policies
ALTER TABLE storage.objects 
SET (
  cache_control = 'public, max-age=31536000, immutable'
);
```

---

### 4. **Add Database Indexes**

```sql
-- Critical indexes for performance
CREATE INDEX idx_swipes_swiper_swiped ON swipes(swiper_id, swiped_id);
CREATE INDEX idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX idx_messages_match_created ON messages(match_id, created_at DESC);
CREATE INDEX idx_profiles_status ON profiles(status) WHERE status = 'approved';
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Composite index for candidate fetching
CREATE INDEX idx_profiles_approved_id ON profiles(status, id) WHERE status = 'approved';
```

---

### 5. **Reduce SELECT * Queries**

```tsx
// ❌ BAD: Fetching all columns
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('status', 'approved');

// ✅ GOOD: Select only needed columns
const { data } = await supabase
  .from('profiles')
  .select('id, nickname, photo_urls, college, year_level, description, gender, looking_for')
  .eq('status', 'approved');
```

---

### 6. **Implement Pagination**

```tsx
// For home page - load profiles in batches
const BATCH_SIZE = 10;

const loadNextBatch = async (offset: number) => {
  const { data } = await supabase
    .from('profiles')
    .select('id, nickname, photo_urls, college, year_level, description')
    .eq('status', 'approved')
    .filter('id', 'not.in', safeIds)
    .range(offset, offset + BATCH_SIZE - 1);
  
  return data;
};
```

---

### 7. **Add Request Caching**

```tsx
// Cache match count to reduce queries
const [matchCount, setMatchCount] = useState(() => {
  const cached = localStorage.getItem('matchCount');
  return cached ? parseInt(cached) : 0;
});

useEffect(() => {
  localStorage.setItem('matchCount', matchCount.toString());
}, [matchCount]);
```

---

### 8. **Optimize Storage Operations**

```tsx
// ✅ Delete old photos in parallel, not sequentially
const deleteOldPhotos = async (photoUrls: string[], userId: string) => {
  const deletePromises = photoUrls.map(url => {
    const fileName = url.split('/').pop();
    return supabase.storage
      .from('photos')
      .remove([`${userId}/${fileName}`]);
  });
  
  await Promise.all(deletePromises);
};
```

---

### 9. **Add Database Materialized Views**

```sql
-- Pre-calculate expensive queries
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
  id,
  (SELECT COUNT(*) FROM matches WHERE user1_id = profiles.id OR user2_id = profiles.id) as match_count,
  (SELECT COUNT(*) FROM swipes WHERE swiper_id = profiles.id) as swipe_count
FROM profiles;

-- Refresh periodically
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
END;
$$ LANGUAGE plpgsql;
```

---

### 10. **Reduce Real-time Payload Size**

```tsx
// ❌ BAD: Receiving full profile updates
.on('postgres_changes', { event: 'UPDATE', table: 'profiles' }, (payload) => {
  console.log('Full payload:', payload.new); // Large object
})

// ✅ GOOD: Use filters to reduce data
.on('postgres_changes', { 
  event: 'UPDATE', 
  table: 'profiles',
  filter: `status=eq.approved`
}, (payload) => {
  // Only approved profiles trigger this
})
```

---

### 11. **Add Connection Pooling**

```tsx
// supabase.ts - increase pool size for production
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'x-connection-pool-size': '50', // Increase for production
      },
    },
  }
);
```

---

### 12. **Implement Debouncing for User Actions**

```tsx
import { useCallback, useRef } from 'react';

const useDebouncedSwipe = (delay = 300) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((direction: 'left' | 'right') => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      handleSwipe(direction);
    }, delay);
  }, [delay]);
};
```

---

## 📊 Monitoring & Analytics

### Add Performance Tracking

```tsx
// lib/analytics.ts
export const trackPerformance = (metric: string, value: number) => {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(`${metric}-${Date.now()}`);
    console.log(`📊 ${metric}: ${value}ms`);
  }
};

// Usage
const start = Date.now();
await fetchCandidates();
trackPerformance('fetch-candidates', Date.now() - start);
```

---

## 🎯 Implementation Priority

### High Priority (Do First):
1. ✅ Add database indexes
2. ✅ Consolidate real-time subscriptions
3. ✅ Fix N+1 queries with JOINs
4. ✅ Reduce SELECT * to specific columns

### Medium Priority (Do Before Launch):
5. ✅ Implement pagination
6. ✅ Add request caching
7. ✅ Optimize storage operations
8. ✅ Add progressive image loading

### Low Priority (Nice to Have):
9. ✅ Add materialized views
10. ✅ Implement debouncing
11. ✅ Add performance tracking
12. ✅ Optimize real-time payloads

---

## 🔍 Performance Targets

- **Page Load**: < 2 seconds
- **Profile Swipe Response**: < 300ms
- **Message Send**: < 500ms
- **Real-time Update Latency**: < 1 second
- **Image Load**: < 1 second (with lazy loading)
- **Database Query**: < 100ms average

---

## 🛠️ Quick Wins (Implement Now)

Run these SQL commands immediately:

```sql
-- 1. Add critical indexes
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- 2. Optimize candidate query with partial index
CREATE INDEX IF NOT EXISTS idx_profiles_approved 
ON profiles(id) 
WHERE status = 'approved';

-- 3. Add composite index for message fetching
CREATE INDEX IF NOT EXISTS idx_messages_match_time 
ON messages(match_id, created_at DESC);
```

These changes will give you immediate performance improvements! 🚀
