import React from 'react';
import { BookOpen, Compass, Home, Inbox, User } from 'lucide-react';
import { NavSection } from '../types/bookloop';

interface TopBarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  isSignedIn: boolean;
  onPrimaryAction: () => void;
  pendingRequestCount: number;
}

const DESKTOP_NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'explore', label: 'Explore' },
  { id: 'listings', label: 'My Listings' },
  { id: 'requests', label: 'My Requests' },
  { id: 'profile', label: 'Profile' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onNavigate,
  isSignedIn,
  onPrimaryAction,
  pendingRequestCount,
}) => {
  return (
    <>
      {/* Strict 3-Zone Top Bar Contract: [Brand] — [5 single-line nav links] — [1 Primary CTA] */}
      <header className="sticky top-0 z-40 bg-[#F8F7F4]/95 backdrop-blur-sm border-b border-black/8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="font-display text-xl font-semibold tracking-tight text-[#14181F] whitespace-nowrap shrink-0 cursor-pointer"
          >
            BookLoop
          </button>

          {/* Zone 2: 5 clean single-line text navigation links */}
          {isSignedIn ? (
            <nav
              aria-label="Primary navigation"
              className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A5568]"
            >
              {DESKTOP_NAV_ITEMS.map((item) => {
                const active = activeSection === item.id;
                const labelText =
                  item.id === 'requests' && pendingRequestCount > 0
                    ? `${item.label} (${pendingRequestCount})`
                    : item.label;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`relative py-5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'text-[#14181F] font-semibold'
                        : 'text-[#4A5568] hover:text-[#14181F]'
                    }`}
                  >
                    {labelText}
                    {active && (
                      <span
                        className="absolute inset-x-0 bottom-0 h-0.5 bg-[#1B5E43]"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          ) : (
            <div className="hidden md:block" />
          )}

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onPrimaryAction}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1B5E43] rounded-lg hover:bg-[#154A34] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isSignedIn ? 'Sell a Book' : 'Sign In'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (56px height, well under 15% mobile sticky cap) */}
      {isSignedIn && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white border-t border-black/10 grid grid-cols-5"
        >
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium whitespace-nowrap ${
              activeSection === 'home' ? 'text-[#1B5E43]' : 'text-[#6B7280]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium whitespace-nowrap ${
              activeSection === 'explore' ? 'text-[#1B5E43]' : 'text-[#6B7280]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Explore</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('listings')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium whitespace-nowrap ${
              activeSection === 'listings' ? 'text-[#1B5E43]' : 'text-[#6B7280]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Listings</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('requests')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium whitespace-nowrap ${
              activeSection === 'requests' ? 'text-[#1B5E43]' : 'text-[#6B7280]'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>
              Requests{pendingRequestCount > 0 ? ` (${pendingRequestCount})` : ''}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium whitespace-nowrap ${
              activeSection === 'profile' ? 'text-[#1B5E43]' : 'text-[#6B7280]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </nav>
      )}
    </>
  );
};
