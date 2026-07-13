import React from 'react';

interface StudentAvatarProps {
  avatar?: string;
  className?: string;
  sizeClassName?: string;
}

export function StudentAvatar({ avatar, className = '', sizeClassName = 'w-12 h-12 text-3xl' }: StudentAvatarProps) {
  if (!avatar) {
    return (
      <div className={`${sizeClassName} flex items-center justify-center bg-slate-100 rounded-full border-2 border-white ${className}`}>
        👶
      </div>
    );
  }
  
  const isImage = avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('/');
  
  if (isImage) {
    return (
      <img
        src={avatar}
        alt="Student Avatar"
        className={`${sizeClassName} rounded-full object-cover shadow-xs border-2 border-white ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }
  
  return (
    <div className={`${sizeClassName} flex items-center justify-center bg-blue-50 border-2 border-white rounded-full select-none ${className}`}>
      {avatar}
    </div>
  );
}
