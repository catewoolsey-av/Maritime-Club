import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, ExternalLink, CheckCircle, Mail, AlertCircle, ChevronDown, ChevronRight, Globe, CalendarClock, Archive, Power } from 'lucide-react';
import { supabase, callDealRoomAdmin } from '../../supabase';
import { Button, Card, Modal } from '../../components/ui';
import { sendDealPostedEmail, sendDealActiveEmail, isEmailTestMode, CATE_EMAIL } from '../../utils/emailNotifications';
import { formatDealDescription } from '../../utils/formatDealDescription';

const AdminDeals = ({ deals, onRefresh }) => {
  // Add deal picker state
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [sb2Deals, setSb2Deals] = useState([]);
  const [loadingSb2, setLoadingSb2] = useState(false);
  const [adding, setAdding] = useState({});
  const [alreadyAdded, setAlreadyAdded] = useState(new Set());
  const [dealSearch, setDealSearch] = useState('');

  // Deal detail state
  const [expandedDeal, setExpandedDeal] = useState(null);
  const [dealMaterials, setDealMaterials] = useState({});
  const [loadingMaterials, setLoadingMaterials] = useState({});

  // Club-deadline modal state
  const [deadlineModalDeal, setDeadlineModalDeal] = useState(null);
  const [deadlineInputValue, setDeadlineInputValue] = useState('');
  const [savingDeadline, setSavingDeadline] = useState(false);

  // Email state
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailTestMode, setEmailTestMode] = useState(true);
  const [pendingEmailType, setPendingEmailType] = useState(null);
  const [pendingDealData, setPendingDealData] = useState(null);

  // Track which supabase2 deals are already added locally
  useEffect(() => {
    const added = new Set();
    deals.forEach(d => {
      if (d.source_deal_id) added.add(d.source_deal_id);
    });
    setAlreadyAdded(added);
  }, [deals]);

  // Preload deal-room details for every source-linked deal so the company logo
  // is available in the collapsed row, before the user clicks to expand.
  const [detailsPreloading, setDetailsPreloading] = useState(deals.some(d => d.source_deal_id));
  useEffect(() => {
    const sourceIds = deals.map(d => d.source_deal_id).filter(Boolean);
    if (sourceIds.length === 0) {
      setDetailsPreloading(false);
      return;
    }
    let cancelled = false;
    setDetailsPreloading(true);
    Promise.all(sourceIds.map(id => loadDealDetail(id)))
      .finally(() => { if (!cancelled) setDetailsPreloading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals]);

  // Load active + considering deals from the deal room (via Netlify function)
  const loadSb2Deals = async () => {
    setLoadingSb2(true);
    try {
      const { deals: data } = await callDealRoomAdmin('listSourceDeals');

      const sorted = (data || []).filter(d => d.name || d.company_name).sort((a, b) => {
        const order = { 'Active': 0, 'Considering': 1 };
        const diff = (order[a.deal_status] ?? 2) - (order[b.deal_status] ?? 2);
        if (diff !== 0) return diff;
        return new Date(a.created_at) - new Date(b.created_at);
      });

      setSb2Deals(sorted);
    } catch (err) {
      console.error('Error loading deals:', err);
    } finally {
      setLoadingSb2(false);
    }
  };

  // Load full deal detail from supabase2 (description, terms, materials)
  const [dealDetails, setDealDetails] = useState({});

  const loadDealDetail = async (sourceDealId) => {
    try {
      const { description, deadline_at, terms } = await callDealRoomAdmin('getDealDetail', { sourceDealId });
      setDealDetails(prev => ({
        ...prev,
        [sourceDealId]: {
          description: description || null,
          deadline_at: deadline_at || null,
          terms: terms || null,
        },
      }));
    } catch (err) {
      console.error('Error loading deal detail:', err);
    }
  };

  // Load materials for a specific deal from the deal room (via Netlify function)
  const loadMaterials = async (sourceDealId) => {
    setLoadingMaterials(prev => ({ ...prev, [sourceDealId]: true }));
    try {
      const { materials } = await callDealRoomAdmin('getDealMaterials', { sourceDealId });
      setDealMaterials(prev => ({ ...prev, [sourceDealId]: materials || [] }));
    } catch (err) {
      console.error('Error loading materials:', err);
      setDealMaterials(prev => ({ ...prev, [sourceDealId]: [] }));
    } finally {
      setLoadingMaterials(prev => ({ ...prev, [sourceDealId]: false }));
    }
  };

  const openPicker = () => {
    setDealSearch('');
    loadSb2Deals();
    setShowPickerModal(true);
  };

  // Add a deal from supabase2 to local portal
  const addDeal = async (sb2Deal) => {
    setAdding(prev => ({ ...prev, [sb2Deal.id]: true }));
    try {
      const localDeal = {
        company_name: sb2Deal.name || sb2Deal.company_name || '',
        headline: sb2Deal.headline || '',
        company_url: sb2Deal.company_url || '',
        deck_url: sb2Deal.deck_url || '',
        status: 'active',
        source_deal_id: sb2Deal.id,
        // closes_at intentionally left null — admin sets the club deadline
        // explicitly via the CalendarClock button after the deal is added.
      };

      const { error } = await supabase.from('deals').insert([localDeal]);
      if (error) throw error;

      // Register the share on SB2 so ClubManagementCW's Club > Deals tab and
      // any other cross-club view can see this club picked up the deal.
      // Best-effort — failure here shouldn't block the local insert.
      try {
        await callDealRoomAdmin('registerDealShare', { sourceDealId: sb2Deal.id });
      } catch (regErr) {
        console.warn('Failed to register deal_share on SB2 (deal added locally OK):', regErr);
      }

      setAlreadyAdded(prev => new Set([...prev, sb2Deal.id]));
      // Silent refresh — a non-silent fetchData() flips the app into its
      // loading state, which unmounts this view and wipes the email-confirm
      // modal state before it can render.
      onRefresh({ silent: true });

      // Email prompt
      setPendingDealData({
        companyName: localDeal.company_name,
        headline: localDeal.headline,
      });
      setPendingEmailType('posted');
      const testMode = await isEmailTestMode();
      setEmailTestMode(testMode);
      setShowPickerModal(false);
      setShowEmailConfirm(true);
    } catch (err) {
      console.error('Error adding deal:', err);
      alert('Error adding deal: ' + err.message);
    } finally {
      setAdding(prev => ({ ...prev, [sb2Deal.id]: false }));
    }
  };

  const removeDeal = async (deal) => {
    if (!confirm(`Remove "${deal.company_name}" from your club portal?`)) return;
    try {
      const { error } = await supabase.from('deals').delete().eq('id', deal.id);
      if (error) throw error;
      // Mirror the removal on SB2 deal_shares so the cross-club view stays in
      // sync. Best-effort.
      if (deal.source_deal_id) {
        try {
          await callDealRoomAdmin('unregisterDealShare', { sourceDealId: deal.source_deal_id });
        } catch (regErr) {
          console.warn('Failed to unregister deal_share on SB2:', regErr);
        }
      }
      onRefresh();
    } catch (err) {
      alert('Error removing deal: ' + err.message);
    }
  };

  // Send the "deal is active — invest now" reminder for a single deal.
  // (This used to fire automatically when a deal was added; now it's manual.)
  const openActiveEmail = async (deal) => {
    setPendingDealData({ companyName: deal.company_name, headline: deal.headline });
    setPendingEmailType('active');
    const testMode = await isEmailTestMode();
    setEmailTestMode(testMode);
    setShowEmailConfirm(true);
  };

  // Toggle whether members can see the Invest/Pass buttons for this deal.
  // Default is OFF; the admin opts the deal in once they're ready for member
  // input. Doesn't send any notification — purely a visibility flag.
  const toggleInterestActive = async (deal) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ interest_active: !deal.interest_active })
        .eq('id', deal.id);
      if (error) throw error;
      onRefresh();
    } catch (err) {
      alert('Error updating activation: ' + err.message);
    }
  };

  // Mark a deal as past — sets the club deadline (closes_at) to now so it moves
  // to members' Past tab. Past/active is driven entirely by closes_at, so this
  // just back-dates the deadline. Stays in the admin list for later review.
  const markAsPast = async (deal) => {
    if (!confirm(`Mark "${deal.company_name}" as past? It will move to the Past tab and no longer show as active to members.`)) return;
    try {
      const { error } = await supabase.from('deals').update({ closes_at: new Date().toISOString() }).eq('id', deal.id);
      if (error) throw error;
      onRefresh();
    } catch (err) {
      alert('Error marking deal as past: ' + err.message);
    }
  };

  // Render a stored UTC instant as Eastern (America/New_York) wall-clock for the
  // datetime-local input, so the admin always edits in ET regardless of their
  // own browser timezone.
  const toDatetimeLocalValue = (iso) => {
    if (!iso) return '';
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(iso));
    const get = (t) => parts.find(p => p.type === t)?.value;
    let hour = get('hour');
    if (hour === '24') hour = '00';
    return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
  };

  // Interpret a datetime-local string ("YYYY-MM-DDTHH:mm") as Eastern wall-clock
  // and return the corresponding UTC ISO string. Handles EST/EDT automatically.
  const easternLocalToUtcIso = (localValue) => {
    if (!localValue) return null;
    const [datePart, timePart] = localValue.split('T');
    const [y, mo, d] = datePart.split('-').map(Number);
    const [h, mi] = timePart.split(':').map(Number);
    const naiveUtc = Date.UTC(y, mo - 1, d, h, mi);
    const etParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(new Date(naiveUtc));
    const getp = (t) => Number(etParts.find(p => p.type === t)?.value);
    let etHour = getp('hour'); if (etHour === 24) etHour = 0;
    const etShownAsUtc = Date.UTC(getp('year'), getp('month') - 1, getp('day'), etHour, getp('minute'));
    return new Date(2 * naiveUtc - etShownAsUtc).toISOString();
  };

  const openDeadlineModal = (deal) => {
    setDeadlineModalDeal(deal);
    setDeadlineInputValue(toDatetimeLocalValue(deal.closes_at));
  };

  const saveDeadline = async () => {
    if (!deadlineModalDeal) return;
    setSavingDeadline(true);
    try {
      const isoValue = easternLocalToUtcIso(deadlineInputValue);
      const { error } = await supabase
        .from('deals')
        .update({ closes_at: isoValue })
        .eq('id', deadlineModalDeal.id);
      if (error) throw error;
      onRefresh();
      setDeadlineModalDeal(null);
      setDeadlineInputValue('');
    } catch (err) {
      alert('Error saving deadline: ' + err.message);
    } finally {
      setSavingDeadline(false);
    }
  };

  // Toggle deal detail expand + load materials
  const toggleDeal = (deal) => {
    if (expandedDeal === deal.id) {
      setExpandedDeal(null);
    } else {
      setExpandedDeal(deal.id);
      if (deal.source_deal_id) {
        loadDealDetail(deal.source_deal_id);
        loadMaterials(deal.source_deal_id);
      }
    }
  };

  // Filter picker deals by search
  const filteredSb2Deals = sb2Deals.filter(d => {
    if (!dealSearch) return true;
    const q = dealSearch.toLowerCase();
    return (d.name || '').toLowerCase().includes(q) ||
           (d.headline || '').toLowerCase().includes(q) ||
           (d.company_url || '').toLowerCase().includes(q);
  });

  // Document type labels
  const docTypeLabels = {
    'due_diligence': 'Due Diligence',
    'pitch_deck': 'Pitch Deck',
    'cap_table': 'Cap Table',
    'term_sheet': 'Term Sheet',
    'financial_projections': 'Financial Projections',
    'offering_documents': 'Offering Documents',
    'additional': 'Additional Media',
  };

  const getDocLabel = (material) => {
    return docTypeLabels[material.doc_type] || docTypeLabels[material.material_type] || material.title || 'Document';
  };

  // Canonical order of material types (matches member-side display)
  const docTypeOrder = ['due_diligence', 'pitch_deck', 'cap_table', 'term_sheet', 'financial_projections', 'offering_documents', 'additional'];
  const getMaterialType = (m) => m.doc_type || m.material_type || '';
  const sortMaterials = (mats) => {
    const rank = (m) => {
      const idx = docTypeOrder.indexOf(getMaterialType(m));
      return idx === -1 ? docTypeOrder.length : idx;
    };
    return [...mats].sort((a, b) => rank(a) - rank(b));
  };

  // Icon color per material type — mirrors member-side colors
  const getDocIconStyle = (m) => {
    const t = getMaterialType(m);
    if (t === 'due_diligence') return { wrap: 'bg-blue-100', icon: 'text-blue-600' };
    if (t === 'pitch_deck') return { wrap: 'bg-purple-100', icon: 'text-purple-600' };
    return { wrap: 'bg-orange-100', icon: 'text-orange-600' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage Deals</h2>
          <p className="text-sm text-gray-500">{deals.length} deal{deals.length !== 1 ? 's' : ''} in portal</p>
        </div>
        <Button icon={Plus} onClick={openPicker}>Add Deal</Button>
      </div>

      {/* Deals List */}
      {detailsPreloading ? (
        <Card>
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
          </div>
        </Card>
      ) : deals.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">No deals yet. Click "Add Deal" to get started.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {deals.map(deal => {
            const isExpanded = expandedDeal === deal.id;
            const materials = dealMaterials[deal.source_deal_id] || [];
            const isLoadingMats = loadingMaterials[deal.source_deal_id];
            const headerLogoSrc = dealDetails[deal.source_deal_id]?.terms?.company_image_path || deal.company_logo;

            return (
              <Card key={deal.id} className="overflow-hidden !p-0">
                {/* Deal row */}
                <div
                  onClick={() => toggleDeal(deal)}
                  className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    }
                    <div className="w-9 h-9 rounded-md border border-gray-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                      {headerLogoSrc ? (
                        <img
                          src={headerLogoSrc}
                          alt={deal.company_name}
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/av-logo.png'; e.currentTarget.className = 'w-5 h-5 object-contain'; }}
                        />
                      ) : (
                        <img src="/av-logo.png" alt="AV" className="w-5 h-5 object-contain" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">{deal.company_name}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 flex-shrink-0">
                          {deal.status}
                        </span>
                      </div>
                      {deal.headline && (
                        <p className="text-sm text-gray-500 truncate mt-0.5">{deal.headline}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4" onClick={e => e.stopPropagation()}>
                    {deal.closes_at && (
                      <span className="text-sm text-gray-500 hidden sm:inline mr-1" title={`Closes ${new Date(deal.closes_at).toLocaleString('en-US', { timeZone: 'America/New_York' })}`}>
                        Closes {new Date(deal.closes_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })}
                      </span>
                    )}
                    <button
                      onClick={() => openDeadlineModal(deal)}
                      className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Set club deadline"
                    >
                      <CalendarClock size={18} />
                    </button>
                    {(() => {
                      const isPast = !!(deal.closes_at && new Date(deal.closes_at).getTime() < Date.now());
                      const isOn = !!deal.interest_active;
                      return (
                        <button
                          onClick={() => !isPast && toggleInterestActive(deal)}
                          disabled={isPast}
                          className={`p-2.5 rounded-lg transition-colors ${
                            isPast
                              ? 'text-gray-300 cursor-not-allowed'
                              : isOn
                                ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          title={isPast
                            ? 'Cannot activate a closed deal'
                            : isOn
                              ? 'Active — members can invest/pass. Click to deactivate.'
                              : 'Activate — let members invest/pass'}
                        >
                          <Power size={18} />
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => openActiveEmail(deal)}
                      className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Email members: deal is active — invest now"
                    >
                      <Mail size={18} />
                    </button>
                    <button
                      onClick={() => markAsPast(deal)}
                      className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Mark deal as past"
                    >
                      <Archive size={18} />
                    </button>
                    <button
                      onClick={() => removeDeal(deal)}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove deal"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Expanded detail — read-only */}
                {isExpanded && (() => {
                  const detail = dealDetails[deal.source_deal_id] || {};
                  const terms = detail.terms || {};

                  return (
                  <div className="border-t border-gray-200 px-5 py-4 bg-gray-50">
                    <div className="grid sm:grid-cols-2 gap-4 mb-5">
                      {deal.company_url && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Website</p>
                          <a href={deal.company_url.startsWith('http') ? deal.company_url : `https://${deal.company_url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            <Globe size={12} /> {deal.company_url.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                      {terms.sector && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Sector</p>
                          <p className="text-sm text-gray-900">{terms.sector}</p>
                        </div>
                      )}
                      {terms.stage && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Stage</p>
                          <p className="text-sm text-gray-900">{terms.stage}</p>
                        </div>
                      )}
                      {terms.lead_investor && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Lead Investor</p>
                          <p className="text-sm text-gray-900">{terms.lead_investor}</p>
                        </div>
                      )}
                      {terms.valuation && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Valuation</p>
                          <p className="text-sm text-gray-900">{terms.valuation}</p>
                        </div>
                      )}
                      {terms.av_allocation && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">AV Allocation</p>
                          <p className="text-sm text-gray-900">{terms.av_allocation}</p>
                        </div>
                      )}
                    </div>

                    {/* Description — prefers dr_deal_terms.investment_description, falls back to deals.description */}
                    {(() => {
                      const text = terms.investment_description?.trim() || detail.description?.trim();
                      if (!text) return null;
                      return (
                        <div className="mb-5">
                          <p className="text-xs text-gray-500 mb-1">Description</p>
                          <div
                            className="text-sm text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formatDealDescription(text) }}
                          />
                        </div>
                      );
                    })()}

                    {/* Why We're Excited About The Opportunity (dr_deal_terms.excitement JSONB) */}
                    {(() => {
                      let excitement = null;
                      const raw = terms.excitement;
                      if (raw) {
                        if (typeof raw === 'string') {
                          try { excitement = JSON.parse(raw); } catch { excitement = null; }
                        } else if (typeof raw === 'object') {
                          excitement = raw;
                        }
                      }
                      if (!excitement || (!excitement.opening && (!excitement.bullets || excitement.bullets.length === 0) && !excitement.closing)) return null;
                      return (
                        <div className="mb-5">
                          <p className="text-xs text-gray-500 mb-2">Why We're Excited About The Opportunity</p>
                          <div className="bg-white border border-gray-200 rounded-lg p-3">
                            {excitement.opening && (
                              <p className="text-sm text-gray-700 leading-relaxed mb-2.5 whitespace-pre-line">{excitement.opening}</p>
                            )}
                            {excitement.bullets && excitement.bullets.length > 0 && (
                              <ul className="space-y-2 mb-2.5">
                                {excitement.bullets.map((b, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)' }}>
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polyline points="20 6 9 17 4 12"/></svg>
                                    </span>
                                    <div className="flex-1 text-sm">
                                      {b.title && <span className="font-semibold text-gray-900">{b.title}</span>}
                                      {b.title && b.body && <span className="text-gray-700">: </span>}
                                      {b.body && <span className="text-gray-700 whitespace-pre-line">{b.body}</span>}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {excitement.closing && (
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{excitement.closing}</p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Materials */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Deal Materials</h4>

                      {isLoadingMats ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                          Loading materials...
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {/* Materials from deal_materials table in supabase2 — sorted to match member-side order */}
                          {sortMaterials(materials.filter(m => !m.is_archived)).map(mat => {
                            const { wrap, icon } = getDocIconStyle(mat);
                            const label = getDocLabel(mat);
                            const fileName = mat.file_name || mat.title || '';
                            return (
                              <a
                                key={mat.id}
                                href={mat.signed_url || mat.url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors bg-white"
                              >
                                <div className={`w-8 h-8 ${wrap} rounded-md flex items-center justify-center flex-shrink-0`}>
                                  <FileText size={16} className={icon} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-900 block truncate">{label}</span>
                                  {fileName && <span className="text-[10px] text-gray-400 block truncate">{fileName}</span>}
                                </div>
                                <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
                              </a>
                            );
                          })}

                          {materials.filter(m => !m.is_archived).length === 0 && (
                            <p className="text-sm text-gray-400 py-3">No materials uploaded yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })()}
              </Card>
            );
          })}
        </div>
      )}

      {/* Set Club Deadline Modal */}
      <Modal
        isOpen={!!deadlineModalDeal}
        onClose={() => { setDeadlineModalDeal(null); setDeadlineInputValue(''); }}
        title={deadlineModalDeal ? `Set Deadline — ${deadlineModalDeal.company_name}` : 'Set Deadline'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Set a club-specific deadline for this deal. When this date passes, the deal automatically moves to the <strong>Past</strong> tab on the member side. Leave empty to keep it active — the deadline is the only thing that moves a deal to Past.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Closes At</label>
            <input
              type="datetime-local"
              value={deadlineInputValue}
              onChange={(e) => setDeadlineInputValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Time is in U.S. Eastern (ET).</p>
          </div>
          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setDeadlineInputValue('')}
              disabled={savingDeadline || !deadlineInputValue}
            >
              Clear
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setDeadlineModalDeal(null); setDeadlineInputValue(''); }} disabled={savingDeadline}>Cancel</Button>
              <Button onClick={saveDeadline} disabled={savingDeadline}>
                {savingDeadline ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Deal Picker Modal */}
      <Modal isOpen={showPickerModal} onClose={() => setShowPickerModal(false)} title="Add Deal" size="xl">
        {loadingSb2 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : sb2Deals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No active deals found.</p>
          </div>
        ) : (
          <div className="max-h-[70vh] flex flex-col">
            <div className="mb-3">
              <input
                type="text"
                value={dealSearch}
                onChange={(e) => setDealSearch(e.target.value)}
                placeholder="Search deals..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="overflow-y-auto space-y-1.5 flex-1">
              {filteredSb2Deals.map(deal => {
                const isAdded = alreadyAdded.has(deal.id);
                const isAdding = adding[deal.id];

                return (
                  <div
                    key={deal.id}
                    className={`px-3 py-2.5 border rounded-lg flex items-center justify-between gap-3 ${isAdded ? 'bg-gray-50 border-gray-200' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'} transition-colors`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 truncate">{deal.name || deal.company_name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${
                          deal.deal_status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {deal.deal_status}
                        </span>
                        {deal.stage && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 bg-gray-100 text-gray-600">
                            {deal.stage}
                          </span>
                        )}
                        {deal.is_uk && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 bg-blue-100 text-blue-700">
                            UK Version
                          </span>
                        )}
                      </div>
                      {deal.headline && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{deal.headline}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {isAdded ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle size={14} /> Added
                        </span>
                      ) : (
                        <button
                          onClick={() => addDeal(deal)}
                          disabled={isAdding}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {isAdding ? '...' : 'Add'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredSb2Deals.length === 0 && dealSearch && (
                <p className="text-center text-sm text-gray-500 py-6">No deals match "{dealSearch}"</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Email Confirmation Modal */}
      <Modal isOpen={showEmailConfirm} onClose={() => { setShowEmailConfirm(false); setPendingDealData(null); }} title="Send Email Notification?" size="md">
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {pendingEmailType === 'active' ? 'Send "deal is active — invest now" reminder' : 'New deal added'}
            </p>
            <p className="text-sm text-gray-600">{pendingDealData?.companyName}</p>
          </div>
          <div className={`p-4 rounded-lg border ${emailTestMode ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className={`mt-0.5 flex-shrink-0 ${emailTestMode ? 'text-amber-600' : 'text-red-600'}`} />
              <div>
                <p className={`text-sm font-semibold ${emailTestMode ? 'text-amber-900' : 'text-red-900'}`}>
                  {emailTestMode ? 'Test Mode — Email will only go to:' : 'LIVE MODE — Email will go to:'}
                </p>
                <p className={`text-sm mt-1 ${emailTestMode ? 'text-amber-700' : 'text-red-700'}`}>
                  {emailTestMode ? CATE_EMAIL : 'All club members, club leaders, and ' + CATE_EMAIL}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => { setShowEmailConfirm(false); setPendingDealData(null); }}>
              Don't Send Email
            </Button>
            <Button
              onClick={async () => {
                if (!pendingDealData) return;
                setEmailSending(true);
                try {
                  if (pendingEmailType === 'posted' || pendingEmailType === 'both') await sendDealPostedEmail(pendingDealData);
                  if (pendingEmailType === 'active' || pendingEmailType === 'both') await sendDealActiveEmail(pendingDealData);
                } catch (err) {
                  console.error('Failed to send deal email:', err);
                }
                setEmailSending(false);
                setShowEmailConfirm(false);
                setPendingDealData(null);
              }}
              disabled={emailSending}
              icon={Mail}
            >
              {emailSending ? 'Sending...' : (emailTestMode ? 'Send Test Email' : 'Send to All')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDeals;
