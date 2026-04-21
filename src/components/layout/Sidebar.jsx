import React from 'react';
import { Home, Calendar, TrendingUp, Briefcase, Users, BookOpen, BarChart3, Star, Bell, Settings, LogOut, CheckSquare } from 'lucide-react';
import { resolveAssetUrl } from '../../utils/assetUrls';

export const Sidebar = ({ currentView, setCurrentView, userRole, isOpen, setIsOpen, isAdmin, onLogoutAdmin, onAdminClick, currentUser, onMemberLogout, siteSettings }) => {
  const memberNav = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'sessions', label: 'Meetings', icon: Calendar },
    { id: 'deals', label: 'Deals', icon: TrendingUp },
    { id: 'community', label: 'Club Members', icon: Users },
    { id: 'content', label: 'Content Library', icon: BookOpen },
    { id: 'announcements', label: 'Announcements', icon: Bell },
  ];
  
  const adminNav = [
    { id: 'admin-dashboard', label: 'Overview', icon: BarChart3 },
    { id: 'admin-members', label: 'Members', icon: Users },
    { id: 'admin-leaders', label: 'AV Team', icon: Star },
    { id: 'admin-sessions', label: 'Meetings', icon: Calendar },
    { id: 'admin-content', label: 'Manage Content', icon: BookOpen },
    { id: 'admin-deals', label: 'Deals', icon: TrendingUp },
    { id: 'admin-deal-interests', label: 'Deal Interests', icon: CheckSquare },
    { id: 'admin-portfolios', label: 'Portfolios', icon: Briefcase },
    { id: 'admin-announcements', label: 'Announcements', icon: Bell },
    { id: 'admin-settings', label: 'Settings', icon: Settings },
  ];
  
  const navItems = isAdmin ? adminNav.filter((item) => item.id !== 'admin-portfolios') : memberNav;
  
  // Get branding from settings or use defaults
  const primaryColor = siteSettings?.primary_color || '#1B4D5C';
  const accentColor = siteSettings?.accent_color || '#C9A227';
  const clubName = siteSettings?.club_name || 'Next Gen';
  const clubSubtitle = siteSettings?.club_subtitle || 'Venture Club';
  const logoUrl = resolveAssetUrl(siteSettings?.logo_url, '/av-logo.png');
  const logoBackgroundColor = siteSettings?.logo_background_color || '#1B4D5C';
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-50 transform transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: primaryColor }}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: logoBackgroundColor }}>
              <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-white">{clubName}</h1>
              <p className="text-xs text-white/60">{clubSubtitle}</p>
            </div>
          </div>
        </div>
        
        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                currentView === item.id
                  ? 'text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              style={currentView === item.id ? { backgroundColor: accentColor } : {}}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom Section - User Profile + Controls */}
        {currentUser && (
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            {/* User Profile */}
            <div 
              className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/10 cursor-pointer hover:bg-white/15 transition-colors"
              onClick={() => { setCurrentView('profile'); setIsOpen(false); }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg overflow-hidden" style={{ backgroundColor: accentColor }}>
                {currentUser.photo_url ? (
                  <img src={currentUser.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-medium text-sm">
                    {currentUser.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser.full_name}</p>
                <p className="text-xs text-white/60">My Profile</p>
              </div>
            </div>

            {/* Admin/Member Toggle - Only for admin users */}
            {currentUser?.is_manager === true && (
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-xs text-white/60 mb-2 px-2">{isAdmin ? 'Admin Mode' : 'Member Mode'}</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setCurrentView('dashboard'); onLogoutAdmin(); }}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${!isAdmin ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'}`}
                  >
                    Member
                  </button>
                  <button
                    onClick={onAdminClick}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${isAdmin ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'}`}
                  >
                    Admin
                  </button>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onMemberLogout(); }}
              className="w-full px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
