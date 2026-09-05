import React, { useRef } from 'react';
import { Movie, UserMovie } from '../types';
import { MovieCard } from './MovieCard';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';

interface GenreCarouselProps {
  genreNumber: string; // e.g. "01"
  genreName: string;   // e.g. "DRAMA"
  movies: Movie[];
  userMoviesMap: Record<string, UserMovie>;
  onOpenMovieDetail: (movie: Movie) => void;
  onQuickAddWatchlist?: (tmdb_id: number) => void;
}

export const GenreCarousel: React.FC<GenreCarouselProps> = ({
  genreNumber,
  genreName,
  movies,
  userMoviesMap,
  onOpenMovieDetail,
  onQuickAddWatchlist
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="py-8 border-b border-[#F2F2EF]/20 bg-[#070707]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Genre Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-[#F2F2EF]/20 mb-6">
          <div className="flex items-baseline gap-3">
            <span className="font-mono-code text-xs text-[#FF3D00] font-bold">
              {genreNumber} /
            </span>
            <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase text-[#F2F2EF]">
              {genreName}
            </h2>
            <span className="text-xs font-mono-code text-[#F2F2EF]/50 border border-[#F2F2EF]/20 px-2 py-0.5 ml-2">
              {movies.length} {movies.length === 1 ? 'EXHIBIT' : 'EXHIBITS'}
            </span>
          </div>

          {/* Scroll Controls & Helper Text */}
          <div className="flex items-center gap-4">
            <span className="hidden md:flex items-center gap-1.5 text-[10px] font-mono-code text-[#F2F2EF]/50 uppercase tracking-widest">
              <MoveHorizontal className="w-3.5 h-3.5 text-[#FF3D00]" />
              <span>DRAG / SCROLL</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                className="w-8 h-8 border border-[#F2F2EF]/20 hover:border-[#FF3D00] bg-[#0A0A0A] flex items-center justify-center text-[#F2F2EF] hover:text-[#FF3D00] transition-colors cursor-pointer"
                aria-label="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-8 h-8 border border-[#F2F2EF]/20 hover:border-[#FF3D00] bg-[#0A0A0A] flex items-center justify-center text-[#F2F2EF] hover:text-[#FF3D00] transition-colors cursor-pointer"
                aria-label="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Carousel Track */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-4 pt-1 snap-x scroll-smooth select-none cursor-grab active:cursor-grabbing"
        >
          {movies.map((movie, idx) => {
            const userMovie = userMoviesMap[movie.id] || userMoviesMap[`m_${movie.tmdb_id}`] || null;
            return (
              <div
                key={`${genreName}-${movie.id}-${idx}`}
                className="w-[200px] sm:w-[220px] md:w-[240px] shrink-0 snap-start"
              >
                <MovieCard
                  movie={movie}
                  userMovie={userMovie}
                  onClick={() => onOpenMovieDetail(movie)}
                  onQuickAddWatchlist={onQuickAddWatchlist}
                  tiltRight={idx % 2 === 1}
                />
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
