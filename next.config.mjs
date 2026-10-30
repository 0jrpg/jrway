/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Admin secreto: não indexável por motor de busca (além do meta noindex na página).
        // ATENÇÃO: o caminho é propositalmente OMITIDO do robots.txt e do sitemap.xml
        // para não revelar a URL secreta.
        source: '/acess/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }]
      },
      {
        source: '/dashboard',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
      }
    ];
  }
};

export default nextConfig;
