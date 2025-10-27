"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function ProfileMenu() {
  const { currentTeam, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!currentTeam) return null;

  const toggle = () => setOpen(o => !o);

  return (
    <div className="absolute top-3 right-3">
      <button onClick={toggle} className="w-10 h-10 bg-gray-700 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={`/logos/${currentTeam.teamId}-main.png.png`} 
          alt={`${currentTeam.teamName} logo`} 
          className="w-10 h-10 object-contain"
          onError={(e) => {
            // Fallback to team initials if logo fails to load
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
        <span className="text-white text-xs hidden">{currentTeam.teamName?.slice(0,2).toUpperCase()}</span>
      </button>
      {open && (
        <div className="mt-2 bg-gray-800 text-white shadow-xl p-2 min-w-[140px]">
          <div className="px-2 py-1 text-xs text-gray-300">{currentTeam.teamName}</div>
          <button onClick={async () => { setOpen(false); await logout(); }} className="w-full text-left px-2 py-1 hover:bg-gray-700">Log out</button>
        </div>
      )}
    </div>
  );
}


