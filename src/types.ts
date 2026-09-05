export interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  poster_url: string;
  backdrop_url: string;
  description: string;
  release_date: string;
  year: number;
  runtime: number; // in minutes
  genres: string[];
  director: string;
  cast: string[];
  tmdb_rating: number;
}

export interface UserMovie {
  id: string;
  user_id: string;
  movie_id: string;
  status: 'watchlist' | 'watched';
  date_added: string;
  date_watched: string | null;
  my_rating: number | null; // 1 to 5
  my_review: string | null;
  movie?: Movie;
}

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export type NavigationTab = 'home' | 'watchlist' | 'watched' | 'genres' | 'reviews' | 'search';

export interface GenreFilter {
  id: string;
  name: string;
  count: number;
}
