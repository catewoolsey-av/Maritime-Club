import React, { useState } from 'react';
import { Plus, Edit, Trash2, Bell, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import { formatDate } from '../../utils/formatters';
import { Button, Card, Badge, Modal } from '../../components/ui';
import { sendAnnouncementEmail, isEmailTestMode, CATE_EMAIL } from '../../utils/emailNotifications';

const AdminAnnouncements = ({ announcements, onRefresh, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_pinned: false,
  });

  // Email confirmation state
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailTestMode, setEmailTestMode] = useState(true);
  const [pendingAnnouncementData, setPendingAnnouncementData] = useState(null);

  const openAddModal = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      is_pinned: false,
    });
    setShowModal(true);
  };

  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title || '',
      content: announcement.content || '',
      is_pinned: announcement.is_pinned || false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Check pinned limit (max 3)
      if (formData.is_pinned && !editingAnnouncement) {
        const pinnedCount = announcements.filter(a => a.is_pinned).length;
        if (pinnedCount >= 3) {
          alert('Maximum 3 announcements can be pinned at once. Please unpin another announcement first.');
          setLoading(false);
          return;
        }
      }

      // When editing, check if we're pinning and already at limit
      if (formData.is_pinned && editingAnnouncement && !editingAnnouncement.is_pinned) {
        const pinnedCount = announcements.filter(a => a.is_pinned).length;
        if (pinnedCount >= 3) {
          alert('Maximum 3 announcements can be pinned at once. Please unpin another announcement first.');
          setLoading(false);
          return;
        }
      }

      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update(formData)
          .eq('id', editingAnnouncement.id);
        if (error) throw error;
      } else {
        const saveData = {
          ...formData,
          author_id: currentUser?.id,
          author: currentUser?.full_name || 'Admin',
        };
        const { error } = await supabase
          .from('announcements')
          .insert([saveData]);
        if (error) throw error;

        // Store data for potential email and show confirmation
        setPendingAnnouncementData({
          title: formData.title,
          content: formData.content,
          author: currentUser?.full_name || 'Admin',
        });

        // Check current email mode before showing confirmation
        const testMode = await isEmailTestMode();
        setEmailTestMode(testMode);
        setShowModal(false);
        setShowEmailConfirm(true);
        setLoading(false);
        return; // Don't refresh yet — wait for email decision
      }
      setShowModal(false);
      onRefresh();
    } catch (err) {
      console.error('Error saving announcement:', err);
      alert('Error saving announcement: ' + err.message);
    }
    setLoading(false);
  };

  const handleSendEmail = async () => {
    if (!pendingAnnouncementData) return;
    setEmailSending(true);
    try {
      await sendAnnouncementEmail(pendingAnnouncementData);
    } catch (err) {
      console.error('Failed to send announcement email:', err);
    }
    setEmailSending(false);
    setShowEmailConfirm(false);
    setPendingAnnouncementData(null);
    onRefresh();
  };

  const handleSkipEmail = () => {
    setShowEmailConfirm(false);
    setPendingAnnouncementData(null);
    onRefresh();
  };

  const handleDelete = async (announcement) => {
    if (!confirm(`Are you sure you want to delete "${announcement.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcement.id);
      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert('Error deleting announcement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
          <p className="text-sm text-gray-500">{announcements.length} announcements</p>
        </div>
        <Button icon={Plus} onClick={openAddModal}>Post Announcement</Button>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                  {announcement.is_pinned && <Badge variant="primary">Pinned</Badge>}
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{announcement.content}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {announcement.author} · {new Date(announcement.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditModal(announcement)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(announcement)} className="p-2 hover:bg-red-100 rounded-lg text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAnnouncement ? 'Edit Announcement' : 'Post Announcement'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
              placeholder="Welcome to Cohort 1!"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
              rows={4}
              placeholder="Your announcement message..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_pinned"
              checked={formData.is_pinned}
              onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
              className="rounded"
              style={{ accentColor: '#1B4D5C' }}
            />
            <label htmlFor="is_pinned" className="text-sm text-gray-700">Pin this announcement</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !formData.title || !formData.content}>
              {loading ? 'Saving...' : (editingAnnouncement ? 'Update' : 'Post Announcement')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Email Confirmation Modal */}
      <Modal isOpen={showEmailConfirm} onClose={handleSkipEmail} title="Send Email Notification?" size="md">
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-1">Announcement posted successfully</p>
            <p className="text-sm text-gray-600">"{pendingAnnouncementData?.title}"</p>
          </div>

          <div className={`p-4 rounded-lg border ${emailTestMode ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className={`mt-0.5 flex-shrink-0 ${emailTestMode ? 'text-amber-600' : 'text-red-600'}`} />
              <div>
                <p className={`text-sm font-semibold ${emailTestMode ? 'text-amber-900' : 'text-red-900'}`}>
                  {emailTestMode ? 'Test Mode — Email will only go to:' : 'LIVE MODE — Email will go to:'}
                </p>
                <p className={`text-sm mt-1 ${emailTestMode ? 'text-amber-700' : 'text-red-700'}`}>
                  {emailTestMode
                    ? CATE_EMAIL
                    : 'All club members, club leaders, and ' + CATE_EMAIL}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleSkipEmail}>
              Don't Send Email
            </Button>
            <Button onClick={handleSendEmail} disabled={emailSending} icon={Mail}>
              {emailSending ? 'Sending...' : (emailTestMode ? 'Send Test Email' : 'Send to All')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


export default AdminAnnouncements;
