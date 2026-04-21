import React from 'react';
import { Mail, Phone, Linkedin, MapPin, Clock, ChevronRight, User } from 'lucide-react';
import { Button, Card, Badge, Avatar } from '../../components/ui';
import { DealInterestCard } from '../../contexts/MessagingContext';

const MemberProfileView = ({ member, currentUser, isOwnProfile, onBack, backLabel = 'Back to Members', onRefresh, isAdmin }) => {
  if (!member) {
    return (
      <Card>
        <div className="text-center py-8">
          <User size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Member not found</p>
          <Button variant="outline" onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ChevronRight size={20} className="rotate-180" />
        {backLabel}
      </button>

      {/* Profile Header */}
      <Card>
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Photo/Avatar */}
          <div className="relative">
            {member.photo_url ? (
              <div className="w-32 h-32 rounded-full overflow-hidden">
                <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <Avatar 
                fullName={member.full_name}
                emoji={member.emoji}
                showEmoji={member.emoji && member.emoji !== '👤' && member.emoji !== 'initials'}
                backgroundColor={(member.is_manager || member.email?.toLowerCase().endsWith('@av.vc') || member.club_role) ? 'var(--accent-color, #C9A227)' : '#E5E7EB'}
                size="2xl"
              />
            )}
            {(member.is_manager || member.club_role) && (
              <div className="absolute -bottom-1 -right-1 px-2 py-1 text-white text-xs rounded-full font-medium" style={{ backgroundColor: 'var(--accent-color, #C9A227)' }}>
                AV Team
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{member.full_name}</h1>
            {(member.is_manager || member.club_role) ? (
              member.club_role && <p className="text-gray-600 text-lg mt-1">{member.club_role}</p>
            ) : (
              member.headline && <p className="text-gray-600 text-lg mt-1">{member.headline}</p>
            )}
            {(member.member_role || member.title || member.member_company || member.company) && (
              <p className="text-gray-500 mt-1">
                {member.member_role || member.title} {(member.member_company || member.company) && `@ ${member.member_company || member.company}`}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
              {member.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {member.location}
                </span>
              )}
              {member.timezone && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {member.timezone}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Deal Interest Card - Only for regular members */}
      {!member.is_manager && !member.club_role && <DealInterestCard member={member} />}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* About Section */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">About</h3>
            {((member.is_manager || member.club_role) ? (member.bio || member.personal_statement) : member.personal_statement) ? (
              <p className="text-gray-600 whitespace-pre-wrap">
                {(member.is_manager || member.club_role) ? (member.bio || member.personal_statement) : member.personal_statement}
              </p>
            ) : (
              <p className="text-gray-400 italic">{(member.is_manager || member.club_role) ? 'No bio provided.' : 'No personal statement provided.'}</p>
            )}
          </Card>

          {/* Learning Profile - Only for regular members */}
          {!member.is_manager && !member.club_role && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Learning Profile</h3>
              {member.vc_experience_level ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">VC Experience:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    member.vc_experience_level === 'experienced' ? 'bg-green-100 text-green-700' :
                    member.vc_experience_level === 'some' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {member.vc_experience_level === 'new' ? 'New to VC' :
                     member.vc_experience_level === 'some' ? 'Some Experience' :
                     member.vc_experience_level === 'experienced' ? 'Experienced' : 'Not set'}
                  </span>
                </div>
              ) : (
                <p className="text-gray-400 italic">VC experience level not set.</p>
              )}
            </Card>
          )}

          {/* Fun Fact - Only for AV team */}
          {(member.is_manager || member.club_role) && member.fun_fact && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Fun Fact</h3>
              <p className="text-gray-600">{member.fun_fact}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Connect Card */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Connect</h3>
            <div className="space-y-2">
              {member.linkedin_url && (
                <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors">
                  <Linkedin size={18} className="text-sky-600" />
                  <span className="text-sm font-medium text-sky-700">LinkedIn</span>
                </a>
              )}

              {member.email && (
                <a href={`mailto:${member.email}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Mail size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Email</span>
                </a>
              )}

              {(member.phone || member.whatsapp) && (
                <a href={`https://wa.me/${(member.phone || member.whatsapp).replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <Phone size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700">Phone</span>
                </a>
              )}

              {!member.linkedin_url && !member.email && !member.phone && !member.whatsapp && (
                <p className="text-gray-400 italic text-sm">No contact information provided.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberProfileView;
