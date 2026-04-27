import React, { useState, useEffect } from 'react';
import { Save, Upload, Settings, AlertCircle, Mail, ShieldAlert } from 'lucide-react';
import { supabase } from '../../supabase';
import { Button, Card, Modal } from '../../components/ui';
import { resolveAssetUrl } from '../../utils/assetUrls';

const AdminSettings = ({ siteSettings, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLiveModeConfirm, setShowLiveModeConfirm] = useState(false);
  const [liveModeConfirmText, setLiveModeConfirmText] = useState('');
  const [formData, setFormData] = useState({
    club_name: siteSettings?.club_name || 'Next Gen',
    club_subtitle: siteSettings?.club_subtitle || 'Venture Club',
    cohort_name: siteSettings?.cohort_name ?? '',
    cohort_number: siteSettings?.cohort_number ?? '',
    primary_color: siteSettings?.primary_color || '#1B4D5C',
    accent_color: siteSettings?.accent_color || '#C9A227',
    logo_url: siteSettings?.logo_url || '/av-logo.png',
    logo_background_color: siteSettings?.logo_background_color || '#1B4D5C',
    email_test_mode: siteSettings?.email_test_mode !== false, // default true
  });

  useEffect(() => {
    if (siteSettings) {
      setFormData({
        club_name: siteSettings.club_name || 'Next Gen',
        club_subtitle: siteSettings.club_subtitle || 'Venture Club',
        cohort_name: siteSettings.cohort_name ?? '',
        cohort_number: siteSettings.cohort_number ?? '',
        primary_color: siteSettings.primary_color || '#1B4D5C',
        accent_color: siteSettings.accent_color || '#C9A227',
        logo_url: siteSettings.logo_url || '/av-logo.png',
        logo_background_color: siteSettings.logo_background_color || '#1B4D5C',
        email_test_mode: siteSettings.email_test_mode !== false,
      });
    }
  }, [siteSettings]);

  const persistSettings = async (nextFormData) => {
    setLoading(true);
    setSaveSuccess(false);
    
    try {
      console.log('Saving settings:', nextFormData);
      
      // Always get the first/latest settings row
      const { data: existingSettings } = await supabase
        .from('site_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (existingSettings?.id) {
        // Update existing row
        const { error } = await supabase
          .from('site_settings')
          .update(nextFormData)
          .eq('id', existingSettings.id);
        if (error) throw error;
      } else {
        // Insert new row if none exists
        const { error } = await supabase
          .from('site_settings')
          .insert([nextFormData]);
        if (error) throw error;
      }
      
      setSaveSuccess(true);
      
      // Refresh data from parent to update all components
      if (onRefresh) {
        await onRefresh();
      }
      
      // Show success for 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Error saving settings: ' + err.message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    await persistSettings(formData);
  };

  const handleEmailTestModeChange = async (email_test_mode) => {
    const nextFormData = { ...formData, email_test_mode };
    setFormData(nextFormData);
    await persistSettings(nextFormData);
  };

  const colorPresets = [
    { name: 'AV Blue', primary: '#063d54', accent: '#6e8ea0' },
    { name: 'AV Gold', primary: '#063d54', accent: '#b4a474' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Site Settings</h2>
          <p className="text-gray-500">Customize branding and appearance</p>
        </div>
        <Button onClick={handleSave} disabled={loading} icon={loading ? null : Save}>
          {loading ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Naming */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Club Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Club Name</label>
              <input
                type="text"
                value={formData.club_name}
                onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                placeholder="Next Gen"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={formData.club_subtitle}
                onChange={(e) => setFormData({ ...formData, club_subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                placeholder="Venture Club"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cohort Number</label>
              <input
                type="text"
                value={formData.cohort_number}
                onChange={(e) => setFormData({ ...formData, cohort_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                placeholder="1"
              />
            </div>
          </div>
        </Card>

        {/* Logo */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Logo</h3>
          <div className="space-y-4">
            {/* Logo Preview */}
            <div 
              className="w-20 h-20 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: formData.logo_background_color }}
            >
              <img src={resolveAssetUrl(formData.logo_url, '/av-logo.png')} alt="Logo" className="w-16 h-16 object-contain" />
            </div>
            
            {/* Logo Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo Style</label>
              <select
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
              >
                <option value="/av-logo.png">Navy Logo</option>
                <option value="/av-white-logo.png">White Logo</option>
              </select>
            </div>
            
            {/* Logo Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo Background Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.logo_background_color}
                  onChange={(e) => setFormData({ ...formData, logo_background_color: e.target.value })}
                  className="w-12 h-10 border border-gray-200 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.logo_background_color}
                  onChange={(e) => setFormData({ ...formData, logo_background_color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                  placeholder="#1B4D5C"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Colors */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Colors</h3>
          
          {/* Presets */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-3">Quick Presets</p>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setFormData({ ...formData, primary_color: preset.primary, accent_color: preset.accent })}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.primary }}></div>
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.accent }}></div>
                  <span className="text-sm text-gray-700">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Custom Colors */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color (Sidebar)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 font-mono"
                  placeholder="#1B4D5C"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color (Buttons, Highlights)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 font-mono"
                  placeholder="#C9A227"
                />
              </div>
            </div>
          </div>
          
          {/* Preview */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500 mb-3">Preview</p>
            <div className="flex items-center gap-4">
              <div
                className="w-64 h-16 rounded-lg flex items-center gap-3 px-4"
                style={{ backgroundColor: formData.primary_color }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: formData.logo_background_color }}>
                  {formData.logo_url && <img src={resolveAssetUrl(formData.logo_url, '/av-logo.png')} alt="" className="w-8 h-8 object-contain" />}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">
                    {formData.club_name}{formData.cohort_name ? ` (${formData.cohort_name})` : ''}
                  </p>
                  <p className="text-white/60 text-xs">{formData.club_subtitle}</p>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: formData.accent_color }}
              >
                Sample Button
              </button>
            </div>
          </div>
        </Card>

        {/* Email Notifications */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Mail size={20} className="text-gray-700" />
            <h3 className="font-semibold text-gray-900">Email Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-2 ${formData.email_test_mode ? 'border-amber-300 bg-amber-50' : 'border-red-300 bg-red-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className={formData.email_test_mode ? 'text-amber-600' : 'text-red-600'} />
                  <p className="font-semibold text-gray-900">
                    {formData.email_test_mode ? 'Test Mode (Safe)' : 'LIVE MODE — Emails go to ALL members'}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${formData.email_test_mode ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'}`}>
                  {formData.email_test_mode ? 'TESTING' : 'LIVE'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {formData.email_test_mode
                  ? 'All notification emails (announcements, deals) are sent only to cate.woolsey@av.vc for testing. Meeting notifications are handled via Google Calendar invites.'
                  : 'All notification emails (announcements, deals) are being sent to every club member and club leader. Meeting notifications are handled via Google Calendar invites.'}
              </p>
              {formData.email_test_mode ? (
                <Button
                  variant="outline"
                  onClick={() => setShowLiveModeConfirm(true)}
                  className="text-sm"
                >
                  Switch to Live Mode...
                </Button>
              ) : (
                <Button
                  onClick={() => handleEmailTestModeChange(true)}
                  disabled={loading}
                  className="text-sm"
                >
                  Switch Back to Test Mode
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Live Mode Confirmation Modal */}
      <Modal isOpen={showLiveModeConfirm} onClose={() => { setShowLiveModeConfirm(false); setLiveModeConfirmText(''); }} title="Enable Live Email Mode" size="md">
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <ShieldAlert size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">Warning: This will send emails to ALL members</p>
                <p className="text-sm text-red-700 mt-1">
                  Every new announcement and deal notification will be emailed to all club members and club leaders. Make sure you have tested emails in test mode first.
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <strong>GO LIVE</strong> to confirm
            </label>
            <input
              type="text"
              value={liveModeConfirmText}
              onChange={(e) => setLiveModeConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
              placeholder="GO LIVE"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => { setShowLiveModeConfirm(false); setLiveModeConfirmText(''); }}>Cancel</Button>
            <Button
              disabled={liveModeConfirmText !== 'GO LIVE' || loading}
              onClick={async () => {
                setShowLiveModeConfirm(false);
                setLiveModeConfirmText('');
                await handleEmailTestModeChange(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Enable Live Mode
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


export default AdminSettings;
