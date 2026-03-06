// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Some Docs',
  tagline: 'Dinosaurs are cool',
  favicon: 'img/favicon.ico',

  markdown: { mermaid: true },
  themes: ['@docusaurus/theme-mermaid'],

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://someUser.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/Oracle-Docs/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'someUser', // Usually your GitHub org/user name.
  projectName: 'Oracle-Docs', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  deploymentBranch: 'gh-pages',  

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js', 
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:undefined,
        }, 
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ], 
  plugins: [
    require.resolve('docusaurus-plugin-image-zoom'),
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'oracleDocs',
        path: 'docs-oracle',
        routeBasePath: 'docs-oracle',
        sidebarPath: require.resolve('./sidebars.oracle.js'), 
        editCurrentVersion: false,
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({ 
      zoom: {
        selector: '.markdown :not(em) > img, .mermaid svg',
        background: {
            light: 'rgb(255, 255, 255)',
            dark: 'rgb(50, 50, 50)',
        },
        config: {
            margin: 24,
        },
    },
    
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Docs',
        logo: {
          alt: 'My Site Logo',
          src: 'img/logo.svg',
        },
        items: [
        // { type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: 'Tutorial' }, 
          { 
            type: 'docSidebar',
            sidebarId: 'oracleSidebar',
            docsPluginId: 'oracleDocs',
            position: 'left',
            label: 'Oracle Docs',
          },
          {
            href: 'https://github.com/someUser/Oracle-Docs',
            label: 'GitHub',
            position: 'right',
          },
        ],
      }, 
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Oracle Architecture',
                to: '/docs-oracle/intro', // Points to oracle docs
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/someUser/Oracle-Docs',
              },
            ],
          },
        ],
        
        copyright: `Copyright © ${new Date().getFullYear()} someUser, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['plsql'],
      },
    }),
};

export default config;
