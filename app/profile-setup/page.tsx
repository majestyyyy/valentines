'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Database } from '@/types/supabase';
import { Heart } from 'lucide-react';
import { validateMultipleFields } from '@/lib/profanityFilter';
import { hashEmail } from '@/lib/hashEmail';

type College = Database['public']['Tables']['profiles']['Row']['college'];
type Gender = 'Male' | 'Female' | 'Non-binary' | 'Other';
type PreferredGender = 'Male' | 'Female' | 'Non-binary' | 'Other' | 'Everyone';

const COLLEGES: College[] = ['CAS', 'CCSS', 'CBA', 'CEDUC', 'CDENT', 'CENG'];
const GENDERS: Gender[] = ['Male', 'Female', 'Non-binary', 'Other'];
const PREF_GENDERS: PreferredGender[] = ['Male', 'Female', 'Non-binary', 'Other', 'Everyone'];

export default function ProfileSetup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRejected = searchParams.get('rejected') === 'true';
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    college: 'CCSS' as College,
    year_level: 1,
    hobbies: '',
    description: '',
    gender: 'Male' as Gender,
    preferred_gender: 'Everyone' as PreferredGender,
  });


  // Photo state
  const [photos, setPhotos] = useState<(File | null)[]>([null, null]); 
  const [previews, setPreviews] = useState<(string | null)[]>([null, null]);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Load existing profile on mount
  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      const { data: profile } = await supabase
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
        });

        // Load existing photos as previews
        if (profile.photo_urls) {
          setPreviews(profile.photo_urls.slice(0, 2).concat([null, null]).slice(0, 2));
        }

        setAcceptedTerms(true); // Already accepted before
        setConfirmedAge(true); // Already confirmed before
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePhotoSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
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
            const fileExt = file.name.split('.').pop();
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
      alert("Please upload at least one photo.");
      return;
    }

    if (!confirmedAge) {
      alert('You must be 18 years old or above to use yUE Match!');
      return;
    }

    if (!acceptedTerms) {
      alert('Please accept the Terms of Service and Privacy Policy to continue');
      return;
    }

    // Validate for harmful words
    const profanityError = validateMultipleFields({
      'Nickname': formData.nickname,
      'Hobbies': formData.hobbies,
      'Bio': formData.description,
    });

    if (profanityError) {
      alert(profanityError);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

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

      // 2. Update/Insert Profile with status back to pending
      const hashedEmail = await hashEmail(user.email!);
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: hashedEmail,
        nickname: formData.nickname,
        college: formData.college,
        year_level: formData.year_level,
        hobbies: formData.hobbies.split(',').map(s => s.trim()),
        description: formData.description,
        gender: formData.gender,
        preferred_gender: formData.preferred_gender,
        photo_urls: uploadedUrls,
        status: 'pending', // Profile must be reviewed by admin before going public
      });

      if (error) throw error;

      router.push('/profile-setup/pending'); // Redirect to pending page to wait for admin approval
    } catch (error) {
      alert('Error creating profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-ue-red border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-red-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-red-500 shadow-lg p-4">
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
              className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-ue-red focus:outline-none transition-colors"
              placeholder="What should we call you?"
              value={formData.nickname}
              onChange={e => setFormData({...formData, nickname: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">My Gender</label>
            <select
              className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-ue-red focus:outline-none transition-colors"
              value={formData.gender}
              onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
            >
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Interested In</label>
            <select 
              className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-ue-red focus:outline-none transition-colors"
              value={formData.preferred_gender}
              onChange={e => setFormData({...formData, preferred_gender: e.target.value as PreferredGender})}
            >
              {PREF_GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">College</label>
              <select
                className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-ue-red focus:outline-none transition-colors"
                value={formData.college || 'CAS'}
                onChange={e => setFormData({...formData, college: e.target.value as College})}
              >
                {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Year Level</label>
              <select 
                className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-ue-red focus:outline-none transition-colors"
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
                className="aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer overflow-hidden relative hover:border-ue-red transition-colors group"
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
                className="aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer overflow-hidden relative hover:border-ue-red transition-colors group"
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
              className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-ue-red focus:outline-none transition-colors"
              value={formData.hobbies}
              onChange={e => setFormData({...formData, hobbies: e.target.value})}
            />
            <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">About Me</label>
            <textarea
              placeholder="Tell others about yourself..."
              className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:border-ue-red focus:outline-none transition-colors h-32 resize-none"
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
          className="w-full bg-ue-red text-white font-bold py-5 rounded-full shadow-xl hover:shadow-2xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 text-lg"
        >
          {loading ? '⏳ Creating Profile...' : '✨ Create My Profile'}
        </button>
      </form>
      </div>
    </div>
  );
}
