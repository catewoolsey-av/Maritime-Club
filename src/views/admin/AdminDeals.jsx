import React, { useState } from 'react';
import { Plus, Edit, Trash2, DollarSign, TrendingUp, Clock, FileText, ExternalLink, Upload, Save, CheckCircle, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import { formatDate } from '../../utils/formatters';
import { Button, Card, Badge, Modal } from '../../components/ui';
import { sendDealPostedEmail, sendDealActiveEmail, isEmailTestMode, CATE_EMAIL } from '../../utils/emailNotifications';

const AdminDeals = ({ deals, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);

  // Email confirmation state
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailTestMode, setEmailTestMode] = useState(true);
  const [pendingEmailType, setPendingEmailType] = useState(null); // 'posted', 'active', or 'both'
  const [pendingDealData, setPendingDealData] = useState(null);
  const [viewingDeal, setViewingDeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingMemo, setUploadingMemo] = useState(false);
  const [uploadingDeck, setUploadingDeck] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState({});
  const [formData, setFormData] = useState({
    company_name: '',
    headline: '',
    sector: '',
    stage: '',
    description: '',
    raise_amount: '',
    valuation: '',
    valuation_type: '', // 'pre' or 'post'
    lead_investor: '',
    status: 'pending',
    company_url: '',
    company_logo: '',
    memo_url: '',
    deck_url: '',
    portal_url: '',
    mp_video_url: '',
    company_video_url: '',
    deal_deadline: '',
    av_allocation: '',
    minimum_check: '',
    highlights: [],
    risks: [],
    additional_media: [],
  });
  
  const sectorOptions = ['AI/ML', 'Healthcare', 'Fintech', 'Climate', 'Enterprise SaaS', 'Consumer', 'Deep Tech', 'Crypto/Web3', 'Space'];
  const stageOptions = ['Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Growth', 'Late Stage'];
  const statusOptions = ['pending', 'voting', 'reviewing', 'active', 'passed', 'closed'];
  
  const openAddModal = () => {
    setEditingDeal(null);
    setSaveSuccess(false);
    setFormData({
      company_name: '',
      headline: '',
      sector: '',
      stage: '',
      description: '',
      raise_amount: '',
      valuation: '',
      valuation_type: '',
      lead_investor: '',
      status: 'pending',
      company_url: '',
      company_logo: '',
      memo_url: '',
      deck_url: '',
      portal_url: '',
      mp_video_url: '',
      company_video_url: '',
      deal_deadline: '',
      av_allocation: '',
      minimum_check: '',
      highlights: [],
      risks: [],
      additional_media: [],
    });
    setShowModal(true);
  };
  
  const openEditModal = (deal) => {
    setEditingDeal(deal);
    setSaveSuccess(false);
    
    // Parse valuation to extract type (pre/post)
    let valuationType = '';
    let valuationValue = deal.valuation || '';
    if (valuationValue) {
      if (valuationValue.toLowerCase().includes('post')) {
        valuationType = 'post';
        valuationValue = valuationValue.replace(/post-money|post/gi, '').trim();
      } else if (valuationValue.toLowerCase().includes('pre')) {
        valuationType = 'pre';
        valuationValue = valuationValue.replace(/pre-money|pre/gi, '').trim();
      }
    }
    
    setFormData({
      company_name: deal.company_name || '',
      headline: deal.headline || '',
      sector: deal.sector || '',
      stage: deal.stage || '',
      description: deal.description || '',
      raise_amount: deal.raise_amount || '',
      valuation: valuationValue,
      valuation_type: valuationType,
      lead_investor: deal.lead_investor || '',
      status: deal.status || 'pending',
      company_url: deal.company_url || '',
      company_logo: deal.company_logo || '',
      memo_url: deal.memo_url || '',
      deck_url: deal.deck_url || '',
      portal_url: deal.portal_url || '',
      mp_video_url: deal.mp_video_url || '',
      company_video_url: deal.company_video_url || '',
      deal_deadline: deal.deal_deadline || deal.voting_deadline || '',
      av_allocation: deal.av_allocation || '',
      minimum_check: deal.minimum_check || '',
      highlights: deal.highlights || [],
      risks: deal.risks || [],
      additional_media: deal.additional_media || [],
    });
    setShowModal(true);
  };
  
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingLogo(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `deal-logos/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('content-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('content-files')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({
        ...prev,
        company_logo: urlData.publicUrl
      }));
      
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading logo: ' + err.message);
    }
    
    setUploadingLogo(false);
  };
  
  const handleMemoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingMemo(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `deal-memos/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('content-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('content-files')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({
        ...prev,
        memo_url: urlData.publicUrl
      }));
      
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading memo: ' + err.message);
    }
    
    setUploadingMemo(false);
  };
  
  const handleDeckUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingDeck(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `deal-decks/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('content-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('content-files')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({
        ...prev,
        deck_url: urlData.publicUrl
      }));
      
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading deck: ' + err.message);
    }
    
    setUploadingDeck(false);
  };
  
  const handleAddAdditionalMedia = () => {
    setFormData({
      ...formData,
      additional_media: [...formData.additional_media, { title: '', url: '' }]
    });
  };
  
  const handleRemoveAdditionalMedia = (index) => {
    setFormData({
      ...formData,
      additional_media: formData.additional_media.filter((_, i) => i !== index)
    });
  };
  
  const handleAdditionalMediaTitleChange = (index, title) => {
    const updated = [...formData.additional_media];
    updated[index] = { ...updated[index], title };
    setFormData({ ...formData, additional_media: updated });
  };
  
  const handleAdditionalMediaUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingAdditional({ ...uploadingAdditional, [index]: true });
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `deal-media/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('content-files')
        .upload(filePath, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('content-files')
        .getPublicUrl(filePath);
      
      const updated = [...formData.additional_media];
      updated[index] = { ...updated[index], url: urlData.publicUrl };
      setFormData({ ...formData, additional_media: updated });
      
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading file: ' + err.message);
    }
    
    setUploadingAdditional({ ...uploadingAdditional, [index]: false });
  };
  
  const handleSave = async () => {
    if (!formData.company_name.trim()) {
      alert('Company name is required');
      return;
    }
    
    setLoading(true);
    setSaveSuccess(false);
    
    try {
      // Clean up the data before saving
      // Format valuation with type if selected
      let formattedValuation = formData.valuation;
      if (formData.valuation && formData.valuation_type) {
        formattedValuation = `${formData.valuation} ${formData.valuation_type}-money`;
      }
      
      const saveData = {
        company_name: formData.company_name,
        headline: formData.headline,
        sector: formData.sector,
        stage: formData.stage,
        description: formData.description,
        raise_amount: formData.raise_amount,
        valuation: formattedValuation,
        lead_investor: formData.lead_investor,
        status: formData.status,
        company_url: formData.company_url,
        company_logo: formData.company_logo,
        memo_url: formData.memo_url,
        deck_url: formData.deck_url,
        portal_url: formData.portal_url,
        mp_video_url: formData.mp_video_url,
        company_video_url: formData.company_video_url,
        deal_deadline: formData.deal_deadline || null,
        av_allocation: formData.av_allocation,
        minimum_check: formData.minimum_check,
        highlights: formData.highlights,
        risks: formData.risks,
        additional_media: formData.additional_media,
      };
      
      console.log('Saving deal:', saveData); // Debug log
      
      if (editingDeal) {
        const previousStatus = editingDeal.status;
        const { data, error } = await supabase
          .from('deals')
          .update(saveData)
          .eq('id', editingDeal.id)
          .select();

        console.log('Update result:', { data, error }); // Debug log
        if (error) throw error;

        // Prompt to send email when deal status changes to "active"
        if (saveData.status === 'active' && previousStatus !== 'active') {
          const dealInfo = {
            companyName: saveData.company_name,
            headline: saveData.headline,
            sector: saveData.sector,
            stage: saveData.stage,
            raiseAmount: saveData.raise_amount,
            deadline: saveData.deal_deadline,
          };
          setPendingDealData(dealInfo);
          setPendingEmailType('active');
          const testMode = await isEmailTestMode();
          setEmailTestMode(testMode);
          setShowModal(false);
          setShowEmailConfirm(true);
          setLoading(false);
          return; // Don't refresh yet — wait for email decision
        }
      } else {
        const { data, error } = await supabase
          .from('deals')
          .insert([saveData])
          .select();

        console.log('Insert result:', { data, error }); // Debug log
        if (error) throw error;

        // Prompt to send email for new deal
        const dealInfo = {
          companyName: saveData.company_name,
          headline: saveData.headline,
          sector: saveData.sector,
          stage: saveData.stage,
          raiseAmount: saveData.raise_amount,
          deadline: saveData.deal_deadline,
        };
        setPendingDealData(dealInfo);
        setPendingEmailType(saveData.status === 'active' ? 'both' : 'posted');
        const testMode = await isEmailTestMode();
        setEmailTestMode(testMode);
        setShowModal(false);
        setShowEmailConfirm(true);
        setLoading(false);
        return; // Don't refresh yet — wait for email decision
      }

      setSaveSuccess(true);
      onRefresh();
      setTimeout(() => {
        setShowModal(false);
      }, 1000);
    } catch (err) {
      console.error('Error saving deal:', err);
      alert('Error saving deal: ' + err.message);
    }
    setLoading(false);
  };
  
  const handleDelete = async (deal) => {
    if (!confirm(`Are you sure you want to delete "${deal.company_name}"? This cannot be undone.`)) return;
    
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', deal.id);
      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Error deleting deal:', err);
      alert('Error deleting deal: ' + err.message);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'reviewing': return 'bg-yellow-100 text-yellow-700';
      case 'voting': return 'bg-purple-100 text-purple-700';
      case 'closed': return 'bg-green-100 text-green-700';
      case 'passed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage Deals</h2>
          <p className="text-sm text-gray-500">{deals.length} deals in pipeline</p>
        </div>
        <Button icon={Plus} onClick={openAddModal}>Add Deal</Button>
      </div>
      
      {/* Deals Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Sector</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stage</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Raise</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No deals yet. Click "Add Deal" to create one.
                  </td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewingDeal(deal)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-gray-200">
                          {deal.company_logo ? (
                            <img src={deal.company_logo} alt={deal.company_name} className="w-full h-full object-contain" />
                          ) : (
                            <img src="/av-logo.png" alt="AV" className="w-6 h-6 object-contain" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{deal.company_name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">{deal.headline || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{deal.sector || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{deal.stage || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{deal.raise_amount || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                        {deal.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(deal)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(deal)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDeal ? `Edit: ${editingDeal.company_name}` : 'Add New Deal'} size="xl">
        {saveSuccess ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-900">Saved Successfully!</p>
            <p className="text-gray-500">Deal has been saved to the database.</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Basic Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="AI-powered logistics platform"
                  />
                </div>
              </div>
              
              {/* Company Logo Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                <div className="flex items-center gap-4">
                  {formData.company_logo && (
                    <div className="w-16 h-16 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden bg-white">
                      <img src={formData.company_logo} alt="Logo preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploadingLogo && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                  </div>
                  {formData.company_logo && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, company_logo: '' })}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select sector...</option>
                    {sectorOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select stage...</option>
                    {stageOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Brief description of the company and opportunity..."
                />
              </div>
            </div>

            {/* Deal Terms */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Deal Terms</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raise Amount</label>
                  <input
                    type="text"
                    value={formData.raise_amount}
                    onChange={(e) => setFormData({ ...formData, raise_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="10M"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valuation</label>
                  <input
                    type="text"
                    value={formData.valuation}
                    onChange={(e) => setFormData({ ...formData, valuation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="50M Post"
                  />
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.valuation_type === 'pre'}
                        onChange={(e) => setFormData({ ...formData, valuation_type: e.target.checked ? 'pre' : '' })}
                        className="rounded"
                      />
                      Pre-money
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.valuation_type === 'post'}
                        onChange={(e) => setFormData({ ...formData, valuation_type: e.target.checked ? 'post' : '' })}
                        className="rounded"
                      />
                      Post-money
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Investor</label>
                  <input
                    type="text"
                    value={formData.lead_investor}
                    onChange={(e) => setFormData({ ...formData, lead_investor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Sequoia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AV Allocation</label>
                  <input
                    type="text"
                    value={formData.av_allocation}
                    onChange={(e) => setFormData({ ...formData, av_allocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="500k"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Check</label>
                  <input
                    type="text"
                    value={formData.minimum_check}
                    onChange={(e) => setFormData({ ...formData, minimum_check: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="25k"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Deadline</label>
                  <input
                    type="date"
                    value={formData.deal_deadline}
                    onChange={(e) => setFormData({ ...formData, deal_deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Documents & Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Documents & Status</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Website</label>
                  <input
                    type="url"
                    value={formData.company_url}
                    onChange={(e) => setFormData({ ...formData, company_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AV Portal (Data Room)</label>
                  <input
                    type="url"
                    value={formData.portal_url}
                    onChange={(e) => setFormData({ ...formData, portal_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DD Memo</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleMemoUpload}
                      className="hidden"
                      id="memo-upload"
                    />
                    <label
                      htmlFor="memo-upload"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Upload size={16} />
                      {uploadingMemo ? 'Uploading...' : formData.memo_url ? 'Change File' : 'Upload File'}
                    </label>
                    {formData.memo_url && (
                      <a href={formData.memo_url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-blue-300 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MP Video</label>
                  <input
                    type="url"
                    value={formData.mp_video_url}
                    onChange={(e) => setFormData({ ...formData, mp_video_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Deck</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx"
                      onChange={handleDeckUpload}
                      className="hidden"
                      id="deck-upload"
                    />
                    <label
                      htmlFor="deck-upload"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Upload size={16} />
                      {uploadingDeck ? 'Uploading...' : formData.deck_url ? 'Change File' : 'Upload File'}
                    </label>
                    {formData.deck_url && (
                      <a href={formData.deck_url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-purple-300 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Video</label>
                  <input
                    type="url"
                    value={formData.company_video_url}
                    onChange={(e) => setFormData({ ...formData, company_video_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://..."
                  />
                </div>
                
                {/* Additional Media */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Additional Media</label>
                    <button
                      type="button"
                      onClick={handleAddAdditionalMedia}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Add File
                    </button>
                  </div>
                  {formData.additional_media.length > 0 && (
                    <div className="space-y-2">
                      {formData.additional_media.map((media, index) => (
                        <div key={index} className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Title"
                            value={media.title}
                            onChange={(e) => handleAdditionalMediaTitleChange(index, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                              onChange={(e) => handleAdditionalMediaUpload(index, e)}
                              className="hidden"
                              id={`additional-upload-${index}`}
                            />
                            <label
                              htmlFor={`additional-upload-${index}`}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center gap-2 justify-center text-sm"
                            >
                              <Upload size={14} />
                              {uploadingAdditional[index] ? 'Uploading...' : media.url ? 'Change' : 'Upload'}
                            </label>
                            {media.url && (
                              <a href={media.url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-green-300 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                                <ExternalLink size={16} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveAdditionalMedia(index)}
                              className="px-3 py-2 border border-red-300 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({ ...formData, status })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          formData.status === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-500'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t sticky bottom-0 bg-white">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading} icon={loading ? null : Save}>
                {loading ? 'Saving...' : editingDeal ? 'Save Changes' : 'Add Deal'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Deal Modal - Deal Room Preview */}
      <Modal isOpen={!!viewingDeal} onClose={() => setViewingDeal(null)} title="" size="xl">
        {viewingDeal && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{viewingDeal.company_name}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(viewingDeal.status)}`}>
                      {viewingDeal.status?.charAt(0).toUpperCase() + viewingDeal.status?.slice(1) || 'Pending'}
                    </span>
                  </div>
                  {viewingDeal.headline && (
                    <p className="text-lg text-gray-600">{viewingDeal.headline}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => { setViewingDeal(null); openEditModal(viewingDeal); }} icon={Edit}>
                    Edit Deal
                  </Button>
                </div>
              </div>

              {viewingDeal.deal_deadline && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <Clock size={16} className="text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Deadline: {formatDate(viewingDeal.deal_deadline, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Deal Terms */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Deal Terms</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                    {viewingDeal.sector && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Sector</p>
                        <p className="font-semibold text-gray-900">{viewingDeal.sector}</p>
                      </div>
                    )}
                    {viewingDeal.stage && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Stage</p>
                        <p className="font-semibold text-gray-900">{viewingDeal.stage}</p>
                      </div>
                    )}
                    {viewingDeal.lead_investor && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Lead Investor</p>
                        <p className="font-semibold text-gray-900">{viewingDeal.lead_investor}</p>
                      </div>
                    )}
                    {viewingDeal.raise_amount && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Round Size</p>
                        <p className="font-semibold text-gray-900">${viewingDeal.raise_amount}</p>
                      </div>
                    )}
                    {viewingDeal.valuation && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Valuation</p>
                        <p className="font-semibold text-gray-900">${viewingDeal.valuation}</p>
                      </div>
                    )}
                    {viewingDeal.minimum_check && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Minimum Check</p>
                        <p className="font-semibold text-gray-900">${viewingDeal.minimum_check}</p>
                      </div>
                    )}
                    {viewingDeal.av_allocation && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">AV Allocation</p>
                        <p className="font-semibold text-gray-900">${viewingDeal.av_allocation}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {viewingDeal.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                      Investment Opportunity
                    </h3>
                    <div className="text-gray-700 leading-relaxed space-y-4">
                      {viewingDeal.description.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="text-base">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {viewingDeal.highlights && viewingDeal.highlights.length > 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">Investment Highlights</h3>
                    <ul className="space-y-3">
                      {viewingDeal.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span className="text-green-900">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risks */}
                {viewingDeal.risks && viewingDeal.risks.length > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-amber-900 mb-4">Key Risks</h3>
                    <ul className="space-y-3">
                      {viewingDeal.risks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span className="text-amber-900">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Documents Sidebar */}
              <div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Documents</h3>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className={`p-3 border rounded-lg ${viewingDeal.memo_url ? 'border-gray-200' : 'border-dashed border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <FileText size={20} className={viewingDeal.memo_url ? 'text-blue-600' : 'text-gray-400'} />
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${viewingDeal.memo_url ? 'text-gray-900' : 'text-gray-400'}`}>DD Memo</p>
                          <p className="text-xs text-gray-500">{viewingDeal.memo_url ? 'Available' : 'Not uploaded'}</p>
                        </div>
                        {viewingDeal.memo_url && (
                          <a href={viewingDeal.memo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className={`p-3 border rounded-lg ${viewingDeal.deck_url ? 'border-gray-200' : 'border-dashed border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <FileText size={20} className={viewingDeal.deck_url ? 'text-purple-600' : 'text-gray-400'} />
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${viewingDeal.deck_url ? 'text-gray-900' : 'text-gray-400'}`}>Pitch Deck</p>
                          <p className="text-xs text-gray-500">{viewingDeal.deck_url ? 'Available' : 'Not uploaded'}</p>
                        </div>
                        {viewingDeal.deck_url && (
                          <a href={viewingDeal.deck_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700">
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className={`p-3 border rounded-lg ${viewingDeal.portal_url ? 'border-gray-200' : 'border-dashed border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <ExternalLink size={20} className={viewingDeal.portal_url ? 'text-green-600' : 'text-gray-400'} />
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${viewingDeal.portal_url ? 'text-gray-900' : 'text-gray-400'}`}>AV Portal</p>
                          <p className="text-xs text-gray-500">{viewingDeal.portal_url ? 'Available' : 'Not uploaded'}</p>
                        </div>
                        {viewingDeal.portal_url && (
                          <a href={viewingDeal.portal_url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className={`p-3 border rounded-lg ${viewingDeal.mp_video_url ? 'border-gray-200' : 'border-dashed border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <ExternalLink size={20} className={viewingDeal.mp_video_url ? 'text-red-600' : 'text-gray-400'} />
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${viewingDeal.mp_video_url ? 'text-gray-900' : 'text-gray-400'}`}>MP Video</p>
                          <p className="text-xs text-gray-500">{viewingDeal.mp_video_url ? 'Available' : 'Not uploaded'}</p>
                        </div>
                        {viewingDeal.mp_video_url && (
                          <a href={viewingDeal.mp_video_url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-700">
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className={`p-3 border rounded-lg ${viewingDeal.company_video_url ? 'border-gray-200' : 'border-dashed border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <ExternalLink size={20} className={viewingDeal.company_video_url ? 'text-rose-600' : 'text-gray-400'} />
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${viewingDeal.company_video_url ? 'text-gray-900' : 'text-gray-400'}`}>Company Video</p>
                          <p className="text-xs text-gray-500">{viewingDeal.company_video_url ? 'Available' : 'Not uploaded'}</p>
                        </div>
                        {viewingDeal.company_video_url && (
                          <a href={viewingDeal.company_video_url} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:text-rose-700">
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={() => setViewingDeal(null)}>Close</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleDelete(viewingDeal)} className="text-red-600 hover:bg-red-50">
                  Delete
                </Button>
                <Button onClick={() => { setViewingDeal(null); openEditModal(viewingDeal); }} icon={Edit}>
                  Edit Deal
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Email Confirmation Modal */}
      <Modal isOpen={showEmailConfirm} onClose={() => { setShowEmailConfirm(false); setPendingDealData(null); }} title="Send Email Notification?" size="md">
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {pendingEmailType === 'active' ? 'Deal status changed to Active' : 'New deal posted'}
            </p>
            <p className="text-sm text-gray-600">{pendingDealData?.companyName}</p>
          </div>

          {pendingEmailType === 'both' && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-800">This will send 2 separate emails: "New Deal Posted" and "Deal Now Active"</p>
            </div>
          )}

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
            <Button variant="outline" onClick={() => { setShowEmailConfirm(false); setPendingDealData(null); onRefresh(); }}>
              Don't Send Email
            </Button>
            <Button
              onClick={async () => {
                if (!pendingDealData) return;
                setEmailSending(true);
                try {
                  if (pendingEmailType === 'posted' || pendingEmailType === 'both') {
                    await sendDealPostedEmail(pendingDealData);
                  }
                  if (pendingEmailType === 'active' || pendingEmailType === 'both') {
                    await sendDealActiveEmail(pendingDealData);
                  }
                } catch (err) {
                  console.error('Failed to send deal email:', err);
                }
                setEmailSending(false);
                setShowEmailConfirm(false);
                setPendingDealData(null);
                onRefresh();
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
