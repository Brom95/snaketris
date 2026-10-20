// What a phone page shows when it opens at the link a host published:
// the strings on it, the code it holds, and whether it is seen as joined.
// Run: node scripts/verify-opened-link.mjs
import { chromium } from '@playwright/test'
import { resolve as pathResolve } from 'node:path'
import { readFileSync } from 'node:fs'
const { freshPage, exposeSingletons, check, report, failureCount, BASE } = await import(import.meta.resolve('./harness.mjs'))
const ROOT = pathResolve(import.meta.dirname, '..')

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 430, height: 932 } })
const page = await freshPage(context, ROOT)

// A pairing link carries query parameters, and the shared server picks a file
// from the path alone, so this page answers the marked URL itself.
await page.route(BASE + '**', (route) => {
  const requested = route.request().url().slice(BASE.length).split('#')[0].split('?')[0];
  const file = pathResolve(ROOT, requested);
  try {
    return route.fulfill({ status: 200, contentType: requested.endsWith('.html') ? 'text/html' : 'text/javascript', body: readFileSync(file) });
  } catch {
    return route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
  }
})

const HOST = `${BASE}snaketris.html?a=100.107.90.10&p=3478#snaketris-pair-7Q4KX&n=173692584013044551&s=208882205317269869`
await page.goto(HOST, { waitUntil: 'load' })
await exposeSingletons(page)
// The link puts the page into the pairing step at once, and nothing waits for a
// candidate supply any more: the wait is for the step's own lines to be painted.
await page.waitForFunction(() => document.getElementById('pairing-title')?.checkVisibility(), { timeout: 45000 })

const seen = await page.evaluate(() => {
  const id = (name) => document.getElementById(name)
  const display = (name) => { const e = id(name); return e ? getComputedStyle(e).display : 'missing' }
  return {
    state: window.__game.screen.state,
    link: window.__netplay.link,
    code: window.__netplay.code,
    joined: window.__netplay.joined,
    paired: window.__netplay.paired,
    offer: window.__netplay.offer,
    peerAddress: window.__netplay.peerAddress,
    peerPort: window.__netplay.peerPort,
    rebuilt: window.__netplay.rebuilt,
    warnLine: id('pairing-warn') !== null,
    iceLine: id('pairing-ice') !== null,
    linkShown: display('pairing-link'),
    qrShown: display('pairing-qr'),
    qrWidth: id('pairing-qr')?.width ?? 0,
    addressField: id('pairing-address')?.value ?? '(no field)',
    addressLineText: id('pairing-address-line')?.textContent ?? '',
    titleText: id('pairing-title-line')?.textContent ?? '',
    hintLineText: id('pairing-hint-line')?.textContent ?? '',
  }
})
console.log(JSON.stringify(seen, null, 1))
check(seen.peerAddress === '100.107.90.10', `the host's address arrived: ${JSON.stringify(seen.peerAddress)} port ${JSON.stringify(seen.peerPort)}`)
check(seen.joined === false && seen.paired === false, `the page is not seen as joined or paired: joined ${JSON.stringify(seen.joined)} paired ${JSON.stringify(seen.paired)}`)
check(seen.qrWidth === 0, `and it paints no QR of a link it does not hold (${seen.qrWidth} modules wide while link ${JSON.stringify(seen.link)})`)
check(!seen.iceLine && !seen.warnLine, `no candidate wait and no supply warning exist on this way: ${JSON.stringify([seen.iceLine, seen.warnLine])}`)
check(seen.peerPort === 3478, `the page read the port its link named: ${JSON.stringify(seen.peerPort)}`)
report('the page a phone opens at a host link', failureCount())
// Closing the browser is not awaited: a peer connection that never resolves keeps
// its request open, so awaiting close waits for a request no network ever answers.
// The verdict above is what decides the exit.
if (failureCount()) process.exitCode = 1
process.exit(process.exitCode ?? 0)
