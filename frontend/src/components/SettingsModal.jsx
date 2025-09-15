import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  Monitor, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Volume2,
  VolumeX,
  Zap,
  ZapOff,
  Save,
  RefreshCw
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useUI, useAuth } from '../store/hooks';
import { closeModal, updateTheme, updateNotificationSettings } from '../store/slices/uiSlice';
import EditableUserProfile from './EditableUserProfile';

const SettingsModal = ({ isOpen: externalIsOpen, onClose: externalOnClose }) => {
  const dispatch = useDispatch();
  const { theme, notifications, modals } = useUI();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('appearance');
  const [hasChanges, setHasChanges] = useState(false);

  // Use external props if provided, otherwise use Redux state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : modals.settings.open;

  // Debug logging for modal state
  useEffect(() => {
    console.log('🔧 SettingsModal - externalIsOpen:', externalIsOpen);
    console.log('🔧 SettingsModal - modals state:', modals);
    console.log('🔧 SettingsModal - final isOpen:', isOpen);
  }, [externalIsOpen, modals, isOpen]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Handle Escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  console.log('🔧 SettingsModal: Rendering modal with isOpen =', isOpen);
  console.log('🔧 SettingsModal: External isOpen =', externalIsOpen);
  console.log('🔧 SettingsModal: Redux modals state =', modals);

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose(); // Use external close handler
    }
    dispatch(closeModal({ modalName: 'settings' })); // Also close Redux state
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleThemeChange = (newTheme) => {
    console.log('handleThemeChange called with:', newTheme);
    console.log('Current theme state:', theme);
    dispatch(updateTheme(newTheme));
    setHasChanges(true);
    
    // Force a re-render to ensure UI updates
    setTimeout(() => {
      console.log('Updated theme state should be:', { ...theme, ...newTheme });
    }, 100);
  };

  const handleNotificationChange = (setting, value) => {
    dispatch(updateNotificationSettings({ [setting]: value }));
    setHasChanges(true);
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun, description: 'Light theme for better visibility in bright environments' },
    { id: 'dark', label: 'Dark', icon: Moon, description: 'Dark theme for reduced eye strain in low light' },
    { id: 'auto', label: 'System', icon: Monitor, description: 'Follow your system theme preference' }
  ];

  const accentColors = [
    { id: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { id: 'cyan', label: 'Cyan', color: 'bg-cyan-500' },
    { id: 'green', label: 'Green', color: 'bg-green-500' },
    { id: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { id: 'red', label: 'Red', color: 'bg-red-500' },
    { id: 'purple', label: 'Purple', color: 'bg-purple-500' }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[99999] flex items-center justify-center p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="rounded-xl border border-gray-700 w-full max-w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden transition-all duration-300 bg-gray-800"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800"
        >
          <h2 className="text-lg sm:text-xl font-bold text-white">Settings</h2>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <div className="flex items-center gap-2 text-sm text-amber-500 font-medium">
                <RefreshCw className="w-4 h-4" />
                Changes saved automatically
              </div>
            )}
            <button
              onClick={handleClose}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row h-auto sm:h-[600px]">
          {/* Sidebar */}
          <div className="w-full sm:w-64 bg-slate-900/50 border-b sm:border-b-0 sm:border-r border-slate-700 p-4">
            <nav className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 sm:w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:block">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-none">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Theme</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = theme.mode === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            console.log('Theme change clicked:', option.id);
                            handleThemeChange({ mode: option.id });
                          }}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
                          }`}
                        >
                          <Icon className={`w-8 h-8 mx-auto mb-2 transition-colors ${
                            isSelected ? 'text-blue-400' : 'text-slate-400'
                          }`} />
                          <div className={`font-medium transition-colors ${
                            isSelected ? 'text-blue-300' : 'text-white'
                          }`}>{option.label}</div>
                          <div className="text-xs text-slate-400 mt-1">{option.description}</div>
                          {isSelected && (
                            <div className="mt-2 flex justify-center">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Accent Color</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {accentColors.map((color) => {
                      const isSelected = theme.accentColor === color.id;
                      return (
                        <button
                          key={color.id}
                          onClick={() => {
                            console.log('Accent color change clicked:', color.id);
                            handleThemeChange({ accentColor: color.id });
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                            isSelected
                              ? 'border-blue-500 bg-slate-700/50 shadow-lg'
                              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full ${color.color} ${
                            isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''
                          }`} />
                          <span className={`transition-colors ${
                            isSelected ? 'text-blue-300 font-semibold' : 'text-white'
                          }`}>{color.label}</span>
                          {isSelected && (
                            <div className="ml-auto">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Interface</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Animations</div>
                        <div className="text-sm text-slate-400">Enable smooth transitions and animations</div>
                      </div>
                      <button
                        onClick={() => {
                          console.log('Animations toggle clicked:', !theme.animations);
                          handleThemeChange({ animations: !theme.animations });
                        }}
                        className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                          theme.animations ? 'bg-blue-600' : 'bg-slate-600'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                          theme.animations ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Sound Effects</div>
                        <div className="text-sm text-slate-400">Play sounds for notifications and interactions</div>
                      </div>
                      <button
                        onClick={() => {
                          console.log('Sound effects toggle clicked:', !theme.soundEffects);
                          handleThemeChange({ soundEffects: !theme.soundEffects });
                        }}
                        className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                          theme.soundEffects ? 'bg-blue-600' : 'bg-slate-600'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                          theme.soundEffects ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="text-white font-medium text-lg">
                          {user?.name || 'User Name'}
                        </div>
                        <div className="text-slate-400">
                          {user?.email || 'user@example.com'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Role: {user?.role || 'User'} • Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Account Stats</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <div className="text-slate-400 text-sm">Account Status</div>
                      <div className="text-green-400 font-medium">Active</div>
                    </div>
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <div className="text-slate-400 text-sm">Last Login</div>
                      <div className="text-white font-medium">
                        {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Today'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Threat Alerts</div>
                        <div className="text-sm text-slate-400">Receive notifications for coastal threats in your area</div>
                      </div>
                      <button
                        onClick={() => handleNotificationChange('threats', !notifications.threats)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notifications.threats ? 'bg-red-600' : 'bg-slate-600'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.threats ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Weather Updates</div>
                        <div className="text-sm text-slate-400">Get notified about weather changes and conditions</div>
                      </div>
                      <button
                        onClick={() => handleNotificationChange('weather', !notifications.weather)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notifications.weather ? 'bg-blue-600' : 'bg-slate-600'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.weather ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">System Updates</div>
                        <div className="text-sm text-slate-400">Notifications about app updates and maintenance</div>
                      </div>
                      <button
                        onClick={() => handleNotificationChange('system', !notifications.system)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notifications.system ? 'bg-green-600' : 'bg-slate-600'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.system ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <div className="text-white font-medium mb-2">Two-Factor Authentication</div>
                      <div className="text-sm text-slate-400 mb-3">
                        Add an extra layer of security to your account
                      </div>
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                        Enable 2FA
                      </button>
                    </div>

                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <div className="text-white font-medium mb-2">Active Sessions</div>
                      <div className="text-sm text-slate-400 mb-3">
                        Manage your active login sessions
                      </div>
                      <button className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors">
                        View Sessions
                      </button>
                    </div>

                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <div className="text-white font-medium mb-2">Data Export</div>
                      <div className="text-sm text-slate-400 mb-3">
                        Download your account data and reports
                      </div>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        Export Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;