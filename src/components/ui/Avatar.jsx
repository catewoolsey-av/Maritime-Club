import React from 'react';

/**
 * Avatar Component - Shows initials by default, emoji as fallback
 * @param {string} fullName - Full name to generate initials from
 * @param {string} emoji - Optional emoji (used only if showEmoji is true)
 * @param {string} photoUrl - Optional photo URL (takes precedence if provided)
 * @param {string} backgroundColor - Background color (default: #C9A227 for yellow)
 * @param {string} size - Size: 'xs', 'sm', 'md', 'lg', 'xl' (default: 'md')
 * @param {boolean} showEmoji - If true, show emoji instead of initials (default: false)
 * @param {string} className - Additional CSS classes
 */
export const Avatar = ({ 
  fullName = '', 
  emoji = '👤', 
  backgroundColor = 'var(--accent-color, #C9A227)',
  photoUrl = '',
  size = 'md',
  showEmoji = false,
  className = ''
}) => {
  // Get initials from full name (first letter of first and last name)
  const getInitials = (name) => {
    if (!name || !name.trim()) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Size mapping
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
    '2xl': 'w-32 h-32 text-5xl',
  };

  const initials = getInitials(fullName);
  
  // Determine if we should show emoji or initials
  const shouldShowEmoji = showEmoji && emoji && emoji !== '👤' && emoji !== 'initials' && emoji !== 'initial';
  const hasPhoto = !!photoUrl;

  return (
    <div 
      className={`rounded-full flex items-center justify-center font-semibold overflow-hidden ${sizeClasses[size] || sizeClasses.md} ${className}`}
      style={{ backgroundColor }}
    >
      {hasPhoto ? (
        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
      ) : shouldShowEmoji ? (
        <span className="text-[1.2em]">{emoji}</span>
      ) : (
        <span className="text-white">{initials}</span>
      )}
    </div>
  );
};
