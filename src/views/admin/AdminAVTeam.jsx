import React, { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Mail, Phone, Linkedin, MapPin, User, Star, Eye, Save, AlertCircle, CheckCircle, UserPlus, Upload } from 'lucide-react';
import { supabase } from '../../supabase';
import { Button, Card, Badge, Modal, Avatar } from '../../components/ui';
import { PROFILE_OPTIONS } from '../../constants/profileOptions';

const AdminAVTeam = ({ avTeam, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);
  
  const clubRoleOptions = ['Club President', 'Club Operations', 'Mentor', 'Contributor'];
  const emojiOptions = ['initials', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🤖', '💼', '🐱', '🐶'];
  
  // Sort and filter AV team
  const sortedAVTeam = [...avTeam].sort((a, b) => 
    (a.full_name || '').localeCompare(b.full_name || '')
  );
  const filteredAVTeam = sortedAVTeam.filter(member => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (member.full_name || '').toLowerCase().includes(q) ||
           (member.email || '').toLowerCase().includes(q);
  });
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    title: '',
    company: 'Alumni Ventures',
    club_role: 'Mentor',
    bio: '',
    emoji: 'initials',
    photo_url: '',
    fun_fact: '',
    linkedin_url: '',
    phone: '',
    location: '',
    timezone: 'America/New_York',
    is_visible_to_members: false,
  });

  const toggleVisibility = async (member) => {
    try {
      const { error } = await supabase
        .from('av_team')
        .update({ is_visible_to_members: !member.is_visible_to_members })
        .eq('id', member.id);
      if (error) throw error;
      onRefresh();
    } catch (err) {
      alert('Error updating visibility: ' + err.message);
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    setSaveSuccess(false);
    setFormData({
      full_name: '',
      email: '',
      title: '',
      company: 'Alumni Ventures',
      club_role: 'Mentor',
      bio: '',
      emoji: 'initials',
      photo_url: '',
      fun_fact: '',
      linkedin_url: '',
      phone: '',
      location: '',
      timezone: 'America/New_York',
      is_visible_to_members: false,
    });
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setSaveSuccess(false);
    setFormData({
      full_name: member.full_name || '',
      email: member.email || '',
      title: member.title || '',
      company: member.company || 'Alumni Ventures',
      club_role: member.club_role || 'Mentor',
      bio: member.bio || '',
      emoji: member.emoji || 'initials',
      photo_url: member.photo_url || '',
      fun_fact: member.fun_fact || '',
      linkedin_url: member.linkedin_url || '',
      phone: member.phone || '',
      location: member.location || '',
      timezone: member.timezone || 'America/New_York',
      is_visible_to_members: member.is_visible_to_members || false,
    });
    setShowModal(true);
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
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

  const handleSave = async () => {
    if (!formData.full_name.trim() || !formData.email.trim()) {
      alert('Name and Email are required');
      return;
    }
    
    setLoading(true);
    setSaveSuccess(false);
    
    try {
      const saveData = {
        full_name: formData.full_name,
        email: formData.email,
        title: formData.title,
        company: formData.company,
        club_role: formData.club_role,
        bio: formData.bio,
        photo_url: formData.photo_url,
        emoji: formData.emoji,
        fun_fact: formData.fun_fact,
        linkedin_url: formData.linkedin_url,
        phone: formData.phone,
        location: formData.location,
        timezone: formData.timezone,
        is_visible_to_members: formData.is_visible_to_members,
      };
      
      if (editingMember) {
        const { error } = await supabase
          .from('av_team')
          .update(saveData)
          .eq('id', editingMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('av_team')
          .insert([saveData]);
        if (error) throw error;
      }

      // Also sync to members table if they exist as a member
      const memberData = {
        member_role: formData.title,
        member_company: formData.company,
        location: formData.location,
        timezone: formData.timezone,
        linkedin_url: formData.linkedin_url,
        whatsapp: formData.phone,
        phone: formData.phone,
        personal_statement: formData.bio,
        fun_fact: formData.fun_fact,
        emoji: formData.emoji,
        photo_url: formData.photo_url,
      };

      await supabase
        .from('members')
        .update(memberData)
        .eq('email', formData.email);
      
      setSaveSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        onRefresh();
      }, 1000);
    } catch (err) {
      console.error('Error saving:', err);
      alert('Error saving: ' + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (member) => {
    if (!confirm(`Remove ${member.full_name} from AV Team? This cannot be undone.`)) return;
    
    try {
      const { error } = await supabase
        .from('av_team')
        .delete()
        .eq('id', member.id);
      if (error) throw error;
      onRefresh();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage AV Team</h2>
          <p className="text-sm text-gray-500">{avTeam.length} team members</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
          />
          <Button icon={UserPlus} onClick={openAddModal}>Add AV Member</Button>
        </div>
      </div>

      {/* Team Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Club Role</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Visible</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAVTeam.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {avTeam.length === 0 ? (
                      <>
                        <UserPlus size={40} className="mx-auto text-gray-300 mb-3" />
                        <p>No AV Team members yet</p>
                        <Button size="sm" className="mt-3" onClick={openAddModal}>Add First Member</Button>
                      </>
                    ) : (
                      <p>No members found matching "{searchQuery}"</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAVTeam.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar 
                          fullName={member.full_name}
                          photoUrl={member.photo_url}
                          emoji={member.emoji}
                          showEmoji={member.emoji && member.emoji !== '👤' && member.emoji !== 'initials' && member.emoji !== 'initial'}
                          backgroundColor="color-mix(in srgb, var(--accent-color, #C9A227) 35%, white)"
                          size="md"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{member.full_name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{member.title || '-'}</p>
                      <p className="text-sm text-gray-500">{member.company}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        {member.club_role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleVisibility(member)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          member.is_visible_to_members
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {member.is_visible_to_members ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {member.location && <p>{member.location}</p>}
                      {member.linkedin_url && (
                        <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          LinkedIn
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => openEditModal(member)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(member)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => !loading && setShowModal(false)} title={editingMember ? 'Edit AV Team Member' : 'Add AV Team Member'} size="lg">
        {saveSuccess ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-900">
              {editingMember ? 'Member Updated!' : 'Member Added!'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Visibility Toggle */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
              <input
                type="checkbox"
                id="is_visible_to_members"
                checked={formData.is_visible_to_members}
                onChange={(e) => setFormData({ ...formData, is_visible_to_members: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <label htmlFor="is_visible_to_members" className="font-medium text-gray-900 cursor-pointer">
                  Visible to Members
                </label>
                <p className="text-sm text-gray-500">Show this team member on the member dashboard and community pages</p>
              </div>
            </div>

            {/* Emoji Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setFormData({ ...formData, emoji: e, photo_url: '' })}
                    className={`w-10 h-10 text-xl rounded-lg border-2 transition-all flex items-center justify-center ${
                      !formData.photo_url && formData.emoji === e ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {e === 'initials' ? (
                      <Avatar 
                        fullName={formData.full_name || 'AB'}
                        backgroundColor="color-mix(in srgb, var(--accent-color, #C9A227) 35%, white)"
                        size="sm"
                      />
                    ) : e}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center border-2 border-dashed ${formData.photo_url ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
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

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Mike Collins"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="mike@av.vc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Club Role *</label>
                <select
                  value={formData.club_role}
                  onChange={(e) => setFormData({ ...formData, club_role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {clubRoleOptions.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title & Company */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="CEO"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Alumni Ventures"
                />
              </div>
            </div>

            {/* Personal Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Brief bio about this team member..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fun Fact</label>
              <input
                type="text"
                value={formData.fun_fact}
                onChange={(e) => setFormData({ ...formData, fun_fact: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Something interesting about them"
              />
            </div>

            {/* Contact Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="New York, NY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {PROFILE_OPTIONS.timezones.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading} icon={loading ? null : Save}>
                {loading ? 'Saving...' : editingMember ? 'Save Changes' : 'Add Member'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

// Member Discussions (placeholder)

export default AdminAVTeam;
