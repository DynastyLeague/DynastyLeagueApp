'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  const [showDropdown, setShowDropdown] = useState(false);

  const navItems = [
    {
      name: 'HOME',
      href: '/',
      icon: HomeIcon,
      isActive: pathname === '/',
      isDropdown: true
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
      name: 'PLAYERS',
      href: '/players',
      icon: UsersIcon,
      isActive: pathname === '/players'
    },
    {
      name: 'LEAGUE',
      href: '/league',
      icon: HomeIcon,
      isActive: pathname === '/league'
    }
  ];

  const dropdownItems = [
    { name: 'Rosters', href: '/rosters' },
    { name: 'Draft Picks', href: '/draft-picks' },
    { name: 'Transactions', href: '/transactions' },
    { name: 'Free Agents', href: '/free-agents' },
    { name: 'Award Winners', href: '/awards' },
    { name: 'Records', href: '/records' },
    { name: 'Constitution', href: '/constitution' }
  ];

  return (
    <>
      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="fixed bottom-24 left-0 right-0 bg-white border-2 border-black shadow-lg z-40 pb-8">
          <div className="py-2">
            {dropdownItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block w-full text-center py-3 text-black hover:bg-gray-100 transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="relative">
                {item.isDropdown ? (
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={`nav-item ${item.isActive ? 'active' : ''}`}
                  >
                    {/* League Logo */}
                    <div className="relative">
                      <img
                        src={`/api/image?url=${encodeURIComponent("https://drive.google.com/uc?export=view&id=1hOy_hcD3zCKG4ajLx9fSgZcF4Wp1Rfqo")}`}
                        alt="Dynasty League"
                        className="w-16 h-16 object-contain"
                      />
                      {/* Dropdown Indicator */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border border-black flex items-center justify-center">
                        <ChevronUpIcon />
                      </div>
                    </div>
                    <span className="nav-item-label"></span>
                  </button>
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