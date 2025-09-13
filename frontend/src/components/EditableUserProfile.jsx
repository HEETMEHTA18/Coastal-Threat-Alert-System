import React, { useState } from 'react';
import { Edit3, Check, X, User } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../store/hooks';
import { updateUserProfile } from '../store/slices/authSlice';

const EditableUserProfile = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  const handleSave = () => {
    if (editName.trim()) {
      dispatch(updateUserProfile({
        name: editName.trim(),
        email: editEmail.trim(),
      }));
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setIsEditing(false);
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'from-red-500 to-red-600',
      analyst: 'from-blue-500 to-blue-600',
      user: 'from-green-500 to-green-600',
      guest: 'from-slate-500 to-slate-600'
    };
    return colors[role?.toLowerCase()] || colors.user;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.trim().split(' ').filter(n => n.length > 0);
    if (names.length === 0) return 'U';
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 bg-gradient-to-r ${getRoleColor(user?.role)} rounded-full flex items-center justify-center text-white font-bold text-xl ring-2 ring-white/20`}>
              {getInitials(user?.name)}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-1 px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group">
                  <div className="flex items-center gap-2">
                    <div className="text-white font-medium text-lg">
                      {user?.name || 'User Name'}
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-all"
                    >
                      <Edit3 className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="text-slate-400">
                    {user?.email || 'user@example.com'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>Role: {user?.role || 'User'}</span>
                    <span>•</span>
                    <span>Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
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
          )}
        </div>
      </div>

      {!isEditing && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Edit Profile
            </button>
            <button className="w-full sm:w-auto px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors ml-0 sm:ml-3">
              Change Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableUserProfile;