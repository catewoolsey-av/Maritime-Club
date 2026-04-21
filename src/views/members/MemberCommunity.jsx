import React, { useState } from 'react';
import { Users, Mail, Linkedin, MapPin, TrendingUp, Clock, ChevronRight, Phone, Settings } from 'lucide-react';
import { Card, Button, Badge, Modal, Avatar } from '../../components/ui';

const MemberCommunity = ({ members, avTeam, onViewMember }) => {
  // Only show regular members, not managers (AV Team is now separate)
  const cohortMembers = members.filter(m => !m.is_manager).sort((a, b) => 
    (a.full_name || '').localeCompare(b.full_name || '')
  );
  const sortedAVTeam = [...avTeam].sort((a, b) => 
    (a.full_name || '').localeCompare(b.full_name || '')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAVMember, setSelectedAVMember] = useState(null);
  
  // Simple search
  const filteredMembers = cohortMembers.filter(member => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (member.full_name || '').toLowerCase().includes(q);
  });

  // Generate brief description from existing fields
  const getBriefDescription = (member) => {
    if (member.headline) {
      // Shorten if too long
      const h = member.headline;
      if (h.length <= 40) return h;
      return h.substring(0, 37) + '...';
    }
    if (member.member_role) return member.member_role;
    if (member.member_company) return `@ ${member.member_company}`;
    if (member.role_title) return member.role_title;
    if (member.job) return member.job;
    return 'Member';
  };

  // Member card component
  const MemberCard = ({ member }) => (
    <div 
      onClick={() => onViewMember(member.id)}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer flex flex-col items-center text-center"
    >
      <Avatar 
        fullName={member.full_name}
        photoUrl={member.photo_url}
        emoji={member.emoji}
        showEmoji={member.emoji && member.emoji !== '👤' && member.emoji !== 'initials' && member.emoji !== 'initial'}
        backgroundColor="color-mix(in srgb, var(--primary-color, #1B4D5C) 35%, white)"
        size="lg"
        className="mb-2 flex-shrink-0"
      />
      
      <h3 className="font-semibold text-gray-900 text-base mb-1">
        {member.full_name || 'Member'}
      </h3>
      
      {member.location && (
        <p className="text-xs text-gray-400 mb-1">{member.location}</p>
      )}
      
      <p className="text-sm text-gray-600 line-clamp-2">
        {getBriefDescription(member)}
      </p>
    </div>
  );

  // AV Team card component
  const AVTeamCard = ({ member }) => (
    <div 
      onClick={() => setSelectedAVMember(member)}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-amber-300 transition-all cursor-pointer flex flex-col items-center text-center"
    >
      <Avatar 
        fullName={member.full_name}
        photoUrl={member.photo_url}
        emoji={member.emoji}
        showEmoji={member.emoji && member.emoji !== '👤' && member.emoji !== 'initials' && member.emoji !== 'initial'}
        backgroundColor="var(--accent-color, #C9A227)"
        size="lg"
        className="mb-2 flex-shrink-0"
      />
      
      <h3 className="font-semibold text-gray-900 text-base mb-1">
        {member.full_name || 'Team Member'}
      </h3>
      
      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full mb-1">
        {member.club_role}
      </span>
      
      <p className="text-sm text-gray-600 line-clamp-1">
        {member.title ? `${member.title}` : member.company || 'Alumni Ventures'}
      </p>
    </div>
  );
  
  return (
    <div className="space-y-8">
      {/* AV Team Section */}
      {avTeam && avTeam.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">AV Team</h2>
          <p className="text-sm text-gray-500 mb-4">Your dedicated program managers and mentors</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedAVTeam.map((member) => (
              <AVTeamCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Club Members Section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
          <h2 className="text-lg font-semibold text-gray-900">Club Members</h2>
            <p className="text-sm text-gray-500">{filteredMembers.length} members</p>
          </div>
          
          {/* Simple Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 text-sm"
            />
            <Settings size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        {/* Members Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
        
        {filteredMembers.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <Users size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No members found</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-sm text-blue-600 hover:text-blue-800 mt-2">Clear search</button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* AV Team Member Modal */}
      <Modal 
        isOpen={!!selectedAVMember} 
        onClose={() => setSelectedAVMember(null)} 
        title={selectedAVMember?.full_name || 'AV Team'}
        size="lg"
      >
        {selectedAVMember && (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar 
                fullName={selectedAVMember.full_name}
                photoUrl={selectedAVMember.photo_url}
                emoji={selectedAVMember.emoji}
                showEmoji={selectedAVMember.emoji && selectedAVMember.emoji !== '👤' && selectedAVMember.emoji !== 'initials' && selectedAVMember.emoji !== 'initial'}
                backgroundColor="var(--accent-color, #C9A227)"
                size="2xl"
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedAVMember.full_name}</h2>
                <p className="text-gray-600">{selectedAVMember.title}</p>
                <p className="text-gray-500">{selectedAVMember.company}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  {selectedAVMember.club_role}
                </span>
              </div>
            </div>
            
            {selectedAVMember.bio && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">About</h4>
                <p className="text-gray-600">{selectedAVMember.bio}</p>
              </div>
            )}
            
            {selectedAVMember.fun_fact && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Fun Fact</h4>
                <p className="text-gray-600">{selectedAVMember.fun_fact}</p>
              </div>
            )}
            
            {selectedAVMember.location && (
              <p className="text-sm text-gray-500">{selectedAVMember.location}</p>
            )}
            
            <div className="flex gap-3 pt-4 border-t">
            {(selectedAVMember.phone || selectedAVMember.whatsapp) && (
              <a href={`https://wa.me/${(selectedAVMember.phone || selectedAVMember.whatsapp).replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" icon={Phone}>WhatsApp</Button>
                </a>
              )}
              {selectedAVMember.email && (
                <a href={`mailto:${selectedAVMember.email}`}>
                  <Button variant="outline" icon={Mail}>Email</Button>
                </a>
              )}
              {selectedAVMember.linkedin_url && (
                <a href={selectedAVMember.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" icon={Linkedin}>LinkedIn</Button>
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Member Profile View (dedicated page)

export default MemberCommunity;
