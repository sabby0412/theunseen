import React from 'react';
import { Movie, UserMovie } from '../types';
import { MovieCard } from './MovieCard';
import { CheckCircle2, Star, MessageSquare, Film, Calendar } from 'lucide-react';

interface WatchedPageProps {
  userMovies: UserMovie[];
  onOpenMovieDetail: (movie: Movie) => void;
  onOpenSearch: () => void;
}

export const WatchedPage: React.FC<WatchedPageProps> = ({
  userMovies,
  onOpenMovieDetail,
  onOpenSearch
}) => {
  const watchedItems = userMovies.filter(um => um.status === 'watched' && um.movie);

  return (
    <div className="py-8 md:py-12 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-800 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code text-emerald-400 uppercase mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>COMPLETED CINEMATIC ARCHIVE</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-[#f3f2ee] uppercase tracking-wide leading-none">
            WATCHED FILMS
          </h1>
        </div>

        <div className="font-mono-code text-xs text-neutral-400">
          <span className="text-emerald-400 font-bold text-2xl font-display">{watchedItems.length}</span> FILMS WATCHED
        </div>
      </div>

      {/* Grid Display */}
      {watchedItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {watchedItems.map((item, idx) => {
            if (!item.movie) return null;
            return (
              <div key={item.id} className="flex flex-col h-full">
                <MovieCard
                  movie={item.movie}
                  userMovie={item}
                  onClick={() => item.movie && onOpenMovieDetail(item.movie)}
                  tiltRight={idx % 2 === 1}
                />

                {/* Watched Meta Card Footer */}
                <div className="mt-2 bg-neutral-950 border border-neutral-800 p-2 text-[10px] font-mono-code text-neutral-400 space-y-1">
                  <div className="flex items-center justify-between text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {item.date_watched ? new Date(item.date_watched).toLocaleDateString() : 'RECENT'}
                    </span>
                    {item.my_rating && (
                      <span className="text-[#ffee00] font-bold">
                        ★ {item.my_rating}/5
                      </span>
                    )}
                  </div>
                  {item.my_review && (
                    <div className="text-neutral-300 font-sans italic truncate text-[11px] pt-1 border-t border-neutral-900">
                      "{item.my_review}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Artistic Empty State */
        <div className="border border-dashed border-neutral-800 bg-neutral-950/40 p-12 md:p-20 text-center font-mono-code max-w-2xl mx-auto my-12">
          <Film className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-80" />
          <h3 className="font-display text-3xl text-neutral-200 uppercase mb-2">
            NOTHING WATCHED YET.
          </h3>
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-6 max-w-md mx-auto">
            THE SCREEN IS WAITING. LOG YOUR FIRST CINEMATIC EXPERIENCE.
          </p>
          <button
            onClick={onOpenSearch}
            className="px-6 py-3 bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider border border-emerald-500 hover:bg-white transition-colors"
          >
            [ SEARCH FILMS ]
          </button>
        </div>
      )}

    </div>
  );
};
