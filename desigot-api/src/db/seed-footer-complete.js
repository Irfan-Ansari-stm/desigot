const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = require('./pool');

async function seedFooter() {
  console.log('Seeding complete default footer matching master reference...');

  // 1. Footer Settings
  const existingSettings = await pool.query(`SELECT id FROM cms_footer_settings LIMIT 1`);
  const settingsData = {
    brand_name: 'Desigot',
    brand_description: 'Desigot is the global creative marketplace for enterprise design systems, digital assets, and vetted agency services.',
    company_info: 'Desigot is the global creative marketplace for enterprise design systems, digital assets, and vetted agency services.',
    copyright_owner: 'Desigot Inc.',
    copyright_text: '© 2026 Desigot Inc. All rights reserved. Crafted for visionary design teams worldwide.',
    copyright_year_mode: 'auto',
    manual_copyright_year: 2026,
    background_color: '#0B0F19',
    heading_color: '#FFFFFF',
    text_color: '#91A8C7',
    link_color: '#91A8C7',
    hover_color: '#FFFFFF',
    border_color: '#263144',
    max_width: '1280px',
    desktop_visibility: true,
    tablet_visibility: true,
    mobile_visibility: true,
    newsletter_enabled: true,
    newsletter_title: 'Join the global creative network',
    newsletter_description: 'Receive curated design systems, UI inspirations, and creator spotlights directly to your inbox.',
    cta_enabled: false,
    publication_status: 'published',
    social_links_json: {
      twitter: 'https://twitter.com/desigot',
      linkedin: 'https://linkedin.com/company/desigot',
      github: 'https://github.com/desigot',
      figma: 'https://figma.com/@desigot'
    },
    payment_icons_json: ['visa', 'mastercard', 'amex', 'stripe', 'apple_pay', 'google_pay'],
    is_active: true
  };

  if (existingSettings.rows.length === 0) {
    await pool.query(`
      INSERT INTO cms_footer_settings (
        brand_name, brand_description, company_info, copyright_owner, copyright_text,
        copyright_year_mode, manual_copyright_year, background_color, heading_color,
        text_color, link_color, hover_color, border_color, max_width, desktop_visibility,
        tablet_visibility, mobile_visibility, newsletter_enabled, newsletter_title,
        newsletter_description, cta_enabled, publication_status, social_links_json,
        payment_icons_json, is_active, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,NOW())
    `, [
      settingsData.brand_name, settingsData.brand_description, settingsData.company_info,
      settingsData.copyright_owner, settingsData.copyright_text, settingsData.copyright_year_mode,
      settingsData.manual_copyright_year, settingsData.background_color, settingsData.heading_color,
      settingsData.text_color, settingsData.link_color, settingsData.hover_color,
      settingsData.border_color, settingsData.max_width, settingsData.desktop_visibility,
      settingsData.tablet_visibility, settingsData.mobile_visibility, settingsData.newsletter_enabled,
      settingsData.newsletter_title, settingsData.newsletter_description, settingsData.cta_enabled,
      settingsData.publication_status, JSON.stringify(settingsData.social_links_json),
      JSON.stringify(settingsData.payment_icons_json), settingsData.is_active
    ]);
  } else {
    await pool.query(`
      UPDATE cms_footer_settings
      SET brand_name = $1, brand_description = $2, company_info = $3,
          copyright_owner = $4, copyright_text = $5, background_color = $6,
          heading_color = $7, text_color = $8, link_color = $9, hover_color = $10,
          border_color = $11, newsletter_enabled = $12, newsletter_title = $13,
          newsletter_description = $14, social_links_json = $15, updated_at = NOW()
      WHERE id = $16
    `, [
      settingsData.brand_name, settingsData.brand_description, settingsData.company_info,
      settingsData.copyright_owner, settingsData.copyright_text, settingsData.background_color,
      settingsData.heading_color, settingsData.text_color, settingsData.link_color,
      settingsData.hover_color, settingsData.border_color, settingsData.newsletter_enabled,
      settingsData.newsletter_title, settingsData.newsletter_description,
      JSON.stringify(settingsData.social_links_json), existingSettings.rows[0].id
    ]);
  }

  // 2. Columns & Links Setup (The 5 reference columns)
  const columnsData = [
    {
      title: 'Marketplace',
      slug: 'marketplace',
      column_order: 1,
      links: [
        { label: 'Explore All Assets', url: '/browse', sort_order: 1 },
        { label: 'UI Kits & Systems', url: '/categories/ui-kits', sort_order: 2 },
        { label: 'Figma Templates', url: '/categories/figma-templates', sort_order: 3 },
        { label: 'Mobile App Screens', url: '/categories/mobile-app-screens', sort_order: 4 },
        { label: 'Dashboard SaaS Themes', url: '/categories/dashboard-templates', sort_order: 5 },
      ]
    },
    {
      title: 'Design Services',
      slug: 'design-services',
      column_order: 2,
      links: [
        { label: 'Browse All Services', url: '/services', sort_order: 1 },
        { label: 'Web & Landing Pages', url: '/services?category=web-design', sort_order: 2 },
        { label: 'Mobile App UX', url: '/services?category=mobile-app-ux', sort_order: 3 },
        { label: 'Design System Sprint', url: '/services?category=design-systems', sort_order: 4 },
        { label: 'SaaS Heuristic Audit', url: '/services?category=saas-audit', sort_order: 5 },
      ]
    },
    {
      title: 'Creators & Sellers',
      slug: 'creators-sellers',
      column_order: 3,
      links: [
        { label: 'Become a Seller', url: '/seller/onboarding', sort_order: 1 },
        { label: 'Creator Guidelines', url: '/seller/guidelines', sort_order: 2 },
        { label: 'Seller Earnings & Fees', url: '/seller/fees', sort_order: 3 },
        { label: 'Affiliate Program', url: '/affiliate', sort_order: 4 },
        { label: 'Creator Success Stories', url: '/success-stories', sort_order: 5 },
      ]
    },
    {
      title: 'Company & Team',
      slug: 'company-team',
      column_order: 4,
      links: [
        { label: 'About Desigot', url: '/about', sort_order: 1 },
        { label: 'Careers & Hiring', url: '/careers', sort_order: 2 },
        { label: 'Brand & Media Kit', url: '/brand-kit', sort_order: 3 },
        { label: 'Press Releases', url: '/press', sort_order: 4 },
        { label: 'Contact Support', url: '/contact', sort_order: 5 },
      ]
    },
    {
      title: 'Help & Resources',
      slug: 'help-resources',
      column_order: 5,
      links: [
        { label: 'Help Center & FAQs', url: '/support', sort_order: 1 },
        { label: 'Customer Concierge', url: '/contact', sort_order: 2 },
        { label: 'Design Insights Blog', url: '/blog', sort_order: 3 },
        { label: 'Buyer Protection', url: '/support', sort_order: 4 },
        { label: 'Community Forum', url: '/blog', sort_order: 5 },
      ]
    },
    {
      title: 'Legal & Compliance',
      slug: 'legal-compliance',
      column_order: 6,
      links: [
        { label: 'Privacy Policy', url: '/privacy', sort_order: 1 },
        { label: 'Terms of Service', url: '/terms', sort_order: 2 },
        { label: 'Refund Policy', url: '/refund-policy', sort_order: 3 },
        { label: 'Cookie Policy', url: '/cookie-policy', sort_order: 4 },
        { label: 'Accessibility Statement', url: '/accessibility', sort_order: 5 },
      ]
    }
  ];

  // Clean and repopulate standard columns
  await pool.query(`DELETE FROM cms_footer_links`);
  await pool.query(`DELETE FROM cms_footer_columns`);

  for (const col of columnsData) {
    const colRes = await pool.query(`
      INSERT INTO cms_footer_columns (title, slug, column_order, is_active)
      VALUES ($1, $2, $3, true)
      RETURNING id
    `, [col.title, col.slug, col.column_order]);
    const colId = colRes.rows[0].id;

    for (const link of col.links) {
      await pool.query(`
        INSERT INTO cms_footer_links (column_id, label, url, sort_order, is_active, route_type, open_behavior)
        VALUES ($1, $2, $3, $4, true, 'internal', 'same_tab')
      `, [colId, link.label, link.url, link.sort_order]);
    }
  }

  // 3. Social Media Accounts
  await pool.query(`DELETE FROM footer_social_links`);
  const socialLinks = [
    { platform: 'Twitter', profile_url: 'https://twitter.com/desigot', icon: 'Twitter', display_order: 1 },
    { platform: 'LinkedIn', profile_url: 'https://linkedin.com/company/desigot', icon: 'Linkedin', display_order: 2 },
    { platform: 'GitHub', profile_url: 'https://github.com/desigot', icon: 'Github', display_order: 3 },
    { platform: 'Figma', profile_url: 'https://figma.com/@desigot', icon: 'Figma', display_order: 4 },
  ];
  for (const s of socialLinks) {
    await pool.query(`
      INSERT INTO footer_social_links (platform, profile_url, icon, display_order, enabled)
      VALUES ($1, $2, $3, $4, true)
    `, [s.platform, s.profile_url, s.icon, s.display_order]);
  }

  // 4. Legal Links
  await pool.query(`DELETE FROM footer_legal_links`);
  const legalLinks = [
    { title: 'Privacy Policy', url: '/privacy', display_order: 1 },
    { title: 'Terms of Service', url: '/terms', display_order: 2 },
    { title: 'Refund Policy', url: '/refund-policy', display_order: 3 },
    { title: 'Cookie Policy', url: '/cookie-policy', display_order: 4 },
    { title: 'Accessibility Statement', url: '/accessibility', display_order: 5 }
  ];
  for (const l of legalLinks) {
    await pool.query(`
      INSERT INTO footer_legal_links (title, url, display_order, enabled)
      VALUES ($1, $2, $3, true)
    `, [l.title, l.url, l.display_order]);
  }

  // 5. Initial Version Snapshot
  const snapSettings = (await pool.query(`SELECT * FROM cms_footer_settings LIMIT 1`)).rows[0];
  const snapCols = (await pool.query(`SELECT * FROM cms_footer_columns`)).rows;
  const snapLinks = (await pool.query(`SELECT * FROM cms_footer_links`)).rows;
  await pool.query(`
    INSERT INTO footer_versions (version_number, configuration_snapshot, change_summary)
    VALUES (1, $1, 'Initial master footer baseline seeded')
  `, [JSON.stringify({ settings: snapSettings, columns: snapCols, links: snapLinks, socialLinks, legalLinks })]);

  console.log('✅ Footer seed data populated successfully.');
  process.exit(0);
}

seedFooter().catch(err => {
  console.error('Seeding footer failed:', err);
  process.exit(1);
});
