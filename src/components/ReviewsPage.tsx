import React from 'react';
import { Movie, UserMovie } from '../types';
import { MessageSquare, Star, Calendar, Edit3, Trash2, Film } from 'lucide-react';
import { getPosterSrc, generateTypographicPoster } from '../utils/posterGenerator';

interface ReviewsPageProps {
  userMovies: UserMovie[];
  onOpenMovieDetail: (movie: Movie) => void;
  onOpenSearch: () => void;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({
  userMovies,
  onOpenMovieDetail,
  onOpenSearch
}) => {
  // Filter entries with reviews
  const reviewedItems = userMovies.filter(um => um.my_review && um.movie);

  return (
    <div className="py-8 md:py-12 px-4 md:px-8 max-w-5xl mx-auto">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-800 mb-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code text-[#ff3b00] uppercase mb-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>PERSONAL FILM JOURNAL & ESSAYS</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-[#f3f2ee] uppercase tracking-wide leading-none">
            REVIEWS & NOTES
          </h1>
        </div>

        <div className="font-mono-code text-xs text-neutral-400">
          <span className="text-[#ff3b00] font-bold text-2xl font-display">{reviewedItems.length}</span> ESSAYS LOGGED
        </div>
      </div>

      {/* Reviews Journal List */}
      {reviewedItems.length > 0 ? (
        <div className="space-y-8">
          {reviewedItems.map((item, idx) => {
            if (!item.movie) return null;
            return (
              <div
                key={item.id}
                onClick={() => item.movie && onOpenMovieDetail(item.movie)}
                className="group cursor-pointer bg-neutral-950 border border-neutral-800 hover:border-[#ff3b00] p-4 sm:p-6 transition-all duration-300 grid-lines flex flex-col sm:flex-row gap-6 items-start"
              >
                {/* Poster Frame */}
                <div className="w-28 sm:w-36 aspect-[2/3] shrink-0 border border-neutral-700 bg-neutral-900 overflow-hidden shadow-lg">
                  <img
                    src={getPosterSrc(item.movie)}
                    alt={item.movie.title}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = generateTypographicPoster(item.movie?.title || '', item.movie?.director, item.movie?.year, item.movie?.genres);
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-3 font-mono-code">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 pb-2">
                    <span className="text-[10px] text-neutral-500 uppercase">
                      CRITIQUE NO. {String(idx + 1).padStart(3, '0')}
                    </span>
                    <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#ff3b00]" />
                      {item.date_watched ? new Date(item.date_watched).toLocaleDateString() : 'LOGGED'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-3xl sm:text-4xl text-[#f3f2ee] uppercase group-hover:text-[#ff3b00] transition-colors leading-none">
                      {item.movie.title} <span className="text-neutral-500 text-lg">({item.movie.year})</span>
                    </h3>

                    {/* Star Score Badge */}
                    {item.my_rating && (
                      <div className="flex items-center gap-1 bg-[#ff3b00] text-black font-bold text-xs px-2 py-0.5 border border-black">
                        ★ {item.my_rating} / 5
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-[#ff3b00] uppercase tracking-wider">
                    DIRECTOR: {item.movie.director} • GENRES: {item.movie.genres.join(' / ')}
                  </div>

                  {/* Written Review Body */}
                  <div className="pt-2 font-sans text-sm sm:text-base text-neutral-200 leading-relaxed border-l-2 border-[#ff3b00] pl-4 italic bg-neutral-900/40 py-2">
                    "{item.my_review}"
                  </div>

                  <div className="text-[10px] text-neutral-500 pt-2 flex justify-end">
                    <span className="text-[#ff3b00] group-hover:translate-x-1 transition-transform">
                      INSPECT FULL MOVIE & EDIT REVIEW →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="border border-dashed border-neutral-800 bg-neutral-950/40 p-12 md:p-20 text-center font-mono-code max-w-2xl mx-auto my-12">
          <MessageSquare className="w-12 h-12 text-[#ff3b00] mx-auto mb-4 opacity-80" />
          <h3 className="font-display text-3xl text-neutral-200 uppercase mb-2">
            NO REVIEWS WRITTEN YET.
          </h3>
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-6 max-w-md mx-auto">
            SELECT A WATCHED FILM IN YOUR ARCHIVE AND ATTACH YOUR CRITIQUE & RATING.
          </p>
          <button
            onClick={onOpenSearch}
            className="px-6 py-3 bg-[#ff3b00] text-black font-bold text-xs uppercase tracking-wider border border-[#ff3b00] hover:bg-white transition-colors"
          >
            [ ADD & REVIEW FILMS ]
          </button>
        </div>
      )}

    </div>
  );
};
