import React, { useState, useEffect } from 'react';
import { Movie, UserMovie } from '../types';
import { X, Star, Bookmark, CheckCircle2, Clock, User as UserIcon, Film, Sparkles, MessageSquare, Trash2, Edit3, ArrowLeft, RotateCw } from 'lucide-react';
import { getPosterSrc, generateTypographicPoster } from '../utils/posterGenerator';

interface MovieDetailModalProps {
  movie: Movie | null;
  userMovie?: UserMovie | null;
  onClose: () => void;
  onAddToWatchlist: (tmdb_id: number) => Promise<void>;
  onMarkAsWatched: (userMovieId: string, rating?: number, review?: string) => Promise<void>;
  onUpdateReview: (userMovieId: string, rating: number, review: string) => Promise<void>;
  onRemoveFromArchive: (userMovieId: string) => Promise<void>;
  onPosterReloaded?: (updatedMovie: Movie) => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  userMovie,
  onClose,
  onAddToWatchlist,
  onMarkAsWatched,
  onUpdateReview,
  onRemoveFromArchive,
  onPosterReloaded,
  isAuthenticated,
  onOpenAuth
}) => {
  const [rating, setRating] = useState<number>(userMovie?.my_rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState<string>(userMovie?.my_review || '');
  const [isEditingReview, setIsEditingReview] = useState<boolean>(!userMovie?.my_review);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isReloadingPoster, setIsReloadingPoster] = useState<boolean>(false);
  const [currentPoster, setCurrentPoster] = useState<string>('');
  const [reloadSuccessMsg, setReloadSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (userMovie) {
      setRating(userMovie.my_rating || 5);
      setReviewText(userMovie.my_review || '');
      setIsEditingReview(!userMovie.my_review);
    }
  }, [userMovie]);

  useEffect(() => {
    if (movie) {
      setCurrentPoster(movie.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80');
      setReloadSuccessMsg('');
    }
  }, [movie]);

  if (!movie) return null;

  const handleReloadPoster = async () => {
    setIsReloadingPoster(true);
    setReloadSuccessMsg('');
    try {
      const res = await fetch(`/api/tmdb/reload-poster/${movie.id}?title=${encodeURIComponent(movie.title)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.movie) {
          setCurrentPoster(data.movie.poster_url);
          setReloadSuccessMsg('Poster artwork refreshed from TMDB!');
          if (onPosterReloaded) {
            onPosterReloaded(data.movie);
          }
        }
      }
    } catch (err) {
      console.error('Failed to reload poster:', err);
    } finally {
      setIsReloadingPoster(false);
    }
  };

  const isWatchlist = userMovie?.status === 'watchlist';
  const isWatched = userMovie?.status === 'watched';

  const handleSaveReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    if (!userMovie) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateReview(userMovie.id, rating, reviewText);
      setIsEditingReview(false);
    } catch (err) {
      console.error('Error saving review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkWatchedClick = async () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    setIsSubmitting(true);
    try {
      if (userMovie) {
        await onMarkAsWatched(userMovie.id, rating, reviewText);
      } else {
        // First add, then mark watched
        await onAddToWatchlist(movie.tmdb_id);
      }
    } catch (err) {
      console.error('Error marking watched:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddWatchlistClick = async () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddToWatchlist(movie.tmdb_id);
    } catch (err) {
      console.error('Error adding to watchlist:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-8 animate-in fade-in duration-300">
      
      {/* Background Backdrop Texture */}
      {movie.backdrop_url && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 filter blur-xl scale-110">
          <img src={movie.backdrop_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-grain"></div>
        </div>
      )}

      {/* Main Exhibition Dialog Container */}
      <div className="relative w-full max-w-5xl bg-[#080808] border border-neutral-700 shadow-2xl p-4 sm:p-8 md:p-12 my-auto z-10 grid-lines overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6 sm:mb-8 text-xs font-mono-code text-neutral-400">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-[#ff3b00] hover:text-white transition-colors uppercase font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← BACK TO ARCHIVE</span>
          </button>

          <div className="flex items-center gap-4 text-[10px]">
            <span className="hidden sm:inline text-neutral-600">FILM EXHIBIT NO. {movie.tmdb_id}</span>
            <button
              onClick={onClose}
              className="p-1.5 border border-neutral-800 hover:border-[#ff3b00] text-neutral-400 hover:text-[#ff3b00] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Centerpiece Exhibition Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Center Poster Artwork Column (Gallery Frame) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-sm border-2 border-neutral-700 p-2 sm:p-3 bg-neutral-950 shadow-2xl hover:border-[#ff3b00] transition-colors">
              
              {/* Frame Corner Annotations */}
              <div className="flex justify-between items-center text-[9px] font-mono-code text-neutral-500 mb-2 border-b border-neutral-900 pb-1">
                <span>ARTWORK REF: #{movie.tmdb_id}</span>
                <span className="text-[#ff3b00]">{movie.year}</span>
              </div>

              {/* Large Central Poster Image */}
              <div className="relative aspect-[2/3] overflow-hidden border border-neutral-800 bg-neutral-900 group">
                <img
                  src={currentPoster || getPosterSrc(movie)}
                  alt={movie.title}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = generateTypographicPoster(movie.title, movie.director, movie.year, movie.genres);
                  }}
                  className="w-full h-full object-cover filter contrast-[1.08] transition-all duration-300"
                />
                <div className="absolute inset-0 bg-grain pointer-events-none opacity-50"></div>
                
                {isReloadingPoster && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-xs font-mono-code text-[#ff3b00] gap-2">
                    <RotateCw className="w-6 h-6 animate-spin" />
                    <span>REFETCHING POSTER...</span>
                  </div>
                )}
              </div>

              {/* Poster Footer Info & Reload Button */}
              <div className="mt-3 pt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] font-mono-code text-neutral-400">
                <span>TMDB RATING: <strong className="text-[#ffee00]">★ {movie.tmdb_rating}</strong></span>
                
                <button
                  onClick={handleReloadPoster}
                  disabled={isReloadingPoster}
                  className="flex items-center gap-1.5 px-2 py-0.5 border border-neutral-800 hover:border-[#ff3b00] text-neutral-400 hover:text-[#ff3b00] transition-colors cursor-pointer uppercase font-bold"
                  title="Reload Poster Artwork from TMDB"
                >
                  <RotateCw className={`w-3 h-3 ${isReloadingPoster ? 'animate-spin' : ''}`} />
                  <span>RELOAD POSTER</span>
                </button>
              </div>

              {reloadSuccessMsg && (
                <div className="mt-2 text-[10px] font-mono-code text-emerald-400 text-center animate-in fade-in">
                  ✓ {reloadSuccessMsg}
                </div>
              )}
            </div>

            {/* Quick Status Badges */}
            <div className="w-full max-w-sm mt-4 flex items-center justify-between gap-2 font-mono-code text-xs">
              {isWatched ? (
                <div className="w-full py-2 bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-center font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>WATCHED ARCHIVE</span>
                </div>
              ) : isWatchlist ? (
                <div className="w-full py-2 bg-[#ff3b00]/10 border border-[#ff3b00] text-[#ff3b00] text-center font-bold flex items-center justify-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  <span>IN WATCHLIST</span>
                </div>
              ) : (
                <div className="w-full py-2 border border-neutral-800 text-neutral-500 text-center">
                  <span>NOT IN ARCHIVE YET</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Typography & Details Column */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            
            <div>
              {/* Genre Tags Header */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {movie.genres.map((g, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono-code text-[#ff3b00] border border-[#ff3b00]/40 px-2 py-0.5 bg-[#ff3b00]/5 uppercase tracking-wider"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Giant Display Title */}
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-[#f3f2ee] uppercase leading-[0.9] tracking-wide mb-4">
                {movie.title}
              </h1>

              {/* Metadata Spec Line */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code text-neutral-400 pb-4 mb-6 border-b border-neutral-800">
                <span>YEAR: <strong className="text-white">{movie.year}</strong></span>
                <span>RUNTIME: <strong className="text-white">{movie.runtime} MIN</strong></span>
                <span>DIRECTOR: <strong className="text-[#ff3b00]">{movie.director}</strong></span>
              </div>

              {/* Overview Synopsis */}
              <div className="mb-6">
                <h3 className="text-xs font-mono-code text-neutral-500 uppercase tracking-widest mb-2">
                  // SYNOPSIS & ARCHIVAL NOTES
                </h3>
                <p className="text-neutral-300 font-sans text-sm sm:text-base leading-relaxed border-l-2 border-neutral-700 pl-4 py-1">
                  {movie.description}
                </p>
              </div>

              {/* Featured Cast List */}
              {movie.cast && movie.cast.length > 0 && (
                <div className="mb-8 font-mono-code text-xs">
                  <h3 className="text-neutral-500 uppercase tracking-widest mb-2 text-[10px]">
                    // PRINCIPAL CAST
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.cast.map((actor, idx) => (
                      <span key={idx} className="bg-neutral-900 border border-neutral-800 px-2.5 py-1 text-neutral-300">
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Section: Watchlist / Watched Buttons & Review Form */}
            <div className="border-t border-neutral-800 pt-6 mt-4 space-y-6">
              
              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 font-mono-code text-xs">
                {!isWatchlist && !isWatched && (
                  <button
                    disabled={isSubmitting}
                    onClick={handleAddWatchlistClick}
                    className="flex-1 py-3 bg-[#ff3b00] text-black font-bold uppercase tracking-wider border border-[#ff3b00] hover:bg-transparent hover:text-[#ff3b00] transition-all flex items-center justify-center gap-2"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>+ ADD TO WATCHLIST</span>
                  </button>
                )}

                {!isWatched && (
                  <button
                    disabled={isSubmitting}
                    onClick={handleMarkWatchedClick}
                    className="flex-1 py-3 bg-neutral-900 text-[#f3f2ee] font-bold uppercase tracking-wider border border-neutral-700 hover:border-emerald-500 hover:text-emerald-400 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>MARK AS WATCHED</span>
                  </button>
                )}

                {userMovie && (
                  <button
                    disabled={isSubmitting}
                    onClick={() => onRemoveFromArchive(userMovie.id)}
                    className="px-4 py-3 border border-neutral-800 hover:border-red-500 text-neutral-500 hover:text-red-400 transition-colors"
                    title="Remove from archive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Personal Rating & Written Review Box (for watched/archived films) */}
              {userMovie && (
                <div className="bg-neutral-950 border border-neutral-800 p-4 font-mono-code">
                  <div className="flex items-center justify-between mb-3 border-b border-neutral-900 pb-2">
                    <span className="text-xs text-[#ff3b00] font-bold uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" />
                      MY PERSONAL RATING & REVIEW
                    </span>
                    {userMovie.my_review && !isEditingReview && (
                      <button
                        onClick={() => setIsEditingReview(true)}
                        className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> EDIT
                      </button>
                    )}
                  </div>

                  {/* Rating Selector */}
                  <div className="mb-4">
                    <label className="block text-[10px] text-neutral-500 uppercase mb-1.5">
                      YOUR SCORE (1 TO 5 STARS):
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(star)}
                          className="p-1 focus:outline-none transition-transform hover:scale-125"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              (hoverRating !== null ? star <= hoverRating : star <= rating)
                                ? 'fill-[#ffee00] text-[#ffee00]'
                                : 'text-neutral-700'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm font-bold text-[#ffee00]">
                        {rating}/5
                      </span>
                    </div>
                  </div>

                  {/* Review Text / Form */}
                  {isEditingReview ? (
                    <form onSubmit={handleSaveReviewSubmit} className="space-y-3">
                      <textarea
                        rows={3}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Write your thoughts about this film... (cinematography, director style, mood, soundtrack)"
                        className="w-full bg-neutral-900 border border-neutral-800 p-3 text-xs text-neutral-200 placeholder-neutral-600 font-sans focus:outline-none focus:border-[#ff3b00]"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-[#ff3b00] text-black font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors"
                      >
                        SAVE REVIEW & RATING
                      </button>
                    </form>
                  ) : (
                    <div className="font-sans text-xs text-neutral-300 italic border-l-2 border-[#ff3b00] pl-3 py-1 bg-neutral-900/50">
                      "{userMovie.my_review}"
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
