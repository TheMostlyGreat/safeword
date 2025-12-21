import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://safeword.dev',
  integrations: [
    starlight({
      title: 'Safeword',
      description: 'AI coding agent guardrails - hooks, skills, and quality controls',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/safeword-dev/safeword' }],
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
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'Reference',
          items: [
            { label: 'CLI Commands', slug: 'reference/cli' },
            { label: 'Hooks', slug: 'reference/hooks' },
            { label: 'Skills', slug: 'reference/skills' },
            { label: 'Configuration', slug: 'reference/configuration' },
          ],
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/safeword-dev/safeword/edit/main/packages/website/',
      },
    }),
  ],
});
