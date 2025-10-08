import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Rewind',
  tagline: 'Explore ArNS history',
  favicon: 'img/REWIND_BLACK_LOGO.png',

  future: { v4: true },

  url: 'https://rewind.ar.io',
  baseUrl: '/',

  organizationName: 'facebook',
  projectName: 'rewind',

  onBrokenLinks: 'throw',

  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          /** ✅ Make docs live at the root of this site (which is mounted at /docs/) */
          routeBasePath: '/',                // <-- key line
        },
        /** ✅ Disable blog entirely */
        blog: false,                         // <-- turned off
        /** ✅ Disable custom “pages” so the template homepage disappears */
        pages: false,                        // <-- turned off
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: 'Rewind',
      logo: { alt: 'Rewind Logo', src: 'img/REWIND_BLACK_LOGO.png' },
      items: [
        { to: '/', label: 'Back to App', position: 'left' },
        { type: 'doc', docId: 'intro', label: 'Docs', position: 'left' },
        { href: 'https://github.com/yourorg/yourrepo', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        { title: 'Docs', items: [{ label: 'Rewind', to: '/' }] },
        {
          title: 'Community',
          items: [
            { label: 'Stack Overflow', href: 'https://stackoverflow.com/questions/tagged/docusaurus' },
            { label: 'Discord', href: 'https://discordapp.com/invite/docusaurus' },
            { label: 'X', href: 'https://x.com/docusaurus' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Rewind. Built with Docusaurus.`,
    },
    prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula },
  } satisfies Preset.ThemeConfig,
};

export default config;
