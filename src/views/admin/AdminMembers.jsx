import React, { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, Mail, Phone, Linkedin, User, UserPlus, MapPin, AlertCircle, CheckCircle, X, Save, Upload } from 'lucide-react';
import { supabase } from '../../supabase';
import { formatDate } from '../../utils/formatters';
import { Button, Card, Badge, Modal, Avatar } from '../../components/ui';
import { PROFILE_OPTIONS } from '../../constants/profileOptions';

const AdminMembers = ({ members, avTeam, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMember, setResetMember] = useState(null);
  const [viewFilter, setViewFilter] = useState('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    temp_password: 'welcome123',
    headline: '',
    member_role: '',
    member_company: '',
    location: '',
    timezone: 'America/New_York',
    sector_interests: [],
    personal_statement: '',
    vc_experience_level: 'new',
    open_to_chats: false,
    is_manager: false,
    emoji: 'initials',
    linkedin_url: '',
    whatsapp: '',
    photo_url: '',
  });
  const [dragOver, setDragOver] = useState(false);
  const [importData, setImportData] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, done: false });

  // Filter and sort members
  const avTeamByEmail = new Map(
    (avTeam || [])
      .filter(person => person?.email)
      .map(person => [person.email.toLowerCase(), person])
  );
  const mergedMembers = members.map(member => {
    if (!member.is_manager) return member;
    const avTeamMatch = avTeamByEmail.get(member.email?.toLowerCase() || '');
    if (!avTeamMatch) return member;
    return {
      ...member,
      full_name: avTeamMatch.full_name || member.full_name,
      email: avTeamMatch.email || member.email,
      member_role: avTeamMatch.club_role || member.member_role,
      role_title: avTeamMatch.title || member.role_title,
      member_company: avTeamMatch.company || member.member_company,
      job: avTeamMatch.company || member.job,
      location: avTeamMatch.location || member.location,
      emoji: avTeamMatch.emoji || member.emoji,
      photo_url: avTeamMatch.photo_url || member.photo_url,
    };
  });
  const clubMembers = mergedMembers.filter(m => !m.is_manager).sort((a, b) =>
    (a.full_name || '').localeCompare(b.full_name || '')
  );
  const sortedMembers = [...mergedMembers].sort((a, b) =>
    (a.full_name || '').localeCompare(b.full_name || '')
  );
  const avTeamMembers = mergedMembers
    .filter(m => m.is_manager)
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  
  const filteredMembers = (viewFilter === 'all' 
    ? sortedMembers 
    : viewFilter === 'members' 
      ? clubMembers 
      : avTeamMembers
  ).filter(member => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (member.full_name || '').toLowerCase().includes(q) ||
           (member.email || '').toLowerCase().includes(q);
  });
  
  const generateTempPassword = () => {
    return 'welcome' + Math.floor(100 + Math.random() * 900);
  };

  const parseJsonSafe = async (response) => {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };
  
  const handleResetPassword = async () => {
    if (!resetMember) return;
    const newTempPassword = generateTempPassword();
    
    try {
      const response = await fetch('/api/update-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_user_id: resetMember.auth_user_id,
          new_password: newTempPassword
        })
      });

      const data = await parseJsonSafe(response);
      if (!response.ok) throw new Error(data?.error || `Failed to reset password (${response.status})`);
      
      // Update must_change_password flag
      await supabase
        .from('members')
        .update({ must_change_password: true })
        .eq('id', resetMember.id);
      
      alert(`Password reset!\n\nNew temporary password: ${newTempPassword}\n\nPlease share this with ${resetMember.full_name}`);
      setShowResetModal(false);
      setResetMember(null);
      onRefresh();
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Error resetting password: ' + err.message);
    }
  };
  
  const sectorOptions = ['AI/ML', 'Healthcare', 'Fintech', 'Climate', 'Enterprise Software', 'Consumer', 'Deep Tech', 'Crypto/Web3', 'Space'];
  const emojiOptions = ['initials', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🤖', '💼', '🐱', '🐶'];

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

  // Add AV Team member as Club Member
  const handleAddAVTeamAsMember = async (avTeamMember) => {
    // Check if already exists
    if (members.find(m => m.id === avTeamMember.id)) {
      alert(`${avTeamMember.full_name} is already a club member`);
      return;
    }
    
    const tempPassword = generateTempPassword();
    
    try {
      // Step 1: Insert member record
      const { data: newMember, error: insertError } = await supabase
        .from('members')
        .insert([{
          full_name: avTeamMember.full_name,
          email: avTeamMember.email,
          must_change_password: true,
          headline: avTeamMember.club_role || '',
          member_role: avTeamMember.club_role || '',
          emoji: avTeamMember.emoji || 'initials',
          linkedin_url: avTeamMember.linkedin_url || '',
          location: avTeamMember.location || '',
          timezone: 'America/New_York',
          open_to_chats: false,
          is_manager: true, // AV Team members should have admin access
          photo_url: avTeamMember.photo_url || '',
        }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Step 2: Create Supabase Auth user via API
      try {
        const response = await fetch('/api/create-auth-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: avTeamMember.email,
            password: tempPassword,
            full_name: avTeamMember.full_name,
            member_id: newMember.id
          })
        });

        const data = await parseJsonSafe(response);
        if (!response.ok) throw new Error(data?.error || `Failed to create auth user (${response.status})`);
      } catch (authError) {
        // Rollback: delete the member record if auth creation failed
        await supabase.from('members').delete().eq('id', newMember.id);
        throw new Error(authError.message || 'Failed to create auth user');
      }
      
      alert(`${avTeamMember.full_name} added as Club Member!\n\nTemporary password: ${tempPassword}\n\nPlease share this with them.`);
      onRefresh();
    } catch (err) {
      if (err.message?.includes('duplicate key') || err.message?.includes('unique constraint')) {
        alert('This email is already registered as a member.');
      } else {
        alert('Error adding member: ' + err.message);
      }
    }
  };

  // CSV Parsing
  const parseCSV = (text) => {
    const lines = text.split('\n');
    if (lines.length < 2) return [];
    
    // Parse header row - handle quoted fields
    const parseRow = (row) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    const headers = parseRow(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseRow(lines[i]);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
    
    return data;
  };

  // Map CSV columns to member fields
  const mapCSVToMember = (row) => {
    const firstName = row['First name'] || row['first_name'] || '';
    const lastName = row['Last name'] || row['last_name'] || '';
    const preferredName = row['Preferred Name'] || '';
    
    return {
      full_name: preferredName || `${firstName} ${lastName}`.trim(),
      email: row['Email Address'] || row['email'] || '',
      headline: row['What do you do'] || row['headline'] || '',
      member_role: row['What is your role in the family office or business'] || '',
      member_company: '',
      location: row['Primary Location'] || row['location'] || '',
      timezone: 'America/New_York',
      sector_interests: [],
      vc_experience_level: mapExperienceLevel(row['How would you describe your current understanding of venture capital?']),
      open_to_chats: false,
      is_manager: false,
      emoji: 'initials',
      linkedin_url: '',
      whatsapp: (row['Mobile Phone (include country/area code)'] || '').replace(/'/g, ''),
      personal_statement: row['What\'s a company, technology, or trend you find genuinely interesting right now—and why?'] || '',
      why_joined: row['Why are you interested in joining this club?'] || '',
    };
  };

  const mapExperienceLevel = (text) => {
    if (!text) return 'new';
    const lower = text.toLowerCase();
    if (lower.includes('actively investing') || lower.includes('experienced')) return 'experienced';
    if (lower.includes('some') || lower.includes('learning')) return 'some';
    return 'new';
  };

  // Handle file drop
  const handleFileDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer?.files[0] || e.target?.files[0];
    if (!file) return;
    
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      alert('Please upload a CSV or Excel file');
      return;
    }
    
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      const mapped = parsed.map(mapCSVToMember).filter(m => m.email);
      
      if (mapped.length === 0) {
        alert('No valid records found. Make sure the CSV has email addresses.');
        return;
      }
      
      setImportData(mapped);
      setShowImportModal(true);
    } catch (err) {
      console.error('Error parsing file:', err);
      alert('Error parsing file: ' + err.message);
    }
  };

  // Bulk import members
  const handleBulkImport = async () => {
    if (importData.length === 0) return;
    
    setLoading(true);
    setImportProgress({ current: 0, total: importData.length, done: false });
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < importData.length; i++) {
      try {
        const { error } = await supabase
          .from('members')
          .insert([importData[i]]);
        
        if (error) {
          console.error('Error importing:', importData[i].email, error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        errorCount++;
      }
      setImportProgress({ current: i + 1, total: importData.length, done: false });
    }
    
    setImportProgress({ current: importData.length, total: importData.length, done: true });
    setLoading(false);
    
    setTimeout(() => {
      setShowImportModal(false);
      setImportData([]);
      setImportProgress({ current: 0, total: 0, done: false });
      onRefresh();
      alert(`Imported ${successCount} members. ${errorCount > 0 ? `${errorCount} failed.` : ''}`);
    }, 1000);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setSaveSuccess(false);
    setFormData({
      full_name: '',
      email: '',
      temp_password: generateTempPassword(),
      headline: '',
      member_role: '',
      member_company: '',
      location: '',
      timezone: 'America/New_York',
      sector_interests: [],
      vc_experience_level: 'new',
      open_to_chats: false,
      is_manager: false,
      emoji: 'initials',
      linkedin_url: '',
      whatsapp: '',
      photo_url: '',
    });
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setSaveSuccess(false);
    setFormData({
      full_name: member.full_name || '',
      email: member.email || '',
      headline: member.headline || '',
      member_role: member.member_role || member.role_title || '',
      member_company: member.member_company || member.job || '',
      location: member.location || '',
      timezone: member.timezone || 'America/New_York',
      sector_interests: member.sector_interests || member.interests || [],
      personal_statement: member.personal_statement || '',
      vc_experience_level: member.vc_experience_level || 'new',
      open_to_chats: member.open_to_chats ?? false,
      is_manager: member.is_manager || false,
      emoji: member.emoji || 'initials',
      linkedin_url: member.linkedin_url || '',
      whatsapp: member.whatsapp || '',
      photo_url: member.photo_url || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.full_name.trim() || !formData.email.trim()) {
      alert('Name and Email are required');
      return;
    }
    
    setLoading(true);
    setSaveSuccess(false);
    try {
      const { temp_password, ...memberData } = formData;
      const saveData = memberData;
      
      if (editingMember) {
        // Updating existing member
        const { error } = await supabase
          .from('members')
          .update(saveData)
          .eq('id', editingMember.id);
        if (error) throw error;
      } else {
        // Creating new member
        // Step 1: Insert member record without auth
        const { data: newMember, error: insertError } = await supabase
          .from('members')
          .insert([saveData])
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // Step 2: Create Supabase Auth user via API
        try {
          const response = await fetch('/api/create-auth-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              password: temp_password,
              full_name: formData.full_name,
              member_id: newMember.id
            })
          });

          const data = await parseJsonSafe(response);
          if (!response.ok) {
            console.error('Auth creation error:', data?.error);
            throw new Error(data?.error || `Failed to create auth user (${response.status})`);
          }
        } catch (authError) {
          console.error('Auth setup error:', authError);
          // Rollback: delete the member record
          await supabase.from('members').delete().eq('id', newMember.id);
          throw new Error(`Failed to create auth account: ${authError.message}`);
        }
        
        // Show the temp password to admin
        alert(`Member created!\n\nTemporary password: ${temp_password}\n\nPlease share this with ${formData.full_name}`);
      }
      
      setSaveSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        onRefresh();
      }, 1000);
    } catch (err) {
      console.error('Error saving member:', err);
      alert('Error saving member: ' + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (member) => {
    if (!confirm(`Are you sure you want to delete ${member.full_name}? This cannot be undone.`)) return;
    
    try {
      // Delete all related records first to avoid foreign key constraints
      await Promise.all([
        supabase.from('session_rsvps').delete().eq('member_id', member.id),
        supabase.from('deal_interests').delete().eq('member_id', member.id),
        supabase.from('portfolio_investments').delete().eq('member_id', member.id),
      ]);
      
      // Delete the member record (this will cascade delete due to ON DELETE CASCADE if set up)
      const { error: deleteError } = await supabase
        .from('members')
        .delete()
        .eq('id', member.id);
      
      if (deleteError) throw deleteError;
      
      // Also delete auth user via API if they have one
      if (member.auth_user_id) {
        try {
          const response = await fetch('/api/delete-auth-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auth_user_id: member.auth_user_id })
          });
          if (!response.ok) {
            const data = await parseJsonSafe(response);
            console.error('Error deleting auth user:', data?.error);
          }
        } catch (authErr) {
          console.error('Error deleting auth user:', authErr);
          // Continue even if auth deletion fails
        }
      }
      
      onRefresh();
    } catch (err) {
      console.error('Error deleting member:', err);
      alert('Error deleting member: ' + err.message);
    }
  };

  const toggleSector = (sector) => {
    setFormData(prev => ({
      ...prev,
      sector_interests: prev.sector_interests.includes(sector)
        ? prev.sector_interests.filter(s => s !== sector)
        : [...prev.sector_interests, sector]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage Members</h2>
          <p className="text-sm text-gray-500">{members.length} total ({clubMembers.length} members, {members.filter(m => m.is_manager).length} AV team)</p>
        </div>
        <Button icon={UserPlus} onClick={openAddModal}>Add Member</Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          {[
            { id: 'members', label: 'Club Members' },
            { id: 'av-team', label: 'AV Team' },
            { id: 'all', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewFilter === tab.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
        </div>
        
        {/* Search Bar */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64"
        />
      </div>

      {/* Members Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role & Company</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
                {viewFilter === 'members' && (
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Interests</th>
                )}
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={viewFilter === 'members' ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                    No members found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar 
                          fullName={member.full_name}
                          photoUrl={member.photo_url}
                          emoji={member.emoji}
                          showEmoji={member.emoji && member.emoji !== '👤' && member.emoji !== 'initials' && member.emoji !== 'initial'}
                          backgroundColor={member.is_manager ? 'color-mix(in srgb, var(--accent-color, #C9A227) 35%, white)' : 'color-mix(in srgb, var(--primary-color, #1B4D5C) 35%, white)'}
                          size="md"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{member.full_name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {member.member_role || member.role_title || '-'}<br/>
                      <span className="text-gray-400">{member.member_company || member.job || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.location || '-'}</td>
                    {viewFilter === 'members' && (
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(member.sector_interests || member.interests || []).slice(0, 2).map((interest, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{interest}</span>
                          ))}
                          {(member.sector_interests || member.interests || []).length > 2 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">+{(member.sector_interests || member.interests).length - 2}</span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {member.is_manager ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Admin</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Member</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {viewFilter === 'av-team' ? (
                          // AV Team tab: no edit button
                          <>
                            <button 
                              onClick={() => { setResetMember(member); setShowResetModal(true); }} 
                              className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                            >
                              Reset PW
                            </button>
                            <button 
                              onClick={() => handleDelete(member)} 
                              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          // All tab and Members tab: show edit button only for members
                          <>
                            {!member.is_manager && (
                              <button 
                                onClick={() => openEditModal(member)} 
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                              >
                                Edit
                              </button>
                            )}
                            <button 
                              onClick={() => { setResetMember(member); setShowResetModal(true); }} 
                              className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                            >
                              Reset PW
                            </button>
                            <button 
                              onClick={() => handleDelete(member)} 
                              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AV Team from av_team table */}
      {avTeam && avTeam.length > 0 && (
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AV Team Members</h3>
              <p className="text-sm text-gray-500">Team members from the AV Team directory. Add them as Club Members to give them login access.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {avTeam.map((person) => {
              const matchingMember = members.find(m => m.email?.toLowerCase() === person.email?.toLowerCase());
              const isAlreadyMember = !!matchingMember;
              return (
                <div key={person.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar 
                      fullName={person.full_name}
                      photoUrl={person.photo_url}
                      emoji={person.emoji}
                      showEmoji={person.emoji && person.emoji !== '👤' && person.emoji !== 'initials' && person.emoji !== 'initial'}
                      backgroundColor="color-mix(in srgb, var(--accent-color, #C9A227) 35%, white)"
                      size="lg"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{person.full_name}</p>
                      <p className="text-sm text-gray-500">{person.club_role}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{person.email}</p>
                  {isAlreadyMember ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                      <CheckCircle size={14} /> Already a Club Member
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddAVTeamAsMember(person)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      + Add as Club Member
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingMember ? `Edit: ${editingMember.full_name}` : 'Add New Member'} size="lg">
        {saveSuccess ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-900">Saved Successfully!</p>
            <p className="text-gray-500">Changes have been saved to the database.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Info */}
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
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
                {!editingMember && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.temp_password}
                        onChange={(e) => setFormData({ ...formData, temp_password: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-amber-50"
                      />
                      <Button variant="outline" type="button" onClick={() => setFormData({ ...formData, temp_password: generateTempPassword() })}>
                        Generate
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Share this with the member. They'll be prompted to change it on first login.</p>
                  </div>
                )}
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

            {/* Role Info */}
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

            {/* Interests */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Sector Interests</h3>
              <div className="flex flex-wrap gap-2">
                {sectorOptions.map(sector => (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => toggleSector(sector)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      formData.sector_interests.includes(sector)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-500'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            {/* About */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">About</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Personal Statement</label>
                <textarea
                  value={formData.personal_statement}
                  onChange={(e) => setFormData({ ...formData, personal_statement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Share your background and what interests you about venture capital..."
                />
              </div>
            </div>

            {/* Settings */}
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

            {/* Contact */}
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

      {/* Reset Password Modal */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Reset Member Password">
        <div className="space-y-4">
          <p className="text-gray-600">
            This will generate a new temporary password for <strong>{resetMember?.full_name}</strong>.
          </p>
          <p className="text-gray-600">
            They will be required to change it on their next login.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              ⚠️ Make sure to copy and share the new password with the member.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowResetModal(false)}>Cancel</Button>
            <Button onClick={handleResetPassword}>Reset Password</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


export default AdminMembers;
