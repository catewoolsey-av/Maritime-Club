import React, { useState } from 'react';
import { Plus, Edit, Trash2, Clock, MapPin, Users, Video, ExternalLink, Calendar, TrendingUp, BookOpen, ClipboardList } from 'lucide-react';
import { supabase } from '../../supabase';
import { formatDate, formatTime } from '../../utils/formatters';
import { Button, Card, Badge, Modal } from '../../components/ui';

const AdminSessions = ({ sessions, deals, members = [], onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [creatingCalendarFor, setCreatingCalendarFor] = useState(null);
  const [calendarCreatedLocal, setCalendarCreatedLocal] = useState({});
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesSession, setNotesSession] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesData, setNotesData] = useState({ attendees: [], participants: [], meeting_notes: '' });
  const [formData, setFormData] = useState({
    type: 'seminar',
    title: '',
    description: '',
    date: '',
    time: '10:00',
    timezone: 'EST',
    duration: 60,
    zoom_link: '',
    host_name: '',
    host_title: '',
    host_linkedin: '',
    deal_id: null,
  });
  
  // Check if meeting is in the past
  const isPastMeeting = (date, time) => {
    if (!date) return false;
    const meetingDateTime = new Date(`${date}T${time || '00:00'}`);
    return meetingDateTime < new Date();
  };
  
  const createGoogleCalendarMeeting = async (session) => {
    if (session.google_calendar_link || calendarCreatedLocal[session.id]) return;

    setCreatingCalendarFor(session.id);
    const startDate = new Date(`${session.date}T${session.time || '12:00'}:00`);
    if (Number.isNaN(startDate.getTime())) {
      alert('Meeting date/time is invalid. Please update the meeting first.');
      setCreatingCalendarFor(null);
      return;
    }
    const durationMinutes = Number.isFinite(session.duration) ? session.duration : 60;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const formatGoogleDate = (date) =>
      date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const { data: membersData, error } = await supabase
      .from('members')
      .select('email');

    if (error) {
      alert('Unable to fetch member emails for guests.');
      setCreatingCalendarFor(null);
      return;
    }

    const guestEmails = (membersData || [])
      .map((m) => m.email?.trim())
      .filter(Boolean);

    const title = encodeURIComponent(session.title || 'Meeting');
    const details = encodeURIComponent(
      (session.description || '') + (session.zoom_link ? `\n\nJoin: ${session.zoom_link}` : '')
    );
    const location = encodeURIComponent(session.zoom_link || 'Online');
    const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;
    const addGuests = encodeURIComponent(guestEmails.join(','));
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&add=${addGuests}`;

    const { error: updateError } = await supabase
      .from('sessions')
      .update({ google_calendar_link: url })
      .eq('id', session.id);

    if (updateError) {
      alert('Unable to save calendar status for this meeting.');
      setCreatingCalendarFor(null);
      return;
    }

    setCalendarCreatedLocal((prev) => ({ ...prev, [session.id]: true }));
    if (onRefresh) onRefresh();
    window.open(url, '_blank', 'noopener,noreferrer');
    setCreatingCalendarFor(null);
  };

  const handleCalendarReset = async (session) => {
    if (!confirm('Re-set Google Calendar meeting status for this session?')) return;

    const { error } = await supabase
      .from('sessions')
      .update({ google_calendar_link: null })
      .eq('id', session.id);

    if (error) {
      alert('Unable to re-set Google Calendar meeting status.');
      return;
    }

    setCalendarCreatedLocal((prev) => {
      const next = { ...prev };
      delete next[session.id];
      return next;
    });
    if (onRefresh) onRefresh();
  };
  
  // Split sessions into upcoming and past
  const upcomingSessions = sessions.filter(s => !isPastMeeting(s.date, s.time));
  const pastSessions = sessions.filter(s => isPastMeeting(s.date, s.time));
  
  const openAddModal = () => {
    setEditingSession(null);
    setSaveSuccess(false);
    setFormData({
      type: 'seminar',
      title: '',
      description: '',
      date: '',
      time: '10:00',
      timezone: 'EST',
      duration: 60,
      zoom_link: '',
      host_name: '',
      host_title: '',
      host_linkedin: '',
      deal_id: null,
    });
    setShowModal(true);
  };
  
  const openEditModal = (session) => {
    setEditingSession(session);
    setSaveSuccess(false);
    setFormData({
      type: session.type || 'seminar',
      title: session.title || '',
      description: session.description || '',
      date: session.date || '',
      time: session.time || '10:00',
      timezone: session.timezone || 'EST',
      duration: session.duration || 60,
      zoom_link: session.zoom_link || '',
      host_name: session.host_name || '',
      host_title: session.host_title || '',
      host_linkedin: session.host_linkedin || '',
      deal_id: session.deal_id || null,
    });
    setShowModal(true);
  };
  
  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Meeting title is required');
      return;
    }
    
    setLoading(true);
    setSaveSuccess(false);
    try {
      if (editingSession) {
        const { error } = await supabase
          .from('sessions')
          .update(formData)
          .eq('id', editingSession.id);
        if (error) throw error;
        setSaveSuccess(true);
        setTimeout(() => {
          setShowModal(false);
          onRefresh();
        }, 1000);
      } else {
        const { error } = await supabase
          .from('sessions')
          .insert([formData]);
        if (error) throw error;
        setSaveSuccess(true);
        setTimeout(() => {
          setShowModal(false);
          onRefresh();
        }, 1000);
      }
    } catch (err) {
      console.error('Error saving meeting:', err);
      alert('Error saving meeting: ' + err.message);
    }
    setLoading(false);
  };
  
  const handleDelete = async (session) => {
    if (!confirm(`Are you sure you want to delete "${session.title}"? This cannot be undone.`)) return;
    
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', session.id);
      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Error deleting meeting:', err);
      alert('Error deleting meeting');
    }
  };
  
  const openNotesModal = (session) => {
    setNotesSession(session);
    setNotesData({
      attendees: session.attendees || [],
      participants: session.participants || [],
      meeting_notes: session.meeting_notes || '',
    });
    setShowNotesModal(true);
  };

  const toggleMemberInList = (list, memberId) => {
    return list.includes(memberId)
      ? list.filter(id => id !== memberId)
      : [...list, memberId];
  };

  const handleSaveNotes = async () => {
    if (!notesSession) return;
    setNotesLoading(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          attendees: notesData.attendees,
          participants: notesData.participants,
          meeting_notes: notesData.meeting_notes,
        })
        .eq('id', notesSession.id);
      if (error) throw error;
      setShowNotesModal(false);
      onRefresh();
    } catch (err) {
      console.error('Error saving meeting notes:', err);
      alert('Error saving meeting notes: ' + err.message);
    }
    setNotesLoading(false);
  };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member?.full_name || 'Unknown Member';
  };

  // Filter to club members only (exclude AV Team / managers) for meeting notes
  const clubMembers = members.filter(m => !m.is_manager);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Meetings</h2>
          <p className="text-sm text-gray-500">{upcomingSessions.length} upcoming, {pastSessions.length} past</p>
        </div>
        <Button icon={Plus} onClick={openAddModal}>Create Meeting</Button>
      </div>
      
      {/* Upcoming Meetings */}
      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-3">Upcoming Meetings</h3>
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Meeting</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Host</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Calendar</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {upcomingSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No upcoming meetings</td>
                  </tr>
                ) : (
                  upcomingSessions.map((session) => {
                    return (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ 
                                backgroundColor: session.type === 'seminar' ? '#E8D59A' : '#D1FAE5',
                                color: session.type === 'seminar' ? '#1B4D5C' : '#059669'
                              }}
                            >
                              {session.type === 'seminar' ? <BookOpen size={18} /> : <TrendingUp size={18} />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{session.title}</p>
                              <p className="text-sm text-gray-500">{session.type === 'seminar' ? 'Seminar' : 'Live Deal'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(session.date)}<br/>
                          <span className="text-gray-400">{formatTime(session.time, session.timezone)}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {session.host_name || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="success">Upcoming</Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => createGoogleCalendarMeeting(session)}
                              disabled={creatingCalendarFor === session.id || !!session.google_calendar_link || !!calendarCreatedLocal[session.id]}
                              className={(session.google_calendar_link || calendarCreatedLocal[session.id]) ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              {creatingCalendarFor === session.id
                                ? 'Creating...'
                                : (session.google_calendar_link || calendarCreatedLocal[session.id])
                                  ? 'Google Calendar Meeting Created'
                                  : 'Create Google Calendar Meeting'}
                            </Button>
                            {(session.google_calendar_link || calendarCreatedLocal[session.id]) && (
                              <button
                                type="button"
                                onClick={() => handleCalendarReset(session)}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700 underline"
                              >
                                Re-set
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openEditModal(session)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(session)} className="p-2 hover:bg-red-100 rounded-lg text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Past Meetings */}
      {pastSessions.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-3">Past Events</h3>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Meeting</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Host</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Notes</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pastSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 opacity-75">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: session.type === 'seminar' ? '#E8D59A' : '#D1FAE5',
                              color: session.type === 'seminar' ? '#1B4D5C' : '#059669'
                            }}
                          >
                            {session.type === 'seminar' ? <BookOpen size={18} /> : <TrendingUp size={18} />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{session.title}</p>
                            <p className="text-sm text-gray-500">{session.type === 'seminar' ? 'Seminar' : 'Live Deal'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(session.date)}<br/>
                        <span className="text-gray-400">{formatTime(session.time, session.timezone)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {session.host_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge>Completed</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openNotesModal(session)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700"
                        >
                          <ClipboardList size={14} />
                          {(session.attendees?.length || session.participants?.length) ? 'View Notes' : 'Add Notes'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEditModal(session)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(session)} className="p-2 hover:bg-red-100 rounded-lg text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
      
      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSession ? 'Edit Meeting' : 'Create Meeting'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'seminar' })}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  formData.type === 'seminar' ? 'text-white' : 'bg-gray-100 text-gray-600'
                }`}
                style={formData.type === 'seminar' ? { backgroundColor: 'var(--primary-color, #1B4D5C)' } : {}}
              >
                Seminar
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'deal' })}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  formData.type === 'deal' ? 'text-white' : 'bg-gray-100 text-gray-600'
                }`}
                style={formData.type === 'deal' ? { backgroundColor: 'var(--primary-color, #1B4D5C)' } : {}}
              >
                Live Deal
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
              placeholder="Venture 101: How VCs Think About Deals"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
              rows={3}
              placeholder="Meeting description..."
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zoom Link</label>
            <input
              type="url"
              value={formData.zoom_link}
              onChange={(e) => setFormData({ ...formData, zoom_link: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
              placeholder="https://zoom.us/j/..."
            />
          </div>

          {formData.type === 'seminar' && (
            <>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-3">Guest Host</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Host Name</label>
                    <input
                      type="text"
                      value={formData.host_name}
                      onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                      placeholder="Drew Johnson"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Host Title</label>
                    <input
                      type="text"
                      value={formData.host_title}
                      onChange={(e) => setFormData({ ...formData, host_title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                      placeholder="Partner, Alumni Ventures"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Host LinkedIn</label>
                  <input
                    type="url"
                    value={formData.host_linkedin}
                    onChange={(e) => setFormData({ ...formData, host_linkedin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
            </>
          )}
          
          {formData.type === 'deal' && deals.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to Deal</label>
              <select
                value={formData.deal_id || ''}
                onChange={(e) => setFormData({ ...formData, deal_id: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
              >
                <option value="">Select a deal...</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>{deal.company_name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !formData.title || !formData.date}>
              {loading ? 'Saving...' : (editingSession ? 'Update Meeting' : 'Create Meeting')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Meeting Notes Modal */}
      <Modal isOpen={showNotesModal} onClose={() => setShowNotesModal(false)} title={`Meeting Notes: ${notesSession?.title || ''}`} size="lg">
        <div className="space-y-6">
          {/* Attended */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Users size={16} />
                Members Who Attended
                <span className="text-sm font-normal text-gray-500">({notesData.attendees.length} selected)</span>
              </h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNotesData(prev => ({ ...prev, attendees: clubMembers.map(m => m.id) }))}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setNotesData(prev => ({ ...prev, attendees: [] }))}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {clubMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={notesData.attendees.includes(member.id)}
                    onChange={() => setNotesData(prev => ({
                      ...prev,
                      attendees: toggleMemberInList(prev.attendees, member.id),
                    }))}
                    className="rounded"
                    style={{ accentColor: '#1B4D5C' }}
                  />
                  <span className="text-sm text-gray-900">{member.full_name}</span>
                  {member.member_company && (
                    <span className="text-xs text-gray-400">{member.member_company}</span>
                  )}
                </label>
              ))}
              {clubMembers.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-500">No members found</p>
              )}
            </div>
          </div>

          {/* Participated / Spoke */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Users size={16} />
                Members Who Actively Participated / Spoke
                <span className="text-sm font-normal text-gray-500">({notesData.participants.length} selected)</span>
              </h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNotesData(prev => ({ ...prev, participants: clubMembers.map(m => m.id) }))}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setNotesData(prev => ({ ...prev, participants: [] }))}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {clubMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={notesData.participants.includes(member.id)}
                    onChange={() => setNotesData(prev => ({
                      ...prev,
                      participants: toggleMemberInList(prev.participants, member.id),
                    }))}
                    className="rounded"
                    style={{ accentColor: '#059669' }}
                  />
                  <span className="text-sm text-gray-900">{member.full_name}</span>
                  {member.member_company && (
                    <span className="text-xs text-gray-400">{member.member_company}</span>
                  )}
                </label>
              ))}
              {clubMembers.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-500">No members found</p>
              )}
            </div>
          </div>

          {/* Free text notes */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Meeting Notes</h4>
            <textarea
              value={notesData.meeting_notes}
              onChange={(e) => setNotesData(prev => ({ ...prev, meeting_notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
              rows={4}
              placeholder="Key takeaways, action items, general notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowNotesModal(false)}>Cancel</Button>
            <Button onClick={handleSaveNotes} disabled={notesLoading}>
              {notesLoading ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};


export default AdminSessions;
