import path from 'node:path';
import { fileURLToPath } from 'node:url';

import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

const __dirname = import.meta.dirname;

export default defineConfig({
  site: 'https://safeword.dev',
  vite: {
    cacheDir: path.resolve(__dirname, 'node_modules/.vite'),
  },
  integrations: [
    starlight({
      title: 'Safeword',
      description: 'AI coding agent guardrails - hooks, skills, and quality controls',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/TheMostlyGreat/safeword' },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Quick Start', slug: 'getting-started/quick-start' },
          ],
        },
        {
          label: 'Guides',
          items: [{ label: 'Overview', slug: 'guides' }],
        },
        {
          label: 'Reference',
          items: [
            { label: 'CLI', slug: 'reference/cli' },
            { label: 'Commands', slug: 'reference/commands' },
            { label: 'Hooks', slug: 'reference/hooks' },
            { label: 'Skills', slug: 'reference/skills' },
            { label: 'Configuration', slug: 'reference/configuration' },
          ],
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/TheMostlyGreat/safeword/edit/main/packages/website/',
      },
    }),
  ],
});
