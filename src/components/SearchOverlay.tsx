import React, { useState, useEffect } from 'react';
import { Movie, UserMovie } from '../types';
import { Search, X, Plus, Check, Loader2, Film, Sparkles } from 'lucide-react';
import { getPosterSrc, generateTypographicPoster } from '../utils/posterGenerator';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToWatchlist: (tmdb_id: number) => Promise<void>;
  userMoviesMap: Record<string, UserMovie>;
  onOpenMovieDetail: (movie: Movie) => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onAddToWatchlist,
  userMoviesMap,
  onOpenMovieDetail,
  isAuthenticated,
  onOpenAuth
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleAddClick = async (e: React.MouseEvent, tmdb_id: number) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    setAddingId(tmdb_id);
    try {
      await onAddToWatchlist(tmdb_id);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070707]/98 backdrop-blur-xl flex flex-col p-4 md:p-8 animate-in fade-in duration-200 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Top Close Header */}
        <div className="flex items-center justify-between py-4 border-b border-[#F2F2EF]/20 text-xs font-mono-code text-[#F2F2EF]/60">
          <span className="text-[#FF3D00] font-bold uppercase tracking-widest flex items-center gap-2">
            <Search className="w-4 h-4" />
            SEARCH GLOBAL FILM ARCHIVE & INDIE REELS
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2 py-1 border border-[#F2F2EF]/20 hover:border-[#FF3D00] text-[#F2F2EF] hover:text-[#FF3D00] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>CLOSE [ESC]</span>
          </button>
        </div>

        {/* Big Search Input Box */}
        <div className="relative my-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any title, director, or country (e.g., Tarkovsky, Parasite, Portrait of a Lady on Fire, Drive My Car)..."
            autoFocus
            className="w-full bg-[#0A0A0A] border-2 border-[#F2F2EF]/30 focus:border-[#FF3D00] px-5 py-4 text-base sm:text-xl font-mono-code text-[#F2F2EF] placeholder-[#F2F2EF]/40 focus:outline-none transition-colors"
          />
          {loading ? (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#FF3D00] animate-spin" />
          ) : query ? (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F2F2EF]/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>

        {/* Quick Search Niche Chips */}
        {!query && (
          <div className="mb-8 p-4 bg-[#0A0A0A] border border-[#F2F2EF]/20 space-y-3 font-mono-code">
            <span className="text-[10px] text-[#FF3D00] tracking-widest uppercase block font-bold">
              + QUICK ARCHIVE SEARCHES (ALL LANGUAGES & NICHE CINEMA)
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                'Wong Kar-wai',
                'Andrei Tarkovsky',
                'French New Wave',
                'Japanese Cinema',
                'A24 Indie',
                'Kiarostami',
                'Agnes Varda',
                'Denis Villeneuve',
                'Korean Cinema',
                'Surrealist Film'
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setQuery(chip)}
                  className="px-3 py-1 bg-[#121212] border border-[#F2F2EF]/20 hover:border-[#FF3D00] hover:text-[#FF3D00] text-[#F2F2EF]/80 transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Count / Info Bar */}
        {query && (
          <div className="text-xs font-mono-code text-[#F2F2EF]/50 mb-4 pb-2 border-b border-[#F2F2EF]/10 flex justify-between">
            <span>RESULTS FOR "{query.toUpperCase()}"</span>
            <span>{results.length} MATCHES FOUND</span>
          </div>
        )}

        {/* Search Results List */}
        <div className="space-y-4 flex-1 overflow-y-auto pb-12">
          {results.map((m) => {
            const isAdded = !!(userMoviesMap[`m_${m.tmdb_id}`] || userMoviesMap[m.tmdb_id]);

            return (
              <div
                key={m.tmdb_id}
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/tmdb/movie/${m.tmdb_id}`);
                    if (res.ok) {
                      const fullMovie = await res.json();
                      onOpenMovieDetail(fullMovie);
                      onClose();
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="group cursor-pointer bg-[#0A0A0A] border border-[#F2F2EF]/20 hover:border-[#FF3D00] p-3 sm:p-4 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bento-card-hover"
              >
                <div className="flex gap-4 items-start sm:items-center flex-1">
                  <div className="w-16 sm:w-20 aspect-[2/3] shrink-0 border border-[#F2F2EF]/20 bg-[#121212] overflow-hidden">
                    <img
                      src={getPosterSrc(m)}
                      alt={m.title}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = generateTypographicPoster(m.title, m.director, m.year, m.genres);
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-xl sm:text-2xl text-[#F2F2EF] uppercase group-hover:text-[#FF3D00] transition-colors leading-none">
                        {m.title}
                      </h4>
                      <span className="text-xs font-mono-code text-[#FF3D00] font-bold">
                        ({m.year})
                      </span>
                    </div>
                    <p className="text-xs font-sans text-[#F2F2EF]/70 line-clamp-2 max-w-xl">
                      {m.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] font-mono-code text-[#F2F2EF]/50 pt-1">
                      <span className="text-[#ffee00]">★ {m.tmdb_rating}</span>
                      <span>•</span>
                      <span>CLICK TO INSPECT DETAIL</span>
                    </div>
                  </div>
                </div>

                {/* Add / Status Button */}
                <div className="w-full sm:w-auto self-end sm:self-center shrink-0">
                  {isAdded ? (
                    <div className="px-4 py-2 border border-emerald-500/50 bg-emerald-950/50 text-emerald-400 font-mono-code text-xs uppercase flex items-center justify-center gap-2 font-bold">
                      <Check className="w-4 h-4" />
                      <span>✓ IN WATCHLIST</span>
                    </div>
                  ) : (
                    <button
                      disabled={addingId === m.tmdb_id}
                      onClick={(e) => handleAddClick(e, m.tmdb_id)}
                      className="w-full sm:w-auto px-4 py-2 bg-[#FF3D00] text-black font-mono-code font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {addingId === m.tmdb_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      <span>+ ADD TO ARCHIVE</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-16 font-mono-code text-xs text-[#F2F2EF]/50 border border-dashed border-[#F2F2EF]/20 bg-[#0A0A0A]">
              <Film className="w-8 h-8 text-[#FF3D00] mx-auto mb-2" />
              <p className="text-[#F2F2EF] uppercase font-bold">NO FILMS FOUND FOR "{query}"</p>
              <p className="text-[10px] text-[#F2F2EF]/50 mt-1">Try searching by director name or original foreign release title.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
