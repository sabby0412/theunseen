import React from 'react';
import { Movie, UserMovie } from '../types';
import { Star, Check, Bookmark, Plus } from 'lucide-react';
import { getPosterSrc, generateTypographicPoster } from '../utils/posterGenerator';

interface MovieCardProps {
  movie: Movie;
  userMovie?: UserMovie | null;
  onClick: () => void;
  onQuickAddWatchlist?: (tmdb_id: number) => void;
  tiltRight?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  userMovie,
  onClick,
  onQuickAddWatchlist,
  tiltRight = false
}) => {
  const isWatchlist = userMovie?.status === 'watchlist';
  const isWatched = userMovie?.status === 'watched';
  const myRating = userMovie?.my_rating;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer relative bg-[#0A0A0A] border border-[#F2F2EF]/20 p-3 transition-all duration-300 bento-card-hover flex flex-col justify-between h-full"
    >
      {/* Top Header Label */}
      <div className="flex items-center justify-between text-[9px] font-mono-code text-[#F2F2EF]/50 mb-2 uppercase tracking-widest">
        <span className="truncate max-w-[120px] text-[#FF3D00] font-bold">{movie.director || 'FILM'}</span>
        <span className="text-[#F2F2EF]/70 font-bold">{movie.year}</span>
      </div>

      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden border border-[#F2F2EF]/10 bg-[#121212] mb-3">
        <img
          src={getPosterSrc(movie)}
          alt={movie.title}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = generateTypographicPoster(movie.title, movie.director, movie.year, movie.genres);
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-[1.05]"
          loading="lazy"
        />

        {/* Film grain texture */}
        <div className="absolute inset-0 bg-grain pointer-events-none opacity-60"></div>

        {/* Overlay Dark Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity"></div>

        {/* Status Tag Top Left */}
        {isWatched ? (
          <div className="absolute top-2 left-2 bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 text-[8px] font-mono-code px-1.5 py-0.5 uppercase tracking-wider flex items-center gap-1 font-bold">
            <Check className="w-2.5 h-2.5" />
            <span>WATCHED</span>
          </div>
        ) : isWatchlist ? (
          <div className="absolute top-2 left-2 bg-[#FF3D00] border border-[#FF3D00] text-black text-[8px] font-mono-code px-1.5 py-0.5 font-bold uppercase tracking-wider flex items-center gap-1">
            <Bookmark className="w-2.5 h-2.5" />
            <span>WATCHLIST</span>
          </div>
        ) : onQuickAddWatchlist ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAddWatchlist(movie.tmdb_id);
            }}
            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 hover:bg-[#FF3D00] hover:text-black text-white border border-[#F2F2EF]/30 text-[9px] font-mono-code px-1.5 py-1 flex items-center gap-1 cursor-pointer"
            title="Add to Watchlist"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>ADD</span>
          </button>
        ) : null}

        {/* TMDB Rating Badge */}
        <div className="absolute top-2 right-2 bg-black/85 backdrop-blur-sm border border-[#F2F2EF]/30 px-1.5 py-0.5 text-[9px] font-mono-code text-[#ffee00]">
          ★ {movie.tmdb_rating}
        </div>

        {/* Personal Rating Overlay if available */}
        {myRating && (
          <div className="absolute bottom-2 right-2 bg-[#FF3D00] text-black font-mono-code font-bold text-[9px] px-1.5 py-0.5 border border-black flex items-center gap-0.5 shadow-md">
            <Star className="w-2.5 h-2.5 fill-black" />
            <span>{myRating}/5</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="space-y-1.5">
        <div className="text-[9px] font-mono-code text-[#FF3D00] tracking-wider uppercase truncate">
          {movie.genres.slice(0, 2).join(' / ')}
        </div>
        <h4 className="font-bold text-lg text-[#F2F2EF] leading-tight uppercase group-hover:text-[#FF3D00] transition-colors truncate">
          {movie.title}
        </h4>
        <div className="flex items-center justify-between text-[9px] font-mono-code text-[#F2F2EF]/50 pt-2 border-t border-[#F2F2EF]/10">
          <span>{movie.runtime ? `${movie.runtime} MIN` : '100 MIN'}</span>
          <span className="text-[#FF3D00] group-hover:translate-x-1 transition-transform">INSPECT →</span>
        </div>
      </div>
    </div>
  );
};
