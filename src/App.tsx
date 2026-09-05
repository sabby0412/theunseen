import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Movie, UserMovie, User, NavigationTab } from './types';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { GenreCarousel } from './components/GenreCarousel';
import { MovieDetailModal } from './components/MovieDetailModal';
import { SearchOverlay } from './components/SearchOverlay';
import { WatchlistPage } from './components/WatchlistPage';
import { WatchedPage } from './components/WatchedPage';
import { GenresPage } from './components/GenresPage';
import { ReviewsPage } from './components/ReviewsPage';
import { AuthModal } from './components/AuthModal';
import { Film, Sparkles, Compass, ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('unseen_token'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Movie collections
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [userMovies, setUserMovies] = useState<UserMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user from token
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
          } else {
            // Token expired or invalid
            localStorage.removeItem('unseen_token');
            setToken(null);
            setUser(null);
          }
        })
        .catch(err => console.error(err));
    }
  }, [token]);

  // Fetch trending/seed movies and user movies
  const refreshArchiveData = useCallback(async () => {
    try {
      // Fetch trending
      const trendingRes = await fetch('/api/tmdb/trending');
      if (trendingRes.ok) {
        const trendingData = await trendingRes.json();
        setTrendingMovies(trendingData.movies || []);
      }

      // Fetch user movies
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const userMoviesRes = await fetch('/api/user-movies', { headers });
      if (userMoviesRes.ok) {
        const userMoviesData = await userMoviesRes.json();
        setUserMovies(userMoviesData.userMovies || []);
      }
    } catch (err) {
      console.error('Failed to load archive data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshArchiveData();
  }, [refreshArchiveData]);

  // Handle Authentication
  const handleLoginSuccess = (authUser: User, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('unseen_token', authToken);
    refreshArchiveData();
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('unseen_token');
    refreshArchiveData();
  };

  // User movie dictionary map for quick status lookup
  const userMoviesMap = useMemo(() => {
    const map: Record<string, UserMovie> = {};
    userMovies.forEach(um => {
      if (um.movie) {
        map[um.movie.id] = um;
        map[`m_${um.movie.tmdb_id}`] = um;
        map[String(um.movie.tmdb_id)] = um;
      }
      map[um.movie_id] = um;
    });
    return map;
  }, [userMovies]);

  // Combined master movie list for home exhibition
  const masterMoviesList = useMemo(() => {
    const list: Movie[] = [];
    const seen = new Set<string>();

    // 1. User movies first
    userMovies.forEach(um => {
      if (um.movie && !seen.has(um.movie.id)) {
        seen.add(um.movie.id);
        list.push(um.movie);
      }
    });

    // 2. Trending exhibition seed movies
    trendingMovies.forEach(m => {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        list.push(m);
      }
    });

    return list;
  }, [userMovies, trendingMovies]);

  // Automatic Genre Categorization
  const genreCategories = useMemo(() => {
    const categories: Record<string, Movie[]> = {};

    masterMoviesList.forEach(movie => {
      movie.genres.forEach(genre => {
        if (!categories[genre]) {
          categories[genre] = [];
        }
        // Avoid duplicate within same genre
        if (!categories[genre].some(m => m.id === movie.id)) {
          categories[genre].push(movie);
        }
      });
    });

    // Sort genres by movie count
    return Object.entries(categories)
      .filter(([_, movies]) => movies.length > 0)
      .sort((a, b) => b[1].length - a[1].length);
  }, [masterMoviesList]);

  // Watchlist & Watched Counts
  const watchlistCount = useMemo(() => {
    return userMovies.filter(um => um.status === 'watchlist').length;
  }, [userMovies]);

  const watchedCount = useMemo(() => {
    return userMovies.filter(um => um.status === 'watched').length;
  }, [userMovies]);

  // Actions
  const handleAddToWatchlist = async (tmdb_id: number) => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    const res = await fetch('/api/user-movies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ tmdb_id, status: 'watchlist' })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to add to watchlist');
    }

    await refreshArchiveData();
  };

  const handleMarkAsWatched = async (userMovieId: string, rating?: number, review?: string) => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    const res = await fetch(`/api/user-movies/${userMovieId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'watched',
        my_rating: rating,
        my_review: review,
        date_watched: new Date().toISOString()
      })
    });

    if (!res.ok) {
      throw new Error('Failed to mark as watched');
    }

    await refreshArchiveData();
  };

  const handleUpdateReview = async (userMovieId: string, rating: number, review: string) => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    const res = await fetch(`/api/user-movies/${userMovieId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        my_rating: rating,
        my_review: review
      })
    });

    if (!res.ok) {
      throw new Error('Failed to update review');
    }

    await refreshArchiveData();
  };

  const handleRemoveFromArchive = async (userMovieId: string) => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    const res = await fetch(`/api/user-movies/${userMovieId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      if (selectedMovie && userMoviesMap[selectedMovie.id]?.id === userMovieId) {
        setSelectedMovie(null);
      }
      await refreshArchiveData();
    }
  };

  const handleAddAllToWatchlist = async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/user-movies/add-all', {
      method: 'POST',
      headers
    });

    if (!res.ok) {
      throw new Error('Failed to add all movies to watchlist');
    }

    await refreshArchiveData();
  };

  const handleReloadAllPosters = async () => {
    const res = await fetch('/api/tmdb/reload-all-posters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      throw new Error('Failed to reload posters');
    }

    await refreshArchiveData();
  };

  const featuredMovie = masterMoviesList.length > 0 ? masterMoviesList[0] : null;

  return (
    <div className="min-h-screen bg-[#070707] text-[#F2F2EF] flex flex-col font-sans bg-grain selection:bg-[#FF3D00] selection:text-black">
      
      {/* Sticky Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        watchlistCount={watchlistCount}
        watchedCount={watchedCount}
      />

      {/* Main Content Router View */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div>
            {/* Bento Hero Section */}
            <HeroSection
              featuredMovie={featuredMovie}
              onOpenMovieDetail={(movie) => setSelectedMovie(movie)}
              onOpenSearch={() => setActiveTab('search')}
              totalMoviesCount={masterMoviesList.length}
              allMovies={masterMoviesList}
              onAddAllToWatchlist={handleAddAllToWatchlist}
              onReloadAllPosters={handleReloadAllPosters}
            />

            {/* Automatically Categorized Genre Carousels */}
            <div className="py-4">
              <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-2 border-b border-[#F2F2EF]/20 flex items-center justify-between font-mono-code text-xs text-[#F2F2EF]/60">
                <span className="flex items-center gap-2 text-[#FF3D00] font-bold">
                  <Compass className="w-3.5 h-3.5" />
                  AUTOMATIC GENRE CAROUSELS ({genreCategories.length} CATEGORIES)
                </span>
                <span className="hidden sm:inline text-[#F2F2EF]/40">
                  AUTO-INDEXED UPON ADDITION
                </span>
              </div>

              {genreCategories.map(([genreName, movies], idx) => (
                <GenreCarousel
                  key={genreName}
                  genreNumber={String(idx + 1).padStart(2, '0')}
                  genreName={genreName}
                  movies={movies}
                  userMoviesMap={userMoviesMap}
                  onOpenMovieDetail={(m) => setSelectedMovie(m)}
                  onQuickAddWatchlist={handleAddToWatchlist}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'watchlist' && (
          <WatchlistPage
            userMovies={userMovies}
            onOpenMovieDetail={(m) => setSelectedMovie(m)}
            onRemoveMovie={handleRemoveFromArchive}
            onOpenSearch={() => setActiveTab('search')}
            onAddAllToWatchlist={handleAddAllToWatchlist}
            totalArchiveCount={masterMoviesList.length}
          />
        )}

        {activeTab === 'watched' && (
          <WatchedPage
            userMovies={userMovies}
            onOpenMovieDetail={(m) => setSelectedMovie(m)}
            onOpenSearch={() => setActiveTab('search')}
          />
        )}

        {activeTab === 'genres' && (
          <GenresPage
            userMovies={userMovies}
            allMovies={masterMoviesList}
            onOpenMovieDetail={(m) => setSelectedMovie(m)}
          />
        )}

        {activeTab === 'reviews' && (
          <ReviewsPage
            userMovies={userMovies}
            onOpenMovieDetail={(m) => setSelectedMovie(m)}
            onOpenSearch={() => setActiveTab('search')}
          />
        )}
      </main>

      {/* Exhibition Movie Detail Centerpiece Modal */}
      <MovieDetailModal
        movie={selectedMovie}
        userMovie={selectedMovie ? userMoviesMap[selectedMovie.id] || userMoviesMap[`m_${selectedMovie.tmdb_id}`] : null}
        onClose={() => setSelectedMovie(null)}
        onAddToWatchlist={handleAddToWatchlist}
        onMarkAsWatched={handleMarkAsWatched}
        onUpdateReview={handleUpdateReview}
        onRemoveFromArchive={handleRemoveFromArchive}
        onPosterReloaded={(updatedMovie) => {
          setSelectedMovie(updatedMovie);
          refreshArchiveData();
        }}
        isAuthenticated={!!token}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* TMDB Search Overlay Modal */}
      <SearchOverlay
        isOpen={activeTab === 'search'}
        onClose={() => setActiveTab('home')}
        onAddToWatchlist={handleAddToWatchlist}
        userMoviesMap={userMoviesMap}
        onOpenMovieDetail={(m) => setSelectedMovie(m)}
        isAuthenticated={!!token}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Editorial Bento Footer */}
      <footer className="border-t border-[#F2F2EF]/20 bg-[#070707] py-8 px-4 md:px-8 mt-16 font-mono-code text-xs text-[#F2F2EF]/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-px bg-[#F2F2EF]/20 border border-[#F2F2EF]/20 p-px">
          
          <div className="bg-[#070707] p-6 space-y-2">
            <span className="text-[10px] text-[#FF3D00] uppercase font-bold tracking-widest block">STATUS</span>
            <span className="text-sm font-bold text-[#F2F2EF] block uppercase">ARCHIVE SYNCED</span>
            <span className="text-[10px] text-[#F2F2EF]/50 block">{masterMoviesList.length} EXHIBIT FILMS LIVE</span>
          </div>

          <div className="bg-[#070707] p-6 space-y-2">
            <span className="text-[10px] text-[#FF3D00] uppercase font-bold tracking-widest block">CATALOGUE SERIAL</span>
            <span className="text-sm font-bold text-[#F2F2EF] block uppercase">C-00129-UNSEEN</span>
            <span className="text-[10px] text-[#F2F2EF]/50 block">VOL. 001 DIGITAL EXHIBITION</span>
          </div>

          <div className="bg-[#070707] p-6 space-y-2">
            <span className="text-[10px] text-[#FF3D00] uppercase font-bold tracking-widest block">GENRE INDEX</span>
            <span className="text-sm font-bold text-[#F2F2EF] block uppercase">{genreCategories.length} CATEGORIES</span>
            <span className="text-[10px] text-[#F2F2EF]/50 block">AUTO-INDEXING ENGINE</span>
          </div>

          <div className="bg-[#070707] p-6 space-y-2">
            <span className="text-[10px] text-[#FF3D00] uppercase font-bold tracking-widest block">TMDB DATABASE</span>
            <span className="text-sm font-bold text-[#F2F2EF] block uppercase">ALL LANGUAGES & INDIES</span>
            <span className="text-[10px] text-[#F2F2EF]/50 block">GLOBAL MOVIE REELS</span>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#F2F2EF]/40 gap-2">
          <span>THE UNSEEN — AN EXPERIMENTAL PERSONAL FILM ARCHIVE</span>
          <span>© 2026 THE UNSEEN REEL ARCHIVE</span>
        </div>
      </footer>

    </div>
  );
}
