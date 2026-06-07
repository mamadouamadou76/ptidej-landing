import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://ptidej.fr',
  output: 'static',
  adapter: vercel(),
  compressHTML: true,
});
