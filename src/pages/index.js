import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

// ── FIX 4: Database replaces SQL + PL/SQL ──────────────────────
const TOPICS = [
  {
    label: 'Database',
    desc: 'SQL queries, PL/SQL procedures, packages, optimizer hints, and core Oracle DB concepts',
    to: '/docs-oracle/intro',
    glyph: '⬡',
  },
  {
    label: 'APEX',
    desc: 'Low-code builder, IR/IG, dynamic actions, REST data sources',
    to: '/docs-oracle/intro',
    glyph: '◉',
  },
  {
    label: 'EBS',
    desc: 'E-Business Suite, APIs, concurrent programs, and module references',
    to: '/docs-oracle/intro',
    glyph: '◫',
  },
];

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="Home" description="Personal Oracle developer reference — SQL, PL/SQL, APEX, EBS">

      <div className={styles.heroWrap}>
        <p className={styles.eyebrow}>Personal Reference</p>
        <h1 className={styles.heroTitle}>Oracle Dev Notes</h1>
        <p className={styles.heroSub}>
          A personal reference for SQL, PL/SQL, APEX, and E-Business Suite.
          <br />
          Built to find things fast — not to impress anyone.
        </p>
        <Link className={styles.heroBtn} to="/docs-oracle/intro">
          Open Docs →
        </Link>
      </div>

      <div className={styles.playground}>
        <div className={styles.auroraWrap} aria-hidden="true">
          <div className={clsx(styles.orb, styles.orb1)} />
          <div className={clsx(styles.orb, styles.orb2)} />
          <div className={clsx(styles.orb, styles.orb3)} />
        </div>
        <div className={styles.cardGrid}>
          {TOPICS.map((t) => (
            <Link key={t.label} to={t.to} className={styles.card}>
              <span className={styles.cardGlyph}>{t.glyph}</span>
              <span className={styles.cardLabel}>{t.label}</span>
              <span className={styles.cardDesc}>{t.desc}</span>
            </Link>
          ))}
        </div>
      </div>

    </Layout>
  );
}
