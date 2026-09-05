import React, { useState, useMemo } from 'react';
import { Movie, UserMovie } from '../types';
import { MovieCard } from './MovieCard';
import { Bookmark, Filter, Search, ArrowUpDown, Trash2, Film, Check } from 'lucide-react';

interface WatchlistPageProps {
  userMovies: UserMovie[];
  onOpenMovieDetail: (movie: Movie) => void;
  onRemoveMovie: (userMovieId: string) => Promise<void>;
  onOpenSearch: () => void;
  onAddAllToWatchlist?: () => Promise<void>;
  totalArchiveCount?: number;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  userMovies,
  onOpenMovieDetail,
  onRemoveMovie,
  onOpenSearch,
  onAddAllToWatchlist,
  totalArchiveCount = 0
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'year' | 'rating'>('recent');
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [addAllSuccess, setAddAllSuccess] = useState(false);

  const handleAddAll = async () => {
    if (!onAddAllToWatchlist) return;
    setIsAddingAll(true);
    try {
      await onAddAllToWatchlist();
      setAddAllSuccess(true);
      setTimeout(() => setAddAllSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingAll(false);
    }
  };

  // Filter watchlist movies only
  const watchlistItems = useMemo(() => {
    return userMovies.filter(um => um.status === 'watchlist' && um.movie);
  }, [userMovies]);

  // Extract all unique genres
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    watchlistItems.forEach(item => {
      item.movie?.genres.forEach(g => set.add(g));
    });
    return Array.from(set).sort();
  }, [watchlistItems]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...watchlistItems];

    if (selectedGenre !== 'ALL') {
      result = result.filter(item => item.movie?.genres.includes(selectedGenre));
    }

    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime());
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) => (a.movie?.title || '').localeCompare(b.movie?.title || ''));
    } else if (sortBy === 'year') {
      result.sort((a, b) => (b.movie?.year || 0) - (a.movie?.year || 0));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.movie?.tmdb_rating || 0) - (a.movie?.tmdb_rating || 0));
    }

    return result;
  }, [watchlistItems, selectedGenre, sortBy]);

  return (
    <div className="py-8 md:py-12 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-800 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code text-[#ff3b00] uppercase mb-1">
            <Bookmark className="w-3.5 h-3.5" />
            <span>PERSONAL WATCHLIST INDEX</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-[#f3f2ee] uppercase tracking-wide leading-none">
            WATCHLIST
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {onAddAllToWatchlist && (
            <button
              onClick={handleAddAll}
              disabled={isAddingAll}
              className={`px-4 py-2.5 font-mono-code text-xs font-bold uppercase tracking-wider border flex items-center gap-2 transition-all cursor-pointer ${
                addAllSuccess
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                  : 'bg-[#ff3b00] border-[#ff3b00] text-black hover:bg-white'
              }`}
            >
              {addAllSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ALL FILMS ADDED!</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>{isAddingAll ? 'ADDING ALL...' : '+ ADD ALL ARCHIVE FILMS'}</span>
                </>
              )}
            </button>
          )}

          <div className="font-mono-code text-xs text-neutral-400">
            <span className="text-[#ff3b00] font-bold text-2xl font-display">{watchlistItems.length}</span> FILMS TO WATCH
          </div>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      {watchlistItems.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-neutral-950 border border-neutral-800 font-mono-code text-xs mb-8">
          
          {/* Genre Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full no-scrollbar">
            <span className="text-neutral-500 text-[10px] uppercase flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3 text-[#ff3b00]" /> GENRE:
            </span>
            <button
              onClick={() => setSelectedGenre('ALL')}
              className={`px-2.5 py-1 text-[11px] uppercase border transition-all ${
                selectedGenre === 'ALL'
                  ? 'border-[#ff3b00] bg-[#ff3b00]/10 text-[#ff3b00]'
                  : 'border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              ALL ({watchlistItems.length})
            </button>
            {availableGenres.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-2.5 py-1 text-[11px] uppercase border transition-all whitespace-nowrap ${
                  selectedGenre === genre
                    ? 'border-[#ff3b00] bg-[#ff3b00]/10 text-[#ff3b00]'
                    : 'border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-neutral-500 text-[10px] uppercase flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-[#ff3b00]" /> SORT:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-200 px-3 py-1 focus:outline-none focus:border-[#ff3b00]"
            >
              <option value="recent">RECENTLY ADDED</option>
              <option value="alphabetical">ALPHABETICAL (A-Z)</option>
              <option value="year">RELEASE YEAR</option>
              <option value="rating">TMDB RATING</option>
            </select>
          </div>

        </div>
      )}

      {/* Grid Display */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {filteredItems.map((item, idx) => {
            if (!item.movie) return null;
            return (
              <div key={item.id} className="relative group/item">
                <MovieCard
                  movie={item.movie}
                  userMovie={item}
                  onClick={() => item.movie && onOpenMovieDetail(item.movie)}
                  tiltRight={idx % 2 === 1}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* Artistic Empty State */
        <div className="border border-dashed border-neutral-800 bg-neutral-950/40 p-12 md:p-20 text-center font-mono-code max-w-2xl mx-auto my-12">
          <Film className="w-12 h-12 text-[#ff3b00] mx-auto mb-4 opacity-80" />
          <h3 className="font-display text-3xl text-neutral-200 uppercase mb-2">
            THE ARCHIVE IS EMPTY.
          </h3>
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-6 max-w-md mx-auto">
            NO FILMS HAVE BEEN ADDED TO YOUR WATCHLIST YET.
          </p>
          <button
            onClick={onOpenSearch}
            className="px-6 py-3 bg-[#ff3b00] text-black font-bold text-xs uppercase tracking-wider border border-[#ff3b00] hover:bg-white transition-colors"
          >
            [ FIND A FILM ]
          </button>
        </div>
      )}

    </div>
  );
};
