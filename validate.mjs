/**
 * Zen Website - Zod Validation Script
 *
 * Validates the structural integrity of index.html before deployment.
 * Run: node validate.mjs
 *
 * Checks: assets, links, meta tags, translations, content structure,
 * image attributes, accessibility, and known patterns.
 */

import { z } from 'zod';
import * as cheerio from 'cheerio';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, 'index.html'), 'utf-8');
const $ = cheerio.load(html);

let passed = 0;
let failed = 0;
let warnings = 0;

function pass(label) {
  passed++;
  console.log(`  \x1b[32m✓\x1b[0m ${label}`);
}

function fail(label, detail) {
  failed++;
  console.log(`  \x1b[31m✗\x1b[0m ${label}`);
  if (detail) console.log(`    → ${detail}`);
}

function warn(label, detail) {
  warnings++;
  console.log(`  \x1b[33m⚠\x1b[0m ${label}`);
  if (detail) console.log(`    → ${detail}`);
}

function check(label, condition, detail) {
  if (condition) pass(label);
  else fail(label, detail);
}

// ============================================================
// SCHEMA DEFINITIONS
// ============================================================

const MetaSchema = z.object({
  charset: z.literal('UTF-8'),
  viewport: z.string().includes('width=device-width'),
  title: z.string().min(10),
  description: z.string().min(50),
  ogTitle: z.string().min(5),
  ogDescription: z.string().min(20),
  ogType: z.literal('website'),
  ogLocale: z.literal('pt_BR'),
  ogImage: z.string().min(1),
  lang: z.literal('pt-BR'),
});

const SectionSchema = z.object({
  hero: z.literal(true),
  sobre: z.literal(true),
  comoFunciona: z.literal(true),
  faq: z.literal(true),
  posicionamento: z.literal(true),
  bottomCta: z.literal(true),
  footer: z.literal(true),
});

const ContentSchema = z.object({
  agentCards: z.number().min(10, 'Expected at least 10 agent cards'),
  agentTabs: z.number().min(10, 'Expected at least 10 agent tabs'),
  faqItems: z.number().min(5, 'Expected at least 5 FAQ items'),
  howItWorksSteps: z.number().min(3, 'Expected at least 3 steps'),
  forms: z.number().min(2, 'Expected at least 2 forms (hero + bottom CTA)'),
  bankLogos: z.number().min(10, 'Expected at least 10 bank logos'),
});

const TranslationSchema = z.object({
  enSelectors: z.literal(true, { message: 'enSelectors not found in JS' }),
  enCards: z.literal(true, { message: 'enCards not found in JS' }),
  enTabs: z.literal(true, { message: 'enTabs not found in JS' }),
  enFaq: z.literal(true, { message: 'enFaq not found in JS' }),
  enSteps: z.literal(true, { message: 'enSteps not found in JS' }),
  enHow: z.literal(true, { message: 'enHow not found in JS' }),
  enCta: z.literal(true, { message: 'enCta not found in JS' }),
  enFooter: z.literal(true, { message: 'enFooter not found in JS' }),
  enForm: z.literal(true, { message: 'enForm not found in JS' }),
  enConsent: z.literal(true, { message: 'enConsent not found in JS' }),
  enLegalLinks: z.literal(true, { message: 'enLegalLinks not found in JS' }),
  enLegalDisclaimer: z.literal(true, { message: 'enLegalDisclaimer not found in JS' }),
  chatDataEN: z.literal(true, { message: 'chatDataEN not found in JS' }),
  illustrationMap: z.literal(true, { message: 'illustrationMap not found in JS' }),
});

// ============================================================
// 1. META TAGS
// ============================================================

console.log('\n\x1b[1m1. Meta Tags\x1b[0m');

const metaData = {
  charset: $('meta[charset]').attr('charset') || '',
  viewport: $('meta[name="viewport"]').attr('content') || '',
  title: $('title').text() || '',
  description: $('meta[name="description"]').attr('content') || '',
  ogTitle: $('meta[property="og:title"]').attr('content') || '',
  ogDescription: $('meta[property="og:description"]').attr('content') || '',
  ogType: $('meta[property="og:type"]').attr('content') || '',
  ogLocale: $('meta[property="og:locale"]').attr('content') || '',
  ogImage: $('meta[property="og:image"]').attr('content') || '',
  lang: $('html').attr('lang') || '',
};

const metaResult = MetaSchema.safeParse(metaData);
if (metaResult.success) {
  pass('All meta tags valid');
} else {
  metaResult.error.issues.forEach(issue => {
    fail(`Meta: ${issue.path.join('.')}`, issue.message);
  });
}

// Favicon
check('Favicon present', $('link[rel="icon"]').length > 0);

// ============================================================
// 2. REQUIRED SECTIONS
// ============================================================

console.log('\n\x1b[1m2. Required Sections\x1b[0m');

const sections = {
  hero: !!$('#hero').length,
  sobre: !!$('#sobre').length,
  comoFunciona: !!$('#como-funciona').length,
  faq: !!$('#faq').length,
  posicionamento: !!$('#posicionamento').length,
  bottomCta: !!$('#bottom-cta').length,
  footer: !!$('footer').length,
};

const sectionResult = SectionSchema.safeParse(sections);
if (sectionResult.success) {
  pass('All required sections present');
} else {
  sectionResult.error.issues.forEach(issue => {
    fail(`Missing section: ${issue.path.join('.')}`, issue.message);
  });
}

// ============================================================
// 3. CONTENT STRUCTURE
// ============================================================

console.log('\n\x1b[1m3. Content Structure\x1b[0m');

const content = {
  agentCards: $('.sobre-card').length,
  agentTabs: $('.sobre-tab').length,
  faqItems: $('#faq .faq-item').length,
  howItWorksSteps: $('#como-funciona h3').length,
  forms: $('form').length,
  bankLogos: $('img[alt]').filter((_, el) => {
    const alt = $(el).attr('alt');
    return ['Nubank', 'Itaú', 'Bradesco', 'Santander', 'Inter', 'C6 Bank', 'Mercado Pago', 'BTG Pactual', 'Caixa', 'PicPay', 'Neon', 'Banco do Brasil'].includes(alt);
  }).length,
};

const contentResult = ContentSchema.safeParse(content);
if (contentResult.success) {
  pass(`Content structure valid (${content.agentCards} cards, ${content.faqItems} FAQs, ${content.howItWorksSteps} steps, ${content.bankLogos} banks)`);
} else {
  contentResult.error.issues.forEach(issue => {
    fail(`Content: ${issue.path.join('.')}`, `${issue.message} (got ${content[issue.path[0]]})`);
  });
}

// Agent cards have all required parts
$('.sobre-card').each((i, card) => {
  const label = $(card).find('.tracking-widest').text().trim();
  const title = $(card).find('h4').text().trim();
  const body = $(card).find('p:not(.tracking-widest)').text().trim();
  const tags = $(card).find('.flex-wrap span').length;
  if (!label || !title || !body || tags < 3) {
    fail(`Agent card ${i} incomplete`, `label="${label.substring(0, 20)}" title="${title.substring(0, 20)}" tags=${tags}`);
  }
});
pass('All agent cards have label, title, body, and tags');

// ============================================================
// 4. ASSET FILES
// ============================================================

console.log('\n\x1b[1m4. Asset Files\x1b[0m');

const localAssets = new Set();
$('img[src]').each((_, el) => {
  const src = $(el).attr('src');
  if (src && !src.startsWith('http') && !src.startsWith('data:')) localAssets.add(src);
});
$('link[href]').each((_, el) => {
  const href = $(el).attr('href');
  if (href && !href.startsWith('http') && !href.startsWith('#')) localAssets.add(href);
});

// Extract url() from inline styles
const urlMatches = html.match(/url\(['"]?([^'")\s]+)['"]?\)/g) || [];
urlMatches.forEach(match => {
  const url = match.replace(/url\(['"]?/, '').replace(/['"]?\)/, '');
  if (!url.startsWith('http') && !url.startsWith('data:')) localAssets.add(url);
});

let missingAssets = [];
localAssets.forEach(asset => {
  const fullPath = join(__dirname, asset);
  if (!existsSync(fullPath)) missingAssets.push(asset);
});

if (missingAssets.length === 0) {
  pass(`All ${localAssets.size} local assets exist on disk`);
} else {
  missingAssets.forEach(a => fail(`Missing asset: ${a}`));
}

// ============================================================
// 5. INTERNAL LINKS
// ============================================================

console.log('\n\x1b[1m5. Internal Links\x1b[0m');

const anchorLinks = [];
const relativeLinks = [];
$('a[href]').each((_, el) => {
  const href = $(el).attr('href');
  if (href.startsWith('#') && href !== '#') {
    const targetId = href.slice(1);
    const exists = $(`#${targetId}`).length > 0;
    if (!exists) anchorLinks.push(href);
  } else if (!href.startsWith('http') && !href.startsWith('mailto:') && href !== '#') {
    const fullPath = join(__dirname, href.replace(/\/$/, '/index.html'));
    if (!existsSync(fullPath)) {
      // Try without index.html for directories
      const dirPath = join(__dirname, href);
      if (!existsSync(dirPath)) relativeLinks.push(href);
    }
  }
});

if (anchorLinks.length === 0) pass('All anchor links resolve to existing IDs');
else anchorLinks.forEach(l => fail(`Broken anchor: ${l}`));

if (relativeLinks.length === 0) pass('All relative links point to existing files');
else relativeLinks.forEach(l => fail(`Broken relative link: ${l}`));

// ============================================================
// 6. IMAGE ACCESSIBILITY & PERFORMANCE
// ============================================================

console.log('\n\x1b[1m6. Images\x1b[0m');

const imgIssues = { missingAlt: [], missingDimensions: [], lazyWithoutDimensions: [] };

$('img').each((_, el) => {
  const src = $(el).attr('src') || '';
  const alt = $(el).attr('alt');
  const width = $(el).attr('width');
  const height = $(el).attr('height');
  const loading = $(el).attr('loading');

  if (src.startsWith('data:') || !src) return;

  // SVGs don't need dimensions as much
  const isSvg = src.endsWith('.svg');

  if (alt === undefined || alt === null) {
    imgIssues.missingAlt.push(src.replace(/.*\//, ''));
  }

  if (loading === 'lazy' && (!width || !height) && !isSvg) {
    imgIssues.lazyWithoutDimensions.push(src.replace(/.*\//, ''));
  }
});

if (imgIssues.missingAlt.length === 0) pass('All images have alt attributes');
else imgIssues.missingAlt.forEach(i => fail(`Missing alt: ${i}`));

if (imgIssues.lazyWithoutDimensions.length === 0) pass('All lazy-loaded images have width/height');
else imgIssues.lazyWithoutDimensions.forEach(i => fail(`Lazy image without dimensions: ${i}`, 'Browser may not load images in collapsed containers'));

// ============================================================
// 7. TRANSLATIONS
// ============================================================

console.log('\n\x1b[1m7. Translations\x1b[0m');

const scriptContent = [];
$('script:not([src])').each((_, el) => {
  scriptContent.push($(el).html() || '');
});
const allJs = scriptContent.join('\n');

const translations = {
  enSelectors: allJs.includes('enSelectors'),
  enCards: allJs.includes('enCards'),
  enTabs: allJs.includes('enTabs'),
  enFaq: allJs.includes('enFaq'),
  enSteps: allJs.includes('enSteps'),
  enHow: allJs.includes('enHow'),
  enCta: allJs.includes('enCta'),
  enFooter: allJs.includes('enFooter'),
  enForm: allJs.includes('enForm'),
  enConsent: allJs.includes('enConsent'),
  enLegalLinks: allJs.includes('enLegalLinks'),
  enLegalDisclaimer: allJs.includes('enLegalDisclaimer'),
  chatDataEN: allJs.includes('chatDataEN'),
  illustrationMap: allJs.includes('illustrationMap'),
};

const transResult = TranslationSchema.safeParse(translations);
if (transResult.success) {
  pass('All 14 translation objects present');
} else {
  transResult.error.issues.forEach(issue => {
    fail(`Translation: ${issue.path.join('.')}`, issue.message);
  });
}

// Check i18n functions exist
check('initI18n() function exists', allJs.includes('function initI18n()'));
check('switchLang() function exists', allJs.includes('function switchLang('));
check('translateIllustrations() function exists', allJs.includes('function translateIllustrations('));
check('restartChat() function exists', allJs.includes('function restartChat()'));

// Chat animation timeout tracking
check('chatAnimationTimeouts tracking array exists', allJs.includes('chatAnimationTimeouts'));
check('trackTimeout() helper exists', allJs.includes('function trackTimeout('));

// No localStorage language persistence
const hasLocalStorageLang = allJs.includes("localStorage.getItem('zenLang')") || allJs.includes('localStorage.getItem("zenLang")');
check('No localStorage language auto-restore on load', !hasLocalStorageLang, 'Page must always open in Portuguese');

// Default language is PT
check('Default currentLang is "pt"', allJs.includes("let currentLang = 'pt'") || allJs.includes('let currentLang = "pt"'));

// ============================================================
// 8. CHAT DATA STRUCTURE
// ============================================================

console.log('\n\x1b[1m8. Chat Data\x1b[0m');

// Count PT chat conversations (var chatData = [...])
const ptChatMatch = allJs.match(/var chatData\s*=\s*\[([\s\S]*?)\];\s*\n/);
if (ptChatMatch) {
  const ptConvCount = (ptChatMatch[1].match(/\{\s*messages:/g) || []).length;
  check(`PT chat data has 4 conversations`, ptConvCount === 4, `Found ${ptConvCount}`);
} else {
  fail('PT chatData not found');
}

// Count EN chat conversations
const enChatMatch = allJs.match(/(?:const|var|let)\s+chatDataEN\s*=\s*\[([\s\S]*?)\];\s*\n/);
if (enChatMatch) {
  const enConvCount = (enChatMatch[1].match(/\{\s*messages:/g) || []).length;
  check(`EN chat data has 4 conversations`, enConvCount === 4, `Found ${enConvCount}`);
} else {
  fail('EN chatDataEN not found');
}

// ============================================================
// 9. LEGAL & COMPLIANCE
// ============================================================

console.log('\n\x1b[1m9. Legal & Compliance\x1b[0m');

// Privacy policy link
check('Privacy policy link exists', $('a[href*="privacidade"]').length > 0);

// Legal PDFs linked
check('Data retention PDF linked', $('a[href*="politica-retencao-dados"]').length > 0);
check('Incident reporting PDF linked', $('a[href*="politica-reporte-incidentes"]').length > 0);

// CNPJ in footer
const footerText = $('footer').text();
check('CNPJ present in footer', footerText.includes('63.740.359/0001-15'));
check('Company name in footer', footerText.includes('AIZEN TECNOLOGIA'));
check('Correspondente Bancário disclosure', footerText.includes('Correspondente Bancário'));

// Consent text in forms
const allText = $('body').text();
check('Form consent text present', allText.includes('concorda em receber mensagens'));

// ============================================================
// 10. TYPOGRAPHY & CONTENT QUALITY
// ============================================================

console.log('\n\x1b[1m10. Content Quality\x1b[0m');

// Check for "Aleah" (old product name)
const hasAleah = html.toLowerCase().includes('aleah');
check('No references to old name "Aleah"', !hasAleah, 'Product was renamed to Zen');

// Check no TODO/FIXME/HACK comments
const hasTodos = /(?:TODO|FIXME|HACK|XXX)(?:\s|:)/i.test(html);
if (hasTodos) warn('Found TODO/FIXME/HACK comments in HTML');
else pass('No TODO/FIXME/HACK comments');

// Check em dashes (style violation)
const hasEmDash = /\u2014/.test($('body').text());
if (hasEmDash) warn('Em dashes found in visible text (style guide prefers periods/commas)');
else pass('No em dashes in visible text');

// WhatsApp placeholder number
if (html.includes('5511999999999')) {
  warn('WhatsApp uses placeholder number (5511999999999)', 'Replace before launch');
} else {
  pass('WhatsApp number is not a placeholder');
}

// Social media links are placeholders
const socialPlaceholders = $('footer a[href="#"]').length;
if (socialPlaceholders > 0) {
  warn(`${socialPlaceholders} placeholder social links (href="#") in footer`, 'Add real social URLs before launch');
} else {
  pass('All footer links have real URLs');
}

// ============================================================
// 11. EXTERNAL DEPENDENCIES
// ============================================================

console.log('\n\x1b[1m11. External Dependencies\x1b[0m');

const requiredCDNs = [
  'cdn.tailwindcss.com',
  'fonts.googleapis.com',
  'cdnjs.cloudflare.com/ajax/libs/gsap',
  'unpkg.com/lucide',
  'iconify',
  'lenis',
];

requiredCDNs.forEach(cdn => {
  check(`CDN loaded: ${cdn}`, html.includes(cdn));
});

// ============================================================
// SUMMARY
// ============================================================

console.log('\n' + '='.repeat(50));
console.log(`\x1b[1mResults: ${passed} passed, ${failed} failed, ${warnings} warnings\x1b[0m`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n\x1b[31m✗ VALIDATION FAILED - Fix issues before deploying\x1b[0m\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n\x1b[33m⚠ PASSED WITH WARNINGS - Review before deploying\x1b[0m\n');
  process.exit(0);
} else {
  console.log('\n\x1b[32m✓ ALL CHECKS PASSED - Ready to deploy\x1b[0m\n');
  process.exit(0);
}
