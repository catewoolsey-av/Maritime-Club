import React, { useState, useEffect } from 'react';
import { Calendar, Users, BookOpen, TrendingUp, MessageSquare, Settings, ChevronRight, Play, FileText, CheckCircle, Clock, Bell, LogOut, Menu, X, Home, Video, ExternalLink, Upload, Plus, Edit, Trash2, Download, Eye, UserPlus, Mail, BarChart3, Activity, Target, Share2, Lock, Save, AlertCircle, Phone, User, Linkedin, Briefcase, DollarSign, MapPin, GripVertical, Star } from 'lucide-react';
import { supabase } from './supabase';
import { formatDate, formatTime, getTimeUntil } from './utils/formatters';
import { Button, Card, Badge, Modal, LoadingSpinner } from './components/ui';
import { Sidebar, Header } from './components/layout';
import { AdminLogin, MemberLogin } from './components/auth';
import {
  AdminDashboard,
  AdminMembers,
  AdminSessions,
  AdminDeals,
  AdminPortfolios,
  AdminAnnouncements,
  AdminSettings,
  AdminContent,
  RecruitsPipeline,
  AdminCohorts,
  AdminAVTeam
} from './views/admin';
import {
  MemberDashboard,
  MemberSessions,
  MemberContent,
  MemberDeals,
  MemberPortfolio,
  MemberCommunity,
  MemberProfileView,
  MemberDiscussions,
  MemberProfile
} from './views/member';
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
  const [siteSettings, setSiteSettings] = useState(null);
  
  // Current user - now based on logged in member
  const currentUser = loggedInMember || members[0];
  
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
    
    try {
      // Check member session
      const { data: memberSession } = await supabase
        .from('member_sessions')
        .select('member_id')
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .single();
      
      if (memberSession) {
        const { data: member } = await supabase
          .from('members')
          .select('*')
          .eq('id', memberSession.member_id)
          .single();
        
        if (member) {
          setLoggedInMember(member);
          setCurrentView('dashboard');
          // Auto-grant admin for av.vc emails
          if (member.email?.toLowerCase().endsWith('@av.vc')) {
            setIsAdmin(true);
          }
        }
      }
      
      // Check admin session
      const { data: adminSession } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .single();
      
      if (adminSession) {
        setIsAdmin(true);
        if (!memberSession) {
          setCurrentView('admin-dashboard');
        }
      }
    } catch (err) {
      console.log('No existing session');
    }
    
    setCheckingSession(false);
  };
  
  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
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
        supabase.from('site_settings').select('*').limit(1).single(),
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
    setLoading(false);
  };
  
  useEffect(() => {
    fetchData();
    checkExistingSessions();
  }, []);
  
  const handleMemberLogin = async (member, remember) => {
    setLoggedInMember(member);
    setCurrentView('dashboard');
    
    // Auto-grant admin for av.vc emails
    if (member.email?.toLowerCase().endsWith('@av.vc')) {
      setIsAdmin(true);
    }
    
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
    // AV team members get direct admin access
    if (currentUser?.email?.toLowerCase().endsWith('@av.vc')) {
      setIsAdmin(true);
      setCurrentView('admin-dashboard');
      return;
    }
    
    // For non-AV users, check if admin session exists in database
    const deviceId = getDeviceId();
    try {
      const { data: adminSession } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .single();
      
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
  
  const handleViewMember = (memberId) => {
    setViewingMemberId(memberId);
    setCurrentView('member-profile-view');
  };
  
  const viewTitles = {
    'dashboard': 'Home',
    'sessions': 'Meetings',
    'content': 'Content Library',
    'deals': 'Deals',
    'portfolio': 'My Venture Portfolio',
    'community': 'Club Members',
    'discussions': 'Discussions',
    'profile': 'My Profile',
    'member-profile-view': 'Member Profile',
    'admin-login': 'Admin Login',
    'admin-dashboard': 'Admin Overview',
    'admin-cohorts': 'Recruiting & Onboarding',
    'admin-members': 'Manage Members',
    'admin-recruits': 'Recruit Pipeline',
    'admin-leaders': 'Manage AV Team',
    'admin-sessions': 'Manage Meetings',
    'admin-content': 'Manage Content',
    'admin-deals': 'Manage Deals',
    'admin-portfolios': 'Manage Portfolios',
    'admin-announcements': 'Announcements',
    'admin-settings': 'Site Settings',
  };
  
  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1B4D5C' }}>
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
      case 'admin-cohorts':
        return <AdminCohorts onNavigate={setCurrentView} />;
      case 'admin-members':
        return <AdminMembers members={members} avTeam={avTeam} onRefresh={fetchData} />;
      case 'admin-recruits':
        return <RecruitsPipeline members={members} avTeam={avTeam} onRefresh={fetchData} />;
      case 'admin-leaders':
        return <AdminAVTeam avTeam={avTeam} onRefresh={fetchData} />;
      case 'admin-sessions':
        return <AdminSessions sessions={sessions} deals={deals} onRefresh={fetchData} />;
      case 'admin-deals':
        return <AdminDeals deals={deals} onRefresh={fetchData} />;
      case 'admin-announcements':
        return <AdminAnnouncements announcements={announcements} onRefresh={fetchData} />;
      case 'admin-portfolios':
        return <AdminPortfolios investments={investments} members={members} onRefresh={fetchData} />;
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
      case 'portfolio':
        return <MemberPortfolio investments={investments} currentUser={currentUser} />;
      case 'community':
        return <MemberCommunity members={members} avTeam={avTeam.filter(m => m.is_visible_to_members === true)} onViewMember={handleViewMember} />;
      case 'member-profile-view':
        const viewedMember = members.find(m => m.id === viewingMemberId) || avTeam.filter(m => m.is_visible_to_members === true).find(m => m.id === viewingMemberId);
        const isOwnProfile = viewedMember?.id === currentUser?.id;
        return <MemberProfileView 
          member={viewedMember} 
          currentUser={currentUser}
          isOwnProfile={isOwnProfile}
          isAdmin={isAdmin}
          onBack={() => setCurrentView('dashboard')} 
          onRefresh={fetchData}
        />;
      case 'discussions':
        return <MemberDiscussions />;
      case 'profile':
        return <MemberProfile currentUser={currentUser} isAdmin={isAdmin} onRefresh={fetchData} />;
      
      // Default: Member Dashboard
      default:
        return <MemberDashboard members={members} sessions={sessions} deals={deals} announcements={announcements} avTeam={avTeam.filter(m => m.is_visible_to_members === true)} onNavigate={setCurrentView} onViewMember={handleViewMember} currentUser={currentUser} onRefresh={fetchData} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
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
          subtitle={isAdmin ? 'Admin Mode' : 'Next Gen Venture Club'}
          setIsOpen={setSidebarOpen}
        />
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
    </div>
  );
}
