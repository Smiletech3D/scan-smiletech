// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      // Ignora node_modules, .next e alguns arquivos/pastas do Windows
      config.watchOptions = {
        ignored: [
          '**/.git/**',
          '**/node_modules/**',
          '**/.next/**',
          // globs para evitar subir até a raiz em casos estranhos
          '**/C:\\\\pagefile.sys',
          '**/C:\\\\hiberfil.sys',
          '**/C:\\\\swapfile.sys',
          '**/C:\\\\System Volume Information/**',
          '**/C:\\\\DumpStack.log.tmp'
        ]
      };
    }
    return config;
  }
};

module.exports = nextConfig;

