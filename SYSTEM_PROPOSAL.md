# yUE Match! - Dating App System Proposal

## Executive Summary

yUE Match! is a mobile-exclusive dating application designed specifically for University of the East students. The platform provides a secure, moderated environment for students to connect, match, and communicate with fellow UE students.

---

## System Overview

### Platform Specifications
- **Platform**: Mobile-only web application
- **Framework**: Next.js 14 (React)
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Realtime)
- **Styling**: Tailwind CSS
- **Target Users**: UE Students (@ue.edu.ph emails)

---

## Core Features

### 1. Authentication System

#### 1.1 Email & Password Authentication with OTP Verification
- **Sign Up Flow**: 
  - User provides email and password
  - System sends 6-digit OTP to verify email
  - User enters OTP to complete registration
  - Account created and email verified
- **Login Flow**:
  - User provides email and password
  - No OTP required for subsequent logins
  - Instant access after password verification
- **Email Validation**: Restricted to @ue.edu.ph domain (configurable)
- **Password Requirements**: Minimum 6 characters
- **Automatic Account Creation**: First-time users create account with email/password
- **Session Management**: Secure session handling with automatic expiration

#### 1.2 Custom SMTP Email Delivery
- **Multiple Provider Support**: Gmail, SendGrid, Mailgun
- **Branded Email Templates**: Custom-designed OTP emails with yUE Match! branding
- **Retry Logic**: Automatic retry for failed email deliveries
- **Rate Limiting**: Protection against email spam and abuse

#### 1.3 Security & Privacy
- **Password Hashing**: Secure bcrypt password hashing by Supabase
- **SHA-256 Email Encryption**: User emails hashed in database for privacy
- **Plain Text Auth**: Email stored plain in Supabase Auth for OTP delivery
- **Dual Storage**: Encrypted in profiles table, plain in auth system
- **OTP Expiration**: Time-limited verification codes for security

---

### 2. Profile Management System

#### 2.1 Profile Creation
- **Mandatory Information**:
  - Nickname
  - Gender (Male, Female, Non-binary, Other)
  - Preferred Gender (Male, Female, Non-binary, Other, Everyone)
  - College (CAS, CCSS, CBA, CEDUC, CDENT, CENG)
  - Year Level (1-5)
  - Photo Upload (2 photos minimum)
  - Bio/Description
  - Hobbies

#### 2.2 Profile Validation
- **Profanity Filter**: Automatic content moderation for offensive language
- **Age Verification**: Users must confirm they are 18+ years old
- **Terms Acceptance**: Mandatory acceptance of Terms of Service and Privacy Policy
- **Admin Approval**: All profiles require admin review before going live

#### 2.3 Profile Status Workflow
1. **Pending**: Newly created profile awaiting admin approval
2. **Approved**: Profile verified and visible to other users
3. **Rejected**: Profile denied, user can resubmit with corrections

#### 2.4 Photo Management
- **Storage**: Supabase Storage buckets
- **Format Support**: JPG, PNG, WebP
- **Multiple Photos**: Up to 2 photos per profile
- **Image Preview**: Real-time preview before upload
- **Secure URLs**: CDN-delivered with access control

---

### 3. Admin Dashboard

#### 3.1 Profile Approval System
- **Pending Queue**: Real-time list of profiles awaiting review
- **Profile Preview**: Full profile view with photos, bio, and details
- **Approve/Reject Actions**: One-click approval or rejection
- **Optimistic UI**: Instant feedback with smooth animations
- **Status Tracking**: Visual indicators for pending/approved/rejected profiles

#### 3.2 User Management
- **User Statistics**: Total users, approved profiles, pending reviews
- **Ban System**: Admin can ban users for violations
- **Real-time Updates**: Live dashboard updates via Supabase Realtime
- **Bulk Actions**: Multi-select for batch operations

#### 3.3 Report Management
- **Report Queue**: View all user reports in chronological order
- **Report Details**:
  - Reporter information
  - Reported user profile
  - Report reason and timestamp
  - Chat history (if applicable)
- **Profile Viewer**: View full reported profile details
- **Chat Viewer**: Read conversation history between users
- **Action Panel**: Ban reported user directly from report view

#### 3.4 Admin Authentication
- **Separate Admin Login**: Dedicated login page for administrators
- **OTP-Based**: Same secure OTP system as regular users
- **Access Control**: Service role key for elevated permissions

#### 3.5 UI/UX Enhancements
- **Gradient Design**: Modern gradient backgrounds and buttons
- **Animations**: Smooth transitions and hover effects
- **Glassmorphism**: Frosted glass effect for modern aesthetics
- **Responsive Stats Cards**: Animated stat displays with icons
- **Loading States**: Skeleton screens and loading indicators

---

### 4. Matching & Discovery System

#### 4.1 Tinder-Style Swiping
- **Card-Based Interface**: Stack of profile cards
- **Swipe Gestures**: Left to pass, right to like
- **Button Alternative**: Heart/X buttons for non-touch devices
- **Photo Carousel**: Swipe through multiple photos per profile
- **Profile Details**: Name, age, college, year level, bio, hobbies

#### 4.2 Matching Algorithm
- **Gender Preferences**: Filter by preferred gender
- **Smart Filtering**: Exclude already-swiped profiles
- **Status Filtering**: Show only approved profiles
- **Self-Exclusion**: Never show user's own profile
- **Match Detection**: Automatic match when both users like each other

#### 4.3 Match Notifications
- **Real-time Match Popup**: Instant notification when matched
- **Match Details**: Show matched user's profile
- **Chat Redirect**: Direct link to start conversation
- **Celebration Animation**: Confetti effect for matches

---

### 5. Chat & Messaging System

#### 5.1 Real-time Messaging
- **WebSocket Integration**: Instant message delivery via Supabase Realtime
- **Live Typing Indicators**: See when match is typing (future enhancement)
- **Message Status**: Sent/Delivered/Read indicators (future enhancement)
- **Auto-scroll**: Automatic scroll to latest messages

#### 5.2 Chat Interface
- **Match List**: View all matches with preview of last message
- **Conversation View**: Full chat history with matched user
- **Message Bubbles**: Different colors for sent/received messages
- **Timestamps**: Message time display
- **User Info**: Profile picture and name in chat header

#### 5.3 Message Features
- **Text Messages**: Standard text-based communication
- **Character Limit**: Reasonable message length restrictions
- **Send Button**: Clear send action with loading state
- **Message History**: Full conversation persistence
- **Empty State**: Friendly message when no chats exist

---

### 6. Reporting System

#### 6.1 User Reporting
- **In-Chat Reporting**: Report users directly from chat
- **Report Reasons**: Predefined violation categories
- **Anonymous Reporting**: Reporter identity protected
- **Timestamp Tracking**: Exact report submission time
- **Context Preservation**: Associated chat messages saved

#### 6.2 Report Types
- Harassment or bullying
- Inappropriate content
- Spam or scam
- Fake profile
- Underage user
- Other violations

#### 6.3 Admin Review
- **Report Dashboard**: Centralized view of all reports
- **Context Access**: View full chat history and profiles
- **Action Buttons**: Quick ban or dismiss options
- **Status Updates**: Track report resolution

---

### 7. Ban & Moderation System

#### 7.1 User Banning
- **Instant Ban**: Admin can ban users immediately
- **Profile Status Change**: Status set to "rejected"
- **Real-time Notification**: Banned users see modal instantly
- **Session Termination**: Automatic logout after ban
- **Access Revocation**: Banned users cannot access app

#### 7.2 BanGuard Component
- **Real-time Detection**: WebSocket monitoring for ban status
- **Full-Screen Modal**: Prominent ban notification
- **Ban Message**: Clear explanation of ban reason
- **Logout Option**: Clean exit from application
- **Prevention**: Blocks all app access while banned

#### 7.3 Ban Notification Features
- **Immediate Detection**: Real-time status monitoring
- **User-Friendly Message**: Clear communication about ban
- **Support Information**: Contact details for appeals
- **Graceful Degradation**: Smooth transition to logged-out state

---

### 8. Mobile-First Design

#### 8.1 Mobile Guard
- **Screen Size Detection**: Automatically detect device type
- **Desktop Blocker**: Prevent desktop access with friendly message
- **Responsive Design**: Optimized for mobile screens (320px - 768px)
- **Touch Optimization**: Touch-friendly buttons and gestures
- **Safe Area Support**: iOS notch and bottom bar handling

#### 8.2 Mobile UX Features
- **Swipe Gestures**: Native-feeling swipe interactions
- **Bottom Navigation**: Thumb-friendly button placement
- **Large Touch Targets**: Easy-to-tap buttons (min 44x44px)
- **Smooth Scrolling**: iOS WebKit optimized scrolling
- **Pull-to-Refresh Protection**: Disabled to prevent accidents

---

### 9. Real-time Features

#### 9.1 Supabase Realtime Integration
- **Profile Status Updates**: Live updates when profile approved/rejected
- **New Messages**: Instant message delivery
- **Match Notifications**: Real-time match detection
- **Report Updates**: Admin sees new reports immediately
- **Ban Detection**: Users see ban status in real-time

#### 9.2 WebSocket Channels
- **User-Specific Channels**: Isolated channels per user
- **Chat Channels**: Per-conversation message streams
- **Admin Channels**: Dashboard update streams
- **Efficient Subscriptions**: Automatic cleanup on unmount

---

### 10. Data Security & Privacy

#### 10.1 Email Encryption
- **SHA-256 Hashing**: One-way encryption of user emails
- **Privacy Protection**: Emails not visible in plain text
- **Admin Privacy**: Even admins cannot see original emails
- **Dual Storage**: Encrypted in profiles, plain in auth

#### 10.2 Row Level Security (RLS)
- **Database Policies**: PostgreSQL RLS on all tables
- **User Isolation**: Users can only access their own data
- **Admin Privileges**: Service role bypass for admin operations
- **Match-Based Access**: Chat access only for matched users

#### 10.3 Content Moderation
- **Profanity Filter**: Automatic detection of harmful language
- **Manual Review**: Admin approval for all profiles
- **Report System**: Community-driven moderation
- **Ban System**: Quick response to violations

---

### 11. Storage & Database

#### 11.1 Database Schema
**Tables**:
- `profiles`: User profiles with status, photos, bio
- `swipes`: Swipe history (like/pass tracking)
- `matches`: Confirmed mutual likes
- `messages`: Chat message history
- `reports`: User violation reports

#### 11.2 Storage Buckets
- `profile-photos`: User uploaded images
- **Public Access**: CDN-delivered images
- **File Organization**: User ID-based folder structure
- **Automatic Cleanup**: Old files removed on update

#### 11.3 Database Optimizations
- **Indexes**: Fast queries on user_id, status, created_at
- **Cascade Deletes**: Automatic cleanup of related records
- **Constraints**: Data integrity enforcement
- **Triggers**: Automated match creation on mutual swipes

---

### 12. Email System

#### 12.1 Custom SMTP Configuration
- **Provider Options**: Gmail, SendGrid, Mailgun
- **Easy Setup**: Environment variable configuration
- **Custom Templates**: Branded HTML email designs
- **Fallback Support**: Multiple providers for reliability

#### 12.2 Email Templates
- **OTP Emails**: Email verification codes for new signups
- **Welcome Emails**: New user onboarding (future)
- **Approval Notifications**: Profile status updates
- **Match Notifications**: New match alerts (future)
- **Password Reset**: Password recovery emails (future)

---

### 13. Terms & Privacy

#### 13.1 Legal Pages
- **Terms of Service**: User agreement and rules
- **Privacy Policy**: Data collection and usage
- **Age Restriction**: 18+ enforcement
- **Consent Tracking**: Mandatory acceptance before use

#### 13.2 Compliance Features
- **GDPR Considerations**: Data privacy compliance
- **User Consent**: Explicit checkbox acceptance
- **Data Rights**: User data access and deletion (future)

---

### 14. Performance Optimizations

#### 14.1 Frontend Optimization
- **Next.js 14**: Server-side rendering and static generation
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Components loaded on demand

#### 14.2 Backend Optimization
- **PostgreSQL Indexes**: Fast database queries
- **Connection Pooling**: Efficient database connections
- **CDN Delivery**: Fast image loading
- **Caching**: Browser and CDN caching strategies

---

### 15. User Experience Features

#### 15.1 Animations & Transitions
- **Smooth Transitions**: CSS transitions on all interactions
- **Loading States**: Spinners and skeleton screens
- **Success Feedback**: Confirmation messages and animations
- **Error Handling**: User-friendly error messages

#### 15.2 Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Focus Indicators**: Clear focus states
- **Color Contrast**: WCAG AA compliance
- **Screen Reader Support**: Semantic HTML (future enhancement)

#### 15.3 Feedback & Validation
- **Form Validation**: Real-time input validation
- **Error Messages**: Clear, actionable error text
- **Success Messages**: Confirmation of actions
- **Progress Indicators**: Multi-step process tracking

---

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: Next.js App Router

### Backend Stack
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (OTP)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime (WebSockets)
- **API**: Supabase Auto-generated APIs

### Infrastructure
- **Hosting**: Vercel (recommended) or self-hosted
- **Database**: Supabase Cloud
- **Email**: Custom SMTP (Gmail/SendGrid/Mailgun)
- **CDN**: Supabase CDN for images

---

## Security Features

### Authentication Security
- ✅ Password-based authentication with OTP email verification
- ✅ Secure password hashing (bcrypt)
- ✅ OTP verification for new accounts
- ✅ Session management with automatic expiration
- ✅ CSRF protection
- ✅ Email domain validation

### Data Security
- ✅ SHA-256 email encryption
- ✅ Row-level security policies
- ✅ Secure API endpoints
- ✅ Environment variable protection

### Content Security
- ✅ Profanity filter
- ✅ Admin profile approval
- ✅ User reporting system
- ✅ Ban system

---

## Future Enhancements

### Phase 2 Features
1. **Advanced Matching**
   - Location-based matching
   - Interest-based algorithms
   - Compatibility scoring

2. **Enhanced Communication**
   - Voice messages
   - Photo sharing in chat
   - Read receipts
   - Typing indicators

3. **Social Features**
   - Profile verification badges
   - Super likes
   - Undo swipes
   - Boost profile visibility

4. **Analytics**
   - User engagement metrics
   - Match success rates
   - Popular times/days
   - Admin analytics dashboard

5. **Notifications**
   - Push notifications
   - Email notifications
   - In-app notification center

6. **Premium Features**
   - Unlimited swipes
   - See who liked you
   - Advanced filters
   - Ad-free experience

---

## Deployment Guide

### Prerequisites
- Node.js 18+
- Supabase Account
- SMTP Email Provider
- Domain (optional)

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Custom SMTP (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Deployment Steps
1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Run database migrations
5. Deploy to Vercel: `vercel --prod`

---

## Support & Maintenance

### Monitoring
- Error tracking (Sentry recommended)
- Performance monitoring
- Database query optimization
- User feedback collection

### Updates
- Regular security patches
- Feature updates based on feedback
- Performance improvements
- Bug fixes

---

## Conclusion

yUE Match! is a comprehensive, secure, and feature-rich dating platform specifically designed for UE students. With robust admin controls, real-time features, and a mobile-first approach, the system provides a safe and engaging environment for students to connect.

### Key Strengths
✅ **Security-First**: Email encryption, admin approval, content moderation  
✅ **Real-time**: Instant matches, live chat, real-time updates  
✅ **Mobile-Optimized**: Native-feeling mobile experience  
✅ **Admin Control**: Comprehensive moderation tools  
✅ **Scalable**: Built on modern, scalable infrastructure  

---

**Document Version**: 1.0  
**Last Updated**: February 4, 2026  
**Contact**: yUE Match! Development Team
