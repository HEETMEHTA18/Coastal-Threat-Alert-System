import React from 'react';
import { useAuth } from '../store/hooks';

const UserProfileDisplay = ({ variant = 'full' }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-xs">G</span>
        </div>
        {variant === 'full' && (
          <div>
            <div style={{ color: 'var(--text-primary)' }} className="font-medium">Guest User</div>
            <div style={{ color: 'var(--text-muted)' }} className="text-sm">Not authenticated</div>
          </div>
        )}
      </div>
    );
  }

  // Get user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.trim().split(' ').filter(n => n.length > 0);
    if (names.length === 0) return 'U';
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'from-red-500 to-red-600',
      analyst: 'from-blue-500 to-blue-600',
      user: 'from-green-500 to-green-600',
      guest: 'from-slate-500 to-slate-600'
    };
    return colors[role?.toLowerCase()] || colors.user;
  };

  const initials = getInitials(user.name);
  const roleColor = getRoleBadgeColor(user.role);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 bg-gradient-to-r ${roleColor} rounded-full flex items-center justify-center`}>
          <span className="text-white font-semibold text-xs">{initials}</span>
        </div>
        <span style={{ color: 'var(--text-primary)' }} className="font-medium truncate max-w-24">{user.name}</span>
      </div>
    );
  }

  if (variant === 'avatar-only') {
    return (
      <div className={`w-8 h-8 bg-gradient-to-r ${roleColor} rounded-full flex items-center justify-center`}>
        <span className="text-white font-semibold text-xs">{initials}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 bg-gradient-to-r ${roleColor} rounded-full flex items-center justify-center ring-2 ring-white/20 shadow-lg`}>
        <span className="text-white font-bold text-sm">{initials}</span>
      </div>
      <div>
        <div style={{ color: 'var(--text-primary)' }} className="font-bold">{user.name}</div>
        <div style={{ color: 'var(--text-muted)' }} className="text-sm flex items-center gap-2 font-medium">
          <span>{user.email}</span>
          {user.role && (
            <>
              <span>•</span>
              <span className="capitalize bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">{user.role}</span>
            </>
          )}
        </div>
        {user.department && (
          <div style={{ color: 'var(--text-muted)' }} className="text-xs opacity-75">{user.department}</div>
        )}
      </div>
    </div>
  );
};

export default UserProfileDisplay;