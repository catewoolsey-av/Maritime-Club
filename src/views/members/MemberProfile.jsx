import React, { useState, useEffect, useRef } from 'react';
import { Save, Edit, CheckCircle, Mail, Linkedin, Phone, MapPin, Target, Settings, Upload, Clock } from 'lucide-react';
import { supabase } from '../../supabase';
import { Button, Card, Badge, Modal, Avatar } from '../../components/ui';
import { PROFILE_OPTIONS } from '../../constants/profileOptions';
import { DealInterestCard } from '../../contexts/MessagingContext';

const MemberProfile = ({ currentUser, isAdmin = false, onRefresh, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);
  
  const sectorOptions = ['AI/ML', 'Healthcare', 'Fintech', 'Climate', 'Enterprise Software', 'Consumer', 'Deep Tech', 'Crypto/Web3', 'Space'];
  const clubRoleOptions = ['Club President', 'Club Operations', 'Mentor', 'Contributor'];
  
  useEffect(() => {
    if (currentUser) {
      setFormData({
        full_name: currentUser.full_name || '',
        email: currentUser.email || '',
        headline: currentUser.headline || '',
        emoji: currentUser.emoji || 'initials',
        member_role: currentUser.member_role || currentUser.title || '',
        member_company: currentUser.member_company || currentUser.company || '',
        club_role: currentUser.club_role || '',
        location: currentUser.location || '',
        timezone: currentUser.timezone || 'America/New_York',
        sector_interests: currentUser.sector_interests || [],
        personal_statement: currentUser.personal_statement || currentUser.bio || '',
        fun_fact: currentUser.fun_fact || '',
        vc_experience_level: currentUser.vc_experience_level || 'new',
        open_to_chats: currentUser.open_to_chats ?? false,
        linkedin_url: currentUser.linkedin_url || '',
        whatsapp: currentUser.whatsapp || currentUser.phone || '',
        photo_url: currentUser.photo_url || '',
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isEditing || !currentUser?.is_manager || !currentUser?.email) return;
    let isActive = true;
    const loadLatestAvTeam = async () => {
      const { data } = await supabase
        .from('av_team')
        .select('*')
        .eq('email', currentUser.email)
        .maybeSingle();
      if (!isActive || !data) return;
      setFormData(prev => ({
        ...prev,
        full_name: data.full_name || prev.full_name,
        email: data.email || prev.email,
        member_role: data.title || prev.member_role,
        member_company: data.company || prev.member_company,
        location: data.location || prev.location,
        timezone: data.timezone || prev.timezone,
        personal_statement: data.bio || prev.personal_statement,
        fun_fact: data.fun_fact || prev.fun_fact,
        linkedin_url: data.linkedin_url || prev.linkedin_url,
        whatsapp: data.phone || prev.whatsapp,
        club_role: data.club_role || prev.club_role,
        emoji: data.emoji || prev.emoji,
        photo_url: data.photo_url || prev.photo_url,
      }));
    };
    loadLatestAvTeam();
    return () => {
      isActive = false;
    };
  }, [isEditing, currentUser?.is_manager, currentUser?.email]);

  const handlePhotoUpload = async (file) => {
    if (!file || !currentUser?.id) return;
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;
      const { error } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, photo_url: urlData.publicUrl }));
    } catch (err) {
      console.error('Photo upload error:', err);
      alert('Error uploading photo: ' + err.message);
    }
    setUploadingPhoto(false);
  };
  
  const toggleArrayItem = (field, item) => {
    const arr = formData[field] || [];
    if (arr.includes(item)) {
      setFormData({ ...formData, [field]: arr.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [field]: [...arr, item] });
    }
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      let avTeamData = null;
      let memberData = null;
      let memberUpdate = null;
      if (currentUser.is_manager) {
        avTeamData = {
          full_name: formData.full_name,
          title: formData.member_role,
          company: formData.member_company,
          club_role: formData.club_role,
          bio: formData.personal_statement,
          fun_fact: formData.fun_fact,
          photo_url: formData.photo_url,
          emoji: formData.emoji,
          linkedin_url: formData.linkedin_url,
          phone: formData.whatsapp,
          location: formData.location,
          timezone: formData.timezone,
        };
        
        const { error } = await supabase
          .from('av_team')
          .update(avTeamData)
          .eq('email', currentUser.email);
        
        if (error) throw error;
        
        memberData = {
          full_name: formData.full_name,
          headline: formData.headline,
          location: formData.location,
          timezone: formData.timezone,
          linkedin_url: formData.linkedin_url,
          whatsapp: formData.whatsapp,
          phone: formData.whatsapp,
          member_role: formData.member_role,
          member_company: formData.member_company,
          personal_statement: formData.personal_statement,
          fun_fact: formData.fun_fact,
          photo_url: formData.photo_url,
          emoji: formData.emoji,
        };
        
        const { error: memberError } = await supabase
          .from('members')
          .update(memberData)
          .eq('id', currentUser.id);
        
        if (memberError) throw memberError;
      } else {
        const { club_role, ...memberUpdateData } = formData;
        memberUpdate = memberUpdateData;
        const { error } = await supabase
          .from('members')
          .update(memberUpdateData)
          .eq('id', currentUser.id);
        
        if (error) throw error;
      }
      
      setIsEditing(false);
      
      const { data: updatedMember, error: updatedMemberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (updatedMemberError) {
        console.warn('Profile refresh error:', updatedMemberError.message);
      }
      
      if (currentUser.is_manager) {
        const { data: avData, error: avDataError } = await supabase
          .from('av_team')
          .select('*')
          .eq('email', currentUser.email)
          .single();
        
        if (avDataError) {
          console.warn('AV team refresh error:', avDataError.message);
        }
        
        const fallbackMember = updatedMember || { ...currentUser, ...memberData };
        const fallbackAv = avData || { ...avTeamData, email: formData.email };
        const mergedData = { ...fallbackMember, ...fallbackAv };
        if (onUserUpdate) {
          onUserUpdate(mergedData);
        }
      } else if (onUserUpdate) {
        onUserUpdate(updatedMember || { ...currentUser, ...memberUpdate });
      }
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error saving profile: ' + err.message);
    }
    setSaving(false);
  };
  
  const getCompleteness = () => {
    if (currentUser.is_manager) {
      const checks = [
        !!currentUser.full_name,
        !!currentUser.headline,
        !!currentUser.location,
        !!currentUser.timezone,
        !!(currentUser.personal_statement || currentUser.bio),
        !!currentUser.linkedin_url,
        !!currentUser.email,
      ];
      return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    } else {
      const checks = [
        !!currentUser.full_name,
        !!currentUser.headline,
        !!currentUser.location,
        !!currentUser.timezone,
        !!currentUser.personal_statement,
        !!currentUser.sector_interests?.length,
        !!currentUser.vc_experience_level,
        !!currentUser.linkedin_url,
        !!currentUser.email,
      ];
      return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }
  };
  
  const emojiOptions = ['initials', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🤖', '💼', '🐱', '🐶'];
  
  if (!currentUser) {
    return (
      <Card>
        <div className="text-center py-8">
          <Settings size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Profile not found</p>
        </div>
      </Card>
    );
  }
  
  const completeness = getCompleteness();
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              {currentUser.photo_url ? (
                <div className="w-24 h-24 rounded-full overflow-hidden">
                  <img src={currentUser.photo_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <Avatar 
                  fullName={currentUser.full_name}
                  emoji={currentUser.emoji}
                  showEmoji={currentUser.emoji && currentUser.emoji !== '👤' && currentUser.emoji !== 'initials'}
                  backgroundColor="var(--accent-color, #C9A227)"
                  size="xl"
                />
              )}
              {currentUser.onboarding_complete && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle size={14} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentUser.full_name}</h2>
              {currentUser.is_manager ? (
                currentUser.club_role && <p className="text-gray-600 mt-1">{currentUser.club_role}</p>
              ) : (
                currentUser.headline && <p className="text-gray-600 mt-1">{currentUser.headline}</p>
              )}
              <p className="text-gray-500 mt-1">
                {currentUser.member_role || currentUser.role_title || currentUser.title} {(currentUser.member_company || currentUser.company) && `@ ${currentUser.member_company || currentUser.company}`}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {currentUser.location && (
                  <span>{currentUser.location}</span>
                )}
                {currentUser.timezone && (
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {currentUser.timezone}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <Button variant="primary" icon={Edit} onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>
      
      {!currentUser.is_manager && <DealInterestCard member={currentUser} />}
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">About</h3>
            
            {(currentUser.personal_statement || currentUser.bio) ? (
              <p className="text-gray-600 whitespace-pre-wrap">{currentUser.personal_statement || currentUser.bio}</p>
            ) : (
              <p className="text-gray-400 italic">No personal statement yet. Click Edit Profile to add one!</p>
            )}
          </Card>
          
          {!currentUser.is_manager && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Learning Profile</h3>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">VC Experience:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentUser.vc_experience_level === 'experienced' ? 'bg-green-100 text-green-700' :
                  currentUser.vc_experience_level === 'some' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {currentUser.vc_experience_level === 'new' ? 'New to VC' :
                   currentUser.vc_experience_level === 'some' ? 'Some Experience' :
                   currentUser.vc_experience_level === 'experienced' ? 'Experienced' : 'Not set'}
                </span>
              </div>
            </Card>
          )}

          {currentUser.is_manager && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Fun Fact</h3>
              <p className="text-gray-600">{currentUser.fun_fact || 'No fun fact yet.'}</p>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Connect</h3>

            <div className="space-y-2">
              {/* LinkedIn OAuth connect / connected status */}
              {currentUser.linkedin_connected ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Linkedin size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700">LinkedIn Connected</span>
                  <CheckCircle size={14} className="text-green-500 ml-auto" />
                </div>
              ) : (
                <a
                  href={`/api/linkedin-auth?member_id=${currentUser.id}`}
                  className="flex items-center gap-3 p-3 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
                >
                  <Linkedin size={18} className="text-sky-600" />
                  <span className="text-sm font-medium text-sky-700">Connect LinkedIn</span>
                  <span className="text-xs text-sky-500 ml-auto">Import photo & name</span>
                </a>
              )}

              {currentUser.linkedin_url && (
                <a href={currentUser.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors">
                  <Linkedin size={18} className="text-sky-600" />
                  <span className="text-sm font-medium text-sky-700">LinkedIn Profile</span>
                </a>
              )}
              
              {currentUser.email && (
                <a href={`mailto:${currentUser.email}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Mail size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Email</span>
                </a>
              )}
              
              {(currentUser.whatsapp || currentUser.phone) && (
                <a href={`https://wa.me/${(currentUser.whatsapp || currentUser.phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <Phone size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700">WhatsApp</span>
                </a>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Profile" size="xl">
        <div className="space-y-6">
          
          {!currentUser.is_manager && (
            <>
              <div className="flex gap-2 border-b pb-2">
                {['Basics', 'About', 'Interests', 'Contact'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.toLowerCase()
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-2">
                {activeTab === 'basics' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Basic Information</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                          <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        {!currentUser.is_manager && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                            <input
                              type="text"
                              value={formData.headline}
                              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Family Office Director | VC Enthusiast"
                            />
                          </div>
                        )}
                        {currentUser.is_manager && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Club Role</label>
                          <select
                            value={formData.club_role}
                            onChange={(e) => setFormData({ ...formData, club_role: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {clubRoleOptions.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>
                      )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                        <div className="flex flex-wrap gap-2">
                          {emojiOptions.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setFormData({ ...formData, emoji, photo_url: '' })}
                            className={`w-10 h-10 rounded-lg text-xl transition-all flex items-center justify-center ${!formData.photo_url && formData.emoji === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-100 hover:bg-gray-200'}`}
                            >
                              {emoji === 'initials' ? (
                                <Avatar 
                                  fullName={formData.full_name || 'AB'}
                                  backgroundColor="#E5E7EB"
                                  size="sm"
                                />
                              ) : emoji}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                          className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center border-2 border-dashed ${formData.photo_url ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 hover:border-gray-400'}`}
                            title={formData.photo_url ? 'Profile photo selected' : 'Upload profile photo'}
                          >
                            {formData.photo_url ? (
                              <img src={formData.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <Upload size={16} className="text-gray-400" />
                            )}
                          </button>
                          <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                          />
                          {uploadingPhoto && (
                            <p className="text-xs text-gray-500 w-full">Uploading photo...</p>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Role & Location</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role/Title</label>
                          <input
                            type="text"
                            value={formData.member_role}
                            onChange={(e) => setFormData({ ...formData, member_role: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Director of Investments"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                          <input
                            type="text"
                            value={formData.member_company}
                            onChange={(e) => setFormData({ ...formData, member_company: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Smith Family Office"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="New York, NY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                          <select
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            {PROFILE_OPTIONS.timezones.map((tz) => (
                              <option key={tz} value={tz}>{tz}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Personal Statement</h3>
                      <textarea
                        value={formData.personal_statement}
                        onChange={(e) => setFormData({ ...formData, personal_statement: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={6}
                        placeholder="Share your background and what interests you about venture capital..."
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'interests' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Sector Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {sectorOptions.map(sector => (
                          <button
                            key={sector}
                            type="button"
                            onClick={() => toggleArrayItem('sector_interests', sector)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              formData.sector_interests?.includes(sector)
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-500'
                            }`}
                          >
                            {sector}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Settings</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">VC Experience</label>
                          <select
                            value={formData.vc_experience_level}
                            onChange={(e) => setFormData({ ...formData, vc_experience_level: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="new">New to VC</option>
                            <option value="some">Some Experience</option>
                            <option value="experienced">Experienced</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.open_to_chats}
                              onChange={(e) => setFormData({ ...formData, open_to_chats: e.target.checked })}
                              className="w-4 h-4 rounded text-blue-600"
                            />
                            <span className="text-sm text-gray-700">Open to 1:1</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Contact Info</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                          <input
                            type="url"
                            value={formData.linkedin_url}
                            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="https://linkedin.com/in/..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                          <input
                            type="tel"
                            value={formData.whatsapp}
                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="+1 555 123 4567"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {currentUser.is_manager && (
            <>
              <div className="flex gap-2 border-b pb-2">
                {['Basics', 'About', 'Contact'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.toLowerCase()
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-2">
                {activeTab === 'basics' && (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      {currentUser.is_manager && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Club Role</label>
                          <select
                            value={formData.club_role}
                            onChange={(e) => setFormData({ ...formData, club_role: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          >
                            {clubRoleOptions.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {!currentUser.is_manager && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                          <input
                            type="text"
                            value={formData.headline}
                            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                            placeholder="e.g., Operator in fintech, learning VC"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                        <div className="flex flex-wrap gap-2 pl-1">
                          {emojiOptions.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setFormData({ ...formData, emoji, photo_url: '' })}
                            className={`w-10 h-10 rounded-lg text-xl transition-all flex items-center justify-center ${!formData.photo_url && formData.emoji === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-100 hover:bg-gray-200'}`}
                            >
                              {emoji === 'initials' ? (
                                <Avatar 
                                  fullName={formData.full_name || 'AB'}
                                  backgroundColor="#E5E7EB"
                                  size="sm"
                                />
                              ) : emoji}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center border-2 border-dashed ${formData.photo_url ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 hover:border-gray-400'}`}
                            title={formData.photo_url ? 'Profile photo selected' : 'Upload profile photo'}
                          >
                            {formData.photo_url ? (
                              <img src={formData.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <Upload size={16} className="text-gray-400" />
                            )}
                          </button>
                          <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                          />
                          {uploadingPhoto && (
                            <p className="text-xs text-gray-500 w-full">Uploading photo...</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role/Title</label>
                        <input
                          type="text"
                          value={formData.member_role}
                          onChange={(e) => setFormData({ ...formData, member_role: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          placeholder="e.g., Director of Investments"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <input
                          type="text"
                          value={formData.member_company}
                          onChange={(e) => setFormData({ ...formData, member_company: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          placeholder="e.g., Smith Family Office"
                        />
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          placeholder="e.g., New York, NY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                        <select
                          value={formData.timezone}
                          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        >
                          {PROFILE_OPTIONS.timezones.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'about' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        value={formData.personal_statement}
                        onChange={(e) => setFormData({ ...formData, personal_statement: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        rows={6}
                        placeholder="Share your background and what you bring to the community..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fun Fact</label>
                      <textarea
                        value={formData.fun_fact}
                        onChange={(e) => setFormData({ ...formData, fun_fact: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        rows={2}
                        placeholder="Share something interesting or fun about yourself..."
                      />
                    </div>
                  </div>
                )}
                
                {activeTab === 'contact' && (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                        <input
                          type="url"
                          value={formData.linkedin_url}
                          onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                        <input
                          type="tel"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          placeholder="+1 555 123 4567"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} icon={saving ? null : Save}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MemberProfile;
