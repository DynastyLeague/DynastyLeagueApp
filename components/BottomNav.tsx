'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface BottomNavProps {
  currentTeam?: { teamId: string; teamName: string; mainLogo?: string } | null;
}

// Simple SVG Icons as components
const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const UserGroupIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const CalendarDaysIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
  </svg>
);

export default function BottomNav({ }: BottomNavProps) {
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { currentTeam, logout } = useAuth();

  const navItems = [
    {
      name: 'HOME',
      href: '/',
      icon: HomeIcon,
      isActive: pathname === '/'
    },
    {
      name: 'GAME PICK',
      href: '/weekly-selection',
      icon: UserGroupIcon,
      isActive: pathname === '/weekly-selection'
    },
    {
      name: 'MATCHUPS',
      href: '/matchups',
      icon: CalendarDaysIcon,
      isActive: pathname === '/matchups'
    },
    {
      name: 'TEAM INFO',
      href: '/roster',
      icon: UserGroupIcon,
      isActive: pathname === '/roster'
    },
    {
      name: 'PROFILE',
      href: '#',
      icon: HomeIcon,
      isActive: false,
      isProfile: true
    }
  ];


  return (
    <>

      {/* Profile Menu */}
      {showProfileMenu && currentTeam && (
        <div className="fixed bottom-24 right-4 bg-gray-800 text-white shadow-xl p-2 min-w-[140px] z-40">
          <div className="px-2 py-1 text-xs text-gray-300">{currentTeam.teamName}</div>
          <button 
            onClick={async () => { 
              setShowProfileMenu(false); 
              await logout(); 
              location.href = '/login'; 
            }} 
            className="w-full text-left px-2 py-1 hover:bg-gray-700"
          >
            Log out
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="relative">
                {item.isProfile ? (
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className={`nav-item ${item.isActive ? 'active' : ''}`}
                  >
                    {/* Team Logo */}
                    {currentTeam ? (
                      <div className="relative">
                        <img
                          src={`/logos/${currentTeam.teamId}-main.png.png`}
                          alt={`${currentTeam.teamName} logo`}
                          className="w-16 h-16 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-black text-xs font-bold hidden">
                          {currentTeam.teamName?.slice(0,2).toUpperCase()}
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-400 flex items-center justify-center">
                        <span className="text-black text-xs font-bold">LO</span>
                      </div>
                    )}
                    <span className="nav-item-label"></span>
                  </button>
                ) : item.name === 'HOME' ? (
                  <Link
                    href={item.href}
                    className={`nav-item ${item.isActive ? 'active' : ''}`}
                  >
                    {/* League Logo */}
                    <img
                      src={`/api/image?url=${encodeURIComponent("https://drive.google.com/uc?export=view&id=1hOy_hcD3zCKG4ajLx9fSgZcF4Wp1Rfqo")}`}
                      alt="Dynasty League"
                      className="w-16 h-16 object-contain"
                    />
                    <span className="nav-item-label"></span>
                  </Link>
                ) : (
                  <Link
                    href={item.href}
                    className={`nav-item ${item.isActive ? 'active' : ''}`}
                  >
                    <Icon />
                    <span className="nav-item-label">{item.name}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}