import React, { useState, useEffect } from 'react';
import { X, Sun, Moon, Monitor, Palette, User, Bell, Shield } from 'lucide-react';
import { useAuth } from '../store/hooks';

const SimpleSettingsModal = ({ isOpen, onClose }) => {
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('appearance');

  const { user } = useAuth();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Apply theme changes to document
  useEffect(() => {
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (selectedTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, [selectedTheme]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const themeOptions = [
    { 
      id: 'light', 
      name: 'Light', 
      icon: Sun, 
      description: 'Light theme for better visibility in bright environments' 
    },
    { 
      id: 'dark', 
      name: 'Dark', 
      icon: Moon, 
      description: 'Dark theme for reduced eye strain in low light' 
    },
    { 
      id: 'system', 
      name: 'System', 
      icon: Monitor, 
      description: 'Follow your system theme preference' 
    }
  ];

  const sidebarItems = [
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'account', name: 'Account', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100000]"
      onClick={handleBackdropClick}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100000
      }}
    >
      <div 
        className="bg-slate-800 text-white rounded-xl shadow-2xl w-[900px] h-[600px] overflow-hidden border border-slate-600 animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600/50">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-orange-400">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Changes saved automatically</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Close settings"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-72 bg-slate-900/50 p-6 border-r border-slate-600/50">
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'appearance' && (
              <div className="space-y-8">
                {/* Theme Section */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {themeOptions.map((theme) => {
                      const Icon = theme.icon;
                      const isSelected = selectedTheme === theme.id;
                      
                      return (
                        <button
                          key={theme.id}
                          onClick={() => setSelectedTheme(theme.id)}
                          className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                              : 'border-slate-600 hover:border-slate-500 bg-slate-700/30 hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-3">
                            <Icon className="w-8 h-8" />
                            <div className="text-center">
                              <span className="text-lg font-semibold block">{theme.name}</span>
                              <span className="text-sm text-slate-400 mt-1 leading-tight">{theme.description}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-8">
                {/* Profile Information */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Profile Information</h3>
                  <div className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'K'}
                      </div>
                      <div>
                        <h4 className="text-white text-xl font-semibold">
                          {user?.name || 'Krish Patel'}
                        </h4>
                        <p className="text-slate-400">
                          {user?.email || 'krish@gmail.com'}
                        </p>
                        <p className="text-slate-500 text-sm">
                          Role: community_leader • Joined: Recently
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Stats */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Account Stats</h3>
                  <div className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-slate-400 text-sm mb-1">Account Status</h4>
                        <p className="text-green-400 font-semibold">Active</p>
                      </div>
                      <div>
                        <h4 className="text-slate-400 text-sm mb-1">Last Login</h4>
                        <p className="text-white font-semibold">9/14/2025</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Changes Saved Indicator */}
                <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="text-orange-400 font-medium">Changes saved automatically</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Notification Settings</h3>
                <div className="p-6 bg-slate-700/30 rounded-xl border border-slate-600/50">
                  <p className="text-slate-400">Notification settings will be available in a future update.</p>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Security Settings</h3>
                <div className="p-6 bg-slate-700/30 rounded-xl border border-slate-600/50">
                  <p className="text-slate-400">Security settings will be available in a future update.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleSettingsModal;