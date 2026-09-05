import React from 'react';
import { NavigationTab, User } from '../types';
import { Search, Film, Bookmark, CheckCircle2, Grid, MessageSquare, LogIn, LogOut, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  watchlistCount: number;
  watchedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onLogout,
  watchlistCount,
  watchedCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#070707]/95 backdrop-blur-md border-b border-[#F2F2EF]/20 px-4 md:px-8 pt-5 pb-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
        
        {/* Logo / Brand Title Bento Box */}
        <div className="flex items-end justify-between w-full md:w-auto">
          <button
            onClick={() => setActiveTab('home')}
            className="group flex flex-col items-start text-left focus:outline-none"
          >
            <span className="text-[10px] tracking-[0.3em] font-mono-code text-[#F2F2EF]/50 mb-0.5 uppercase">
              The Unseen // Vol. 001
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[0.85] uppercase italic text-[#F2F2EF] group-hover:text-[#FF3D00] transition-colors">
              THE<br />UNSEEN
            </h1>
          </button>

          {/* Mobile Search & Auth Buttons */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setActiveTab('search')}
              className="p-2 border border-[#F2F2EF]/20 text-[#FF3D00] hover:border-[#FF3D00]"
            >
              <Search className="w-4 h-4" />
            </button>
            {user ? (
              <button
                onClick={onLogout}
                className="p-2 border border-[#F2F2EF]/20 text-neutral-400 hover:text-white"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="p-2 border border-[#FF3D00] text-[#FF3D00]"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation & Search Bento Controls */}
        <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
          <span className="text-[10px] font-mono-code text-[#F2F2EF]/40 hidden md:block">
            [ NAVIGATION ]
          </span>

          <nav className="flex items-center gap-3 sm:gap-6 overflow-x-auto max-w-full no-scrollbar pb-1 text-xs font-bold tracking-widest font-mono-code uppercase">
            <button
              onClick={() => setActiveTab('home')}
              className={`hover:text-[#FF3D00] transition-colors py-1 cursor-pointer whitespace-nowrap ${
                activeTab === 'home'
                  ? 'text-[#FF3D00] underline underline-offset-4 decoration-2 font-black'
                  : 'text-[#F2F2EF]/80'
              }`}
            >
              ARCHIVE
            </button>

            <button
              onClick={() => setActiveTab('watchlist')}
              className={`hover:text-[#FF3D00] transition-colors py-1 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'watchlist'
                  ? 'text-[#FF3D00] underline underline-offset-4 decoration-2 font-black'
                  : 'text-[#F2F2EF]/80'
              }`}
            >
              <span>WATCHLIST</span>
              <span className="text-[9px] px-1 bg-[#121212] border border-[#F2F2EF]/20 text-[#FF3D00]">
                {watchlistCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('watched')}
              className={`hover:text-[#FF3D00] transition-colors py-1 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'watched'
                  ? 'text-[#FF3D00] underline underline-offset-4 decoration-2 font-black'
                  : 'text-[#F2F2EF]/80'
              }`}
            >
              <span>WATCHED</span>
              <span className="text-[9px] px-1 bg-[#121212] border border-[#F2F2EF]/20 text-emerald-400">
                {watchedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('genres')}
              className={`hover:text-[#FF3D00] transition-colors py-1 cursor-pointer whitespace-nowrap ${
                activeTab === 'genres'
                  ? 'text-[#FF3D00] underline underline-offset-4 decoration-2 font-black'
                  : 'text-[#F2F2EF]/80'
              }`}
            >
              GENRES
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`hover:text-[#FF3D00] transition-colors py-1 cursor-pointer whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'text-[#FF3D00] underline underline-offset-4 decoration-2 font-black'
                  : 'text-[#F2F2EF]/80'
              }`}
            >
              REVIEWS
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className="text-[#FF3D00] border border-[#FF3D00]/40 px-2 py-0.5 hover:bg-[#FF3D00] hover:text-black transition-all flex items-center gap-1 text-[11px]"
            >
              <Search className="w-3 h-3" />
              <span>SEARCH</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#F2F2EF]/20">
                <span className="text-[10px] text-[#F2F2EF]/60 lowercase font-sans">{user.username}</span>
                <button
                  onClick={onLogout}
                  className="p-1 border border-[#F2F2EF]/20 hover:border-red-500 text-[#F2F2EF]/40 hover:text-red-400 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="ml-1 bg-[#FF3D00] text-black px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase hover:bg-white transition-colors"
              >
                SIGN IN
              </button>
            )}
          </nav>
        </div>

      </div>
    </header>
  );
};
