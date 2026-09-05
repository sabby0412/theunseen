import React, { useState, useMemo } from 'react';
import { Movie, UserMovie } from '../types';
import { MovieCard } from './MovieCard';
import { Grid, ChevronRight, ArrowLeft } from 'lucide-react';

interface GenresPageProps {
  userMovies: UserMovie[];
  allMovies: Movie[];
  onOpenMovieDetail: (movie: Movie) => void;
}

export const GenresPage: React.FC<GenresPageProps> = ({
  userMovies,
  allMovies,
  onOpenMovieDetail
}) => {
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  // Combine user movies & cached exhibition movies
  const moviesList = useMemo(() => {
    const list: Movie[] = [];
    const seen = new Set<string>();

    userMovies.forEach(um => {
      if (um.movie && !seen.has(um.movie.id)) {
        seen.add(um.movie.id);
        list.push(um.movie);
      }
    });

    allMovies.forEach(m => {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        list.push(m);
      }
    });

    return list;
  }, [userMovies, allMovies]);

  // Aggregate genres with counts
  const genreStats = useMemo(() => {
    const counts: Record<string, Movie[]> = {};

    moviesList.forEach(m => {
      m.genres.forEach(g => {
        if (!counts[g]) counts[g] = [];
        counts[g].push(m);
      });
    });

    return Object.entries(counts)
      .map(([genre, items]) => ({
        name: genre,
        count: items.length,
        movies: items
      }))
      .sort((a, b) => b.count - a.count);
  }, [moviesList]);

  // User movie map for status tags
  const userMoviesMap = useMemo(() => {
    const map: Record<string, UserMovie> = {};
    userMovies.forEach(um => {
      if (um.movie) map[um.movie.id] = um;
      map[`m_${um.movie_id}`] = um;
    });
    return map;
  }, [userMovies]);

  const selectedGenreData = activeGenre ? genreStats.find(g => g.name === activeGenre) : null;

  return (
    <div className="py-8 md:py-12 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-800 mb-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code text-[#ff3b00] uppercase mb-1">
            <Grid className="w-3.5 h-3.5" />
            <span>AUTOMATIC CLASSIFICATION SYSTEM</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-[#f3f2ee] uppercase tracking-wide leading-none">
            GENRE INDEX
          </h1>
        </div>

        {activeGenre && (
          <button
            onClick={() => setActiveGenre(null)}
            className="flex items-center gap-2 text-xs font-mono-code text-[#ff3b00] hover:text-white uppercase font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← VIEW ALL GENRES</span>
          </button>
        )}
      </div>

      {activeGenre && selectedGenreData ? (
        /* Selected Genre Filter View */
        <div className="space-y-6">
          <div className="flex items-baseline gap-3 border-b border-neutral-800 pb-4">
            <h2 className="font-display text-5xl text-[#f3f2ee] uppercase">
              {selectedGenreData.name}
            </h2>
            <span className="font-mono-code text-xs text-[#ff3b00] border border-[#ff3b00]/40 px-2.5 py-0.5">
              {selectedGenreData.count} FILMS
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {selectedGenreData.movies.map((movie, idx) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                userMovie={userMoviesMap[movie.id]}
                onClick={() => onOpenMovieDetail(movie)}
                tiltRight={idx % 2 === 1}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Editorial List of Genres */
        <div className="space-y-4">
          {genreStats.map((g, idx) => (
            <div
              key={g.name}
              onClick={() => setActiveGenre(g.name)}
              className="group cursor-pointer bg-neutral-950 border border-neutral-800 hover:border-[#ff3b00] p-4 sm:p-6 transition-all flex items-center justify-between font-mono-code"
            >
              <div className="flex items-center gap-4 sm:gap-8">
                <span className="text-sm font-bold text-[#ff3b00]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-3xl sm:text-5xl text-[#f3f2ee] group-hover:text-[#ff3b00] transition-colors uppercase leading-none">
                  {g.name}
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs sm:text-sm text-neutral-400 group-hover:text-white border border-neutral-800 group-hover:border-[#ff3b00] px-3 py-1 bg-neutral-900">
                  {g.count} {g.count === 1 ? 'FILM' : 'FILMS'}
                </span>
                <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-[#ff3b00] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
