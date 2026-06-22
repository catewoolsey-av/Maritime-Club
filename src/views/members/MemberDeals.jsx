import React, { useState, useEffect } from 'react';
import { TrendingUp, FileText, AlertCircle, Eye, Link2, Check } from 'lucide-react';
import { supabase, callDealRoomMember } from '../../supabase';
import { formatDate } from '../../utils/formatters';
import { formatDealDescription } from '../../utils/formatDealDescription';
import { Button, Card, Badge, Modal, DocumentModal, VideoModal } from '../../components/ui';

const MemberDeals = ({ deals, currentUser }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [docMaterialId, setDocMaterialId] = useState(null);
  const [docDirectUrl, setDocDirectUrl] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [interestType, setInterestType] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentAmountType, setInvestmentAmountType] = useState('up_to');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dealInterests, setDealInterests] = useState({});
  const [dealRoomInfo, setDealRoomInfo] = useState({});
  const [dealRoomLoading, setDealRoomLoading] = useState(deals.some(d => d.source_deal_id));

  // Deals-section disclosure — must be accepted once per login session
  const DISCLOSURE_STORAGE_KEY = 'ngvc_deals_disclosure_accepted_member_id';
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const [acceptingDisclosure, setAcceptingDisclosure] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) { setDisclosureAccepted(false); return; }
    try {
      const stored = localStorage.getItem(DISCLOSURE_STORAGE_KEY);
      setDisclosureAccepted(stored === String(currentUser.id));
    } catch {
      setDisclosureAccepted(false);
    }
  }, [currentUser?.id]);

  const acceptDisclosure = async () => {
    if (!currentUser?.id) return;
    setAcceptingDisclosure(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({ deals_disclosure_accepted_at: new Date().toISOString() })
        .eq('id', currentUser.id);
      if (error) console.warn('Disclosure backend update failed (run migration 009 if column is missing):', error.message);
      try { localStorage.setItem(DISCLOSURE_STORAGE_KEY, String(currentUser.id)); } catch {}
      setDisclosureAccepted(true);
    } catch (err) {
      console.error('Failed to record disclosure acceptance:', err);
    } finally {
      setAcceptingDisclosure(false);
    }
  };

  // A deal is "past" purely based on the club deadline (closes_at) set via the
  // admin calendar button. Status is not used to determine this. No deadline
  // set → the deal stays active.
  const isPastDeal = (d) => {
    return !!(d.closes_at && new Date(d.closes_at).getTime() < Date.now());
  };
  const activeDeals = deals.filter(d => !isPastDeal(d));
  const archivedDeals = deals.filter(d => isPastDeal(d));

  // Fetch deal-room info (description, terms, materials) for all source-linked deals
  useEffect(() => {
    const sourceDealIds = deals.map(d => d.source_deal_id).filter(Boolean);
    if (sourceDealIds.length === 0) {
      setDealRoomLoading(false);
      return;
    }

    let cancelled = false;
    setDealRoomLoading(true);

    const loadDealInfo = async () => {
      try {
        const { byId } = await callDealRoomMember('getDealsInfo', { sourceDealIds });
        if (!cancelled) setDealRoomInfo(byId || {});
      } catch (err) {
        console.error('Failed to load deal-room info:', err);
      } finally {
        if (!cancelled) setDealRoomLoading(false);
      }
    };

    loadDealInfo();
    return () => { cancelled = true; };
  }, [deals]);

  // Fetch user's existing responses from the deal room (via Netlify function)
  useEffect(() => {
    if (!currentUser?.email) return;

    const loadUserResponses = async () => {
      try {
        const { responses } = await callDealRoomMember('getMyResponses');
        if (!responses) return;

        // Build map keyed by LOCAL deal id (via source_deal_id)
        const sb2DealIdToLocal = {};
        deals.forEach(d => {
          if (d.source_deal_id) sb2DealIdToLocal[d.source_deal_id] = d.id;
        });

        const map = {};
        responses.forEach(r => {
          const localDealId = sb2DealIdToLocal[r.deal_id];
          if (localDealId) {
            map[localDealId] = {
              id: r.id,
              deal_id: r.deal_id,
              interest_type: r.decision === 'invest' ? 'want_to_invest' : r.decision === 'pass' ? 'not_interested' : 'interested',
              investment_amount: r.desired_amount,
              status: 'pending',
              created_at: r.created_at,
            };
          }
        });
        setDealInterests(map);
      } catch (err) {
        console.error('Failed to load deal-room responses:', err);
      }
    };

    loadUserResponses();
  }, [currentUser?.email, deals]);

  // Also check local deal_interests as fallback (for deals without source_deal_id)
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchLocalInterests = async () => {
      const { data, error } = await supabase
        .from('deal_interests')
        .select('*')
        .eq('member_id', currentUser.id);

      if (!error && data) {
        setDealInterests(prev => {
          const merged = { ...prev };
          data.forEach(interest => {
            // Only add if not already set by supabase2 response
            if (!merged[interest.deal_id]) {
              merged[interest.deal_id] = interest;
            }
          });
          return merged;
        });
      }
    };

    fetchLocalInterests();
  }, [currentUser?.id]);

  // Realtime subscription to local deal_interests
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

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  const ensureUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return 'https://' + url;
  };

  // Handle interest submission — writes to supabase2 if deal has source_deal_id, otherwise local
  const handleInterestSubmit = async () => {
    if (!reason || reason.trim().length < 10) {
      alert('Please provide a reason (at least 10 characters)');
      return;
    }

    if (interestType === 'want_to_invest') {
      if (investmentAmountType === 'max') {
        // OK — max allocation
      } else if (!investmentAmount || investmentAmount <= 0) {
        alert('Please enter a valid investment amount');
        return;
      }
    }

    setSubmitting(true);

    try {
      const sourceDealId = selectedDeal.source_deal_id;

      if (sourceDealId) {
        const decision = interestType === 'want_to_invest' ? 'invest' : 'pass';
        let desiredAmount = null;
        if (interestType === 'want_to_invest' && investmentAmountType !== 'max') {
          desiredAmount = parseFloat(investmentAmount);
        }

        const { id: responseId } = await callDealRoomMember('submitResponse', {
          sourceDealId,
          decision,
          desiredAmount,
          reason,
        });

        setDealInterests(prev => ({
          ...prev,
          [selectedDeal.id]: {
            id: responseId,
            deal_id: sourceDealId,
            interest_type: interestType,
            investment_amount: desiredAmount,
            status: 'pending',
          },
        }));
      } else {
        // --- Fallback: write to local deal_interests ---
        const existingInterest = dealInterests[selectedDeal.id];

        // Amount encoding: NULL = max allocation, number = up-to dollar cap.
        // The reason is stored verbatim — no prefix.
        let formattedAmount = null;
        if (interestType === 'want_to_invest' && investmentAmountType !== 'max') {
          formattedAmount = parseFloat(investmentAmount);
        }

        if (existingInterest?.id && !String(existingInterest.id).startsWith('pending-')) {
          await supabase
            .from('deal_interests')
            .update({
              interest_type: interestType,
              investment_amount: formattedAmount,
              reason,
              status: 'pending',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingInterest.id);
        } else {
          await supabase
            .from('deal_interests')
            .insert([{
              member_id: currentUser.id,
              deal_id: selectedDeal.id,
              interest_type: interestType,
              investment_amount: formattedAmount,
              reason,
              status: 'pending',
            }]);
        }

        setDealInterests(prev => ({
          ...prev,
          [selectedDeal.id]: {
            deal_id: selectedDeal.id,
            interest_type: interestType,
            investment_amount: formattedAmount,
            status: 'pending',
          },
        }));
      }

      // Send email notification
      try {
        const { data: siteSettingsData } = await supabase
          .from('site_settings')
          .select('club_name')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const clubDisplayName = siteSettingsData?.club_name || 'Maritime Venture Club';

        const interestTypeLabels = {
          'want_to_invest': 'wants to invest in',
          'not_interested': 'passed on',
        };

        let investmentDisplayText = '';
        if (interestType === 'want_to_invest') {
          if (investmentAmountType === 'max') {
            investmentDisplayText = 'Maximum Available Allocation';
          } else {
            investmentDisplayText = `Up to $${parseInt(investmentAmount).toLocaleString()}`;
          }
        }

        await fetch('/.netlify/functions/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: ['cate.woolsey@av.vc', 'clubs@av.vc', 'ryan.musto@av.vc', 'clare@av.vc'],
            subject: `${clubDisplayName} - Deal Interest: ${selectedDeal.company_name} - ${currentUser.full_name}`,
            html: `<h2>Deal Interest</h2><p><strong>Member:</strong> ${currentUser.full_name} (${currentUser.email})</p><p><strong>Deal:</strong> ${selectedDeal.company_name}</p><p><strong>Action:</strong> ${interestTypeLabels[interestType]}</p>${interestType === 'want_to_invest' ? `<p><strong>Amount:</strong> ${investmentDisplayText}</p>` : ''}<p><strong>Reason:</strong></p><p>${reason}</p>`,
            text: `Member: ${currentUser.full_name}\nDeal: ${selectedDeal.company_name}\nAction: ${interestTypeLabels[interestType]}\nReason: ${reason}`,
          }),
        });
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr);
      }

      const messages = {
        'want_to_invest': 'Investment interest submitted! We will follow up with you shortly.',
        'not_interested': 'Thank you for your feedback. Your response has been recorded.',
      };
      alert(messages[interestType]);

      setShowInterestModal(false);
      setInvestmentAmount('');
      setInvestmentAmountType('up_to');
      setReason('');
      setInterestType('');
      setSelectedDeal(null);
    } catch (err) {
      alert(`Error submitting interest: ${err.message}\n\nPlease contact us directly at clubs@av.vc`);
    }

    setSubmitting(false);
  };

  const openInterestModal = (deal, type) => {
    const existingInterest = dealInterests[deal.id];
    const dealClosed = deal.status === 'closed' || deal.status === 'passed';

    if (dealClosed) {
      alert('This deal is closed. You can no longer change your response.');
      return;
    }

    if (existingInterest) {
      if (type === 'want_to_invest' && existingInterest.interest_type === 'want_to_invest') {
        alert('You already expressed investment interest in this deal');
        return;
      }
      if (type === 'not_interested' && existingInterest.interest_type === 'not_interested') {
        alert('You already passed on this deal');
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

  const displayDeals = activeTab === 'active' ? activeDeals : archivedDeals;

  return (
    <>
    {!disclosureAccepted && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
        <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Deal Room Disclosure</h2>
          </div>
          <div className="px-6 py-4 max-h-[55vh] overflow-y-auto text-sm text-gray-700 space-y-3">
            <p>Your participation in our Syndication program and your access to this deal room is subject to your confidentiality obligations to AV.</p>
            <p>By clicking &ldquo;Accept&rdquo;, you acknowledge that you will not distribute or disclose any confidential information.</p>
            <p>AV is vigilant in protecting our confidential portfolio company information and we will not hesitate to exercise our legal and contractual rights to the fullest extent of the law.</p>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onClick={acceptDisclosure}
              disabled={acceptingDisclosure}
              className="px-5 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary-color, #1B4D5C)' }}
            >
              {acceptingDisclosure ? 'Saving...' : 'Accept'}
            </button>
          </div>
        </div>
      </div>
    )}
    <div className={`space-y-4 ${!disclosureAccepted ? 'pointer-events-none select-none filter blur-sm' : ''}`}>
      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'active' ? 'text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          style={activeTab === 'active' ? { borderColor: 'var(--primary-color, #1B4D5C)', color: 'var(--primary-color, #1B4D5C)' } : {}}
        >
          Active ({activeDeals.length})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'archived' ? 'text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          style={activeTab === 'archived' ? { borderColor: 'var(--primary-color, #1B4D5C)', color: 'var(--primary-color, #1B4D5C)' } : {}}
        >
          Closed ({archivedDeals.length})
        </button>
      </div>

      {/* Deal Display */}
      {dealRoomLoading ? (
        <Card>
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
          </div>
        </Card>
      ) : displayDeals.length === 0 ? (
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
        displayDeals.map((rawDeal) => {
          const info = rawDeal.source_deal_id ? dealRoomInfo[rawDeal.source_deal_id] : null;
          const investmentDescription = info?.terms?.investment_description?.trim();
          const deal = info
            ? {
                ...rawDeal,
                ...(info.terms || {}),
                description: investmentDescription || info.description || rawDeal.description,
                deadline_at: info.deadline_at || null,
                deal_materials: info.materials || [],
              }
            : rawDeal;
          const userInterest = dealInterests[deal.id];
          const materialType = (m) => m.doc_type || m.material_type;
          const dealMaterials = deal.deal_materials || [];

          const docTypeConfig = {
            due_diligence: { label: 'Due Diligence', wrap: 'bg-blue-50', icon: 'text-blue-600' },
            pitch_deck: { label: 'Pitch Deck', wrap: 'bg-violet-50', icon: 'text-violet-600' },
            cap_table: { label: 'Cap Table', wrap: 'bg-amber-50', icon: 'text-amber-600' },
            term_sheet: { label: 'Term Sheet', wrap: 'bg-amber-50', icon: 'text-amber-600' },
            financial_projections: { label: 'Financial Projections', wrap: 'bg-amber-50', icon: 'text-amber-600' },
            offering_documents: { label: 'Offering Documents', wrap: 'bg-emerald-50', icon: 'text-emerald-600' },
            mp_video: { label: 'MP Video', wrap: 'bg-red-50', icon: 'text-red-600' },
            company_video: { label: 'Company Video', wrap: 'bg-red-50', icon: 'text-red-600' },
          };
          const canonicalDocOrder = ['due_diligence', 'pitch_deck', 'cap_table', 'term_sheet', 'financial_projections', 'offering_documents', 'mp_video', 'company_video'];

          const docItems = [];
          canonicalDocOrder.forEach((type) => {
            const mats = dealMaterials.filter((m) => materialType(m) === type);
            if (mats.length > 0) {
              mats.forEach((m) => {
                const url = m.signed_url || m.url;
                if (!url) return;
                docItems.push({
                  key: m.id || `${type}-${url}`,
                  type,
                  materialId: m.id || null,
                  isLink: m.material_type === 'link',
                  label: docTypeConfig[type].label,
                  url: ensureUrl(url),
                });
              });
            } else if (type === 'due_diligence' && deal.memo_url) {
              docItems.push({ key: 'legacy-dd', type, materialId: null, label: docTypeConfig[type].label, url: ensureUrl(deal.memo_url) });
            } else if (type === 'pitch_deck' && deal.deck_url) {
              docItems.push({ key: 'legacy-deck', type, materialId: null, label: docTypeConfig[type].label, url: ensureUrl(deal.deck_url) });
            }
          });

          // Any other materials (links like videos, additional, unknown doc_types) — append at the end.
          // For video links (av.vc/youtube/vimeo), auto-label by order: first = MP Video, second = Company Video.
          const knownTypes = new Set(canonicalDocOrder);
          const isVideoUrl = (u) => /video\.av\.vc|youtube\.com|youtu\.be|vimeo\.com|loom\.com/i.test(u || '');
          const looksLikeUrl = (s) => typeof s === 'string' && /^(https?:\/\/|www\.)/i.test(s);
          let videoLabelIndex = 0;
          dealMaterials.filter((m) => !knownTypes.has(materialType(m))).forEach((m) => {
            const url = m.signed_url || m.url;
            if (!url) return;
            const isLink = m.material_type === 'link';
            let label;
            let typeKey = 'extra';
            if (isLink && isVideoUrl(url)) {
              label = videoLabelIndex === 0 ? 'MP Video' : videoLabelIndex === 1 ? 'Company Video' : (m.title && !looksLikeUrl(m.title) ? m.title : 'Video');
              typeKey = videoLabelIndex === 0 ? 'mp_video' : 'company_video';
              videoLabelIndex++;
            } else if (m.title && !looksLikeUrl(m.title)) {
              label = m.title;
            } else if (m.file_name) {
              label = m.file_name;
            } else {
              label = 'Document';
            }
            docItems.push({
              key: m.id || `extra-${url}`,
              type: typeKey,
              materialId: m.id || null,
              isLink,
              label,
              url: ensureUrl(url),
            });
          });

          const extraConfig = { wrap: 'bg-red-50', icon: 'text-red-600' };
          // Excitement may arrive as a JSONB object or as a JSON string; handle both
          let excitement = null;
          const rawExcitement = deal.excitement;
          if (rawExcitement) {
            if (typeof rawExcitement === 'string') {
              try { excitement = JSON.parse(rawExcitement); } catch { excitement = null; }
            } else if (typeof rawExcitement === 'object') {
              excitement = rawExcitement;
            }
          }
          const investedAmountLabel = userInterest?.interest_type === 'want_to_invest'
            ? (userInterest.investment_amount
                ? ` · $${Number(userInterest.investment_amount).toLocaleString()}`
                : ' · Max')
            : '';

          return (
            <Card key={deal.id} className="overflow-hidden">
              {/* Header: logo + name + url + tagline */}
              <div className="flex items-start gap-3 mb-5">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                  {(() => {
                    const logoSrc = deal.company_image_path || deal.company_logo;
                    return logoSrc ? (
                      <img
                        src={logoSrc}
                        alt={deal.company_name}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/av-logo.png'; e.currentTarget.className = 'w-6 h-6 object-contain'; }}
                      />
                    ) : (
                      <img src="/av-logo.png" alt="AV" className="w-6 h-6 object-contain" />
                    );
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{deal.company_name}</h2>
                    {deal.company_url && (
                      <a href={deal.company_url.startsWith('http') ? deal.company_url : `https://${deal.company_url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        {deal.company_url.replace(/^https?:\/\//, '')} ↗
                      </a>
                    )}
                  </div>
                  {deal.headline && <p className="text-sm text-gray-600 leading-relaxed mt-0.5">{deal.headline}</p>}
                </div>
                {deal.closes_at && (() => {
                  const closesAtMs = new Date(deal.closes_at).getTime();
                  const isExpired = closesAtMs < Date.now();
                  const isUrgent = !isExpired && (closesAtMs - Date.now()) < 86400000 * 3;
                  return (
                    <div className={`flex-shrink-0 flex flex-col items-end text-right px-3 py-1.5 rounded-lg border ${
                      isExpired
                        ? 'bg-gray-50 border-gray-200 text-gray-600'
                        : isUrgent
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      <span className="text-[10px] uppercase tracking-wider font-semibold opacity-75">{isExpired ? 'Closed' : 'Deadline'}</span>
                      <span className="text-sm font-bold leading-tight mt-0.5 whitespace-nowrap">
                        {new Date(deal.closes_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="grid lg:grid-cols-[2fr_minmax(320px,1fr)] gap-8">
                <div className="flex flex-col gap-5">
                  {/* Deal Overview */}
                  {(deal.sector || deal.stage || deal.lead_investor || deal.valuation || deal.av_allocation) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
                      <h3 className="text-base font-bold text-gray-900 mb-3 tracking-tight">Deal Overview</h3>
                      <div className="text-sm leading-relaxed">
                        {(deal.sector || deal.stage) && (
                          <div className="mb-1.5">
                            {deal.sector && (
                              <span className="mr-9">
                                <span className="text-xs uppercase tracking-wider font-bold text-gray-700 mr-1.5">Sector:</span>
                                <span className="text-gray-800">{deal.sector}</span>
                              </span>
                            )}
                            {deal.stage && (
                              <span>
                                <span className="text-xs uppercase tracking-wider font-bold text-gray-700 mr-1.5">Stage:</span>
                                <span className="text-gray-800">{deal.stage}</span>
                              </span>
                            )}
                          </div>
                        )}
                        {(deal.valuation || deal.av_allocation) && (
                          <div className="mb-1.5">
                            {deal.valuation && (
                              <span className="mr-9">
                                <span className="text-xs uppercase tracking-wider font-bold text-gray-700 mr-1.5">Valuation:</span>
                                <span className="text-gray-800">{deal.valuation}</span>
                              </span>
                            )}
                            {deal.av_allocation && (
                              <span>
                                <span className="text-xs uppercase tracking-wider font-bold text-gray-700 mr-1.5">AV Allocation:</span>
                                <span className="text-gray-800">{deal.av_allocation}</span>
                              </span>
                            )}
                          </div>
                        )}
                        {deal.lead_investor && (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs uppercase tracking-wider font-bold text-gray-700 flex-shrink-0">Key Investors:</span>
                            <span className="text-gray-800 break-words">{deal.lead_investor}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Investment Opportunity */}
                  {deal.description && (
                    <div className="flex-1 flex flex-col">
                      <div className="border-l-[3px] border-blue-600 pl-4 mt-5">
                        <h3 className="text-base font-bold text-gray-900 mb-3 tracking-tight">Investment Opportunity</h3>
                        <div
                          className="text-sm text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatDealDescription(deal.description) }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Documents column */}
                <div>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center gap-2.5">
                      <FileText size={14} className="text-gray-700" />
                      <span className="text-sm font-semibold text-gray-800">Documents</span>
                    </div>
                    <div className="py-1.5">
                      {docItems.length === 0 ? (
                        <p className="text-xs text-gray-400 px-4 py-6 text-center">No documents uploaded yet</p>
                      ) : docItems.map((item) => {
                        const cfg = item.type === 'extra' ? extraConfig : docTypeConfig[item.type];
                        return (
                          <div
                            key={item.key}
                            onClick={() => {
                              if (item.isLink && isVideoUrl(item.url)) {
                                setVideoUrl(item.url);
                                setVideoTitle(item.label);
                                setShowVideoModal(true);
                              } else {
                                setDocMaterialId(item.materialId);
                                setDocDirectUrl(item.materialId ? '' : item.url);
                                setDocumentTitle(item.label);
                                setShowDocumentModal(true);
                              }
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors group"
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.wrap}`}>
                              {item.isLink
                                ? <Link2 size={15} className={cfg.icon} />
                                : <FileText size={15} className={cfg.icon} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">{item.label}</p>
                            </div>
                            <Eye size={14} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Why We're Excited About The Opportunity */}
              {excitement && (excitement.opening || (excitement.bullets && excitement.bullets.length > 0) || excitement.closing) && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-5 mt-6">
                  <h3 className="text-base font-bold text-gray-900 mb-3.5 tracking-tight">Why We're Excited About The Opportunity</h3>
                  {excitement.opening && (
                    <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-line">{excitement.opening}</p>
                  )}
                  {excitement.bullets && excitement.bullets.length > 0 && (
                    <ul className="pl-8 space-y-3.5 mb-4">
                      {excitement.bullets.map((b, i) => (
                        <li key={i} className="grid grid-cols-[28px_1fr] gap-3 items-start">
                          <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full mt-0.5" style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)' }}>
                            <Check size={14} strokeWidth={3} className="text-blue-600" />
                          </span>
                          <div>
                            {b.title && <div className="text-sm font-bold text-gray-900 mb-1">{b.title}</div>}
                            {b.body && <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{b.body}</div>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {excitement.closing && (
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{excitement.closing}</p>
                  )}
                </div>
              )}

              {/* Interest section — only visible when:
                  - deal is active and not past
                  - admin has flipped the Activate switch (deal.interest_active)
                  The Activate flag defaults to false so members don't see
                  Invest/Pass until the club is ready to collect responses. */}
              {deal.status === 'active' && !isPastDeal(deal) && deal.interest_active && (
                <div className="border-t border-gray-200 -mx-6 -mb-6 mt-6 px-8 py-5 bg-gray-50">
                  <p className="text-base font-bold text-gray-900 mb-3.5 tracking-tight">Interested in this deal?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <button
                      onClick={() => openInterestModal(deal, 'want_to_invest')}
                      disabled={userInterest?.interest_type === 'want_to_invest'}
                      style={{
                        backgroundColor: '#f1faf3',
                        borderColor: '#cbe7d3',
                        color: '#15803d',
                      }}
                      className="px-5 py-3.5 rounded-lg text-[15px] font-semibold border transition-colors disabled:cursor-not-allowed hover:opacity-90"
                    >
                      I'm interested{investedAmountLabel}
                    </button>
                    <button
                      onClick={() => openInterestModal(deal, 'not_interested')}
                      disabled={userInterest?.interest_type === 'not_interested'}
                      style={{
                        backgroundColor: '#fbf3f3',
                        borderColor: '#e7caca',
                        color: '#9a3939',
                      }}
                      className="px-5 py-3.5 rounded-lg text-[15px] font-semibold border transition-colors disabled:cursor-not-allowed hover:opacity-90"
                    >
                      I'm not interested
                    </button>
                  </div>
                  <div className="mt-3.5 p-3 border border-gray-200 rounded-lg bg-white">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <strong>NOTE:</strong> Submitting captures your <em>interest</em>. AV Operations will follow up within a few business days to complete subscription documents, accreditation verification, and wiring instructions through the standard av.vc investor portal. Your investment is not finalized until those steps are complete and counter-signed.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Interest Modal */}
      <Modal isOpen={showInterestModal} onClose={() => { setShowInterestModal(false); setInvestmentAmount(''); setInvestmentAmountType('up_to'); setReason(''); setInterestType(''); setSelectedDeal(null); }} title={interestType === 'want_to_invest' ? 'Investment Interest' : 'Pass on Deal'} size="md">
        {selectedDeal && (
          <div className="space-y-4">
            <div className="text-gray-700 space-y-2">
              {interestType === 'want_to_invest' ? (
                <>
                  <p>You're expressing interest to invest in <strong>{selectedDeal.company_name}</strong>.</p>
                  <p>We will follow up with you to discuss next steps.</p>
                </>
              ) : (
                <>
                  <p>You're passing on <strong>{selectedDeal.company_name}</strong>.</p>
                  <p>Help us understand why so we can improve future deal flow.</p>
                </>
              )}
            </div>
            {interestType === 'want_to_invest' && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                  <p className="text-sm text-amber-800"><strong>Note:</strong> Minimum check is $10K.</p>
                  <p className="text-sm text-amber-800"><strong>OOI determines final allocations</strong> — desired amount is not guaranteed.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Desired Investment Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      placeholder="e.g., 50,000"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="1000"
                    />
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {[
                      { label: '$10K', value: 10000 },
                      { label: '$25K', value: 25000 },
                      { label: '$50K', value: 50000 },
                      { label: '$100K', value: 100000 },
                      { label: '$250K', value: 250000 },
                      { label: '$500K', value: 500000 },
                      { label: '$1M+', value: 1000000 },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => setInvestmentAmount(String(chip.value))}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded-full text-xs text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{interestType === 'not_interested' ? 'Why are you passing?' : 'Why are you interested?'} *</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={interestType === 'not_interested' ? 'e.g., Not in my investment thesis, valuation concerns, etc.' : 'e.g., Strong market opportunity, experienced team, innovative technology, etc.'} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 resize-none" minLength="10" />
              <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowInterestModal(false); setInvestmentAmount(''); setInvestmentAmountType('up_to'); setReason(''); setInterestType(''); setSelectedDeal(null); }} disabled={submitting}>Cancel</Button>
              <Button onClick={handleInterestSubmit} disabled={submitting || !reason || reason.trim().length < 10} className={interestType === 'not_interested' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-green-600 hover:bg-green-700'}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Document Viewer Modal — watermarked PDF via /api/doc-view proxy */}
      <DocumentModal
        isOpen={showDocumentModal}
        materialId={docMaterialId}
        directUrl={docDirectUrl}
        title={documentTitle}
        onClose={() => {
          setShowDocumentModal(false);
          setDocMaterialId(null);
          setDocDirectUrl('');
          setDocumentTitle('');
        }}
      />

      {/* Video Modal — embeds YouTube/Vimeo/Loom share URLs */}
      <VideoModal
        isOpen={showVideoModal}
        src={videoUrl}
        title={videoTitle}
        onClose={() => {
          setShowVideoModal(false);
          setVideoUrl('');
          setVideoTitle('');
        }}
      />
    </div>
    </>
  );
};

export default MemberDeals;
