import React from 'react';
import { Bell, Pin } from 'lucide-react';
import { Card, Badge } from '../../components/ui';

const MemberAnnouncements = ({ announcements }) => {
  // Sort announcements: pinned first, then by date
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Separate pinned and regular announcements
  const pinnedAnnouncements = sortedAnnouncements.filter(a => a.is_pinned);
  const regularAnnouncements = sortedAnnouncements.filter(a => !a.is_pinned);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
        <p className="text-sm text-gray-500">Stay updated with the latest club news</p>
      </div>

      {/* Pinned Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Pin size={14} />
            Pinned
          </h3>
          {pinnedAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="border-l-4 border-amber-400 bg-amber-50/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-color, #C9A227)' }}>
                  <Pin size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                    <Badge variant="warning">Pinned</Badge>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">{announcement.content}</p>
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                    <span className="font-medium">{announcement.author}</span>
                    <span>•</span>
                    <span>{new Date(announcement.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Regular Announcements */}
      {regularAnnouncements.length > 0 && (
        <div className="space-y-3">
          {pinnedAnnouncements.length > 0 && (
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              All Announcements
            </h3>
          )}
          {regularAnnouncements.map((announcement) => (
            <Card key={announcement.id}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F4F6' }}>
                  <Bell size={18} style={{ color: '#1B4D5C' }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{announcement.title}</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{announcement.content}</p>
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                    <span className="font-medium">{announcement.author}</span>
                    <span>•</span>
                    <span>{new Date(announcement.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {announcements.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#E8F4F6' }}>
              <Bell size={32} style={{ color: '#1B4D5C' }} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Announcements Yet</h3>
            <p className="text-gray-500">Check back later for updates from the club</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MemberAnnouncements;
