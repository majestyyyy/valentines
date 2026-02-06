'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Database } from '@/types/supabase';
import { Heart } from 'lucide-react';
import { validateMultipleFields } from '@/lib/profanityFilter';
import { hashEmail } from '@/lib/hashEmail';
import { sanitizeInput, validateNickname, validateDescription } from '@/lib/security';
import { validateImageFile, sanitizeFilename } from '@/lib/fileValidation';
import Modal from '@/components/Modal';

type College = Database['public']['Tables']['profiles']['Row']['college'];
type Gender = 'Male' | 'Female' | 'Non-binary' | 'Other';
type PreferredGender = 'Male' | 'Female' | 'Non-binary' | 'Other' | 'Everyone';
type LookingFor = 'Romantic' | 'Friendship' | 'Study Buddy' | 'Networking' | 'Everyone';

const COLLEGES: Array<'CAS' | 'CCSS' | 'CBA' | 'CEDUC' | 'CDENT' | 'CENG'> = ['CAS', 'CCSS', 'CBA', 'CEDUC', 'CDENT', 'CENG'];
const GENDERS: Gender[] = ['Male', 'Female', 'Non-binary', 'Other'];
const PREF_GENDERS: PreferredGender[] = ['Male', 'Female', 'Non-binary', 'Other', 'Everyone'];
const LOOKING_FOR_OPTIONS: LookingFor[] = ['Romantic', 'Friendship', 'Study Buddy', 'Networking', 'Everyone'];

function ProfileSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRejected = searchParams.get('rejected') === 'true';
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState({
    respectful: false,
    noSpam: false,
    noHarassment: false,
    authenticity: false,
    privacy: false
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);
  
  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'error' | 'warning';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showModal = (type: 'info' | 'success' | 'error' | 'warning', title: string, message: string) => {
    setModal({ isOpen: true, type, title, message });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const [formData, setFormData] = useState({
    nickname: '',
    college: 'CCSS' as College,
    year_level: 1,
    hobbies: '',
    description: '',
    gender: 'Male' as Gender,
    preferred_gender: 'Everyone' as PreferredGender,
    looking_for: 'Romantic' as LookingFor,
  });


  // Photo state
  const [photos, setPhotos] = useState<(File | null)[]>([null, null]); 
  const [previews, setPreviews] = useState<(string | null)[]>([null, null]);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Load existing profile on mount
  useEffect(() => {
    checkBanStatusFirst();
  }, []);

  const checkBanStatusFirst = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Check ban status FIRST before loading anything
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('is_banned')
        .eq('id', user.id)
        .single();

      if (profile?.is_banned === true) {
        // Banned user - sign out immediately and redirect
        await supabase.auth.signOut();
        router.push('/');
        return;
      }

      // If not banned, proceed to load profile
      loadExistingProfile();
    } catch (error) {
      console.error('Error checking ban status:', error);
      loadExistingProfile();
    }
  };

  const loadExistingProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setHasExistingProfile(true);
        setFormData({
          nickname: profile.nickname || '',
          college: profile.college || 'CCSS',
          year_level: profile.year_level || 1,
          hobbies: profile.hobbies?.join(', ') || '',
          description: profile.description || '',
          gender: profile.gender as Gender || 'Male',
          preferred_gender: profile.preferred_gender as PreferredGender || 'Everyone',
          looking_for: profile.looking_for as LookingFor || 'Romantic',
        });

        // Load existing photos as previews
        if (profile.photo_urls) {
          setPreviews(profile.photo_urls.slice(0, 2).concat([null, null]).slice(0, 2));
        }

        // User must manually check age confirmation and terms even when editing
        // This ensures they re-confirm on every profile update
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePhotoSelect = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        // Validate file before accepting
        const validation = await validateImageFile(file);
        if (!validation.valid) {
          showModal('error', 'Invalid Image', validation.error || 'File validation failed');
          // Clear the input
          e.target.value = '';
          return;
        }

        const newPhotos = [...photos];
        newPhotos[index] = file;
        setPhotos(newPhotos);

        const newPreviews = [...previews];
        newPreviews[index] = URL.createObjectURL(file);
        setPreviews(newPreviews);
    }
  };

  const uploadPhotos = async (userId: string) => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < photos.length; i++) {
        const file = photos[i];
        if (file) {
            const sanitizedName = sanitizeFilename(file.name);
            const fileExt = sanitizedName.split('.').pop();
            const fileName = `${userId}/${Date.now()}-${i}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('photos')
                .upload(fileName, file);

            if (uploadError) {
                console.error('Error uploading photo:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('photos')
                .getPublicUrl(fileName);
            
            uploadedUrls.push(data.publicUrl);
        }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photos[0] && !photos[1] && !previews[0] && !previews[1]) {
      showModal('warning', 'Photos Required', 'Please upload at least one photo.');
      return;
    }

    if (!confirmedAge) {
      showModal('warning', 'Age Verification Required', 'You must be 18 years old or above to use yUE Match!');
      return;
    }

    if (!acceptedTerms) {
      showModal('warning', 'Terms Required', 'Please accept the Terms of Service and Privacy Policy to continue');
      return;
    }

    // Validate for harmful words
    const profanityError = validateMultipleFields({
      'Nickname': formData.nickname,
      'Hobbies': formData.hobbies,
      'Bio': formData.description,
    });

    if (profanityError) {
      showModal('error', 'Inappropriate Content', profanityError);
      return;
    }

    // Validate input formats
    if (!validateNickname(formData.nickname)) {
      showModal('error', 'Invalid Nickname', 'Nickname must be 2-50 characters and contain only letters, numbers, spaces, hyphens, underscores, or apostrophes.');
      return;
    }

    if (!validateDescription(formData.description)) {
      showModal('error', 'Invalid Description', 'Description must be 500 characters or less.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Check if user is banned before allowing profile submission
      const { data: existingProfile } = await (supabase as any)
        .from('profiles')
        .select('status, is_banned')
        .eq('id', user.id)
        .single();

      if (existingProfile?.is_banned) {
        // Sign out banned user immediately
        await supabase.auth.signOut();
        showModal('error', 'Account Banned', 'Your account has been permanently banned.');
        setLoading(false);
        router.push('/');
        return;
      }

      // Check rate limit
      const rateLimitResponse = await fetch('/api/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          limiterType: 'profile',
          identifier: user.id 
        })
      });

      const rateLimitData = await rateLimitResponse.json();

      if (!rateLimitData.allowed) {
        const resetDate = new Date(rateLimitData.reset);
        showModal('error', 'Too Many Requests', 
          `You can only submit your profile 3 times per hour. Try again at ${resetDate.toLocaleTimeString()}.`);
        setLoading(false);
        return;
      }

      // 1. Upload new photos (if any) or keep existing ones
      let uploadedUrls: string[] = [];
      
      // If has existing profile and no new photos uploaded, keep existing previews
      if (hasExistingProfile && !photos[0] && !photos[1] && (previews[0] || previews[1])) {
        uploadedUrls = previews.filter(p => p !== null) as string[];
      } else if (photos[0] || photos[1]) {
        // Upload new photos
        uploadedUrls = await uploadPhotos(user.id);
      } else {
        // Keep existing previews if available
        uploadedUrls = previews.filter(p => p !== null) as string[];
      }

      // 2. Sanitize and prepare profile data
      const sanitizedNickname = sanitizeInput(formData.nickname);
      const sanitizedDescription = sanitizeInput(formData.description);
      const sanitizedHobbies = formData.hobbies.split(',').map(s => sanitizeInput(s.trim()));

      console.log('Original nickname:', formData.nickname);
      console.log('Sanitized nickname:', sanitizedNickname);
      console.log('Original description:', formData.description);
      console.log('Sanitized description:', sanitizedDescription);

      // 3. Update/Insert Profile with status back to pending
      const hashedEmail = await hashEmail(user.email!);
      const { error } = await (supabase as any).from('profiles').upsert({
        id: user.id,
        email: hashedEmail,
        nickname: sanitizedNickname,
        college: formData.college,
        year_level: formData.year_level,
        hobbies: sanitizedHobbies,
        description: sanitizedDescription,
        gender: formData.gender,
        preferred_gender: formData.preferred_gender,
        looking_for: formData.looking_for,
        photo_urls: uploadedUrls,
        status: 'pending', // Profile must be reviewed by admin before going public
      });

      if (error) throw error;

      router.push('/profile-setup/pending'); // Redirect to pending page to wait for admin approval
    } catch (error) {
      showModal('error', 'Profile Creation Failed', 'Error creating profile. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Community Guidelines Screen
  if (showGuidelines) {
    const allAccepted = Object.values(guidelinesAccepted).every(v => v);

    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-500 shadow-lg p-6">
          <div className="max-w-2xl mx-auto text-center">
            <Heart className="w-12 h-12 text-white fill-white mx-auto mb-3" />
            <h1 className="text-2xl font-black text-white drop-shadow-md">
              Welcome to yUE Match! 💕
            </h1>
            <p className="text-white/90 mt-2">
              Before we begin, let's review our community guidelines
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Community Guidelines
              </h2>
              <p className="text-gray-600">
                To create a safe and respectful environment for everyone, please agree to follow these rules:
              </p>
            </div>

            {/* Guideline 1 */}
            <label className="flex items-start gap-4 p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-xl border-2 border-transparent hover:border-rose-200 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={guidelinesAccepted.respectful}
                onChange={(e) => setGuidelinesAccepted({ ...guidelinesAccepted, respectful: e.target.checked })}
                className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-600 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🤝</span>
                  <h3 className="font-bold text-gray-800">Be Respectful</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Treat others with kindness and respect. No offensive language, discrimination, or hate speech.
                </p>
              </div>
            </label>

            {/* Guideline 2 */}
            <label className="flex items-start gap-4 p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-xl border-2 border-transparent hover:border-rose-200 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={guidelinesAccepted.noSpam}
                onChange={(e) => setGuidelinesAccepted({ ...guidelinesAccepted, noSpam: e.target.checked })}
                className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-600 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🚫</span>
                  <h3 className="font-bold text-gray-800">No Spam or Scams</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Don't send repetitive messages, promotional content, or solicitations. Respect the message rate limit.
                </p>
              </div>
            </label>

            {/* Guideline 3 */}
            <label className="flex items-start gap-4 p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-xl border-2 border-transparent hover:border-rose-200 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={guidelinesAccepted.noHarassment}
                onChange={(e) => setGuidelinesAccepted({ ...guidelinesAccepted, noHarassment: e.target.checked })}
                className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-600 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🛡️</span>
                  <h3 className="font-bold text-gray-800">No Harassment</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Don't harass, stalk, or make unwanted advances. If someone isn't interested, respect their decision.
                </p>
              </div>
            </label>

            {/* Guideline 4 */}
            <label className="flex items-start gap-4 p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-xl border-2 border-transparent hover:border-rose-200 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={guidelinesAccepted.authenticity}
                onChange={(e) => setGuidelinesAccepted({ ...guidelinesAccepted, authenticity: e.target.checked })}
                className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-600 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">✨</span>
                  <h3 className="font-bold text-gray-800">Be Authentic</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Use real photos and accurate information about yourself. No catfishing or impersonation.
                </p>
              </div>
            </label>

            {/* Guideline 5 */}
            <label className="flex items-start gap-4 p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-xl border-2 border-transparent hover:border-rose-200 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={guidelinesAccepted.privacy}
                onChange={(e) => setGuidelinesAccepted({ ...guidelinesAccepted, privacy: e.target.checked })}
                className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-600 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🔒</span>
                  <h3 className="font-bold text-gray-800">Protect Privacy</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Don't share personal information (address, phone number) publicly. Keep conversations on the platform initially.
                </p>
              </div>
            </label>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-yellow-800">Violation Consequences</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Violating these guidelines may result in warnings, temporary suspension, or permanent account removal.
                    We review all reports and take appropriate action.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">📋</span>
                <div>
                  <p className="font-semibold text-red-800">Disclaimer</p>
                  <p className="text-sm text-red-700 mt-1">
                    yUE Match is a platform to facilitate connections between University of the East students. Any relationship problems, disputes, emotional distress, or other issues that may arise from interactions on this platform are the sole responsibility of the users involved. The developer and the University of the East Student Council are NOT liable for any consequences, damages, or problems resulting from use of this application. Users engage at their own risk and discretion.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGuidelines(false)}
              disabled={!allAccepted}
              className="w-full bg-gradient-to-r from-rose-600 to-red-500 text-white py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {allAccepted ? "I Agree ✓" : "I Agree ✓"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-red-500 shadow-lg p-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Heart className="w-6 h-6 text-white fill-white" />
          <div>
            <h1 className="text-xl font-black text-white drop-shadow">
              {hasExistingProfile ? 'Edit Your Profile' : 'Create Your Profile'}
            </h1>
            <p className="text-xs text-white/90">
              {hasExistingProfile ? 'Changes will be reviewed by admin before going live' : isRejected ? 'Update your information and resubmit for review' : 'Let others know who you are'}
            </p>
          </div>
        </div>
      </div>

      {isRejected && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-orange-50 border-l-4 border-orange-500 rounded-xl p-3 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-orange-800">Profile Rejected</p>
                <p className="text-sm text-orange-700 mt-1">
                  Your profile was not approved. Please review and update your information, then resubmit for admin review.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 pb-32">
        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📝 Basic Information</h2>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Nickname</label>
            <input
              type="text"
              required
              className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-rose-600 focus:outline-none transition-colors"
              placeholder="What should we call you?"
              value={formData.nickname}
              onChange={e => setFormData({...formData, nickname: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">My Gender</label>
            <select
              className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-rose-600 focus:outline-none transition-colors"
              value={formData.gender}
              onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
            >
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Interested In</label>
            <select 
              className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-rose-600 focus:outline-none transition-colors"
              value={formData.preferred_gender}
              onChange={e => setFormData({...formData, preferred_gender: e.target.value as PreferredGender})}
            >
              {PREF_GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Looking For</label>
            <select 
              className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-rose-600 focus:outline-none transition-colors"
              value={formData.looking_for}
              onChange={e => setFormData({...formData, looking_for: e.target.value as LookingFor})}
            >
              {LOOKING_FOR_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">College</label>
              <select
                className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-rose-600 focus:outline-none transition-colors"
                value={formData.college || 'CAS'}
                onChange={e => setFormData({...formData, college: e.target.value as College})}
              >
                {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Year Level</label>
              <select 
                className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-rose-600 focus:outline-none transition-colors"
                value={formData.year_level}
                onChange={e => setFormData({...formData, year_level: parseInt(e.target.value)})}
              >
                {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-2">📸 Your Photos</h2>
          <p className="text-sm text-gray-500 mb-4">Upload at least one photo</p>
          <div className="grid grid-cols-2 gap-4">
             {/* Photo 1 */}
             <div 
                onClick={() => fileInputRef1.current?.click()}
                className="aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer overflow-hidden relative hover:border-rose-600 transition-colors group"
             >
                {previews[0] ? (
                    <img src={previews[0]} className="w-full h-full object-cover" alt="Preview 1" />
                ) : (
                    <div className="text-center p-4">
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📷</div>
                      <span className="text-gray-500 text-sm font-medium">Photo 1</span>
                    </div>
                )}
                <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef1} 
                    accept="image/*"
                    onChange={(e) => handlePhotoSelect(0, e)}
                />
             </div>

             {/* Photo 2 */}
             <div 
                onClick={() => fileInputRef2.current?.click()}
                className="aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer overflow-hidden relative hover:border-rose-600 transition-colors group"
             >
                 {previews[1] ? (
                    <img src={previews[1]} className="w-full h-full object-cover" alt="Preview 2" />
                ) : (
                    <div className="text-center p-4">
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📷</div>
                      <span className="text-gray-500 text-sm font-medium">Photo 2</span>
                    </div>
                )}
                <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef2} 
                    accept="image/*"
                    onChange={(e) => handlePhotoSelect(1, e)}
                />
             </div>
          </div>
        </div>

        {/* Hobbies & Bio */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">💭 About You</h2>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Hobbies</label>
            <input
              type="text"
              placeholder="Gaming, Coding, Basketball"
              className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-rose-600 focus:outline-none transition-colors"
              value={formData.hobbies}
              onChange={e => setFormData({...formData, hobbies: e.target.value})}
            />
            <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">About Me</label>
            <textarea
              placeholder="Tell others about yourself..."
              className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-rose-600 focus:outline-none transition-colors h-32 resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </div>

        {/* Age Verification */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmedAge}
              onChange={(e) => setConfirmedAge(e.target.checked)}
              className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">
              <span className="font-semibold">I confirm that I am 18 years old or above.</span>
              {' '}yUE Match! is strictly for users aged 18 and older.
            </span>
          </label>
        </div>

        {/* Terms & Privacy Acceptance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">
              I have read and agree to the{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-700 underline font-semibold"
              >
                Terms of Service and Privacy Policy
              </a>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !confirmedAge || !acceptedTerms}
          className="w-full bg-gradient-to-r from-rose-600 to-red-500 text-white font-bold py-5 rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50 text-lg"
        >
          {loading ? '⏳ Creating Profile...' : '✨ Create My Profile'}
        </button>
      </form>

      {/* Modal for notifications */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
      >
        {modal.message}
      </Modal>
      </div>
    </div>
  );
}

export default function ProfileSetup() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-600 border-t-transparent"></div>
      </div>
    }>
      <ProfileSetupContent />
    </Suspense>
  );
}
