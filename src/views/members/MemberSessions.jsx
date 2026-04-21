import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Video, ExternalLink, CheckCircle, Play, TrendingUp, BookOpen } from 'lucide-react';
import { formatDate, formatTime, getTimeUntil } from '../../utils/formatters';
import { Button, Card, Badge, Modal } from '../../components/ui';

const MemberSessions = ({ sessions, currentUser, onRefresh }) => {
  // Check if meeting is in the past
  const isPastMeeting = (date, time) => {
    if (!date) return false;
    const meetingDateTime = new Date(`${date}T${time || '00:00'}`);
    return meetingDateTime < new Date();
  };
  
  const upcomingSessions = sessions.filter(s => !isPastMeeting(s.date, s.time));
  const pastSessions = sessions.filter(s => isPastMeeting(s.date, s.time));
  const [expandedDescription, setExpandedDescription] = useState(null);
  const [expandedTitle, setExpandedTitle] = useState('');

  const isDescriptionTooLong = (description) => {
    if (!description) return false;
    const lineCount = description.split(/\r\n|\r|\n/).length;
    return lineCount > 6 || description.length > 500;
  };
  
  return (
    <div className="space-y-6">
      {/* Upcoming */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Meetings</h2>
        {upcomingSessions.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No upcoming meetings scheduled</p>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingSessions.map((session) => {
              return (
              <Card key={session.id} className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="default">
                    {session.type === 'seminar' ? 'Seminar' : 'Live Deal'}
                  </Badge>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                    {getTimeUntil(session.date)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{session.title}</h3>
                <div className="flex-1 mb-4">
                  {session.description ? (
                    <>
                      <div className={`text-sm text-gray-600 whitespace-pre-wrap break-words ${isDescriptionTooLong(session.description) ? 'max-h-28 overflow-hidden' : ''}`}>
                        {session.description}
                      </div>
                      {isDescriptionTooLong(session.description) && (
                        <button
                          type="button"
                          className="mt-2 text-xs font-semibold"
                          style={{ color: 'var(--primary-color, #1B4D5C)' }}
                          onClick={() => {
                            setExpandedTitle(session.title || 'Meeting Description');
                            setExpandedDescription(session.description);
                          }}
                        >
                          Expand
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">No description provided yet</p>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> {formatDate(session.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {formatTime(session.time, session.timezone)}
                  </span>
                </div>

                {session.google_calendar_link && (
                  <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-xs text-gray-600">
                      You should receive a Google invite in your email inbox for this meeting. Please accept or decline there.
                    </p>
                  </div>
                )}
                
                {/* Guest Host Section - Always rendered for consistent spacing */}
                <div className="mb-4 pb-4 border-b border-gray-100">
                  {session.host_name ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: '#1B4D5C' }}>
                        {session.host_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{session.host_name}</p>
                        <p className="text-xs text-gray-500">{session.host_title}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img src="/av-logo.png" alt="AV" className="w-8 h-8 object-contain" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Live Deal</p>
                        <p className="text-xs text-gray-500">Alumni Ventures</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {session.zoom_link && (
                    <a href={session.zoom_link} target="_blank" rel="noopener noreferrer">
                      <Button variant="primary" icon={Video}>Join Meeting</Button>
                    </a>
                  )}
                </div>
              </Card>
            )})}
          </div>
        )}
      </div>
      
      {/* Past Meetings */}
      {pastSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Meetings</h2>
          <div className="space-y-3">
            {pastSessions.map((session) => (
              <Card key={session.id} className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: session.type === 'seminar' ? '#F3F4F6' : '#D1FAE5' }}
                >
                  {session.type === 'seminar' ? <BookOpen size={20} className="text-gray-600" /> : <TrendingUp size={20} className="text-green-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">{session.title}</h4>
                  <p className="text-sm text-gray-500">{formatDate(session.date)} · {session.host_name || 'Alumni Ventures'}</p>
                </div>
                {session.recording_url ? (
                  <a href={session.recording_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" icon={Play}>Watch</Button>
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">No recording</span>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={!!expandedDescription}
        onClose={() => setExpandedDescription(null)}
        title={expandedTitle || 'Meeting Description'}
        size="lg"
      >
        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {expandedDescription}
        </div>
      </Modal>
    </div>
  );
};

// Member Content Library

export default MemberSessions;
