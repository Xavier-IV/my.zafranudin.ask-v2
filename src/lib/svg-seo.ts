export interface SEOImageParams {
  title: string;
  description: string;
  author: string;
  siteName: string;
  theme: "dark" | "light";
  width: number;
  height: number;
}

export function generateSVGOGImage(params: SEOImageParams): string {
  const { title, description, author, siteName, theme, width, height } = params;

  const isDark = theme === "dark";
  const bgColor = isDark ? "#0a0a0a" : "#fafafa";
  const textColor = isDark ? "#fafafa" : "#0a0a0a";
  const mutedColor = isDark ? "#a1a1aa" : "#71717a";
  const accentColor = isDark ? "#3b82f6" : "#2563eb";
  const dotColor = isDark ? "#1f2937" : "#e5e7eb";

  // Escape HTML entities
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeAuthor = escapeHtml(author);
  const safeSiteName = escapeHtml(siteName);

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="${dotColor}"/>
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  <rect width="${width}" height="${height}" fill="url(#dots)"/>
  
  <!-- Accent line -->
  <rect x="0" y="0" width="6" height="${height}" fill="${accentColor}"/>
  
  <!-- Content -->
  <text x="80" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="600" fill="${textColor}">
    ${safeTitle}
  </text>
  
  <text x="80" y="320" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="${mutedColor}">
    ${safeDescription}
  </text>
  
  <!-- Footer -->
  <line x1="80" y1="520" x2="${width - 80}" y2="520" stroke="${dotColor}" stroke-width="1"/>
  
  <text x="80" y="570" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="${mutedColor}">
    ${safeAuthor}
  </text>
  
  <text x="${width - 80}" y="570" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="${mutedColor}" text-anchor="end">
    ${safeSiteName}
  </text>
</svg>`;
}
