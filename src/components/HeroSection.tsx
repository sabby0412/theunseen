import React, { useState } from 'react';
import { Movie } from '../types';
import { Plus, Compass, ArrowRight, Bookmark, CheckCircle2, Globe, Sparkles, RotateCw, Check } from 'lucide-react';
import { getPosterSrc, generateTypographicPoster } from '../utils/posterGenerator';

interface HeroSectionProps {
  featuredMovie: Movie | null;
  onOpenMovieDetail: (movie: Movie) => void;
  onOpenSearch: () => void;
  totalMoviesCount: number;
  allMovies?: Movie[];
  onAddAllToWatchlist?: () => Promise<void>;
  onReloadAllPosters?: () => Promise<void>;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  featuredMovie,
  onOpenMovieDetail,
  onOpenSearch,
  totalMoviesCount,
  allMovies = [],
  onAddAllToWatchlist,
  onReloadAllPosters
}) => {
  const upcomingReel = allMovies.slice(1, 6);
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [isReloadingAll, setIsReloadingAll] = useState(false);
  const [addAllDone, setAddAllDone] = useState(false);

  const handleAddAllClick = async () => {
    if (!onAddAllToWatchlist) return;
    setIsAddingAll(true);
    try {
      await onAddAllToWatchlist();
      setAddAllDone(true);
      setTimeout(() => setAddAllDone(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingAll(false);
    }
  };

  const handleReloadAllClick = async () => {
    if (!onReloadAllPosters) return;
    setIsReloadingAll(true);
    try {
      await onReloadAllPosters();
    } catch (err) {
      console.error(err);
    } finally {
      setIsReloadingAll(false);
    }
  };

  return (
    <section className="bg-[#070707] text-[#F2F2EF] border-b border-[#F2F2EF]/20 relative overflow-hidden font-sans">
      
      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-[#F2F2EF]/20">
        
        {/* Main 8-Column Bento Spotlight Cell */}
        <div className="lg:col-span-8 bg-[#070707] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden min-h-[460px]">
          
          {/* Header Serial */}
          <div className="flex items-center justify-between text-[10px] font-mono-code text-[#FF3D00] tracking-widest uppercase mb-6">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#FF3D00] rounded-full animate-ping"></span>
              FEATURED EXHIBIT / {String(totalMoviesCount).padStart(3, '0')}
            </span>
            <span className="text-[#F2F2EF]/40 hidden sm:inline">ARCH-8820-UNSEEN</span>
          </div>

          {featuredMovie ? (
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start my-auto">
              
              {/* Left Poster Frame */}
              <div 
                onClick={() => onOpenMovieDetail(featuredMovie)}
                className="w-full sm:w-[240px] md:w-[260px] aspect-[2/3] bg-[#121212] border border-[#F2F2EF]/20 relative shrink-0 group cursor-pointer overflow-hidden bento-card-hover"
              >
                <div className="absolute -inset-2 border border-[#FF3D00]/30 -z-10 group-hover:inset-0 transition-all"></div>
                <img
                  src={getPosterSrc(featuredMovie)}
                  alt={featuredMovie.title}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = generateTypographicPoster(featuredMovie.title, featuredMovie.director, featuredMovie.year, featuredMovie.genres);
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 z-10"></div>
                <div className="z-20 absolute bottom-0 inset-x-0 p-4">
                  <span className="text-[9px] font-mono-code mb-1 tracking-widest text-[#FF3D00] block uppercase">
                    {featuredMovie.year} / {featuredMovie.genres.slice(0, 2).join(' / ')}
                  </span>
                  <h3 className="text-xl font-bold leading-tight font-display text-white uppercase group-hover:text-[#FF3D00] transition-colors">
                    {featuredMovie.title}
                  </h3>
                </div>
              </div>

              {/* Right Details */}
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 bg-[#FF3D00] text-black text-[9px] font-bold font-mono-code tracking-tighter uppercase">
                      DIRECTOR
                    </span>
                    <span className="text-xl font-bold uppercase tracking-tight text-[#F2F2EF]">
                      {featuredMovie.director || 'Unknown Master'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed max-w-lg text-[#F2F2EF]/80 font-light mb-6 line-clamp-4">
                    {featuredMovie.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 font-mono-code border-t border-[#F2F2EF]/10 pt-4">
                    <div>
                      <span className="block text-[9px] opacity-40 uppercase mb-1">Archive No.</span>
                      <span className="text-xs sm:text-sm font-bold text-[#F2F2EF]">ARCH-8820-X</span>
                    </div>
                    <div>
                      <span className="block text-[9px] opacity-40 uppercase mb-1">Rating</span>
                      <span className="text-xs sm:text-sm font-bold text-[#ffee00]">★ {featuredMovie.tmdb_rating}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] opacity-40 uppercase mb-1">Status</span>
                      <span className="text-xs sm:text-sm font-bold italic text-[#FF3D00]">IN ARCHIVE</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => onOpenMovieDetail(featuredMovie)}
                    className="bg-[#F2F2EF] text-black px-4 py-2.5 text-xs font-bold font-mono-code tracking-widest uppercase flex items-center gap-2 hover:bg-[#FF3D00] transition-colors cursor-pointer"
                  >
                    <span>INSPECT EXHIBIT</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {onAddAllToWatchlist && (
                    <button
                      onClick={handleAddAllClick}
                      disabled={isAddingAll}
                      className={`px-4 py-2.5 text-xs font-bold font-mono-code tracking-widest uppercase flex items-center gap-2 border transition-all cursor-pointer ${
                        addAllDone
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                          : 'bg-[#FF3D00] border-[#FF3D00] text-black hover:bg-white'
                      }`}
                    >
                      {addAllDone ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>ALL ADDED!</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4" />
                          <span>{isAddingAll ? 'ADDING...' : `+ ADD ALL FILMS TO WATCHLIST (${totalMoviesCount})`}</span>
                        </>
                      )}
                    </button>
                  )}

                  {onReloadAllPosters && (
                    <button
                      onClick={handleReloadAllClick}
                      disabled={isReloadingAll}
                      className="border border-[#F2F2EF]/40 px-4 py-2.5 text-xs font-bold font-mono-code tracking-widest uppercase hover:border-[#FF3D00] hover:text-[#FF3D00] transition-colors cursor-pointer flex items-center gap-2 text-[#F2F2EF]/80"
                      title="Reload poster artwork for all films"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isReloadingAll ? 'animate-spin text-[#FF3D00]' : ''}`} />
                      <span>{isReloadingAll ? 'RELOADING...' : 'RELOAD POSTERS'}</span>
                    </button>
                  )}

                  <button
                    onClick={onOpenSearch}
                    className="border border-[#F2F2EF]/20 px-3 py-2.5 text-xs font-bold font-mono-code tracking-widest uppercase hover:border-[#FF3D00] hover:text-[#FF3D00] transition-colors cursor-pointer text-[#F2F2EF]/60"
                  >
                    + ADD FILM
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="py-12 text-center font-mono-code text-xs text-[#F2F2EF]/50">
              <p className="mb-4">NO FEATURED FILM IN REEL</p>
              <button
                onClick={onOpenSearch}
                className="bg-[#FF3D00] text-black px-6 py-3 font-bold uppercase tracking-widest hover:bg-white transition-colors"
              >
                + ADD FIRST MOVIE
              </button>
            </div>
          )}

          {/* Bottom Bar Indicator */}
          <div className="mt-6 pt-4 border-t border-[#F2F2EF]/10 flex items-center justify-between text-[10px] font-mono-code text-[#F2F2EF]/50">
            <span className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#FF3D00]" />
              SUPPORTS ALL MOVIES, ALL LANGUAGES & INDIE / ARTHOUSE CINEMA
            </span>
            <span className="hidden md:inline">SYSTEM: TMDB REAL-TIME INDEX</span>
          </div>

        </div>

        {/* 4-Column Upcoming / Reel List Bento Cell */}
        <div className="lg:col-span-4 bg-[#0A0A0A] border-l border-[#F2F2EF]/20 flex flex-col p-6 sm:p-8 justify-between">
          <div>
            <div className="mb-6 border-b border-[#F2F2EF]/10 pb-3 flex justify-between items-baseline font-mono-code">
              <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-[#F2F2EF]">
                FEATURED REEL
              </h2>
              <button onClick={onOpenSearch} className="text-[10px] text-[#FF3D00] hover:underline cursor-pointer">
                + SEARCH ALL
              </button>
            </div>

            <div className="space-y-4">
              {upcomingReel.map((movie, idx) => (
                <div
                  key={movie.id}
                  onClick={() => onOpenMovieDetail(movie)}
                  className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-[#121212] border border-transparent hover:border-[#FF3D00]/40 transition-all"
                >
                  <span className="text-xs font-mono-code text-[#FF3D00] font-bold">
                    {String(idx + 2).padStart(3, '0')}
                  </span>
                  <div className="w-12 h-16 bg-[#222] shrink-0 border border-[#F2F2EF]/10 overflow-hidden relative">
                    <img
                      src={getPosterSrc(movie)}
                      alt={movie.title}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = generateTypographicPoster(movie.title, movie.director, movie.year, movie.genres);
                      }}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[9px] font-mono-code mb-0.5 tracking-widest text-[#FF3D00] truncate uppercase">
                      {movie.genres[0] || 'FILM'} • {movie.year}
                    </div>
                    <div className="text-sm font-bold uppercase tracking-tight text-[#F2F2EF] group-hover:text-[#FF3D00] transition-colors truncate">
                      {movie.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenSearch}
            className="mt-6 w-full p-4 bg-[#FF3D00] text-black font-black font-mono-code text-center text-xs tracking-[0.2em] uppercase hover:bg-white transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD NEW TO ARCHIVE</span>
          </button>

        </div>

      </div>

    </section>
  );
};
