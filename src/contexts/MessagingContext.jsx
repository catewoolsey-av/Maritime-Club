import React, { useState, useEffect, createContext } from 'react';
import { X, Mail, AlertCircle, CheckCircle, Target } from 'lucide-react';
import { supabase } from '../supabase';
import { Button, Card, Badge, Modal } from '../components/ui';

const MessagingContext = React.createContext();

const MessagingProvider = ({ children, currentUser, cohortId }) => {
  const [introRequests, setIntroRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = async () => {
    if (!currentUser?.id) return;
    
    const [reqRes, msgRes, blockRes] = await Promise.all([
      supabase.from('intro_requests').select('*').or(`from_member_id.eq.${currentUser.id},to_member_id.eq.${currentUser.id}`),
      supabase.from('messages').select('*').or(`from_member_id.eq.${currentUser.id},to_member_id.eq.${currentUser.id}`).order('created_at', { ascending: false }),
      supabase.from('member_blocks').select('*').eq('blocker_id', currentUser.id)
    ]);
    
    if (!reqRes.error) setIntroRequests(reqRes.data || []);
    if (!msgRes.error) {
      setMessages(msgRes.data || []);
      setUnreadCount((msgRes.data || []).filter(m => m.to_member_id === currentUser.id && !m.read).length);
    }
    if (!blockRes.error) setBlocks(blockRes.data || []);
  };

  useEffect(() => { fetchData(); }, [currentUser?.id]);

  const sendIntroRequest = async (toMemberId, reason, note, proposedFormat) => {
    const { error } = await supabase.from('intro_requests').insert({
      from_member_id: currentUser.id,
      to_member_id: toMemberId,
      cohort_id: cohortId,
      reason,
      note,
      proposed_format: proposedFormat
    });
    if (!error) fetchData();
    return !error;
  };

  const respondToRequest = async (requestId, status, suggestedFormat) => {
    const updates = { status, responded_at: new Date().toISOString() };
    if (suggestedFormat) updates.suggested_format = suggestedFormat;
    
    await supabase.from('intro_requests').update(updates).eq('id', requestId);
    
    if (status === 'accepted') {
      const req = introRequests.find(r => r.id === requestId);
      if (req) {
        const threadId = [req.from_member_id, req.to_member_id].sort().join('-');
        await supabase.from('messages').insert({
          thread_id: threadId,
          from_member_id: currentUser.id,
          to_member_id: req.from_member_id,
          cohort_id: cohortId,
          content: `✅ Intro request accepted! Looking forward to connecting.`,
          intro_request_id: requestId
        });
      }
    }
    fetchData();
  };

  const sendMessage = async (toMemberId, content) => {
    const threadId = [currentUser.id, toMemberId].sort().join('-');
    const { error } = await supabase.from('messages').insert({
      thread_id: threadId,
      from_member_id: currentUser.id,
      to_member_id: toMemberId,
      cohort_id: cohortId,
      content
    });
    if (!error) fetchData();
    return !error;
  };

  const shareEmail = async (requestId) => {
    await supabase.from('intro_requests').update({ 
      email_shared: true, 
      email_shared_at: new Date().toISOString() 
    }).eq('id', requestId);
    fetchData();
  };

  const blockMember = async (memberId) => {
    await supabase.from('member_blocks').insert({ blocker_id: currentUser.id, blocked_id: memberId });
    fetchData();
  };

  const unblockMember = async (memberId) => {
    await supabase.from('member_blocks').delete().eq('blocker_id', currentUser.id).eq('blocked_id', memberId);
    fetchData();
  };

  const reportMember = async (memberId, reason, note) => {
    await supabase.from('member_reports').insert({
      reporter_id: currentUser.id,
      reported_id: memberId,
      cohort_id: cohortId,
      reason,
      note
    });
    return true;
  };

  const isBlocked = (memberId) => blocks.some(b => b.blocked_id === memberId);
  
  const getPendingRequestsTo = () => introRequests.filter(r => r.to_member_id === currentUser?.id && r.status === 'pending');
  const getMessagesForThread = (memberId) => {
    const threadId = [currentUser?.id, memberId].sort().join('-');
    return messages.filter(m => m.thread_id === threadId);
  };

  return (
    <MessagingContext.Provider value={{
      introRequests, messages, blocks, unreadCount,
      sendIntroRequest, respondToRequest, sendMessage, shareEmail,
      blockMember, unblockMember, reportMember, isBlocked,
      getPendingRequestsTo, getMessagesForThread, fetchData
    }}>
      {children}
    </MessagingContext.Provider>
  );
};

// Intro Request Modal
const IntroRequestModal = ({ isOpen, onClose, member, currentUser }) => {
  const { sendIntroRequest } = React.useContext(MessagingContext) || {};
  const [reason, setReason] = useState('Networking');
  const [note, setNote] = useState('');
  const [format, setFormat] = useState(member?.chat_format || '30 min call');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSending(true);
    const success = await sendIntroRequest?.(member.id, reason, note, format);
    setSending(false);
    if (success) {
      setSent(true);
      setTimeout(() => { onClose(); setSent(false); }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={sent ? '✅ Request Sent!' : `Request Intro with ${member?.full_name}`}>
      {sent ? (
        <div className="text-center py-8">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <p className="text-gray-600">Your intro request has been sent. They'll be notified.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Why would you like to connect? *</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="Networking">Networking</option>
              <option value="Deal diligence">Deal diligence</option>
              <option value="Learn VC">Learn VC</option>
              <option value="Help founders">Help founders</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add a note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 300))}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Briefly introduce yourself or explain why you'd like to connect..."
            />
            <p className="text-xs text-gray-400 mt-1">{note.length}/300 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred format</label>
            <div className="flex gap-2">
              {['15 min call', '30 min call', 'Async only'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    format === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={sending || !reason}>
              {sending ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// Message Thread Modal
const MessageThreadModal = ({ isOpen, onClose, member, currentUser }) => {
  const { getMessagesForThread, sendMessage, introRequests } = React.useContext(MessagingContext) || {};
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const threadMessages = getMessagesForThread?.(member?.id) || [];
  const introReq = introRequests?.find(r => 
    (r.from_member_id === currentUser?.id && r.to_member_id === member?.id) ||
    (r.to_member_id === currentUser?.id && r.from_member_id === member?.id)
  );

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    await sendMessage?.(member.id, newMessage);
    setNewMessage('');
    setSending(false);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Message ${member?.full_name}`} size="lg">
      <div className="flex flex-col h-[400px]">
        <div className="flex-1 overflow-y-auto space-y-3 p-2">
          {threadMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare size={32} className="mx-auto mb-2" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            threadMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from_member_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                  msg.from_member_id === currentUser?.id 
                    ? 'bg-blue-600 text-white rounded-br-md' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.from_member_id === currentUser?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t pt-4 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
          />
          <Button onClick={handleSend} disabled={sending || !newMessage.trim()}>Send</Button>
        </div>
      </div>
    </Modal>
  );
};

// Report/Block Modal
const ReportBlockModal = ({ isOpen, onClose, member, action }) => {
  const { blockMember, reportMember } = React.useContext(MessagingContext) || {};
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (action === 'block') {
      await blockMember?.(member.id);
    } else {
      await reportMember?.(member.id, reason, note);
    }
    setDone(true);
    setTimeout(() => { onClose(); setDone(false); }, 1500);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={action === 'block' ? 'Block User' : 'Report User'}>
      {done ? (
        <div className="text-center py-8">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <p className="text-gray-600">{action === 'block' ? 'User has been blocked.' : 'Report submitted. Thank you.'}</p>
        </div>
      ) : action === 'block' ? (
        <div className="space-y-4">
          <p className="text-gray-600">
            Blocking <strong>{member?.full_name}</strong> will prevent them from viewing your profile or sending you messages.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleSubmit}>Block User</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for report *</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select a reason...</option>
              <option value="harassment">Harassment</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="spam">Spam</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional details (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleSubmit} disabled={!reason}>Submit Report</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// Deal Interest Card Component
const DealInterestCard = ({ member, compact = false }) => {
  if (!member) return null;
  
  const sectors = member.sector_interests || member.interests || [];
  const stages = member.stage_interest || [];
  const geographies = member.geography_preference || [];
  const roles = member.deal_role_preference || [];
  
  const hasAnyData = sectors.length > 0 || stages.length > 0 || geographies.length > 0 || roles.length > 0;
  
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
        <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">Deal Interests</h4>
        {hasAnyData ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {sectors.length > 0 && (
              <div><span className="text-gray-500">Sectors:</span> <span className="font-medium">{sectors.slice(0, 2).join(', ')}{sectors.length > 2 ? '...' : ''}</span></div>
            )}
            {stages.length > 0 && (
              <div><span className="text-gray-500">Stage:</span> <span className="font-medium">{stages.slice(0, 2).join(', ')}</span></div>
            )}
            {geographies.length > 0 && (
              <div><span className="text-gray-500">Geo:</span> <span className="font-medium">{geographies[0]}</span></div>
            )}
            {roles.length > 0 && (
              <div><span className="text-gray-500">Role:</span> <span className="font-medium">{roles[0]}</span></div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">No deal interests selected yet.</p>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Target size={18} className="text-blue-600" /> Deal Interest Profile
      </h3>
      
      {!hasAnyData ? (
        <div className="text-center py-6">
          <p className="text-gray-600 mb-2">Share your deal preferences to help match you with relevant opportunities</p>
          <p className="text-sm text-gray-500 italic">Click Edit Profile to add your deal interests</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sectors.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sector Interests</p>
              <div className="flex flex-wrap gap-1">
                {sectors.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-white rounded text-xs font-medium text-blue-700">{s}</span>
                ))}
              </div>
            </div>
          )}
          {stages.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stage Interest</p>
              <div className="flex flex-wrap gap-1">
                {stages.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-white rounded text-xs font-medium text-indigo-700">{s}</span>
                ))}
              </div>
            </div>
          )}
          {geographies.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Geography Preference</p>
              <div className="flex flex-wrap gap-1">
                {geographies.map((g, i) => (
                  <span key={i} className="px-2 py-1 bg-white rounded text-xs font-medium text-green-700">{g}</span>
                ))}
              </div>
            </div>
          )}
          {roles.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deal Role Preference</p>
              <div className="flex flex-wrap gap-1">
                {roles.map((r, i) => (
                  <span key={i} className="px-2 py-1 bg-white rounded text-xs font-medium text-amber-700">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// =====================================================
// MEMBER PORTFOLIO
// =====================================================


export { MessagingContext, MessagingProvider, DealInterestCard };
