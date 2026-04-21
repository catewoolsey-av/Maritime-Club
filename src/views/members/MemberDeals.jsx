import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Clock, FileText, ExternalLink, CheckCircle, AlertCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../supabase';
import { formatDate } from '../../utils/formatters';
import { Button, Card, Badge, Modal } from '../../components/ui';

const MemberDeals = ({ deals, currentUser }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [interestType, setInterestType] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentAmountType, setInvestmentAmountType] = useState('up_to'); // 'up_to', 'max'
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dealInterests, setDealInterests] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  // Active deals (pending or active status)
  const activeDeals = deals.filter(d => d.status === 'pending' || d.status === 'active');
  // Archived deals (closed or passed)
  const archivedDeals = deals.filter(d => d.status === 'closed' || d.status === 'passed');

  // Fetch user's interests for all deals
  useEffect(() => {
    const fetchDealInterests = async () => {
      const { data, error } = await supabase
        .from('deal_interests')
        .select('*')
        .eq('member_id', currentUser.id);

      if (!error && data) {
        const interestsMap = {};
        data.forEach(interest => {
          interestsMap[interest.deal_id] = interest;
        });
        setDealInterests(interestsMap);
      }
    };

    fetchDealInterests();
  }, [currentUser.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel(`deal-interests-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deal_interests',
          filter: `member_id=eq.${currentUser.id}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const dealId = payload.old?.deal_id;
            if (!dealId) return;
            setDealInterests(prev => {
              const next = { ...prev };
              delete next[dealId];
              return next;
            });
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = payload.new;
            if (!updated?.deal_id) return;
            setDealInterests(prev => ({
              ...prev,
              [updated.deal_id]: updated
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Helper to ensure URLs have protocol
  const ensureUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return 'https://' + url;
  };

  // Handle interest submission
  const handleInterestSubmit = async () => {
    if (!reason || reason.trim().length < 10) {
      alert('Please provide a reason (at least 10 characters)');
      return;
    }

    if (interestType === 'want_to_invest') {
      if (investmentAmountType === 'max') {
        // Max allocation doesn't require amount input
      } else if (!investmentAmount || investmentAmount <= 0) {
        alert('Please enter a valid investment amount');
        return;
      }
    }

    setSubmitting(true);
    
    try {
      const existingInterest = dealInterests[selectedDeal.id];

      // Allow updating previous decision (no lockout)

      let interestData;
      let isUpdate = false;

      if (existingInterest) {
        // Update existing record
        isUpdate = true;
        
        // Format investment amount - keep numeric, add type to reason if needed
        let formattedAmount = null;
        let formattedReason = reason;
        
        if (interestType === 'want_to_invest') {
          if (investmentAmountType === 'max') {
            formattedAmount = null; // No specific amount for max
            formattedReason = `[MAXIMUM ALLOCATION REQUESTED]\n\n${reason}`;
          } else if (investmentAmountType === 'up_to') {
            formattedAmount = parseFloat(investmentAmount);
            formattedReason = `[UP TO $${parseInt(investmentAmount).toLocaleString()}]\n\n${reason}`;
          } else {
            formattedAmount = parseFloat(investmentAmount);
          }
        }
        
        const { data: updated, error: updateError } = await supabase
          .from('deal_interests')
          .update({
            interest_type: interestType,
            investment_amount: formattedAmount,
            reason: formattedReason,
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInterest.id)
          .select()
          .single();

        if (updateError) throw updateError;
        interestData = updated;
      } else {
        // Insert new record
        
        // Format investment amount - keep numeric, add type to reason if needed
        let formattedAmount = null;
        let formattedReason = reason;
        
        if (interestType === 'want_to_invest') {
          if (investmentAmountType === 'max') {
            formattedAmount = null; // No specific amount for max
            formattedReason = `[MAXIMUM ALLOCATION REQUESTED]\n\n${reason}`;
          } else if (investmentAmountType === 'up_to') {
            formattedAmount = parseFloat(investmentAmount);
            formattedReason = `[UP TO $${parseInt(investmentAmount).toLocaleString()}]\n\n${reason}`;
          } else {
            formattedAmount = parseFloat(investmentAmount);
          }
        }
        
        // Validate that we have valid IDs
        if (!currentUser?.id) {
          throw new Error('User ID is missing. Please log in again.');
        }
        if (!selectedDeal?.id) {
          throw new Error('Deal ID is missing. Please refresh the page.');
        }
        
        const { data: inserted, error: insertError } = await supabase
          .from('deal_interests')
          .insert([{
            member_id: currentUser.id,
            deal_id: selectedDeal.id,
            interest_type: interestType,
            investment_amount: formattedAmount,
            reason: formattedReason,
            status: 'pending'
          }])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }
        interestData = inserted;
      }

      // Update local state
      setDealInterests(prev => ({
        ...prev,
        [selectedDeal.id]: interestData
      }));

      // Send email notification
      let emailSent = false;
      let emailError = null;
      
      try {
        const interestTypeLabels = {
          'interested': 'expressed interest in',
          'want_to_invest': 'wants to invest in',
          'not_interested': 'passed on'
        };

        // Get club name for subject line
        const { data: siteSettingsData } = await supabase
          .from('site_settings')
          .select('club_name')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const clubDisplayName = siteSettingsData?.club_name || 'Green & Granite';

        const emailSubject = `${clubDisplayName} - Deal Interest: ${selectedDeal.company_name} - ${currentUser.full_name}`;
        
        // Format investment amount for display
        let investmentDisplayText = '';
        if (interestType === 'want_to_invest') {
          if (investmentAmountType === 'max') {
            investmentDisplayText = 'Maximum Available Allocation';
          } else if (investmentAmountType === 'up_to') {
            investmentDisplayText = `Up to $${parseInt(investmentAmount).toLocaleString()}`;
          } else {
            investmentDisplayText = `$${parseInt(investmentAmount).toLocaleString()}`;
          }
        }
        
        const emailBody = `
<h2>New Deal Interest Notification</h2>

<p><strong>Member:</strong> ${currentUser.full_name} (${currentUser.email})</p>
<p><strong>Deal:</strong> ${selectedDeal.company_name}</p>
<p><strong>Action:</strong> ${interestTypeLabels[interestType]}</p>
${interestType === 'want_to_invest' ? `<p><strong>Investment Amount:</strong> ${investmentDisplayText}</p>` : ''}

<p><strong>Reason:</strong></p>
<p>${reason}</p>

<hr>
<p><a href="${window.location.origin}/deals">View deal in portal</a></p>
        `.trim();

        const emailText = `
Member: ${currentUser.full_name} (${currentUser.email})
Deal: ${selectedDeal.company_name}
Action: ${interestTypeLabels[interestType]}
${interestType === 'want_to_invest' ? `Investment Amount: ${investmentDisplayText}` : ''}

Reason:
${reason}

---
View deal: ${window.location.origin}/deals
        `.trim();

        const response = await fetch('/.netlify/functions/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: ['cate.woolsey@av.vc', 'luke@av.vc', 'clubs@av.vc'],
            subject: emailSubject,
            text: emailText,
            html: emailBody
          })
        });

        if (response.ok) {
          emailSent = true;
        } else {
          emailError = 'Email service unavailable';
        }
      } catch (emailErr) {
        emailError = 'Email service unavailable';
      }

      // Update record with email status
      await supabase
        .from('deal_interests')
        .update({
          email_sent: emailSent,
          email_sent_at: emailSent ? new Date().toISOString() : null,
          email_error: emailError
        })
        .eq('id', interestData.id);

      // Show appropriate message
      const messages = {
        'interested': isUpdate 
          ? 'Interest updated! We will follow up with you shortly.'
          : 'Interest recorded! We will follow up with you shortly.',
        'want_to_invest': isUpdate
          ? 'Investment interest updated! We will follow up with you shortly.'
          : 'Investment interest submitted! We will follow up with you shortly.',
        'not_interested': 'Thank you for your feedback. Your response has been recorded.'
      };
      alert(messages[interestType]);

      setShowInterestModal(false);
      setInvestmentAmount('');
      setInvestmentAmountType('up_to');
      setReason('');
      setInterestType('');
      setSelectedDeal(null);
    } catch (err) {
      alert(`Error submitting interest: ${err.message}\n\nPlease contact us directly at nextgen@av.vc`);
    }
    
    setSubmitting(false);
  };

  const openInterestModal = (deal, type) => {
    const existingInterest = dealInterests[deal.id];
    const dealClosed = deal.status === 'closed' || deal.status === 'passed';
    const isContacted = existingInterest?.status === 'contacted' || existingInterest?.status === 'completed';
    const isDeclined = existingInterest?.status === 'declined';
    
    // Deal is closed - no changes allowed
    if (dealClosed) {
      alert('This deal is closed. You can no longer change your response.');
      return;
    }

    if (isDeclined) {
      alert('Your investment interest was declined by admin.');
      return;
    }
    
    // Already selected the same option
    if (existingInterest) {
      if (type === 'want_to_invest' && existingInterest.interest_type === 'want_to_invest') {
        alert('You already expressed investment interest in this deal');
        return;
      }
      
      if (type === 'not_interested' && existingInterest.interest_type === 'not_interested') {
        alert('You already passed on this deal');
        return;
      }
      
      // Can't switch to pass after being contacted
      if (type === 'not_interested' && existingInterest.interest_type === 'want_to_invest' && isContacted) {
        alert('You can no longer switch to pass after being contacted.');
        return;
      }
    }
    
    setSelectedDeal(deal);
    setInterestType(type);
    setShowInterestModal(true);
    setInvestmentAmount('');
    setInvestmentAmountType('up_to');
    setReason('');
  };

  const toggleDescription = (dealId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [dealId]: !prev[dealId]
    }));
  };

  const shouldTruncateDescription = (description) => {
    if (!description) return false;
    const wordCount = description.split(/\s+/).length;
    return wordCount > 150;
  };

  const getTruncatedDescription = (description) => {
    if (!description) return '';
    const words = description.split(/\s+/);
    if (words.length <= 150) return description;
    return words.slice(0, 150).join(' ') + '...';
  };

  const displayDeals = activeTab === 'active' ? activeDeals : archivedDeals;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'active' ? 'text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          style={activeTab === 'active' ? { borderColor: 'var(--primary-color, #1B4D5C)', color: 'var(--primary-color, #1B4D5C)' } : {}}
        >
          Active ({activeDeals.length})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'archived' ? 'text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          style={activeTab === 'archived' ? { borderColor: 'var(--primary-color, #1B4D5C)', color: 'var(--primary-color, #1B4D5C)' } : {}}
        >
          Archived ({archivedDeals.length})
        </button>
      </div>

      {/* Deal Display */}
      {displayDeals.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No {activeTab} deals right now</p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'active' ? 'Check back soon for new opportunities!' : 'Past deals will appear here'}
            </p>
          </div>
        </Card>
      ) : (
        displayDeals.map((deal) => {
          const userInterest = dealInterests[deal.id];
          const isExpanded = expandedDescriptions[deal.id];
          const shouldTruncate = shouldTruncateDescription(deal.description);
          
          return (
            <Card key={deal.id} className="overflow-hidden">
              {/* Deal Header with gradient accent */}
              <div className="border-b border-gray-100 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                      {deal.company_logo ? (
                        <img src={deal.company_logo} alt={deal.company_name} className="w-full h-full object-contain" />
                      ) : (
                        <img src="/av-logo.png" alt="AV" className="w-8 h-8 object-contain" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h2 className="text-2xl font-bold text-gray-900">{deal.company_name}</h2>
                        {deal.status === 'pending' && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">Coming Soon</span>
                        )}
                        {deal.status === 'voting' && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Voting</span>
                        )}
                        {deal.status === 'reviewing' && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Reviewing</span>
                        )}
                        {deal.status === 'active' && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
                        )}
                        {deal.status === 'passed' && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">Passed</span>
                        )}
                        {deal.status === 'closed' && (
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">Closed</span>
                        )}
                        {userInterest && userInterest.status !== 'declined' && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {userInterest.interest_type === 'interested' && 'Expressed Interest'}
                            {userInterest.interest_type === 'want_to_invest' && 'Want to Invest'}
                            {userInterest.interest_type === 'not_interested' && 'Passed'}
                          </span>
                        )}
                      </div>
                      {deal.headline && (
                        <p className="text-lg text-gray-600 leading-relaxed">{deal.headline}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Deadline callout if exists */}
                {deal.deal_deadline && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <Clock size={16} className="text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      Investment Deadline: {formatDate(deal.deal_deadline, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Main Content Area (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Key Details */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Deal Terms</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                      {deal.sector && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Sector</p>
                          <p className="font-semibold text-gray-900">{deal.sector}</p>
                        </div>
                      )}
                      {deal.stage && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Stage</p>
                          <p className="font-semibold text-gray-900">{deal.stage}</p>
                        </div>
                      )}
                      {deal.lead_investor && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Lead Investor</p>
                          <p className="font-semibold text-gray-900">{deal.lead_investor}</p>
                        </div>
                      )}
                      {deal.round_size && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Round Size</p>
                          <p className="font-semibold text-gray-900">{deal.round_size}</p>
                        </div>
                      )}
                      {deal.valuation && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Valuation</p>
                          <p className="font-semibold text-gray-900">{deal.valuation}</p>
                        </div>
                      )}
                      {deal.minimum_check && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Minimum Check</p>
                          <p className="font-semibold text-gray-900">{deal.minimum_check}</p>
                        </div>
                      )}
                      {deal.av_allocation && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">AV Allocation</p>
                          <p className="font-semibold text-gray-900">{deal.av_allocation}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description with truncation */}
                  {deal.description && (
                    <div className="prose prose-gray max-w-none">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                        Investment Opportunity
                      </h3>
                      <div className="text-gray-700 leading-relaxed space-y-4">
                        {shouldTruncate && !isExpanded ? (
                          <>
                            <p className="text-base">{getTruncatedDescription(deal.description)}</p>
                            <button
                              onClick={() => toggleDescription(deal.id)}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                              See More <ChevronDown size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            {deal.description.split('\n\n').map((paragraph, idx) => (
                              <p key={idx} className="text-base">{paragraph}</p>
                            ))}
                            {shouldTruncate && (
                              <button
                                onClick={() => toggleDescription(deal.id)}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                              >
                                See Less <ChevronUp size={16} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Highlights */}
                  {deal.highlights && deal.highlights.length > 0 && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                      <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </span>
                        Investment Highlights
                      </h3>
                      <ul className="space-y-3">
                        {deal.highlights.map((highlight, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="text-green-600 mt-0.5 flex-shrink-0">•</span>
                            <span className="text-green-900">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Risks */}
                  {deal.risks && deal.risks.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                      <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">!</span>
                        </span>
                        Key Risks
                      </h3>
                      <ul className="space-y-3">
                        {deal.risks.map((risk, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="text-amber-600 mt-0.5 flex-shrink-0">•</span>
                            <span className="text-amber-900">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right: Documents Section (1/3 width) */}
                <div>
                  <div className="sticky top-4 space-y-4">
                    {/* Documents Card */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <FileText size={18} className="text-gray-600" />
                          Documents
                        </h3>
                      </div>
                      <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                        {deal.memo_url ? (
                          <div 
                            onClick={() => {
                              setDocumentUrl(ensureUrl(deal.memo_url));
                              setDocumentTitle('DD Memo');
                              setShowDocumentModal(true);
                            }}
                            className="block cursor-pointer"
                          >
                            <div className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                  <FileText size={20} className="text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm">DD Memo</p>
                                  <p className="text-xs text-gray-500">Investment thesis & analysis</p>
                                </div>
                                <Eye size={14} className="text-gray-400 group-hover:text-blue-500" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileText size={20} className="text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-400 text-sm">DD Memo</p>
                                <p className="text-xs text-gray-400">Coming soon</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {deal.deck_url ? (
                          <div 
                            onClick={() => {
                              setDocumentUrl(ensureUrl(deal.deck_url));
                              setDocumentTitle('Pitch Deck');
                              setShowDocumentModal(true);
                            }}
                            className="block cursor-pointer"
                          >
                            <div className="p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                  <FileText size={20} className="text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm">Pitch Deck</p>
                                  <p className="text-xs text-gray-500">Company presentation</p>
                                </div>
                                <Eye size={14} className="text-gray-400 group-hover:text-purple-500" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileText size={20} className="text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-400 text-sm">Pitch Deck</p>
                                <p className="text-xs text-gray-400">Coming soon</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Additional Media */}
                        {deal.additional_media && deal.additional_media.length > 0 && (
                          <div className="space-y-2">
                            {deal.additional_media.map((media, index) => (
                              media.url && (
                                <div 
                                  key={index}
                                  onClick={() => {
                                    setDocumentUrl(ensureUrl(media.url));
                                    setDocumentTitle(media.title || `Document ${index + 1}`);
                                    setShowDocumentModal(true);
                                  }}
                                  className="block cursor-pointer"
                                >
                                  <div className="p-3 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                                        <FileText size={20} className="text-orange-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm truncate">{media.title || `Document ${index + 1}`}</p>
                                        <p className="text-xs text-gray-500">Additional resource</p>
                                      </div>
                                      <Eye size={14} className="text-gray-400 group-hover:text-orange-500" />
                                    </div>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        )}
                        
                        {deal.portal_url && (
                          <a href={ensureUrl(deal.portal_url)} target="_blank" rel="noopener noreferrer" className="block">
                            <div className="p-3 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                  <ExternalLink size={20} className="text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm">AV Portal</p>
                                  <p className="text-xs text-gray-500">Full deal details & docs</p>
                                </div>
                                <ExternalLink size={14} className="text-gray-400 group-hover:text-green-500" />
                              </div>
                            </div>
                          </a>
                        )}
                        {deal.mp_video_url ? (
                          <a href={ensureUrl(deal.mp_video_url)} target="_blank" rel="noopener noreferrer" className="block">
                            <div className="p-3 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                  <ExternalLink size={20} className="text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm">MP Video</p>
                                  <p className="text-xs text-gray-500">Video link</p>
                                </div>
                                <ExternalLink size={14} className="text-gray-400 group-hover:text-red-500" />
                              </div>
                            </div>
                          </a>
                        ) : (
                          <div className="p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <ExternalLink size={20} className="text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-400 text-sm">MP Video</p>
                                <p className="text-xs text-gray-400">Coming soon</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {deal.company_video_url ? (
                          <a href={ensureUrl(deal.company_video_url)} target="_blank" rel="noopener noreferrer" className="block">
                            <div className="p-3 border border-gray-200 rounded-lg hover:border-rose-500 hover:bg-rose-50 transition-all cursor-pointer group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                                  <ExternalLink size={20} className="text-rose-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm">Company Video</p>
                                  <p className="text-xs text-gray-500">Video link</p>
                                </div>
                                <ExternalLink size={14} className="text-gray-400 group-hover:text-rose-500" />
                              </div>
                            </div>
                          </a>
                        ) : (
                          <div className="p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <ExternalLink size={20} className="text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-400 text-sm">Company Video</p>
                                <p className="text-xs text-gray-400">Coming soon</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons at Bottom - for active deals only */}
              {deal.status === 'active' && (
                <div className="border-t border-gray-200 p-6 bg-gray-50 mt-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Interested in this deal?</p>
                  
                  {/* Show existing interest status */}
                  {userInterest?.status === 'declined' ? (
                    <div className="mb-4 p-3 bg-white border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-600" />
                        <span className="text-sm font-medium text-red-700">
                          Your investment interest was declined by admin.
                        </span>
                      </div>
                    </div>
                  ) : userInterest && (userInterest.interest_type === 'want_to_invest' || userInterest.interest_type === 'not_interested') && (
                    <div className="mb-4 p-3 bg-white border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {userInterest.status === 'completed' && userInterest.interest_type === 'want_to_invest'
                            ? "You've invested in this"
                            : userInterest.interest_type === 'want_to_invest' 
                              ? "You've expressed investment interest" 
                              : "You've passed on this deal"}
                        </span>
                      </div>
                      {userInterest.interest_type === 'want_to_invest' && (userInterest.status === 'contacted' || userInterest.status === 'completed') && (
                        <p className="text-xs text-gray-600 mt-1 ml-6">
                          You've been contacted about your interest.
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Only show buttons if not completed */}
                  {(!userInterest || (userInterest.status !== 'completed' && userInterest.status !== 'declined')) && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => openInterestModal(deal, 'want_to_invest')} 
                        disabled={userInterest?.interest_type === 'want_to_invest'}
                        style={{
                          borderColor: 'var(--primary-color, #1B4D5C)',
                          backgroundColor: userInterest?.interest_type === 'want_to_invest' ? 'var(--primary-color, #1B4D5C)' : 'white',
                          color: userInterest?.interest_type === 'want_to_invest' ? 'white' : '#374151'
                        }}
                        className="flex-1 px-4 py-3 rounded-lg font-medium border-2 transition-colors relative hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {userInterest?.interest_type === 'want_to_invest' && (
                          <CheckCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
                        )}
                        Invest
                      </button>
                      <button
                        onClick={() => openInterestModal(deal, 'not_interested')} 
                        disabled={userInterest?.interest_type === 'not_interested' || (userInterest?.interest_type === 'want_to_invest' && (userInterest?.status === 'contacted' || userInterest?.status === 'completed'))}
                        style={{
                          borderColor: 'var(--primary-color, #1B4D5C)',
                          backgroundColor: userInterest?.interest_type === 'not_interested' ? 'var(--primary-color, #1B4D5C)' : 'white',
                          color: userInterest?.interest_type === 'not_interested' ? 'white' : '#374151'
                        }}
                        className="flex-1 px-4 py-3 rounded-lg font-medium border-2 transition-colors relative hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {userInterest?.interest_type === 'not_interested' && (
                          <CheckCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
                        )}
                        Pass
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-3 text-center">Club leadership will be notified</p>
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Interest Modal */}
      <Modal 
        isOpen={showInterestModal} 
        onClose={() => { 
          setShowInterestModal(false); 
          setInvestmentAmount(''); 
          setInvestmentAmountType('up_to');
          setReason('');
          setInterestType('');
          setSelectedDeal(null); 
        }} 
        title={
          interestType === 'interested' ? 'Express Interest' :
          interestType === 'want_to_invest' ? 'Investment Interest' :
          'Pass on Deal'
        } 
        size="md"
      >
        {selectedDeal && (
          <div className="space-y-4">
            <p className="text-gray-700">
              {interestType === 'interested' && `You're expressing interest in `}
              {interestType === 'want_to_invest' && `You're expressing interest to invest in `}
              {interestType === 'not_interested' && `You're passing on `}
              <strong>{selectedDeal.company_name}</strong>{interestType !== 'not_interested' && '. We will follow up with you to discuss next steps'}.
            </p>

            {interestType === 'want_to_invest' && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Allocation is not guaranteed. Depending on demand and allocation policy, you may receive less than your requested amount; this is a requested reservation only.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Investment Amount *</label>
                  
                  <div className="space-y-3">
                    {/* Up To Amount */}
                    <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={investmentAmountType === 'up_to'}
                        onChange={() => setInvestmentAmountType('up_to')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">Up To $</div>
                        {investmentAmountType === 'up_to' && (
                          <input
                            type="number"
                            value={investmentAmount}
                            onChange={(e) => setInvestmentAmount(e.target.value)}
                            placeholder="e.g., 50000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="1000"
                          />
                        )}
                      </div>
                    </label>
                    
                    {/* Max Allocation */}
                    <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={investmentAmountType === 'max'}
                        onChange={() => setInvestmentAmountType('max')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Maximum Available Allocation</div>
                        <div className="text-sm text-gray-500 mt-1">Request the maximum amount available</div>
                      </div>
                    </label>
                  </div>
                  
                  {selectedDeal.minimum_check && (
                    <p className="text-xs text-gray-500 mt-2">Minimum check: {selectedDeal.minimum_check}</p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {interestType === 'not_interested' ? 'Why are you passing?' : 'Why are you interested?'} *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  interestType === 'not_interested' 
                    ? 'e.g., Not in my investment thesis, valuation concerns, etc.'
                    : 'e.g., Strong market opportunity, experienced team, innovative technology, etc.'
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
                minLength="10"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => { 
                  setShowInterestModal(false); 
                  setInvestmentAmount(''); 
                  setInvestmentAmountType('up_to');
                  setReason('');
                  setInterestType('');
                  setSelectedDeal(null); 
                }} 
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleInterestSubmit} 
                disabled={submitting || !reason || reason.trim().length < 10} 
                className={
                  interestType === 'not_interested' 
                    ? 'bg-gray-600 hover:bg-gray-700' 
                    : interestType === 'want_to_invest'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Document Viewer Modal */}
      <Modal 
        isOpen={showDocumentModal} 
        onClose={() => {
          setShowDocumentModal(false);
          setDocumentUrl('');
          setDocumentTitle('');
        }} 
        title={documentTitle}
        size="xl"
      >
        <div className="w-full h-[80vh] relative overflow-hidden rounded-lg">
          <iframe
            src={documentUrl}
            className="w-full h-full border-0 rounded-lg"
            title={documentTitle}
            style={{ position: 'relative', zIndex: 1 }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default MemberDeals;
