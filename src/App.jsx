import React, { useState, useEffect } from 'react';
import { Calendar, Users, BookOpen, TrendingUp, MessageSquare, Settings, ChevronRight, Play, FileText, CheckCircle, Clock, Bell, LogOut, Menu, X, Home, Video, ExternalLink, Upload, Plus, Edit, Trash2, Download, Eye, Mail, BarChart3, Activity, Target, Share2, Lock, Save, AlertCircle, Phone, User, Linkedin, Briefcase, DollarSign, MapPin, GripVertical, Star } from 'lucide-react';
import { supabase } from './supabase';
import { formatDate, formatTime, getTimeUntil } from './utils/formatters';
import { resolveAssetUrl } from './utils/assetUrls';
import { Button, Card, Badge, Modal, LoadingSpinner } from './components/ui';
import { Sidebar, Header } from './components/layout';
import { AdminLogin, MemberLogin } from './components/auth';
import {
  AdminDashboard,
  AdminMembers,
  AdminSessions,
  AdminDeals,
  AdminDealInterests,
  AdminPortfolios,
  AdminAnnouncements,
  AdminSettings,
  AdminContent,
  AdminAVTeam
} from './views/admin';
import {
  MemberDashboard,
  MemberSessions,
  MemberContent,
  MemberDeals,
  MemberCommunity,
  MemberProfileView,
  MemberDiscussions,
  MemberProfile,
  MemberAnnouncements
} from './views/members';
import { MessagingContext, MessagingProvider } from './contexts/MessagingContext';

// ============================================
// MAIN APP
// ============================================

export default function App() {
  const [currentView, setCurrentView] = useState('member-login');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewingMemberId, setViewingMemberId] = useState(null);
  const [previousView, setPreviousView] = useState('dashboard');
  const [loggedInMember, setLoggedInMember] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // Data
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [deals, setDeals] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [content, setContent] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [avTeam, setAvTeam] = useState([]);
  const getCachedSiteSettings = () => {
    try {
      const cached = localStorage.getItem('ngvc_site_settings');
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      return parsed || null;
    } catch {
      return null;
    }
  };
  const [siteSettings, setSiteSettings] = useState(() => getCachedSiteSettings());
  
  // Current user - now based on logged in member, enriched with av_team data if is_manager
  let currentUser = loggedInMember || members[0];
  
  // Enrich AV Team members with their av_team data
  if (currentUser?.is_manager && currentUser?.email) {
    const avData = avTeam.find(av => av.email === currentUser.email);
    if (avData) {
      // Preserve the member_id from members table, use av_team data for display only
      const memberId = currentUser.id;
      currentUser = { ...currentUser, ...avData, id: memberId, member_id: memberId };
      // Prefer av_team updates if member list is stale
      if (avData.title) currentUser.member_role = avData.title;
      if (avData.company) currentUser.member_company = avData.company;
      if (avData.phone) currentUser.whatsapp = avData.phone;
      if (avData.bio) currentUser.personal_statement = avData.bio;
    }
  }
  
  // Generate device ID for session tracking
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('ngvc_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('ngvc_device_id', deviceId);
    }
    return deviceId;
  };

  // Check for existing sessions on load
  const checkExistingSessions = async () => {
    setCheckingSession(true);
    const deviceId = getDeviceId();
    
    let storedView = null;
    let storedIsAdmin = false;
    try {
      storedView = localStorage.getItem('ngvc_current_view');
      storedIsAdmin = localStorage.getItem('ngvc_is_admin') === 'true';
    } catch {
      // ignore storage errors
    }

    // Refresh site settings on startup to avoid stale cached splash colors.
    try {
      const { data: settings } = await supabase
        .from('site_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (settings) {
        setSiteSettings(settings);
        document.documentElement.style.setProperty('--primary-color', settings.primary_color || '#1B4D5C');
        document.documentElement.style.setProperty('--accent-color', settings.accent_color || '#C9A227');
        document.documentElement.style.setProperty('--logo-background-color', settings.logo_background_color || '#1B4D5C');
        try {
          localStorage.setItem('ngvc_site_settings', JSON.stringify({
            primary_color: settings.primary_color || '#1B4D5C',
            accent_color: settings.accent_color || '#C9A227',
            logo_background_color: settings.logo_background_color || '#1B4D5C',
            logo_url: settings.logo_url || '/av-logo.png'
          }));
        } catch {
          // ignore storage errors
        }
      }
    } catch {
      // ignore settings errors and proceed
    }

    try {
      // Check member session - use maybeSingle() to avoid 406 errors
      const { data: memberSession, error: memberError } = await supabase
        .from('member_sessions')
        .select('member_id')
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (memberSession) {
        const { data: member } = await supabase
          .from('members')
          .select('*')
          .eq('id', memberSession.member_id)
          .maybeSingle();
        
        if (member) {
          setLoggedInMember(member);
          setIsAdmin(false); // Ensure member mode
          if (storedView && !storedView.startsWith('admin-')) {
            setCurrentView(storedView);
          } else {
            setCurrentView('dashboard');
          }
          // All users start on member side, even if they have admin capabilities
        }
      }
      
      // Check admin session - use maybeSingle() to avoid 406 errors
      // Check if admin session exists but don't auto-activate admin mode
      // Admin mode should only be activated via manual toggle
      const { data: adminSession, error: adminError } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (adminSession && storedIsAdmin && storedView?.startsWith('admin-')) {
        setIsAdmin(true);
        setCurrentView(storedView);
      }
      
      // Note: We don't auto-activate admin mode anymore
      // All users start on member side regardless of sessions
    } catch (err) {
      console.log('No existing session');
    }
    
    setCheckingSession(false);
  };
  
  // Fetch all data
  const fetchData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [membersRes, sessionsRes, dealsRes, announcementsRes, contentRes, investmentsRes, avTeamRes, rsvpsRes, settingsRes] = await Promise.all([
        supabase.from('members').select('*').order('created_at', { ascending: false }),
        supabase.from('sessions').select('*').order('date', { ascending: true }),
        supabase.from('deals').select('*').order('created_at', { ascending: false }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('content').select('*').order('sort_order', { ascending: true }),
        supabase.from('portfolio_investments').select('*').order('investment_date', { ascending: false }),
        supabase.from('av_team').select('*').eq('is_active', true).order('created_at', { ascending: true }),
        supabase.from('session_rsvps').select('*'),
        supabase.from('site_settings').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      
      if (membersRes.data) setMembers(membersRes.data);
      
      // Attach RSVPs to sessions
      if (sessionsRes.data) {
        const sessionsWithRSVPs = sessionsRes.data.map(session => ({
          ...session,
          rsvps: rsvpsRes.data?.filter(r => r.session_id === session.id) || []
        }));
        setSessions(sessionsWithRSVPs);
      }
      
      if (dealsRes.data) setDeals(dealsRes.data);
      if (announcementsRes.data) setAnnouncements(announcementsRes.data);
      if (contentRes.data) setContent(contentRes.data);
      if (investmentsRes.data) setInvestments(investmentsRes.data);
      if (avTeamRes.data) setAvTeam(avTeamRes.data);
      if (settingsRes.data) setSiteSettings(settingsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    if (!silent) setLoading(false);
  };
  
  // LinkedIn connect prompt — show once after login for members without LinkedIn
  const [showLinkedinPrompt, setShowLinkedinPrompt] = useState(false);

  useEffect(() => {
    if (!loggedInMember || loggedInMember.linkedin_connected) return;
    if (loggedInMember.photo_url) return;
    if (currentView !== 'dashboard') return;
    if (linkedinStatus) return;

    try {
      const permaDismissed = localStorage.getItem('ngvc_linkedin_prompt_never');
      if (permaDismissed) return;

      const skipped = localStorage.getItem('ngvc_linkedin_prompt_skipped');
      if (skipped) {
        const skippedAt = parseInt(skipped, 10);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - skippedAt < sevenDays) return;
      }
    } catch {}

    const timer = setTimeout(() => setShowLinkedinPrompt(true), 2000);
    return () => clearTimeout(timer);
  }, [loggedInMember, currentView]);

  const skipLinkedinPrompt = () => {
    setShowLinkedinPrompt(false);
    try {
      localStorage.setItem('ngvc_linkedin_prompt_skipped', String(Date.now()));
    } catch {}
  };

  const dismissLinkedinPromptForever = () => {
    setShowLinkedinPrompt(false);
    try {
      localStorage.setItem('ngvc_linkedin_prompt_never', 'true');
    } catch {}
  };

  // Handle LinkedIn OAuth redirect
  const [linkedinStatus, setLinkedinStatus] = useState(null);
  const [linkedinErrorDetail, setLinkedinErrorDetail] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedinParam = params.get('linkedin');
    if (linkedinParam) {
      setLinkedinStatus(linkedinParam);
      if (linkedinParam === 'error') {
        setLinkedinErrorDetail(`${params.get('reason') || 'unknown'}${params.get('detail') ? ': ' + params.get('detail') : ''}`);
      }
      window.history.replaceState({}, '', window.location.pathname);
      if (linkedinParam === 'connected') {
        fetchData({ silent: true });
        setCurrentView('profile');
        setShowLinkedinPrompt(false);
      }
      if (linkedinParam === 'connected') {
        setTimeout(() => setLinkedinStatus(null), 5000);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    checkExistingSessions();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ngvc_current_view', currentView);
      localStorage.setItem('ngvc_is_admin', isAdmin ? 'true' : 'false');
    } catch {
      // ignore storage errors
    }
  }, [currentView, isAdmin]);

  useEffect(() => {
    if (!siteSettings) return;
    document.documentElement.style.setProperty('--primary-color', siteSettings.primary_color || '#1B4D5C');
    document.documentElement.style.setProperty('--accent-color', siteSettings.accent_color || '#C9A227');
    document.documentElement.style.setProperty('--logo-background-color', siteSettings.logo_background_color || '#1B4D5C');
    if (siteSettings.logo_url) {
      const existingIcon = document.querySelector('link[rel~="icon"]');
      if (existingIcon) {
        existingIcon.href = resolveAssetUrl(siteSettings.logo_url, '/av-logo.png');
      } else {
        const icon = document.createElement('link');
        icon.rel = 'icon';
        icon.href = resolveAssetUrl(siteSettings.logo_url, '/av-logo.png');
        document.head.appendChild(icon);
      }
    }
    try {
      localStorage.setItem('ngvc_site_settings', JSON.stringify({
        primary_color: siteSettings.primary_color || '#1B4D5C',
        accent_color: siteSettings.accent_color || '#C9A227',
        logo_background_color: siteSettings.logo_background_color || '#1B4D5C',
        logo_url: siteSettings.logo_url || '/av-logo.png'
      }));
    } catch {
      // ignore storage errors
    }
  }, [siteSettings]);
  
  const handleMemberLogin = async (member, remember) => {
    setLoggedInMember(member);
    setCurrentView('dashboard');
    setIsAdmin(false); // Always start in member mode
    
    if (remember) {
      const deviceId = getDeviceId();
      try {
        // Clear any existing session for this device
        await supabase.from('member_sessions').delete().eq('device_id', deviceId);
        
        // Create new session
        await supabase.from('member_sessions').insert([{
          member_id: member.id,
          device_id: deviceId,
          is_active: true,
        }]);
      } catch (err) {
        console.error('Error saving member session:', err);
      }
    }
  };
  
  const handleMemberLogout = async () => {
    const deviceId = getDeviceId();
    try {
      await supabase.from('member_sessions').delete().eq('device_id', deviceId);
    } catch (err) {
      console.error('Error clearing member session:', err);
    }
    setLoggedInMember(null);
    setIsAdmin(false); // Reset admin mode
    setCurrentView('member-login');
  };
  
  const handleAdminLogin = async (remember) => {
    setIsAdmin(true);
    setCurrentView('admin-dashboard');
    
    if (remember) {
      const deviceId = getDeviceId();
      try {
        // Clear any existing admin session for this device
        await supabase.from('admin_sessions').delete().eq('device_id', deviceId);
        
        // Create new session
        await supabase.from('admin_sessions').insert([{
          device_id: deviceId,
          is_active: true,
        }]);
      } catch (err) {
        console.error('Error saving admin session:', err);
      }
    }
  };
  
  const handleLogoutAdmin = async () => {
    const deviceId = getDeviceId();
    try {
      await supabase.from('admin_sessions').delete().eq('device_id', deviceId);
    } catch (err) {
      console.error('Error clearing admin session:', err);
    }
    setIsAdmin(false);
  };

  const handleAdminClick = async () => {
    // Check if current member has is_manager flag
    if (currentUser?.is_manager === true) {
      setIsAdmin(true);
      setCurrentView('admin-dashboard');
      return;
    }
    
    // For non-admin users, check if admin session exists in database
    const deviceId = getDeviceId();
    try {
      const { data: adminSession } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (adminSession) {
        setIsAdmin(true);
        setCurrentView('admin-dashboard');
        return;
      }
    } catch (err) {
      // No session found
    }
    setCurrentView('admin-login');
  };
  
  const handleViewMember = (memberId, sourceView = 'dashboard') => {
    setViewingMemberId(memberId);
    setPreviousView(sourceView);
    setCurrentView('member-profile-view');
  };
  
  const viewTitles = {
    'dashboard': 'Home',
    'sessions': 'Meetings',
    'content': 'Content Library',
    'deals': 'Deals',
    'community': 'Club Members',
    'discussions': 'Discussions',
    'profile': 'My Profile',
    'member-profile-view': 'Member Profile',
    'admin-login': 'Admin Login',
    'admin-dashboard': 'Admin Overview',
    'admin-members': 'Manage Members',
    'admin-leaders': 'Manage AV Team',
    'admin-sessions': 'Manage Meetings',
    'admin-content': 'Manage Content',
    'admin-deals': 'Manage Deals',
    'admin-deal-interests': 'Deal Interests',
    'admin-portfolios': 'Manage Portfolios',
    'admin-announcements': 'Announcements',
    'admin-settings': 'Site Settings',
  };
  
  // Show loading while checking session
  if (checkingSession) {
    if (!siteSettings?.primary_color) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    const loadingBg = siteSettings.primary_color;
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: loadingBg }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Member login view
  if (currentView === 'member-login' && !loggedInMember) {
    return <MemberLogin onLogin={handleMemberLogin} members={members} />;
  }
  
  // Admin login view
  if (currentView === 'admin-login' && !isAdmin) {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }
  
  const renderView = () => {
    if (loading) return <LoadingSpinner />;
    
    switch (currentView) {
      // Admin views
      case 'admin-dashboard':
        return <AdminDashboard members={members} sessions={sessions} deals={deals} announcements={announcements} avTeam={avTeam} onNavigate={setCurrentView} onRefresh={fetchData} />;
      case 'admin-members':
        return <AdminMembers members={members} avTeam={avTeam} onRefresh={fetchData} />;
      case 'admin-leaders':
        return <AdminAVTeam avTeam={avTeam} onRefresh={fetchData} />;
      case 'admin-sessions':
        return <AdminSessions sessions={sessions} deals={deals} members={members} onRefresh={fetchData} />;
      case 'admin-deals':
        return <AdminDeals deals={deals} onRefresh={fetchData} />;
      case 'admin-deal-interests':
        return <AdminDealInterests onRefresh={fetchData} />;
      case 'admin-announcements':
        return <AdminAnnouncements announcements={announcements} onRefresh={fetchData} currentUser={currentUser} />;
      case 'admin-portfolios':
        return <AdminPortfolios investments={investments} members={members} deals={deals} onRefresh={fetchData} onNavigate={setCurrentView} />;
      case 'admin-content':
        return <AdminContent content={content} onRefresh={fetchData} />;
      case 'admin-settings':
        return <AdminSettings siteSettings={siteSettings} onRefresh={fetchData} />;
      
      // Member views
      case 'sessions':
        return <MemberSessions sessions={sessions} currentUser={currentUser} onRefresh={fetchData} />;
      case 'content':
        return <MemberContent content={content} sessions={sessions} />;
      case 'deals':
        return <MemberDeals deals={deals} currentUser={currentUser} />;
      case 'community':
        return <MemberCommunity members={members} avTeam={avTeam.filter(m => m.is_visible_to_members === true)} onViewMember={(id) => handleViewMember(id, 'community')} />;
      case 'announcements':
        return <MemberAnnouncements announcements={announcements} />;
      case 'member-profile-view':
        // Find member from either members or avTeam
        let viewedMember = members.find(m => m.id === viewingMemberId);
        
        // If not found in members, check avTeam
        if (!viewedMember) {
          const avMember = avTeam.filter(m => m.is_visible_to_members === true).find(m => m.id === viewingMemberId);
          if (avMember) {
            // Enrich av_team data with members table data if member exists
            // But av_team fields take priority, except for ID
            const memberData = members.find(m => m.email === avMember.email);
            if (memberData) {
              const memberId = memberData.id;
              viewedMember = { ...memberData, ...avMember, id: memberId, member_id: memberId };
            } else {
              viewedMember = avMember;
            }
          }
        } else if (viewedMember.is_manager) {
          // If member is an AV Team member, enrich with av_team data
          // av_team fields take priority, except for ID
          const avData = avTeam.find(av => av.email === viewedMember.email);
          if (avData) {
            const memberId = viewedMember.id;
            viewedMember = { ...viewedMember, ...avData, id: memberId, member_id: memberId };
            // Prefer av_team updates if member list is stale
            if (avData.title) viewedMember.member_role = avData.title;
            if (avData.company) viewedMember.member_company = avData.company;
            if (avData.phone) viewedMember.whatsapp = avData.phone;
            if (avData.bio) viewedMember.personal_statement = avData.bio;
          }
        }
        
        if (viewedMember?.email && loggedInMember?.email &&
            viewedMember.email.toLowerCase() === loggedInMember.email.toLowerCase()) {
          const memberId = viewedMember.id;
          viewedMember = viewedMember.is_manager
            ? { ...loggedInMember, ...viewedMember, id: memberId, member_id: memberId }
            : { ...viewedMember, ...loggedInMember, id: memberId, member_id: memberId };
        }
        
        const isOwnProfile = viewedMember?.id === currentUser?.id;
        return <MemberProfileView 
          member={viewedMember} 
          currentUser={currentUser}
          isOwnProfile={isOwnProfile}
          isAdmin={isAdmin}
          onBack={() => setCurrentView(previousView)} 
          backLabel={previousView === 'dashboard' ? 'Back to Dashboard' : 'Back to Members'}
          onRefresh={fetchData}
        />;
      case 'discussions':
        return <MemberDiscussions />;
      case 'profile':
        return <MemberProfile currentUser={currentUser} isAdmin={isAdmin} onRefresh={fetchData} onUserUpdate={setLoggedInMember} />;
      
      // Default: Member Dashboard
      default:
        return <MemberDashboard members={members} sessions={sessions} deals={deals} announcements={announcements} avTeam={avTeam.filter(m => m.is_visible_to_members === true)} content={content} onNavigate={setCurrentView} onViewMember={(id) => handleViewMember(id, 'dashboard')} currentUser={currentUser} onRefresh={fetchData} siteSettings={siteSettings} />;
    }
  };

  const primaryColor = siteSettings?.primary_color || '#1B4D5C';
  const accentColor = siteSettings?.accent_color || '#C9A227';
  const logoBackgroundColor = siteSettings?.logo_background_color || '#1B4D5C';
  
  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{
        '--primary-color': primaryColor,
        '--accent-color': accentColor,
        '--logo-background-color': logoBackgroundColor
      }}
    >
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        userRole={isAdmin ? 'admin' : 'member'}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isAdmin={isAdmin}
        onLogoutAdmin={handleLogoutAdmin}
        onAdminClick={handleAdminClick}
        currentUser={currentUser}
        onMemberLogout={handleMemberLogout}
        siteSettings={siteSettings}
      />
      
      <main className="lg:ml-64">
        <Header
          title={viewTitles[currentView] || 'Dashboard'}
          subtitle={isAdmin ? 'Admin Mode' : 'Member Mode'}
          setIsOpen={setSidebarOpen}
        />

        {/* LinkedIn OAuth feedback banner */}
        {linkedinStatus && (
          <div className={`mx-4 lg:mx-8 mt-4 px-4 py-3 rounded-lg flex items-center justify-between ${
            linkedinStatus === 'connected'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <span className="text-sm font-medium">
              {linkedinStatus === 'connected'
                ? 'LinkedIn connected successfully! Your photo and profile have been updated.'
                : linkedinStatus === 'denied'
                  ? 'LinkedIn connection was cancelled.'
                  : `Something went wrong connecting LinkedIn. ${linkedinErrorDetail || 'Please try again.'}`}
            </span>
            <button
              onClick={() => setLinkedinStatus(null)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="p-4 lg:p-8">
          {renderView()}
        </div>
        
        {/* Footer Disclaimer */}
        <footer className="px-4 lg:px-8 py-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500 leading-relaxed max-w-4xl mx-auto">
            Venture capital investing involves substantial risk, including risk of loss of all capital invested. Achievement of investment objectives cannot be guaranteed. Past performance does not guarantee future results. To see information on all AV fund investment performance, please see <a href="https://www.av.vc/performance" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">here</a>. To see additional risk factors and considerations, please see <a href="https://www.av.vc/risk-factors" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">here</a>.
          </p>
        </footer>
      </main>

      {/* LinkedIn connect prompt */}
      {showLinkedinPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="h-1.5" style={{ backgroundColor: 'var(--accent-color, #C9A227)' }} />
            <div className="p-6 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--primary-color, #1B4D5C) 15%, white)' }}>
                {loggedInMember?.photo_url ? (
                  <img src={loggedInMember.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={36} className="text-gray-300" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {loggedInMember?.photo_url ? 'Connect your LinkedIn' : 'Add your photo'}
              </h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Other club members see your profile during meetings. One click imports your photo and name from LinkedIn.
              </p>
              <a
                href={`/api/linkedin-auth?member_id=${loggedInMember?.id}`}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#0A66C2' }}
              >
                <Linkedin size={18} />
                Connect LinkedIn
              </a>
              <button
                onClick={skipLinkedinPrompt}
                className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                I'll do it myself
              </button>
              <button
                onClick={dismissLinkedinPromptForever}
                className="w-full text-xs text-gray-300 hover:text-gray-400 py-1"
              >
                Skip, and don't see again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
