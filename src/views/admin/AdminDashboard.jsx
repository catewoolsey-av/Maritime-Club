import React, { useState } from 'react';
import { Users, Calendar, TrendingUp, Bell, Target, BookOpen, Briefcase, Download, Star, Save, CheckCircle, Settings } from 'lucide-react';
import { supabase } from '../../supabase';
import { formatDate, parseDateValue } from '../../utils/formatters';
import { Button, Card, Badge, Modal, Avatar } from '../../components/ui';
import { PROFILE_OPTIONS } from '../../constants/profileOptions';

const AdminDashboard = ({ members, sessions, deals, announcements, avTeam, onNavigate, onRefresh }) => {
  const [showAVTeamModal, setShowAVTeamModal] = useState(false);
  const [avFormLoading, setAvFormLoading] = useState(false);
  const [avSaveSuccess, setAvSaveSuccess] = useState(false);
  
  const clubRoleOptions = ['Club President', 'Club Operations', 'Mentor', 'Contributor'];
  const emojiOptions = ['initials', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🤖', '💼', '🐱', '🐶'];
  
  const [avFormData, setAvFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    title: '',
    company: 'Alumni Ventures',
    club_role: 'Mentor',
    bio: '',
    photo_url: '',
    emoji: 'initials',
    fun_fact: '',
    linkedin_url: '',
    phone: '',
    location: '',
    timezone: 'America/New_York',
  });

  const resetAvForm = () => {
    setAvFormData({
      full_name: '',
      email: '',
      password: '',
      title: '',
      company: 'Alumni Ventures',
      club_role: 'Mentor',
      bio: '',
      photo_url: '',
      emoji: 'initials',
      fun_fact: '',
      linkedin_url: '',
      phone: '',
      location: '',
      timezone: 'America/New_York',
    });
    setAvSaveSuccess(false);
  };

  const handleSaveAVMember = async () => {
    if (!avFormData.full_name.trim() || !avFormData.email.trim() || !avFormData.password) {
      alert('Name, Email, and Password are required');
      return;
    }
    
    setAvFormLoading(true);
    try {
      const { error } = await supabase
        .from('av_team')
        .insert([{
          full_name: avFormData.full_name,
          email: avFormData.email,
          password_hash: avFormData.password,
          title: avFormData.title,
          company: avFormData.company,
          club_role: avFormData.club_role,
          bio: avFormData.bio,
          photo_url: avFormData.photo_url,
          emoji: avFormData.emoji,
          fun_fact: avFormData.fun_fact,
          linkedin_url: avFormData.linkedin_url,
          phone: avFormData.phone,
          location: avFormData.location,
          timezone: avFormData.timezone,
        }]);
      
      if (error) throw error;
      setAvSaveSuccess(true);
      setTimeout(() => {
        setShowAVTeamModal(false);
        resetAvForm();
        onRefresh();
      }, 1000);
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
    setAvFormLoading(false);
  };

  // Get upcoming meetings (max 3)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingMeetings = sessions
    .filter(s => {
      if (!s.date) return false;
      const sessionDate = parseDateValue(s.date);
      if (!sessionDate || Number.isNaN(sessionDate.getTime())) return false;
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate >= today;
    })
    .sort((a, b) => parseDateValue(a.date) - parseDateValue(b.date))
    .slice(0, 3);
  
  // Filter out av_team members from members list
  const avTeamEmails = new Set(avTeam?.map(av => av.email) || []);
  const regularMembers = members.filter(m => !avTeamEmails.has(m.email));
  
  // Calculate recent members count based on upcoming meetings count
  const recentMembersCount = upcomingMeetings.length;
  
  // Get active deals - only those with 'active' status or badge
  const activeDeals = deals.filter(d => 
    d.status === 'active' || 
    (d.badge && d.badge.toLowerCase() === 'active')
  );

  const stats = [
    { label: 'Total Members', value: regularMembers.length, icon: Users },
    { label: 'AV Team Members', value: avTeam?.length || 0, icon: Target },
    { label: 'Meetings', value: sessions.length, icon: Calendar },
    { label: 'Active Deals', value: activeDeals.length, icon: TrendingUp },
  ];
  
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color, #C9A227) 20%, white)' }}>
                <stat.icon size={24} style={{ color: 'var(--primary-color, #1B4D5C)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Quick Actions */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Button variant="outline" icon={Users} onClick={() => onNavigate('admin-members')}>
            Add Member
          </Button>
          <Button variant="outline" icon={Star} onClick={() => onNavigate('admin-leaders')}>
            Add AV Team Member
          </Button>
          <Button variant="outline" icon={Calendar} onClick={() => onNavigate('admin-sessions')}>
            Create Meeting
          </Button>
          <Button variant="outline" icon={BookOpen} onClick={() => onNavigate('admin-content')}>
            Manage Content
          </Button>
          <Button variant="outline" icon={TrendingUp} onClick={() => onNavigate('admin-deals')}>
            Deals
          </Button>
          <Button variant="outline" icon={Briefcase} onClick={() => onNavigate('admin-portfolios')}>
            Manage Portfolios
          </Button>
          <Button variant="outline" icon={Bell} onClick={() => onNavigate('admin-announcements')}>
            Announcements
          </Button>
        </div>
      </Card>
      
      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Recent Members</h3>
          <div className="space-y-3">
            {regularMembers.slice(0, recentMembersCount).map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar 
                  fullName={member.full_name}
                  photoUrl={member.photo_url}
                  emoji={member.emoji}
                  showEmoji={member.emoji && member.emoji !== '👤' && member.emoji !== 'initials'}
                  backgroundColor="color-mix(in srgb, var(--primary-color, #1B4D5C) 35%, white)"
                  size="sm"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                  <p className="text-xs text-gray-500">{member.job}</p>
                </div>
                {member.is_manager && <Badge variant="primary">Admin</Badge>}
              </div>
            ))}
          </div>
        </Card>
        
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Upcoming Meetings</h3>
          <div className="space-y-3">
            {upcomingMeetings.map((session) => (
              <div key={session.id} className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ 
                    backgroundColor: session.type === 'seminar' ? '#E8D59A' : '#D1FAE5',
                    color: session.type === 'seminar' ? '#1B4D5C' : '#059669'
                  }}
                >
                  {session.type === 'seminar' ? <BookOpen size={18} /> : <TrendingUp size={18} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{session.title}</p>
                  <p className="text-xs text-gray-500">{formatDate(session.date)} • {session.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      <Modal isOpen={showAVTeamModal} onClose={() => !avFormLoading && setShowAVTeamModal(false)} title="Add AV Team Member" size="lg">
        {avSaveSuccess ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-900">AV Team Member Added!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Emoji Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setAvFormData({ ...avFormData, emoji: e })}
                    className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                      avFormData.emoji === e ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={avFormData.full_name}
                  onChange={(e) => setAvFormData({ ...avFormData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Mike Collins"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={avFormData.email}
                  onChange={(e) => setAvFormData({ ...avFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="mike@av.vc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={avFormData.password}
                  onChange={(e) => setAvFormData({ ...avFormData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Set initial password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Club Role *</label>
                <select
                  value={avFormData.club_role}
                  onChange={(e) => setAvFormData({ ...avFormData, club_role: e.target.value })}
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
                  value={avFormData.title}
                  onChange={(e) => setAvFormData({ ...avFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="CEO"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={avFormData.company}
                  onChange={(e) => setAvFormData({ ...avFormData, company: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Alumni Ventures"
                />
              </div>
            </div>

            {/* Personal Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={avFormData.bio}
                onChange={(e) => setAvFormData({ ...avFormData, bio: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Brief bio about this team member..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fun Fact</label>
                <input
                  type="text"
                  value={avFormData.fun_fact}
                  onChange={(e) => setAvFormData({ ...avFormData, fun_fact: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Something interesting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                <input
                  type="url"
                  value={avFormData.photo_url}
                  onChange={(e) => setAvFormData({ ...avFormData, photo_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={avFormData.linkedin_url}
                  onChange={(e) => setAvFormData({ ...avFormData, linkedin_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={avFormData.phone}
                  onChange={(e) => setAvFormData({ ...avFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={avFormData.location}
                  onChange={(e) => setAvFormData({ ...avFormData, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="New York, NY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={avFormData.timezone}
                  onChange={(e) => setAvFormData({ ...avFormData, timezone: e.target.value })}
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
              <Button variant="outline" onClick={() => setShowAVTeamModal(false)}>Cancel</Button>
              <Button onClick={handleSaveAVMember} disabled={avFormLoading} icon={avFormLoading ? null : Save}>
                {avFormLoading ? 'Saving...' : 'Add Member'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};


export default AdminDashboard;
