// scripts/verify-pairing-scroll.mjs
// The pairing step must reach every line it paints when the pane runs out of
// height. Two short viewports are driven: 900x300, above the stacked-layout
// breakpoint where the stylesheet carried no overflow rule at all, and 390x300
// for the page a phone opens at a peer's published link, whose mirror lines make
// the step taller than the pane. A pane whose content overflows must scroll, must
// pin its title while it scrolls, and must name the gesture at the TOP of the step
// (the pairing-scroll-line element, painted only while the step overflows); a pane
// that fits must say nothing about scrolling and must not be pinned.
//
// Run: node scripts/verify-pairing-scroll.mjs

import { chromium } from '@playwright/test';
import { resolve as pathResolve } from 'node:path';
import { BASE, freshPage, exposeGame, waitFor, check, report, failureCount } from './harness.mjs';
import { readFileSync } from 'node:fs';

const ROOT = pathResolve(import.meta.dirname, '..');
const HOST_ADDRESS = '100.107.90.10';
const GUEST_ADDRESS = '192.168.0.155';
const { PAIRING } = await import(import.meta.resolve('../js/constants.js'));

const browser = await chromium.launch();
const context = await browser.newContext();

async function shortPage(width, height) {
  const page = await freshPage(context, ROOT);
  await page.setViewportSize({ width, height });
  return page;
}

async function typeAddress(page, address) {
  await page.waitForFunction(() => document.getElementById('pairing-address')?.checkVisibility(), null);
  await page.locator('#pairing-address').evaluate(() => true);
  await page.keyboard.type(address);
  await page.waitForTimeout(300);
}

async function driveToPairing(page) {
  await page.click('#menu-item-two-player');
  await waitFor(page, (wanted) => window.__game.screen.state === wanted, 'SELECT_WAY', 5000);
  await page.click('#way-item-network-local');
  await waitFor(page, (wanted) => window.__game.screen.state === wanted, PAIRING, 5000);
}

async function measure(page, label) {
  const m = await page.evaluate(() => {
    const pane = document.getElementById('pairing-view');
    if (!pane) return { found: false };
    const line = document.getElementById('pairing-scroll-line');
    const field = document.getElementById('pairing-address');
    return {
      found: true,
      overflow: getComputedStyle(pane).overflowY,
      contentPx: pane.scrollHeight,
      panePx: pane.clientHeight,
      tallClass: pane.classList.contains('tall'),
      lineShown: line ? line.checkVisibility() : false,
      lineText: line ? line.textContent : '(no element)',
      lineAboveField:
        line && field
          ? line.getBoundingClientRect().top < field.getBoundingClientRect().top
          : false,
      fieldText: field ? field.value : '',
    };
  }, null);
  check(m.found, `${label}: the pairing pane is on screen`);
  if (!m.found) return null;
  const over = m.contentPx > m.panePx;
  check(m.tallClass === over, `${label}: the step is pinned only while it overflows (${m.contentPx} content in a ${m.panePx} pane)`);
  check(m.lineShown === over, `${label}: the gesture is named exactly while the step overflows`);
  if (over) {
    check(m.overflow === 'auto' || m.overflow === 'scroll', `${label}: the pane lets the step move (${m.overflow})`);
    check(m.lineText.length > 0, `${label}: the scroll line carries copy (${JSON.stringify(m.lineText)})`);
    check(m.lineAboveField, `${label}: the line sits above the fields it names, not at the cut end`);
    await page.evaluate(() => {
      const pane = document.getElementById('pairing-view');
      pane.scrollTo(0, pane.scrollHeight);
    }, null);
    const reached = await page.evaluate(() => document.getElementById('pairing-address')?.checkVisibility() ?? false, null);
    check(reached, `${label}: scrolling reaches the address field`);
  } else {
    check(m.lineText === '' || !m.lineShown, `${label}: the silent line stays silent (${m.contentPx} in ${m.panePx})`);
  }
  return m;
}

async function publishedLink(page) {
  await page.waitForFunction(() => window.__netplay.link !== '', null, 20000);
  const link = await page.evaluate(() => window.__netplay.link, null);
  check(link.includes('a=') && link.includes('p='), 'the published line names the address and the port it read');
  check(!link.includes('flow='), 'the published line names no way marker');
  return link;
}

async function openedPage(link) {
  const page = await context.newPage();
  await page.route(BASE + '**', (route) => {
    const requested = route.request().url().slice(BASE.length).split('#')[0].split('?')[0];
    const file = pathResolve(ROOT, requested);
    try {
      return route.fulfill({ status: 200, contentType: requested.endsWith('.html') ? 'text/html' : 'text/javascript', body: readFileSync(file) });
    } catch {
      return route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
    }
  });
  await page.goto(link);
  await exposeGame(page);
  await waitFor(page, (wanted) => window.__game.screen.state === wanted, PAIRING, 15000);
  return page;
}

{
  const host = await shortPage(900, 300);
  await driveToPairing(host);
  await typeAddress(host, HOST_ADDRESS);
  const wide = await measure(host, 'wide short window (900x300)');
  await host.close();
}

{
  const host = await shortPage(390, 700);
  await driveToPairing(host);
  await typeAddress(host, HOST_ADDRESS);
  const fits = await measure(host, 'phone that publishes (390x700)');
  const link = await publishedLink(host);
  await host.close();
  const guest = await openedPage(link);
  await guest.setViewportSize({ width: 390, height: 300 });
  await typeAddress(guest, GUEST_ADDRESS);
  const opened = await measure(guest, 'phone opened at that line (390x300)');
  if (opened) {
    const known = await guest.evaluate(() => ({ a: window.__netplay.peerAddress, p: window.__netplay.peerPort }), null);
    console.log(`  opened page knows its peer as ${known.a}:${known.p}`);
  }
  await guest.close();
}

report('verify-pairing-scroll', failureCount());
