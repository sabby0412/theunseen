// Utility to generate a high-craft typographic poster SVG Data URI
// when no official movie poster is available or when an image fails to load.

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateTypographicPoster(
  title: string,
  director?: string,
  year?: number | string,
  genres?: string[] | string
): string {
  const cleanTitle = (title || 'UNTITLED ARCHIVE').toUpperCase().trim();
  const cleanDir = (director || 'CURATED EXHIBITION').toUpperCase().trim();
  const cleanYear = year ? String(year) : '';
  const genreList = Array.isArray(genres) ? genres.slice(0, 2).join(' • ') : (genres || 'CINEMA ARCHIVE');
  const cleanGenre = genreList.toUpperCase().trim();

  // Dynamic color palette based on title hash
  const hash = cleanTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hueAccents = ['#FF3D00', '#FF5500', '#FF8800', '#FF3366', '#E63946', '#FFB703'];
  const accentColor = hueAccents[hash % hueAccents.length];

  // Split title into lines for SVG text wrapping
  const words = cleanTitle.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > 12) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = (currentLine + ' ' + word).trim();
    }
  }
  if (currentLine) lines.push(currentLine.trim());

  const maxLines = Math.min(lines.length, 5);
  const fontSize = maxLines > 3 ? 24 : maxLines === 3 ? 28 : 34;
  const lineHeight = fontSize + 10;
  const startY = 280 - ((maxLines * lineHeight) / 2);

  const titleSpans = lines.slice(0, maxLines).map((line, i) =>
    `<text x="50%" y="${startY + (i * lineHeight)}" text-anchor="middle" font-family="'Space Grotesk', 'Impact', -apple-system, sans-serif" font-weight="900" font-size="${fontSize}" fill="#F2F2EF" letter-spacing="2">${escapeXml(line)}</text>`
  ).join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGlow_${hash}" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#1e1e1e"/>
      <stop offset="70%" stop-color="#0e0e0e"/>
      <stop offset="100%" stop-color="#050505"/>
    </radialGradient>
    <pattern id="grain_${hash}" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="none"/>
      <circle cx="2" cy="2" r="0.5" fill="#ffffff" opacity="0.07"/>
      <circle cx="6" cy="5" r="0.4" fill="#ffffff" opacity="0.05"/>
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="400" height="600" fill="url(#bgGlow_${hash})"/>
  <rect width="400" height="600" fill="url(#grain_${hash})"/>

  <!-- Geometric Accent Lines & Frame -->
  <rect x="18" y="18" width="364" height="564" fill="none" stroke="${accentColor}" stroke-width="1.5" opacity="0.75"/>
  <rect x="24" y="24" width="352" height="552" fill="none" stroke="#F2F2EF" stroke-width="0.75" stroke-dasharray="3 3" opacity="0.25"/>

  <!-- Top Header / Exhibition Monogram -->
  <text x="50%" y="60" text-anchor="middle" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="10" font-weight="700" fill="${accentColor}" letter-spacing="4">THE UNSEEN // ARCHIVE</text>
  <line x1="90" y1="75" x2="310" y2="75" stroke="${accentColor}" stroke-width="1" opacity="0.4"/>
  <text x="50%" y="98" text-anchor="middle" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="9" font-weight="600" fill="#8E8E93" letter-spacing="3">${escapeXml(cleanGenre)}</text>

  <!-- Decorative Reel Marks -->
  <rect x="34" y="130" width="4" height="12" fill="${accentColor}" opacity="0.6"/>
  <rect x="362" y="130" width="4" height="12" fill="${accentColor}" opacity="0.6"/>
  <rect x="34" y="440" width="4" height="12" fill="${accentColor}" opacity="0.6"/>
  <rect x="362" y="440" width="4" height="12" fill="${accentColor}" opacity="0.6"/>

  <!-- Main Center Title Display -->
  ${titleSpans}

  <!-- Center Divider Dot -->
  <circle cx="200" cy="${startY + (maxLines * lineHeight) + 20}" r="3.5" fill="${accentColor}" opacity="0.8"/>

  <!-- Director / Cinema Tag -->
  <text x="50%" y="${startY + (maxLines * lineHeight) + 55}" text-anchor="middle" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="9" font-weight="600" fill="#71717A" letter-spacing="3">DIRECTED BY</text>
  <text x="50%" y="${startY + (maxLines * lineHeight) + 80}" text-anchor="middle" font-family="'Space Grotesk', -apple-system, sans-serif" font-weight="700" font-size="16" fill="#F2F2EF" letter-spacing="1.5">${escapeXml(cleanDir)}</text>

  <!-- Bottom Details Bar -->
  <line x1="36" y1="525" x2="364" y2="525" stroke="#27272A" stroke-width="1"/>
  <text x="36" y="552" text-anchor="start" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="10" font-weight="700" fill="#FFEE00">${cleanYear ? 'RELEASE: ' + escapeXml(cleanYear) : 'CINEMA EXHIBIT'}</text>
  <text x="364" y="552" text-anchor="end" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="10" font-weight="700" fill="${accentColor}">ARCHIVE NO. ${hash % 900 + 100}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getPosterSrc(
  movie: { title: string; poster_url?: string; director?: string; year?: number | string; genres?: string[] | string }
): string {
  if (
    movie.poster_url &&
    movie.poster_url.startsWith('https://image.tmdb.org') &&
    !movie.poster_url.includes('undefined') &&
    !movie.poster_url.includes('null')
  ) {
    return movie.poster_url;
  }
  return generateTypographicPoster(movie.title, movie.director, movie.year, movie.genres);
}
