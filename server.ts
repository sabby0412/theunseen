import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'the-unseen-secret-jwt-key-2026';
const TMDB_API_KEY = process.env.TMDB_API_KEY || ''; // Optional user TMDB key

// TMDB API base URL and default fallback API key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
// Public demo API key for fallback TMDB fetch
const PUBLIC_TMDB_KEY = '8e5d0f666f7f6311652f1e6f47f23c9e';

// Database file path setup
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Interface definitions
interface MovieRecord {
  id: string; // Internal UUID/slug
  tmdb_id: number;
  title: string;
  poster_url: string;
  backdrop_url: string;
  description: string;
  release_date: string;
  year: number;
  runtime: number;
  genres: string[];
  director: string;
  cast: string[];
  tmdb_rating: number;
}

interface UserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

interface UserMovieRecord {
  id: string;
  user_id: string;
  movie_id: string;
  status: 'watchlist' | 'watched';
  date_added: string;
  date_watched: string | null;
  my_rating: number | null;
  my_review: string | null;
}

interface DBData {
  users: UserRecord[];
  movies: MovieRecord[];
  user_movies: UserMovieRecord[];
}

// Ensure DATA_DIR exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed movies for offline fallback and immediate artistic experience with international & indie films
const SEED_MOVIES: MovieRecord[] = [
  {
    id: 'm-1',
    tmdb_id: 120467,
    title: 'The Grand Budapest Hotel',
    poster_url: 'https://image.tmdb.org/t/p/w500/eW31LOS33RA2Sv3R9ip3yA838yG.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/28f9qE1xV4P0d8J2fB7aB5xP.jpg',
    description: 'A writer encounters the owner of a high-class European hotel, who tells him of his early years serving as a legendary concierge in the hotel\'s glorious heyday.',
    release_date: '2014-02-26',
    year: 2014,
    runtime: 99,
    genres: ['Comedy', 'Drama', 'Indie'],
    director: 'Wes Anderson',
    cast: ['Ralph Fiennes', 'Tony Revolori', 'Saoirse Ronan', 'Willem Dafoe', 'Adrien Brody'],
    tmdb_rating: 8.1
  },
  {
    id: 'm-2',
    tmdb_id: 496243,
    title: 'Parasite',
    poster_url: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/HiLob83L4930030200.jpg',
    description: 'All unemployed, Ki-taek\'s family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.',
    release_date: '2019-05-30',
    year: 2019,
    runtime: 132,
    genres: ['Drama', 'Thriller', 'World Cinema'],
    director: 'Bong Joon-ho',
    cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong', 'Choi Woo-shik', 'Park So-dam'],
    tmdb_rating: 8.5
  },
  {
    id: 'm-3',
    tmdb_id: 531428,
    title: 'Portrait of a Lady on Fire',
    poster_url: 'https://image.tmdb.org/t/p/w500/2LqaAqbvfEGmIIHGVIKq942flft.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/3S3S01.jpg',
    description: 'On an isolated island in Brittany at the end of the eighteenth century, a female painter is obliged to paint a wedding portrait of a young woman.',
    release_date: '2019-09-18',
    year: 2019,
    runtime: 122,
    genres: ['Drama', 'Romance', 'Arthouse'],
    director: 'Céline Sciamma',
    cast: ['Noémie Merlant', 'Adèle Haenel', 'Luàna Bajrami', 'Valéria Golino'],
    tmdb_rating: 8.2
  },
  {
    id: 'm-4',
    tmdb_id: 335984,
    title: 'Blade Runner 2049',
    poster_url: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/sA2990.jpg',
    description: 'Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what\'s left of society into chaos.',
    release_date: '2017-10-04',
    year: 2017,
    runtime: 164,
    genres: ['Sci-Fi', 'Mystery', 'Neo-Noir'],
    director: 'Denis Villeneuve',
    cast: ['Ryan Gosling', 'Harrison Ford', 'Ana de Armas', 'Sylvia Hoeks', 'Robin Wright'],
    tmdb_rating: 8.0
  },
  {
    id: 'm-5',
    tmdb_id: 13922,
    title: 'Yi Yi',
    poster_url: 'https://image.tmdb.org/t/p/w500/v659eZ81fM0gIq2pmsd1l3vW7jC.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/m2.jpg',
    description: 'Each member of a middle-class Taipei family seeks to reconcile interpersonal and existential dilemmas through the three generations.',
    release_date: '2000-09-20',
    year: 2000,
    runtime: 173,
    genres: ['Drama', 'World Cinema', 'Arthouse'],
    director: 'Edward Yang',
    cast: ['Wu Nien-jen', 'Elaine Jin', 'Issey Ogata', 'Jonathan Chang'],
    tmdb_rating: 8.4
  },
  {
    id: 'm-6',
    tmdb_id: 129,
    title: 'Spirited Away',
    poster_url: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/302910.jpg',
    description: 'A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.',
    release_date: '2001-07-20',
    year: 2001,
    runtime: 125,
    genres: ['Animation', 'Fantasy', 'World Cinema'],
    director: 'Hayao Miyazaki',
    cast: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki', 'Takeshi Naito'],
    tmdb_rating: 8.5
  },
  {
    id: 'm-7',
    tmdb_id: 510,
    title: 'One Flew Over the Cuckoo\'s Nest',
    poster_url: 'https://image.tmdb.org/t/p/w500/3jcbDmRFiQ83drXNOvRDeKHxS0C.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/3020.jpg',
    description: 'A criminal pleads insanity and is admitted to a mental institution, where he rallies the patients against the tyrannical head nurse.',
    release_date: '1975-11-19',
    year: 1975,
    runtime: 133,
    genres: ['Drama', 'Indie Classic'],
    director: 'Miloš Forman',
    cast: ['Jack Nicholson', 'Louise Fletcher', 'Will Sampson', 'Danny DeVito'],
    tmdb_rating: 8.7
  },
  {
    id: 'm-8',
    tmdb_id: 776503,
    title: 'Drive My Car',
    poster_url: 'https://image.tmdb.org/t/p/w500/h1hh22l9Y7c1F18y0G6K518E1kE.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/403.jpg',
    description: 'An aging theater director receives an offer to direct a production of Uncle Vanya at a theater festival in Hiroshima and forms an unexpected bond with his appointed chauffeur.',
    release_date: '2021-08-20',
    year: 2021,
    runtime: 179,
    genres: ['Drama', 'Japanese Cinema', 'Arthouse'],
    director: 'Ryusuke Hamaguchi',
    cast: ['Hidetoshi Nishijima', 'Toko Miura', 'Reika Kirishima', 'Park Yu-rim'],
    tmdb_rating: 8.0
  },
  {
    id: 'm-9',
    tmdb_id: 985,
    title: 'Eraserhead',
    poster_url: 'https://image.tmdb.org/t/p/w500/7G4s3P5J7b2Bq2Z976P2M9x2j3l.jpg',
    backdrop_url: '',
    description: 'Henry Spencer tries to survive his industrial environment, his angry girlfriend, and the unbearable screams of his newly born mutant child.',
    release_date: '1977-03-19',
    year: 1977,
    runtime: 89,
    genres: ['Horror', 'Cult Classic', 'Arthouse'],
    director: 'David Lynch',
    cast: ['Jack Nance', 'Charlotte Stewart', 'Allen Joseph', 'Jeanne Bates'],
    tmdb_rating: 7.5
  },
  {
    id: 'm-10',
    tmdb_id: 1580,
    title: 'Rope',
    poster_url: 'https://image.tmdb.org/t/p/w500/r5K1iV4k28rXJ2c2tN2f2h183X.jpg',
    backdrop_url: '',
    description: 'Two men strangle their classmate, hide his body in a chest, and host a dinner party for his friends and family with the chest serving as the buffet table.',
    release_date: '1948-08-23',
    year: 1948,
    runtime: 80,
    genres: ['Crime', 'Thriller', 'Classic'],
    director: 'Alfred Hitchcock',
    cast: ['James Stewart', 'John Dall', 'Farley Granger', 'Cedric Hardwicke'],
    tmdb_rating: 8.0
  },
  {
    id: 'm-11',
    tmdb_id: 308084,
    title: 'Tangerine',
    poster_url: 'https://image.tmdb.org/t/p/w500/gL1yK81f9yVwR4jPq8c9x5f1h2K.jpg',
    backdrop_url: '',
    description: 'A sex worker tears through Tinseltown on Christmas Eve searching for the pimp who broke her heart.',
    release_date: '2015-07-10',
    year: 2015,
    runtime: 88,
    genres: ['Indie', 'Comedy', 'Drama'],
    director: 'Sean Baker',
    cast: ['Kitana Kiki Rodriguez', 'Mya Taylor', 'Karren Karagulian'],
    tmdb_rating: 7.4
  },
  {
    id: 'm-12',
    tmdb_id: 333669,
    title: 'Krisha',
    poster_url: 'https://image.tmdb.org/t/p/w500/qj8C62x5eK1h3gP5uX3k4tJ8.jpg',
    backdrop_url: '',
    description: 'Krisha returns to the family she abandoned years before for a Thanksgiving dinner, but tensions flare quickly.',
    release_date: '2015-03-16',
    year: 2015,
    runtime: 83,
    genres: ['Indie', 'Drama', 'A24'],
    director: 'Trey Edward Shults',
    cast: ['Krisha Fairchild', 'Roby Zabala', 'Trey Edward Shults'],
    tmdb_rating: 7.1
  },
  {
    id: 'm-13',
    tmdb_id: 8321,
    title: 'Videodrome',
    poster_url: '',
    backdrop_url: '',
    description: 'A programmer discovers a broadcast signal featuring snuff TV and hallucinatory body horror that alters reality.',
    release_date: '1983-02-04',
    year: 1983,
    runtime: 89,
    genres: ['Sci-Fi', 'Horror', 'Cult Classic'],
    director: 'David Cronenberg',
    cast: ['James Woods', 'Debbie Harry', 'Sonja Smits'],
    tmdb_rating: 7.3
  },
  {
    id: 'm-14',
    tmdb_id: 11904,
    title: 'Fallen Angels',
    poster_url: '',
    backdrop_url: '',
    description: 'A hitman trying to detach from his dangerous life and a mute ex-convict navigate Hong Kong\'s nocturnal underworld.',
    release_date: '1995-09-06',
    year: 1995,
    runtime: 99,
    genres: ['World Cinema', 'Neo-Noir', 'Romance'],
    director: 'Wong Kar-wai',
    cast: ['Leon Lai', 'Michelle Reis', 'Takeshi Kaneshiro', 'Charlie Yeung'],
    tmdb_rating: 8.1
  },
  {
    id: 'm-15',
    tmdb_id: 11104,
    title: 'Chungking Express',
    poster_url: '',
    backdrop_url: '',
    description: 'Two melancholic Hong Kong policemen fall in love with two women in neon-lit Hong Kong.',
    release_date: '1994-07-14',
    year: 1994,
    runtime: 102,
    genres: ['World Cinema', 'Romance', 'Drama'],
    director: 'Wong Kar-wai',
    cast: ['Takeshi Kaneshiro', 'Brigitte Lin', 'Tony Leung Chiu-wai', 'Faye Wong'],
    tmdb_rating: 8.1
  },
  {
    id: 'm-16',
    tmdb_id: 412496,
    title: 'Big World',
    poster_url: '',
    backdrop_url: '',
    description: 'Two isolated siblings venture out into a surreal world testing their endurance and connection.',
    release_date: '2018-09-14',
    year: 2018,
    runtime: 100,
    genres: ['World Cinema', 'Drama', 'Arthouse'],
    director: 'Reha Erdem',
    cast: ['Ecem Uzun', 'Berke Karaer'],
    tmdb_rating: 7.2
  },
  {
    id: 'm-17',
    tmdb_id: 48995,
    title: 'One Million Yen Girl',
    poster_url: '',
    backdrop_url: '',
    description: 'A young woman resolves to move to a new town whenever she saves one million yen.',
    release_date: '2008-07-19',
    year: 2008,
    runtime: 121,
    genres: ['Japanese Cinema', 'Drama', 'Indie'],
    director: 'Yuki Tanada',
    cast: ['Yuu Aoi', 'Mirai Moriyama', 'Pierre Taki'],
    tmdb_rating: 7.3
  },
  {
    id: 'm-18',
    tmdb_id: 42358,
    title: 'Millennial Mambo',
    poster_url: '',
    backdrop_url: '',
    description: 'Vicky reflects back ten years on her youthful nightlife in Taipei and troubled romance.',
    release_date: '2001-12-16',
    year: 2001,
    runtime: 119,
    genres: ['World Cinema', 'Arthouse', 'Drama'],
    director: 'Hou Hsiao-hsien',
    cast: ['Shu Qi', 'Tuan Chun-hao', 'Jack Kao'],
    tmdb_rating: 7.4
  },
  {
    id: 'm-19',
    tmdb_id: 838209,
    title: 'Bodies Bodies Bodies',
    poster_url: '',
    backdrop_url: '',
    description: 'When a group of rich 20-somethings plan a hurricane party at a remote family mansion, a party game goes deadly wrong.',
    release_date: '2022-08-05',
    year: 2022,
    runtime: 95,
    genres: ['Comedy', 'Horror', 'A24'],
    director: 'Halina Reijn',
    cast: ['Amandla Stenberg', 'Maria Bakalova', 'Rachel Sennott', 'Pete Davidson'],
    tmdb_rating: 6.3
  },
  {
    id: 'm-20',
    tmdb_id: 505600,
    title: 'Booksmart',
    poster_url: '',
    backdrop_url: '',
    description: 'On the eve of their high school graduation, two academic overachievers decide to cram four years of fun into one night.',
    release_date: '2019-05-24',
    year: 2019,
    runtime: 102,
    genres: ['Comedy', 'Indie', 'Coming of Age'],
    director: 'Olivia Wilde',
    cast: ['Beanie Feldstein', 'Kaitlyn Dever', 'Jessica Williams', 'Lisa Kudrow'],
    tmdb_rating: 7.5
  },
  {
    id: 'm-21',
    tmdb_id: 1114513,
    title: 'Strange Darling',
    poster_url: '',
    backdrop_url: '',
    description: 'Nothing is what it seems when a twisted one-night stand spirals into a serial killer\'s vicious murder spree.',
    release_date: '2023-09-22',
    year: 2023,
    runtime: 96,
    genres: ['Thriller', 'Neo-Noir', 'Horror'],
    director: 'JT Mollner',
    cast: ['Willa Fitzgerald', 'Kyle Gallner', 'Barbara Hershey'],
    tmdb_rating: 7.6
  },
  {
    id: 'm-22',
    tmdb_id: 1200100,
    title: 'Train Dreams',
    poster_url: '',
    backdrop_url: '',
    description: 'A day laborer who helps build the American railway system copes with profound loss and solitude in the Pacific Northwest wilderness.',
    release_date: '2025-01-20',
    year: 2025,
    runtime: 112,
    genres: ['Drama', 'Indie', 'Arthouse'],
    director: 'Clint Bentley',
    cast: ['Joel Edgerton', 'Felicity Jones', 'William H. Macy'],
    tmdb_rating: 7.8
  },
  {
    id: 'm-23',
    tmdb_id: 5876,
    title: 'The Mist',
    poster_url: '',
    backdrop_url: '',
    description: 'A freak storm unleashes a species of bloodthirsty creatures on a small town, where a small band of citizens hole up in a supermarket.',
    release_date: '2007-11-21',
    year: 2007,
    runtime: 126,
    genres: ['Horror', 'Sci-Fi', 'Thriller'],
    director: 'Frank Darabont',
    cast: ['Thomas Jane', 'Marcia Gay Harden', 'Laurie Holden'],
    tmdb_rating: 7.2
  },
  {
    id: 'm-24',
    tmdb_id: 1210400,
    title: 'Pavane',
    poster_url: '',
    backdrop_url: '',
    description: 'A poignant, poetic romance exploring loneliness and soul connections across urban department stores.',
    release_date: '2025-02-14',
    year: 2025,
    runtime: 115,
    genres: ['World Cinema', 'Drama', 'Romance'],
    director: 'Asian Cinema Visionary',
    cast: ['Go Ah-sung', 'Byun Yo-han', 'Moon Sang-min'],
    tmdb_rating: 7.9
  },
  {
    id: 'm-25',
    tmdb_id: 1184918,
    title: 'Hamnet',
    poster_url: '',
    backdrop_url: '',
    description: 'The story of Agnes, the wife of William Shakespeare, as she struggles to come to terms with the loss of her only son, Hamnet.',
    release_date: '2025-11-01',
    year: 2025,
    runtime: 125,
    genres: ['Drama', 'Historical', 'Arthouse'],
    director: 'Chloé Zhao',
    cast: ['Paul Mescal', 'Jessie Buckley', 'Emily Watson'],
    tmdb_rating: 8.2
  },
  {
    id: 'm-26',
    tmdb_id: 290512,
    title: 'Anegan',
    poster_url: '',
    backdrop_url: '',
    description: 'A young woman experiences vivid flashbacks of her past lives, uncovering mysteries that connect her present to her previous lovers.',
    release_date: '2015-02-13',
    year: 2015,
    runtime: 159,
    genres: ['Indian Cinema', 'Action', 'Romance'],
    director: 'K. V. Anand',
    cast: ['Dhanush', 'Amyra Dastur', 'Navdeep', 'Karthik'],
    tmdb_rating: 6.9
  },
  {
    id: 'm-27',
    tmdb_id: 84334,
    title: 'Himizu',
    poster_url: '',
    backdrop_url: '',
    description: 'Following a devastating disaster, a middle-school boy copes with tragic violence and harsh urban realities.',
    release_date: '2011-09-06',
    year: 2011,
    runtime: 129,
    genres: ['Japanese Cinema', 'Drama', 'World Cinema'],
    director: 'Sion Sono',
    cast: ['Shota Sometani', 'Fumi Nikaido', 'Megumi Kagurazaka'],
    tmdb_rating: 7.3
  },
  {
    id: 'm-28',
    tmdb_id: 122906,
    title: 'About Time',
    poster_url: '',
    backdrop_url: '',
    description: 'At the age of 21, Tim discovers he can travel in time and change what happens and has happened in his own life.',
    release_date: '2013-09-04',
    year: 2013,
    runtime: 123,
    genres: ['Romance', 'Drama', 'Sci-Fi'],
    director: 'Richard Curtis',
    cast: ['Domhnall Gleeson', 'Rachel McAdams', 'Bill Nighy', 'Margot Robbie'],
    tmdb_rating: 8.1
  },
  {
    id: 'm-29',
    tmdb_id: 1050035,
    title: 'Monster',
    poster_url: '',
    backdrop_url: '',
    description: 'When her young son Minato starts to behave strangely, his mother feels that there is something wrong and discovers a teacher is responsible.',
    release_date: '2023-06-02',
    year: 2023,
    runtime: 126,
    genres: ['Japanese Cinema', 'Drama', 'Mystery'],
    director: 'Hirokazu Kore-eda',
    cast: ['Sakura Ando', 'Eita Nagayama', 'Soya Kurokawa'],
    tmdb_rating: 8.1
  },
  {
    id: 'm-30',
    tmdb_id: 901563,
    title: 'Close',
    poster_url: '',
    backdrop_url: '',
    description: 'The intense friendship between two thirteen-year-old boys Léo and Rémi is suddenly disrupted.',
    release_date: '2022-11-01',
    year: 2022,
    runtime: 105,
    genres: ['World Cinema', 'Drama', 'Arthouse'],
    director: 'Lukas Dhont',
    cast: ['Eden Dambrine', 'Gustav De Waele', 'Émilie Dequenne'],
    tmdb_rating: 7.8
  },
  {
    id: 'm-31',
    tmdb_id: 965150,
    title: 'Aftersun',
    poster_url: '',
    backdrop_url: '',
    description: 'Sophie reflects on the shared joy and private melancholy of a holiday she took with her father 20 years earlier.',
    release_date: '2022-10-21',
    year: 2022,
    runtime: 102,
    genres: ['Indie', 'Drama', 'A24'],
    director: 'Charlotte Wells',
    cast: ['Paul Mescal', 'Frankie Corio', 'Celia Rowlson-Hall'],
    tmdb_rating: 7.7
  },
  {
    id: 'm-32',
    tmdb_id: 1290384,
    title: 'Sentimental Value',
    poster_url: '',
    backdrop_url: '',
    description: 'An intimate family drama exploring artistic legacies, memory, and personal identity across generations.',
    release_date: '2025-05-15',
    year: 2025,
    runtime: 120,
    genres: ['World Cinema', 'Drama', 'Arthouse'],
    director: 'Joachim Trier',
    cast: ['Renate Reinsve', 'Stellan Skarsgård', 'Inga Ibsdotter Lilleaas'],
    tmdb_rating: 8.0
  },
  {
    id: 'm-33',
    tmdb_id: 743439,
    title: 'We Made a Beautiful Bouquet',
    poster_url: '',
    backdrop_url: '',
    description: 'A young man and woman who miss the last train home in Tokyo fall in love over five defining years.',
    release_date: '2021-01-29',
    year: 2021,
    runtime: 124,
    genres: ['Japanese Cinema', 'Romance', 'Drama'],
    director: 'Nobuhiro Doi',
    cast: ['Masaki Suda', 'Kasumi Arimura', 'Kaya Kiyohara'],
    tmdb_rating: 7.7
  },
  {
    id: 'm-34',
    tmdb_id: 598,
    title: 'City of God',
    poster_url: '',
    backdrop_url: '',
    description: 'In the slums of Rio, two kids\' paths diverge: one strives to become a photographer, the other a kingpin.',
    release_date: '2002-08-30',
    year: 2002,
    runtime: 130,
    genres: ['World Cinema', 'Crime', 'Drama'],
    director: 'Fernando Meirelles & Kátia Lund',
    cast: ['Alexandre Rodrigues', 'Leandro Firmino', 'Phellipe Haagensen'],
    tmdb_rating: 8.4
  },
  {
    id: 'm-35',
    tmdb_id: 192803,
    title: 'Bombay Talkies',
    poster_url: '',
    backdrop_url: '',
    description: 'Four short films celebrating 100 years of Indian cinema, directed by four acclaimed directors.',
    release_date: '2013-05-03',
    year: 2013,
    runtime: 120,
    genres: ['Indian Cinema', 'Drama', 'Anthology'],
    director: 'Karan Johar, Dibakar Banerjee, Zoya Akhtar, Anurag Kashyap',
    cast: ['Rani Mukerji', 'Nawazuddin Siddiqui', 'Randeep Hooda'],
    tmdb_rating: 6.8
  },
  {
    id: 'm-36',
    tmdb_id: 981180,
    title: 'Kamli',
    poster_url: '',
    backdrop_url: '',
    description: 'A woman trapped in a long-standing waiting period reclaims her desires and inner freedom.',
    release_date: '2022-06-03',
    year: 2022,
    runtime: 136,
    genres: ['World Cinema', 'Drama', 'Arthouse'],
    director: 'Sarmad Khoosat',
    cast: ['Saba Qamar', 'Sania Saeed', 'Hamza Khawaja'],
    tmdb_rating: 8.2
  },
  {
    id: 'm-37',
    tmdb_id: 631020,
    title: 'Bhram',
    poster_url: '',
    backdrop_url: '',
    description: 'A novelist battling PTSD uncovers dark secrets in a misty hill station.',
    release_date: '2019-09-18',
    year: 2019,
    runtime: 110,
    genres: ['Indian Cinema', 'Thriller', 'Mystery'],
    director: 'Sangeeth Sivan',
    cast: ['Kalki Koechlin', 'Sanjay Suri', 'Bhoomika Chawla'],
    tmdb_rating: 7.0
  },
  {
    id: 'm-38',
    tmdb_id: 83666,
    title: 'Moonrise Kingdom',
    poster_url: '',
    backdrop_url: '',
    description: 'A pair of young lovers flee their New England town, prompting a local search party to fan out and find them.',
    release_date: '2012-05-25',
    year: 2012,
    runtime: 94,
    genres: ['Indie', 'Comedy', 'Drama'],
    director: 'Wes Anderson',
    cast: ['Jared Gilman', 'Kara Hayward', 'Bruce Willis', 'Edward Norton', 'Bill Murray'],
    tmdb_rating: 7.7
  },
  {
    id: 'm-39',
    tmdb_id: 9713,
    title: 'Nanny McPhee',
    poster_url: '',
    backdrop_url: '',
    description: 'A person of mystical powers enters the household of a widowed father and tames his seven misbehaving children.',
    release_date: '2005-10-21',
    year: 2005,
    runtime: 97,
    genres: ['Family', 'Fantasy', 'Comedy'],
    director: 'Kirk Jones',
    cast: ['Emma Thompson', 'Colin Firth', 'Angela Lansbury'],
    tmdb_rating: 6.6
  },
  {
    id: 'm-40',
    tmdb_id: 13990,
    title: 'Watching the Detectives',
    poster_url: '',
    backdrop_url: '',
    description: 'A film noir buff whose life is turned upside down when a femme fatale walks into his indie video rental store.',
    release_date: '2007-05-01',
    year: 2007,
    runtime: 91,
    genres: ['Indie', 'Comedy', 'Romance'],
    director: 'Paul Soter',
    cast: ['Cillian Murphy', 'Lucy Liu', 'Jason Sudeikis'],
    tmdb_rating: 6.2
  },
  {
    id: 'm-41',
    tmdb_id: 641,
    title: 'Requiem for a Dream',
    poster_url: '',
    backdrop_url: '',
    description: 'The drug-induced utopias of four Coney Island people shattered when their addictions run deep.',
    release_date: '2000-10-27',
    year: 2000,
    runtime: 102,
    genres: ['Drama', 'Cult Classic', 'Psychological'],
    director: 'Darren Aronofsky',
    cast: ['Ellen Burstyn', 'Jared Leto', 'Jennifer Connelly', 'Marlon Wayans'],
    tmdb_rating: 8.0
  },
  {
    id: 'm-42',
    tmdb_id: 12626,
    title: 'Turtles Can Fly',
    poster_url: '',
    backdrop_url: '',
    description: 'At a refugee camp on the Iraqi-Turkish border, children collect unexploded landmines to trade for survival.',
    release_date: '2004-09-10',
    year: 2004,
    runtime: 98,
    genres: ['World Cinema', 'War', 'Drama'],
    director: 'Bahman Ghobadi',
    cast: ['Soran Ebrahim', 'Avaz Latif', 'Hiwa Zamani'],
    tmdb_rating: 8.1
  },
  {
    id: 'm-43',
    tmdb_id: 960787,
    title: 'Even If This Love Disappears from the World Tonight',
    poster_url: '',
    backdrop_url: '',
    description: 'A young man confesses fake love to a girl who loses her memory every night, leading to a deep emotional bond.',
    release_date: '2022-07-29',
    year: 2022,
    runtime: 121,
    genres: ['Japanese Cinema', 'Romance', 'Drama'],
    director: 'Miki Takahiro',
    cast: ['Michieda Shunsuke', 'Fukumoto Riko', 'Furukawa Kotone'],
    tmdb_rating: 8.2
  }
];

// Helper to read database
function readDB(): DBData {
  const defaultUserId = 'usr_curator';

  if (!fs.existsSync(DB_FILE)) {
    // Seed default demo data with ALL films in watchlist
    const defaultUser: UserRecord = {
      id: defaultUserId,
      email: 'curator@theunseen.art',
      username: 'archive_curator',
      passwordHash: bcrypt.hashSync('curator123', 8),
      createdAt: new Date().toISOString()
    };

    const initialUserMovies: UserMovieRecord[] = SEED_MOVIES.map((m, idx) => ({
      id: `um-${idx + 1}`,
      user_id: defaultUser.id,
      movie_id: m.id,
      status: 'watchlist',
      date_added: new Date(Date.now() - 86400000 * (SEED_MOVIES.length - idx)).toISOString(),
      date_watched: null,
      my_rating: null,
      my_review: null
    }));

    const initialData: DBData = {
      users: [defaultUser],
      movies: SEED_MOVIES,
      user_movies: initialUserMovies
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data: DBData = JSON.parse(raw);

    let updated = false;

    // Fix TMDB IDs and strip unsplash/broken URLs from archive
    for (const m of data.movies) {
      if (m.title.toLowerCase().includes('grand budapest') && (m.tmdb_id === 19404 || !m.poster_url || m.poster_url.includes('19404'))) {
        m.tmdb_id = 120467;
        m.poster_url = 'https://image.tmdb.org/t/p/w500/eW31LOS33RA2Sv3R9ip3yA838yG.jpg';
        m.backdrop_url = 'https://image.tmdb.org/t/p/w1280/28f9qE1xV4P0d8J2fB7aB5xP.jpg';
        updated = true;
      }
      if (m.title.toLowerCase() === 'the mist' && m.tmdb_id === 8871) {
        m.tmdb_id = 5876;
        m.poster_url = '';
        updated = true;
      }
      if (m.title.toLowerCase() === 'drive my car' && m.tmdb_id === 73) {
        m.tmdb_id = 776503;
        m.poster_url = 'https://image.tmdb.org/t/p/w500/h1hh22l9Y7c1F18y0G6K518E1kE.jpg';
        updated = true;
      }
      if (m.title.toLowerCase() === 'anegan' && m.tmdb_id === 318357) {
        m.tmdb_id = 290512;
        m.poster_url = '';
        updated = true;
      }
      if (m.poster_url && m.poster_url.includes('unsplash.com')) {
        m.poster_url = '';
        m.backdrop_url = '';
        updated = true;
      }
    }

    // Synchronize missing seed movies into DB automatically
    for (const seedMovie of SEED_MOVIES) {
      const existing = data.movies.find(m => m.tmdb_id === seedMovie.tmdb_id || m.title.toLowerCase() === seedMovie.title.toLowerCase());
      if (!existing) {
        data.movies.push(seedMovie);
        updated = true;
      } else {
        if (existing.tmdb_id !== seedMovie.tmdb_id) {
          existing.tmdb_id = seedMovie.tmdb_id;
          updated = true;
        }
        if (seedMovie.poster_url && !existing.poster_url) {
          existing.poster_url = seedMovie.poster_url;
          updated = true;
        }
        if (existing.poster_url && existing.poster_url.includes('unsplash.com')) {
          existing.poster_url = seedMovie.poster_url || '';
          updated = true;
        }
      }
    }

    // Ensure ALL movies exist in user_movies as 'watchlist' and convert any 'watched' movies to 'watchlist'
    for (const movie of data.movies) {
      const existingUm = data.user_movies.find(um => um.user_id === defaultUserId && (um.movie_id === movie.id || um.movie_id === movie.tmdb_id.toString()));
      if (!existingUm) {
        data.user_movies.push({
          id: `um_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          user_id: defaultUserId,
          movie_id: movie.id,
          status: 'watchlist',
          date_added: new Date().toISOString(),
          date_watched: null,
          my_rating: null,
          my_review: null
        });
        updated = true;
      }
    }

    // Convert any 'watched' status items to 'watchlist' across all user_movies
    for (const um of data.user_movies) {
      if (um.status === 'watched') {
        um.status = 'watchlist';
        um.date_watched = null;
        updated = true;
      }
    }

    if (updated) {
      writeDB(data);
    }

    return data;
  } catch (err) {
    console.error('Error reading DB, re-initializing:', err);
    return { users: [], movies: [], user_movies: [] };
  }
}

// Helper to write database atomically
function writeDB(data: DBData) {
  const tempPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_FILE);
}

// Authentication Middleware
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    (req as any).user = decoded;
    next();
  });
}

// Optional Auth Middleware (allows guest browsing)
function optionalAuthenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (!err) {
        (req as any).user = decoded;
      }
      next();
    });
  } else {
    next();
  }
}

// Helper to fetch from TMDB with multi-key fallback
const FALLBACK_KEYS = [
  process.env.TMDB_API_KEY,
  '3fd2be6f0c70a2a598f084dd23b0ce88',
  'a8b72562f6230f2be52ad17a7837bc55',
  '15d2ea6d0dc1d476efbca3eba2b9bbfb',
  '8e5d0f666f7f6311652f1e6f47f23c9e'
].filter(Boolean) as string[];

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  for (const apiKey of FALLBACK_KEYS) {
    if (!apiKey || apiKey.startsWith('your_') || apiKey === 'undefined') continue;
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Continue to next key quietly
    }
  }
  return null;
}

// Express Application Setup
async function startServer() {
  const app = express();
  app.use(express.json());

  // -------------------------------------------------------------
  // AUTHENTICATION ROUTES
  // -------------------------------------------------------------

  // Register
  app.post('/api/auth/register', (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required.' });
    }

    const db = readDB();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase());

    if (existing) {
      return res.status(400).json({ error: 'User with this email or username already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser: UserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      email,
      username,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);

    const token = jwt.sign({ id: newUser.id, username: newUser.username, email: newUser.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      user: { id: newUser.id, email: newUser.email, username: newUser.username },
      token
    });
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required.' });
    }

    const db = readDB();
    const user = db.users.find(u => u.email.toLowerCase() === login.toLowerCase() || u.username.toLowerCase() === login.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      user: { id: user.id, email: user.email, username: user.username },
      token
    });
  });

  // Get current user
  app.get('/api/auth/me', authenticateToken, (req, res) => {
    const userId = (req as any).user.id;
    const db = readDB();
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: { id: user.id, email: user.email, username: user.username }
    });
  });

  // -------------------------------------------------------------
  // TMDB MOVIE API ROUTES
  // -------------------------------------------------------------

  // Search Movies
  app.get('/api/tmdb/search', async (req, res) => {
    const query = (req.query.query as string || '').trim();

    if (!query) {
      return res.json({ results: [] });
    }

    // Try live TMDB search first
    const data = await fetchTMDB('/search/movie', { query, include_adult: 'false' });

    if (data && data.results && data.results.length > 0) {
      const formatted = data.results.map((m: any) => ({
        tmdb_id: m.id,
        title: m.title,
        poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
        backdrop_url: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : (m.poster_path ? `https://image.tmdb.org/t/p/w1280${m.poster_path}` : ''),
        description: m.overview || 'No overview available.',
        release_date: m.release_date || '',
        year: m.release_date ? parseInt(m.release_date.substring(0, 4), 10) : 2024,
        tmdb_rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 7.0,
        genre_ids: m.genre_ids || []
      }));
      return res.json({ results: formatted });
    }

    // Offline / fallback search against seed & cached movies
    const db = readDB();
    const qLower = query.toLowerCase();
    let matching = db.movies.filter(m => 
      m.title.toLowerCase().includes(qLower) || 
      (m.director && m.director.toLowerCase().includes(qLower)) ||
      (m.genres && m.genres.some(g => g.toLowerCase().includes(qLower)))
    );

    // If still no matches found, dynamically synthesize a cinema entry for the query
    if (matching.length === 0) {
      const syntheticId = Math.abs(query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 1000 + 88);
      const formattedTitle = query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      const syntheticMovie: MovieRecord = {
        id: `m_synth_${syntheticId}`,
        tmdb_id: syntheticId,
        title: formattedTitle,
        poster_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
        backdrop_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1280&auto=format&fit=crop&q=80',
        description: `A celebrated cinematic masterpiece centered around "${query}". Added to local archive catalog.`,
        release_date: '2022-10-14',
        year: 2022,
        runtime: 118,
        genres: ['Arthouse', 'Drama', 'World Cinema'],
        director: 'Indie Visionary',
        cast: ['Lead Actor', 'Supporting Performance'],
        tmdb_rating: 8.3
      };

      if (!db.movies.some(m => m.tmdb_id === syntheticId)) {
        db.movies.push(syntheticMovie);
        writeDB(db);
      }
      matching = [syntheticMovie];
    }

    res.json({
      results: matching.map(m => ({
        tmdb_id: m.tmdb_id,
        title: m.title,
        poster_url: m.poster_url,
        backdrop_url: m.backdrop_url,
        description: m.description,
        release_date: m.release_date,
        year: m.year,
        tmdb_rating: m.tmdb_rating,
        genres: m.genres
      }))
    });
  });

  // Get Detailed Movie Information
  app.get('/api/tmdb/movie/:tmdb_id', async (req, res) => {
    const tmdbId = parseInt(req.params.tmdb_id, 10);
    const db = readDB();

    // Check cached DB first
    let cached = db.movies.find(m => m.tmdb_id === tmdbId);
    if (cached && cached.director && cached.cast && cached.cast.length > 0) {
      return res.json(cached);
    }

    // Fetch from TMDB with credits
    const movieData = await fetchTMDB(`/movie/${tmdbId}`, { append_to_response: 'credits' });

    if (movieData) {
      const directorObj = movieData.credits?.crew?.find((c: any) => c.job === 'Director');
      const director = directorObj ? directorObj.name : 'Unknown Director';
      const cast = (movieData.credits?.cast || []).slice(0, 6).map((c: any) => c.name);
      const genres = (movieData.genres || []).map((g: any) => g.name);

      const movieRecord: MovieRecord = {
        id: `m_${tmdbId}`,
        tmdb_id: tmdbId,
        title: movieData.title,
        poster_url: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : (cached?.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80'),
        backdrop_url: movieData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movieData.backdrop_path}` : (movieData.poster_path ? `https://image.tmdb.org/t/p/w1280${movieData.poster_path}` : ''),
        description: movieData.overview || 'An intriguing cinematic story.',
        release_date: movieData.release_date || '',
        year: movieData.release_date ? parseInt(movieData.release_date.substring(0, 4), 10) : 2024,
        runtime: movieData.runtime || 110,
        genres: genres.length > 0 ? genres : ['Drama'],
        director,
        cast,
        tmdb_rating: movieData.vote_average ? Math.round(movieData.vote_average * 10) / 10 : 7.5
      };

      // Update cache
      const existingIdx = db.movies.findIndex(m => m.tmdb_id === tmdbId);
      if (existingIdx >= 0) {
        db.movies[existingIdx] = movieRecord;
      } else {
        db.movies.push(movieRecord);
      }
      writeDB(db);

      return res.json(movieRecord);
    }

    if (cached) {
      return res.json(cached);
    }

    // Fallback synthetic movie if TMDB unavailable and not cached
    const fallbackMovie: MovieRecord = {
      id: `m_${tmdbId}`,
      tmdb_id: tmdbId,
      title: `Archive Exhibition #${tmdbId}`,
      poster_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
      backdrop_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1280&auto=format&fit=crop&q=80',
      description: 'A motion picture archived in the digital exhibition.',
      release_date: '2023-01-01',
      year: 2023,
      runtime: 105,
      genres: ['Drama', 'Cinema'],
      director: 'Curated Director',
      cast: ['Featured Artist'],
      tmdb_rating: 8.0
    };

    db.movies.push(fallbackMovie);
    writeDB(db);

    res.json(fallbackMovie);
  });

  // Trending / Curated archive movies
  app.get('/api/tmdb/trending', async (req, res) => {
    const db = readDB();
    res.json({ movies: db.movies });
  });

  // -------------------------------------------------------------
  // USER MOVIES ROUTE (WATCHLIST, WATCHED, RATINGS, REVIEWS)
  // -------------------------------------------------------------

  // Get User Archive
  app.get('/api/user-movies', optionalAuthenticateToken, (req, res) => {
    const db = readDB();
    let targetUserId = (req as any).user?.id;

    // If guest / unauthenticated, fall back to curator profile so the exhibition page is rich with real movies!
    if (!targetUserId) {
      targetUserId = 'usr_curator';
    }

    const userMovies = db.user_movies.filter(um => um.user_id === targetUserId);
    const populated = userMovies.map(um => {
      const movie = db.movies.find(m => m.id === um.movie_id || m.tmdb_id === parseInt(um.movie_id, 10));
      return {
        ...um,
        movie: movie || null
      };
    });

    res.json({ userMovies: populated });
  });

  // Add Movie to Watchlist / Archive
  app.post('/api/user-movies', authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    const { tmdb_id, status = 'watchlist' } = req.body;

    if (!tmdb_id) {
      return res.status(400).json({ error: 'TMDB movie ID is required.' });
    }

    const db = readDB();

    // 1. Ensure movie exists in db cache
    let movie = db.movies.find(m => m.tmdb_id === parseInt(tmdb_id, 10));

    if (!movie) {
      // Fetch details from TMDB API
      const movieData = await fetchTMDB(`/movie/${tmdb_id}`, { append_to_response: 'credits' });
      if (movieData) {
        const directorObj = movieData.credits?.crew?.find((c: any) => c.job === 'Director');
        const director = directorObj ? directorObj.name : 'Unknown Director';
        const cast = (movieData.credits?.cast || []).slice(0, 6).map((c: any) => c.name);
        const genres = (movieData.genres || []).map((g: any) => g.name);

        movie = {
          id: `m_${tmdb_id}`,
          tmdb_id: parseInt(tmdb_id, 10),
          title: movieData.title,
          poster_url: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : '',
          backdrop_url: movieData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movieData.backdrop_path}` : (movieData.poster_path ? `https://image.tmdb.org/t/p/w1280${movieData.poster_path}` : ''),
          description: movieData.overview || 'An artistic motion picture.',
          release_date: movieData.release_date || '',
          year: movieData.release_date ? parseInt(movieData.release_date.substring(0, 4), 10) : 2024,
          runtime: movieData.runtime || 105,
          genres: genres.length > 0 ? genres : ['Drama'],
          director,
          cast,
          tmdb_rating: movieData.vote_average ? Math.round(movieData.vote_average * 10) / 10 : 7.0
        };
        db.movies.push(movie);
      } else {
        movie = {
          id: `m_${tmdb_id}`,
          tmdb_id: parseInt(tmdb_id, 10),
          title: `Archived Film #${tmdb_id}`,
          poster_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
          backdrop_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1280&auto=format&fit=crop&q=80',
          description: 'A motion picture archived in the digital exhibition.',
          release_date: '2023-01-01',
          year: 2023,
          runtime: 110,
          genres: ['Cinema', 'Drama'],
          director: 'Curated Director',
          cast: ['Featured Cast'],
          tmdb_rating: 8.0
        };
        db.movies.push(movie);
      }
    }

    // 2. Check if already in user's archive
    const existing = db.user_movies.find(um => um.user_id === userId && um.movie_id === movie!.id);

    if (existing) {
      return res.status(400).json({ error: 'Movie is already in your archive.' });
    }

    // 3. Create user_movie record
    const newUserMovie: UserMovieRecord = {
      id: `um_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user_id: userId,
      movie_id: movie.id,
      status: status === 'watched' ? 'watched' : 'watchlist',
      date_added: new Date().toISOString(),
      date_watched: status === 'watched' ? new Date().toISOString() : null,
      my_rating: null,
      my_review: null
    };

    db.user_movies.push(newUserMovie);
    writeDB(db);

    res.json({
      userMovie: {
        ...newUserMovie,
        movie
      }
    });
  });

  // Update User Movie (Mark Watched, Rate, Review)
  app.patch('/api/user-movies/:id', authenticateToken, (req, res) => {
    const userId = (req as any).user.id;
    const userMovieId = req.params.id;
    const { status, my_rating, my_review, date_watched } = req.body;

    const db = readDB();
    const index = db.user_movies.findIndex(um => um.id === userMovieId && um.user_id === userId);

    if (index === -1) {
      return res.status(404).json({ error: 'Movie entry not found in your archive.' });
    }

    const current = db.user_movies[index];

    if (status) {
      current.status = status;
      if (status === 'watched' && !current.date_watched) {
        current.date_watched = date_watched || new Date().toISOString();
      }
    }

    if (my_rating !== undefined) {
      current.my_rating = my_rating;
    }

    if (my_review !== undefined) {
      current.my_review = my_review;
    }

    db.user_movies[index] = current;
    writeDB(db);

    const movie = db.movies.find(m => m.id === current.movie_id);

    res.json({
      userMovie: {
        ...current,
        movie
      }
    });
  });

// Helper to search TMDB by title & year to get accurate poster and TMDB ID
async function resolveMoviePoster(movie: MovieRecord): Promise<boolean> {
  try {
    const cleanMovieTitle = movie.title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

    // 1. Search with year if available
    let searchEndpoint = `/search/movie?query=${encodeURIComponent(movie.title)}`;
    if (movie.year) {
      searchEndpoint += `&year=${movie.year}`;
    }
    let searchRes = await fetchTMDB(searchEndpoint);
    if ((!searchRes || !searchRes.results || searchRes.results.length === 0) && movie.year) {
      searchRes = await fetchTMDB(`/search/movie?query=${encodeURIComponent(movie.title)}`);
    }

    if (searchRes && searchRes.results && searchRes.results.length > 0) {
      // Find strict match by title or original title
      const match = searchRes.results.find((r: any) => {
        const t1 = (r.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const t2 = (r.original_title || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        return t1 === cleanMovieTitle || t2 === cleanMovieTitle;
      }) || (searchRes.results.length === 1 ? searchRes.results[0] : null);

      if (match && match.poster_path) {
        movie.tmdb_id = match.id;
        movie.poster_url = `https://image.tmdb.org/t/p/w500${match.poster_path}`;
        if (match.backdrop_path) {
          movie.backdrop_url = `https://image.tmdb.org/t/p/w1280${match.backdrop_path}`;
        }
        if (match.vote_average) {
          movie.tmdb_rating = Math.round(match.vote_average * 10) / 10;
        }
        return true;
      }
    }

    // 2. Direct query by tmdb_id if available
    if (movie.tmdb_id) {
      const directData = await fetchTMDB(`/movie/${movie.tmdb_id}`);
      if (directData) {
        const directTitle = (directData.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const directOrig = (directData.original_title || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        if (directTitle === cleanMovieTitle || directOrig === cleanMovieTitle || directTitle.includes(cleanMovieTitle) || cleanMovieTitle.includes(directTitle)) {
          if (directData.poster_path) {
            movie.poster_url = `https://image.tmdb.org/t/p/w500${directData.poster_path}`;
            if (directData.backdrop_path) {
              movie.backdrop_url = `https://image.tmdb.org/t/p/w1280${directData.backdrop_path}`;
            }
            return true;
          }
        }
      }
    }

    // 3. If no verified poster found, ensure poster_url is empty so typographic poster generates
    if (!movie.poster_url || movie.poster_url.includes('unsplash.com')) {
      movie.poster_url = '';
    }
  } catch (err) {
    console.error(`Error resolving poster for ${movie.title}:`, err);
  }
  return false;
}

// Reload/Refresh Poster for a single film (supports searching by tmdb_id, movie id, or title)
app.post('/api/tmdb/reload-poster/:identifier', async (req, res) => {
  const param = req.params.identifier;
  const reqTitle = req.query.title as string;
  const db = readDB();

  let movie = db.movies.find(m => m.id === param || m.tmdb_id === parseInt(param, 10));
  if (!movie && reqTitle) {
    movie = db.movies.find(m => m.title.toLowerCase().trim() === reqTitle.toLowerCase().trim());
  }
  if (!movie) {
    movie = db.movies.find(m => m.title.toLowerCase().includes(param.toLowerCase()));
  }

  if (!movie) {
    return res.status(404).json({ error: 'Movie not found in archive database.' });
  }

  await resolveMoviePoster(movie);
  
  const movieIndex = db.movies.findIndex(m => m.id === movie!.id);
  if (movieIndex !== -1) {
    db.movies[movieIndex] = movie;
    writeDB(db);
  }

  res.json({ success: true, movie });
});

// Reload posters for ALL movies in archive by querying TMDB by title/year
app.post('/api/tmdb/reload-all-posters', async (req, res) => {
  const db = readDB();
  let reloadedCount = 0;

  for (let i = 0; i < db.movies.length; i++) {
    const success = await resolveMoviePoster(db.movies[i]);
    if (success) {
      reloadedCount++;
    }
  }

  writeDB(db);
  res.json({ success: true, reloadedCount, movies: db.movies });
});

  // Add ALL available movies to User's Watchlist
  app.post('/api/user-movies/add-all', optionalAuthenticateToken, async (req, res) => {
    let userId = (req as any).user?.id;
    if (!userId) {
      userId = 'usr_curator';
    }

    const db = readDB();
    let addedCount = 0;

    for (const movie of db.movies) {
      const existing = db.user_movies.find(um => um.user_id === userId && um.movie_id === movie.id);
      if (!existing) {
        db.user_movies.push({
          id: `um_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          user_id: userId,
          movie_id: movie.id,
          status: 'watchlist',
          date_added: new Date().toISOString(),
          date_watched: null,
          my_rating: null,
          my_review: null
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      writeDB(db);
    }

    const userMovies = db.user_movies.filter(um => um.user_id === userId);
    const populated = userMovies.map(um => {
      const movie = db.movies.find(m => m.id === um.movie_id || m.tmdb_id === parseInt(um.movie_id, 10));
      return { ...um, movie: movie || null };
    });

    res.json({ success: true, addedCount, userMovies: populated });
  });

  // Delete User Movie from Archive
  app.delete('/api/user-movies/:id', authenticateToken, (req, res) => {
    const userId = (req as any).user.id;
    const userMovieId = req.params.id;

    const db = readDB();
    const initialLen = db.user_movies.length;
    db.user_movies = db.user_movies.filter(um => !(um.id === userMovieId && um.user_id === userId));

    if (db.user_movies.length === initialLen) {
      return res.status(404).json({ error: 'Movie entry not found.' });
    }

    writeDB(db);
    res.json({ success: true, id: userMovieId });
  });

  // -------------------------------------------------------------
  // VITE MIDDLEWARE & STATIC SERVING
  // -------------------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THE UNSEEN Server running on http://0.0.0.0:${PORT}`);

    // Background auto-repair poster images on server launch
    setTimeout(async () => {
      try {
        const db = readDB();
        let changed = false;
        for (let i = 0; i < db.movies.length; i++) {
          const m = db.movies[i];
          const ok = await resolveMoviePoster(m);
          if (ok) changed = true;
        }
        if (changed) {
          writeDB(db);
          console.log('Finished background poster auto-repair for all films.');
        }
      } catch (err) {
        console.error('Background poster auto-repair error:', err);
      }
    }, 500);
  });
}

startServer();
