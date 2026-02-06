'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/supabase';
import { Heart, ArrowLeft, Camera, Save, X, Edit2, LogOut, Trash2 } from 'lucide-react';
import { validateMultipleFields } from '@/lib/profanityFilter';
import { sanitizeInput } from '@/lib/security';
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

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
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

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      setUserId(user.id);

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        router.push('/profile-setup');
        return;
      }

      // Check if user is banned - sign out immediately
      if (profile.is_banned === true) {
        await supabase.auth.signOut();
        router.push('/');
        return;
      }

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

      if (profile.photo_urls) {
        setExistingPhotoUrls(profile.photo_urls);
        setPreviews(profile.photo_urls.slice(0, 2).concat([null, null]).slice(0, 2));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
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

  const handlePhotoRemove = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);

    const newPreviews = [...previews];
    newPreviews[index] = null;
    setPreviews(newPreviews);
  };

  const handleSave = () => {
    if (!userId) return;

    // Validate required fields
    if (!formData.nickname.trim() || !formData.description.trim() || !formData.hobbies.trim()) {
      showModal('warning', 'Missing Information', 'Please fill in all required fields (Nickname, Description, Hobbies)');
      return;
    }

    // Profanity check
    const fieldsToCheck = {
      nickname: formData.nickname,
      description: formData.description,
      hobbies: formData.hobbies,
    };

    const profanityError = validateMultipleFields(fieldsToCheck);
    if (profanityError) {
      showModal('error', 'Inappropriate Content', profanityError);
      return;
    }

    // Show confirmation modal
    setShowSaveConfirm(true);
  };

  const confirmSave = async () => {
    if (!userId) return;

    setShowSaveConfirm(false);
    setSaving(true);

    try {
      // Check if user is banned before allowing profile update
      const { data: profileStatus } = await (supabase as any)
        .from('profiles')
        .select('status, is_banned')
        .eq('id', userId)
        .single();

      if (profileStatus?.is_banned) {
        showModal('error', 'Account Banned', 'Your account has been banned. You cannot update your profile.');
        setSaving(false);
        return;
      }

      // Check rate limit
      const rateLimitResponse = await fetch('/api/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          limiterType: 'profile',
          identifier: userId 
        })
      });

      const rateLimitData = await rateLimitResponse.json();

      if (!rateLimitData.allowed) {
        const resetDate = new Date(rateLimitData.reset);
        showModal('error', 'Too Many Requests', 
          `You can only update your profile 3 times per hour. Try again at ${resetDate.toLocaleTimeString()}.`);
        setSaving(false);
        return;
      }

      // Upload new photos if they exist
      const photoUrls: string[] = [...existingPhotoUrls];

      for (let i = 0; i < photos.length; i++) {
        if (photos[i]) {
          // Delete old photo from this slot if exists
          if (existingPhotoUrls[i]) {
            const oldPath = existingPhotoUrls[i].split('/').pop();
            if (oldPath) {
              await supabase.storage.from('photos').remove([`${userId}/${oldPath}`]);
            }
          }

          // Upload new photo
          const fileExt = photos[i]!.name.split('.').pop();
          const fileName = `${Date.now()}-${i}.${fileExt}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('photos')
            .upload(`${userId}/${fileName}`, photos[i]!);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(`${userId}/${fileName}`);

          photoUrls[i] = publicUrl;
        } else if (previews[i] === null && existingPhotoUrls[i]) {
          // Photo was removed
          const oldPath = existingPhotoUrls[i].split('/').pop();
          if (oldPath) {
            await supabase.storage.from('photos').remove([`${userId}/${oldPath}`]);
          }
          photoUrls[i] = '';
        }
      }

      // Filter out empty strings
      const cleanedPhotoUrls = photoUrls.filter(url => url);

      // First, fetch current approved data to save as snapshot
      const { data: currentProfile } = await (supabase as any)
        .from('profiles')
        .select('nickname, college, year_level, hobbies, description, gender, preferred_gender, photo_urls, status')
        .eq('id', userId)
        .single();

      // Update profile - Set status to 'pending' for admin review
      const hobbiesArray = formData.hobbies
        .split(',')
        .map(h => h.trim())
        .filter(h => h.length > 0);

      // Sanitize user input
      const sanitizedNickname = sanitizeInput(formData.nickname);
      const sanitizedDescription = sanitizeInput(formData.description);
      const sanitizedHobbies = hobbiesArray.map(h => sanitizeInput(h));

      console.log('Original nickname:', formData.nickname);
      console.log('Sanitized nickname:', sanitizedNickname);
      console.log('Original description:', formData.description);
      console.log('Sanitized description:', sanitizedDescription);

      const updateData: any = {
        nickname: sanitizedNickname,
        college: formData.college,
        year_level: formData.year_level,
        hobbies: sanitizedHobbies,
        description: sanitizedDescription,
        gender: formData.gender,
        preferred_gender: formData.preferred_gender,
        looking_for: formData.looking_for,
        photo_urls: cleanedPhotoUrls,
        status: 'pending', // Require admin review
      };

      // If currently approved, save snapshot of current data so others still see it
      if (currentProfile && currentProfile.status === 'approved') {
        updateData.approved_nickname = currentProfile.nickname;
        updateData.approved_photo_urls = currentProfile.photo_urls;
        updateData.approved_college = currentProfile.college;
        updateData.approved_year_level = currentProfile.year_level;
        updateData.approved_hobbies = currentProfile.hobbies;
        updateData.approved_description = currentProfile.description;
        updateData.approved_gender = currentProfile.gender;
        updateData.approved_preferred_gender = currentProfile.preferred_gender;
      }

      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) throw updateError;

      // Redirect to pending page
      router.push('/profile-setup/pending');
    } catch (error) {
      console.error('Error updating profile:', error);
      showModal('error', 'Update Failed', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      showModal('error', 'Sign Out Failed', 'Failed to sign out. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;

    setDeleting(true);

    try {
      // Delete all user photos from storage
      const { data: files } = await supabase.storage
        .from('photos')
        .list(userId);

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${file.name}`);
        await supabase.storage.from('photos').remove(filePaths);
      }

      // Delete user profile (this will cascade delete swipes, matches, notifications due to foreign keys)
      await (supabase as any)
        .from('profiles')
        .delete()
        .eq('id', userId);

      // Delete auth user account
      const { error: deleteError } = await supabase.rpc('delete_user');
      
      if (deleteError) {
        console.error('Error deleting auth account:', deleteError);
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      showModal('success', 'Account Deleted', 'Your account has been deleted successfully.');
      setTimeout(() => router.push('/'), 2000);
    } catch (error) {
      console.error('Error deleting account:', error);
      showModal('error', 'Deletion Failed', 'Failed to delete account. Please try again or contact support.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-rose-50 via-red-50 to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-600 to-red-500 shadow-lg">
        <button 
          onClick={() => router.push('/home')}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-xl font-black text-white drop-shadow-md">My Profile</h1>
        <div className="w-10"></div>
      </header>

      <div className="max-w-2xl mx-auto p-6 pb-20">
        {/* View Mode */}
        {!isEditing ? (
          <div className="space-y-6">
            {/* Photos */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="grid grid-cols-2 gap-2 p-4">
                {previews.map((preview, idx) => (
                  <div key={idx} className="aspect-square relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                    {preview ? (
                      <img src={preview} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Nickname</h3>
                <p className="text-2xl font-bold text-gray-800">{formData.nickname}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">College</h3>
                  <p className="text-lg font-medium text-gray-800">{formData.college}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Year Level</h3>
                  <p className="text-lg font-medium text-gray-800">{formData.year_level}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Gender</h3>
                  <p className="text-lg font-medium text-gray-800">{formData.gender}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Looking For</h3>
                  <p className="text-lg font-medium text-gray-800">{formData.preferred_gender}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Interested In</h3>
                <p className="text-lg font-medium text-gray-800">{formData.looking_for}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">About Me</h3>
                <p className="text-gray-700 whitespace-pre-wrap break-words">{formData.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Hobbies</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.hobbies.split(',').map((hobby, idx) => (
                    <span 
                      key={idx} 
                      className="bg-gradient-to-r from-rose-50 to-red-50 text-gray-700 px-4 py-2 rounded-full text-sm font-medium border border-rose-200 break-words"
                    >
                      {hobby.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-gradient-to-r from-rose-600 to-red-500 text-white py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Edit2 className="w-5 h-5" />
              Edit Profile
            </button>

            {/* Account Actions */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-50 text-red-600 py-3 rounded-full font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete Account
              </button>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-6">
            {/* Photos */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Photos (2 required)</h3>
              <div className="grid grid-cols-2 gap-4">
                {[0, 1].map((idx) => (
                  <div key={idx}>
                    <div className="aspect-square relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-dashed border-gray-300">
                      {previews[idx] ? (
                        <>
                          <img src={previews[idx]!} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handlePhotoRemove(idx)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => idx === 0 ? fileInputRef1.current?.click() : fileInputRef2.current?.click()}
                          className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Camera className="w-12 h-12 mb-2" />
                          <span className="text-sm font-medium">Add Photo</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={idx === 0 ? fileInputRef1 : fileInputRef2}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoSelect(idx, e)}
                      className="hidden"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nickname *</label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-600 focus:outline-none transition-colors text-gray-800"
                  placeholder="What should we call you?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">College *</label>
                  <select
                    value={formData.college || ''}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value as College })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-600 focus:outline-none transition-colors text-gray-800"
                  >
                    {COLLEGES.map(college => (
                      <option key={college} value={college}>{college}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Year Level *</label>
                  <select
                    value={formData.year_level}
                    onChange={(e) => setFormData({ ...formData, year_level: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-600 focus:outline-none transition-colors text-gray-800"
                  >
                    {[1, 2, 3, 4, 5].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-600 focus:outline-none transition-colors text-gray-800"
                  >
                    {GENDERS.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Looking For *</label>
                  <select
                    value={formData.preferred_gender}
                    onChange={(e) => setFormData({ ...formData, preferred_gender: e.target.value as PreferredGender })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-600 focus:outline-none transition-colors text-gray-800"
                  >
                    {PREF_GENDERS.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Interested In *</label>
                <select
                  value={formData.looking_for}
                  onChange={(e) => setFormData({ ...formData, looking_for: e.target.value as LookingFor })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-600 focus:outline-none transition-colors text-gray-800"
                >
                  {LOOKING_FOR_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">About Me *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-600 focus:outline-none transition-colors resize-none text-gray-800"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hobbies * (comma-separated)</label>
                <input
                  type="text"
                  value={formData.hobbies}
                  onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-600 focus:outline-none transition-colors text-gray-800"
                  placeholder="e.g., Reading, Gaming, Music"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPhotos([null, null]);
                  loadProfile(); // Reset to original data
                }}
                disabled={saving}
                className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-full font-bold text-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-rose-600 to-red-500 text-white py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save Confirmation Modal */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-yellow-600">
              <Save className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Save</h2>
            </div>
            
            <p className="text-gray-600">
              Your profile changes will be submitted for admin review. Your profile will be temporarily hidden until approved.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Note:</strong> During review, other users won't be able to see your updated profile.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-full font-bold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="flex-1 bg-rose-600 text-white py-3 rounded-full font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <Trash2 className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Delete Account?</h2>
            </div>
            
            <p className="text-gray-600">
              This action cannot be undone. All your data including profile, photos, matches, and messages will be permanently deleted.
            </p>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-full font-bold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-3 rounded-full font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete Forever
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
  );
}
