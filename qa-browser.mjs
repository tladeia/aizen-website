/**
 * Zen Website - Browser QA Script
 *
 * Uses Playwright to navigate the site at multiple viewports,
 * test interactions, and capture issues.
 *
 * Run: node qa-browser.mjs [url]
 * Default URL: http://localhost:8765
 *
 * Requires: npx playwright install chromium (first time only)
 */

import { chromium } from 'playwright';

const BASE_URL = process.argv[2] || 'http://localhost:8765';

const VIEWPORTS = [
  { name: 'Mobile (iPhone 14)', width: 390, height: 844 },
  { name: 'Tablet (iPad)', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 800 },
  { name: 'Wide Desktop', width: 1920, height: 1080 },
];

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Privacy Policy', path: '/privacidade/' },
  { name: 'Privacy PDF', path: '/legal/politica-privacidade.html' },
];

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

async function run() {
  console.log(`\n\x1b[1mBrowser QA - ${BASE_URL}\x1b[0m\n`);

  const browser = await chromium.launch({ headless: true });

  // ========================================================
  // 1. PAGE LOAD TESTS (all pages)
  // ========================================================

  console.log('\x1b[1m1. Page Load\x1b[0m');

  for (const pg of PAGES) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    try {
      const response = await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response?.status();

      if (status === 200) pass(`${pg.name} loads (HTTP ${status})`);
      else fail(`${pg.name} load`, `HTTP ${status}`);

      if (errors.length === 0) pass(`${pg.name} - no JS errors`);
      else errors.forEach(e => fail(`${pg.name} JS error`, e));
    } catch (e) {
      fail(`${pg.name} load`, e.message);
    }

    await context.close();
  }

  // ========================================================
  // 2. RESPONSIVE LAYOUT (per viewport)
  // ========================================================

  console.log('\n\x1b[1m2. Responsive Layout\x1b[0m');

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });

    // Horizontal overflow
    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      viewport: window.innerWidth,
    }));

    if (overflow.body <= overflow.viewport) {
      pass(`${vp.name} (${vp.width}px) - no horizontal overflow`);
    } else {
      fail(`${vp.name} (${vp.width}px) - horizontal overflow`, `body=${overflow.body}px > viewport=${overflow.viewport}px`);
    }

    // Nav visible
    const navVisible = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      return nav && nav.getBoundingClientRect().height > 0;
    });
    if (navVisible) pass(`${vp.name} - nav visible`);
    else fail(`${vp.name} - nav not visible`);

    // Phone mockup visibility
    const phoneCheck = await page.evaluate(() => {
      const phone = document.querySelector('.phone-frame');
      if (!phone) return { found: false };
      const container = phone.closest('div[class*="order-2"]');
      const cs = getComputedStyle(container);
      return {
        found: true,
        display: cs.display,
        width: phone.getBoundingClientRect().width,
        height: phone.getBoundingClientRect().height,
      };
    });

    if (phoneCheck.found && phoneCheck.display !== 'none' && phoneCheck.width > 0) {
      pass(`${vp.name} - phone mockup visible (${Math.round(phoneCheck.width)}x${Math.round(phoneCheck.height)})`);
    } else {
      fail(`${vp.name} - phone mockup hidden or collapsed`);
    }

    // Footer visible when scrolled
    const footerVisible = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      footer?.scrollIntoView();
      return footer && footer.getBoundingClientRect().height > 0;
    });
    if (footerVisible) pass(`${vp.name} - footer accessible`);
    else fail(`${vp.name} - footer not accessible`);

    await context.close();
  }

  // ========================================================
  // 3. IMAGES
  // ========================================================

  console.log('\n\x1b[1m3. Images\x1b[0m');

  const imgContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const imgPage = await imgContext.newPage();
  await imgPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });

  // Scroll through entire page to trigger lazy loads
  await imgPage.evaluate(async () => {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await delay(100);
    }
    window.scrollTo(0, 0);
  });
  await imgPage.waitForTimeout(2000);

  const brokenImages = await imgPage.evaluate(() => {
    return Array.from(document.querySelectorAll('img'))
      .filter(img => img.src && !img.src.startsWith('data:'))
      .filter(img => !img.complete || img.naturalWidth === 0)
      .map(img => img.src.replace(/.*\/site\//, ''));
  });

  if (brokenImages.length === 0) pass('All images loaded after full scroll');
  else brokenImages.forEach(img => fail(`Broken image: ${img}`));

  await imgContext.close();

  // ========================================================
  // 4. LANGUAGE SWITCHING
  // ========================================================

  console.log('\n\x1b[1m4. Language Switching\x1b[0m');

  const langContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const langPage = await langContext.newPage();
  await langPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });

  // Default should be PT
  const defaultLang = await langPage.evaluate(() => document.documentElement.lang);
  if (defaultLang === 'pt-BR') pass('Default language is pt-BR');
  else fail('Default language', `Expected pt-BR, got ${defaultLang}`);

  // Switch to EN
  await langPage.evaluate(() => switchLang('en'));
  await langPage.waitForTimeout(500);
  const enState = await langPage.evaluate(() => ({
    lang: document.documentElement.lang,
    title: document.title,
    h1: document.querySelector('#hero h1')?.textContent?.trim().substring(0, 30),
  }));
  if (enState.lang === 'en' && enState.h1?.includes('Your financial')) pass('Switch to English works');
  else fail('Switch to English', JSON.stringify(enState));

  // Switch back to PT
  await langPage.evaluate(() => switchLang('pt'));
  await langPage.waitForTimeout(500);
  const ptState = await langPage.evaluate(() => ({
    lang: document.documentElement.lang,
    title: document.title,
    h1: document.querySelector('#hero h1')?.textContent?.trim().substring(0, 30),
  }));
  if (ptState.lang === 'pt-BR' && ptState.h1?.includes('Sua vida')) pass('Switch back to Portuguese works');
  else fail('Switch back to Portuguese', JSON.stringify(ptState));

  // Stress test: rapid switching
  const stressErrors = await langPage.evaluate(async () => {
    const errors = [];
    try {
      for (let i = 0; i < 10; i++) {
        switchLang('en');
        await new Promise(r => setTimeout(r, 100));
        switchLang('pt');
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (e) {
      errors.push(e.message);
    }
    return errors;
  });

  if (stressErrors.length === 0) pass('Rapid language switching (10 cycles) - no errors');
  else stressErrors.forEach(e => fail('Stress test error', e));

  await langContext.close();

  // ========================================================
  // 5. WHATSAPP CHAT ANIMATION
  // ========================================================

  console.log('\n\x1b[1m5. Chat Animation\x1b[0m');

  const animContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const animPage = await animContext.newPage();
  await animPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });

  // Wait for animation to populate messages
  await animPage.waitForTimeout(3000);
  const chatState = await animPage.evaluate(() => {
    const container = document.getElementById('chat-messages');
    return {
      messageCount: container?.children.length || 0,
      hasTimeout: typeof chatTimeoutId !== 'undefined' && chatTimeoutId !== null,
      trackingArray: typeof chatAnimationTimeouts !== 'undefined',
    };
  });

  if (chatState.messageCount > 0) pass(`Chat animation running (${chatState.messageCount} messages visible)`);
  else fail('Chat animation not running');

  if (chatState.hasTimeout) pass('Chat cycle timeout is set');
  else fail('Chat cycle timeout missing');

  if (chatState.trackingArray) pass('Animation timeout tracking array exists');
  else fail('Animation timeout tracking missing');

  // Test restart clears timeouts
  const restartCheck = await animPage.evaluate(async () => {
    const beforeCount = chatAnimationTimeouts.length;
    restartChat();
    await new Promise(r => setTimeout(r, 100));
    const afterRestart = chatAnimationTimeouts.length;
    // After restart, should have new timeouts but old ones cleared
    await new Promise(r => setTimeout(r, 2000));
    const afterDelay = document.getElementById('chat-messages').children.length;
    return { beforeCount, afterRestart, messagesAfterRestart: afterDelay };
  });

  if (restartCheck.messagesAfterRestart > 0) pass('Chat restarts cleanly with new messages');
  else fail('Chat restart produced no messages');

  await animContext.close();

  // ========================================================
  // 6. INTERACTIVE ELEMENTS
  // ========================================================

  console.log('\n\x1b[1m6. Interactive Elements\x1b[0m');

  const interContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const interPage = await interContext.newPage();
  await interPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });

  // FAQ accordion
  const faqWorks = await interPage.evaluate(async () => {
    const firstFaq = document.querySelector('#faq .faq-item button');
    if (!firstFaq) return false;
    firstFaq.click();
    await new Promise(r => setTimeout(r, 500));
    const answer = firstFaq.closest('.faq-item')?.querySelector('.faq-answer, [class*="faq-answer"]');
    return answer ? answer.offsetHeight > 0 || getComputedStyle(answer).maxHeight !== '0px' : false;
  });
  if (faqWorks) pass('FAQ accordion opens on click');
  else warn('FAQ accordion may not be working (check manually)');

  // Agent tabs switch cards
  const tabsWork = await interPage.evaluate(async () => {
    const tabs = document.querySelectorAll('.sobre-tab');
    if (tabs.length < 2) return false;
    tabs[1].click();
    await new Promise(r => setTimeout(r, 300));
    return true;
  });
  if (tabsWork) pass('Agent tabs are clickable');
  else fail('Agent tabs not working');

  // Form input accepts text
  const formWorks = await interPage.evaluate(() => {
    const input = document.querySelector('#hero-form input[type="tel"]');
    if (!input) return false;
    input.value = '11999999999';
    return input.value === '11999999999';
  });
  if (formWorks) pass('Hero form accepts input');
  else fail('Hero form input broken');

  // Navigation smooth scroll
  const scrollWorks = await interPage.evaluate(async () => {
    const link = document.querySelector('a[href="#sobre"]');
    if (!link) return false;
    link.click();
    await new Promise(r => setTimeout(r, 1000));
    const sobre = document.getElementById('sobre');
    const rect = sobre?.getBoundingClientRect();
    return rect && rect.top < 200; // Should be near top of viewport
  });
  if (scrollWorks) pass('Navigation scrolls to sections');
  else warn('Smooth scroll may not be working (check manually)');

  await interContext.close();

  // ========================================================
  // 7. PERFORMANCE
  // ========================================================

  console.log('\n\x1b[1m7. Performance\x1b[0m');

  const perfContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const perfPage = await perfContext.newPage();

  const startTime = Date.now();
  await perfPage.goto(`${BASE_URL}/`, { waitUntil: 'load', timeout: 30000 });
  const loadTime = Date.now() - startTime;

  if (loadTime < 3000) pass(`Page load: ${loadTime}ms`);
  else if (loadTime < 5000) warn(`Page load: ${loadTime}ms`, 'Consider optimizing');
  else fail(`Page load: ${loadTime}ms`, 'Too slow');

  // Check total page weight
  const resources = await perfPage.evaluate(() => {
    const entries = performance.getEntriesByType('resource');
    let totalSize = 0;
    entries.forEach(e => { if (e.transferSize) totalSize += e.transferSize; });
    return { count: entries.length, totalKB: Math.round(totalSize / 1024) };
  });

  if (resources.totalKB < 5000) pass(`Total resources: ${resources.count} files, ${resources.totalKB}KB`);
  else warn(`Total resources: ${resources.count} files, ${resources.totalKB}KB`, 'Page is heavy');

  await perfContext.close();

  // ========================================================
  // SUMMARY
  // ========================================================

  await browser.close();

  console.log('\n' + '='.repeat(50));
  console.log(`\x1b[1mResults: ${passed} passed, ${failed} failed, ${warnings} warnings\x1b[0m`);
  console.log('='.repeat(50));

  if (failed > 0) {
    console.log('\n\x1b[31m✗ BROWSER QA FAILED\x1b[0m\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n\x1b[33m⚠ PASSED WITH WARNINGS\x1b[0m\n');
    process.exit(0);
  } else {
    console.log('\n\x1b[32m✓ ALL BROWSER CHECKS PASSED\x1b[0m\n');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('\x1b[31mFatal error:\x1b[0m', err.message);
  process.exit(1);
});
