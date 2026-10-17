// Browser check for the way a page runs under: the address a player types arrives
// whole, a digit typed over it is not spent on the code, and a page that walks back
// to the way choice re-runs its open under the other way, rebuilding its channel.
// Run: node scripts/verify-way-switch.mjs
//
// The way items are clicked rather than keyboard-navigated: this check is about
// re-picking a way, not about which viewports offer the choice.
import { chromium } from '@playwright/test'
import { resolve as pathResolve } from 'node:path'
const { freshPage, exposeSingletons, check, report, stateIs } = await import(import.meta.resolve('./harness.mjs'))

const ROOT = pathResolve(import.meta.dirname, '..')
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await freshPage(context, ROOT)
await exposeSingletons(page)
let failures = 0

// Record every state the page's ICE machinery runs through, in order, so the switch
// is read as a sequence rather than a before/after pair that any one change could
// have caused. The page drives its own frames on requestAnimationFrame, so sampling
// there sees each change at most once per frame.
await page.evaluate(async () => {
  const mod = await import('/js/netplay.js')
  const trace = []
  window.__trace = trace
  const sample = () => {
    const link = mod.peerLink()
    const pc = link && link.transport && link.transport.connection ? link.transport.connection.signalingState : 'no connection'
    const row = `${mod.lobby.flow}/${mod.lobby.ice}/${pc}`
    if (trace[trace.length - 1] !== row) trace.push(row)
  }
  const tick = () => {
    sample()
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})

await page.click('#menu-item-two-player')
await stateIs(page, 'SELECT_WAY')
await page.click('#way-item-network-local')
await stateIs(page, 'PAIRING')

// The address the player types, typed as real keystrokes into the field.
const field = page.locator('#pairing-address')
await field.focus()
await page.keyboard.type('100.107.90.10', { delay: 90 })
const typed = await page.evaluate(() => ({
  field: document.getElementById('pairing-address').value,
  lobby: window.__netplay.address,
  bad: window.__netplay.addressBad,
  typed: window.__netplay.typed,
}))
check(typed.field === '100.107.90.10', `the field holds the whole address: ${JSON.stringify(typed.field)}`, (m) => failures = m)
check(typed.lobby === '100.107.90.10', `the lobby accepts it: ${JSON.stringify(typed.lobby)} bad ${JSON.stringify(typed.bad)}`, (m) => failures = m)
check(typed.typed === '', `the digits went to the field, not the code: typed ${JSON.stringify(typed.typed)}`, (m) => failures = m)

const letter = await page.evaluate(async () => {
  const devices = await import('/js/devices.js')
  return devices.keyToIntent('b')
})
check(letter && letter.action === 'pairChar' && letter.char === 'B', `a letter still spells the code: pairChar ${letter && letter.char}`, (m) => failures = m)

// Walk back to the menu the way choice sits under and pick the other way.
await page.click('#pairing-back')
await stateIs(page, 'MENU')
await page.click('#menu-item-two-player')
await stateIs(page, 'SELECT_WAY')
await page.click('#way-item-network-global')
await stateIs(page, 'PAIRING')

const secondWay = await page.evaluate(() => ({
  flow: window.__netplay.flow,
  offer: window.__netplay.offer,
  link: window.__netplay.link,
  address: window.__netplay.address,
  ice: window.__netplay.ice,
  rebuilt: window.__netplay.rebuilt,
}))
check(secondWay.flow === 'global', `the way switched: flow ${JSON.stringify(secondWay.flow)}`, (m) => failures = m)
check(secondWay.address === '', `the address the first way asked for is gone: ${JSON.stringify(secondWay.address)}`, (m) => failures = m)
check(secondWay.offer === '' && secondWay.link === '', `the first way's offer and link were taken back: offer ${JSON.stringify(secondWay.offer)} link ${JSON.stringify(secondWay.link)}`, (m) => failures = m)
check(secondWay.ice === 'gathering' && secondWay.rebuilt === false, `the page ran its open again under the new way: ice ${JSON.stringify(secondWay.ice)} rebuilt ${JSON.stringify(secondWay.rebuilt)}`, (m) => failures = m)

const dom = await page.evaluate(() => ({
  linkCopy: (document.getElementById('pairing-link') || {}).textContent || '',
  codeCopy: (document.getElementById('pairing-code') || {}).textContent || '',
  addressFieldHidden: getComputedStyle(document.getElementById('pairing-address')).display === 'none',
  addressLineWidth: (document.getElementById('pairing-address-line') || {}).getBoundingClientRect().width,
  addressFieldWidth: (document.getElementById('pairing-address') || {}).getBoundingClientRect().width,
}))
check(dom.linkCopy === '' && dom.codeCopy === '', `the page shows no offer of the way it left: link copy ${JSON.stringify(dom.linkCopy)} code copy ${JSON.stringify(dom.codeCopy)}`, (m) => failures = m)
check(dom.addressFieldHidden, `the re-picked way asks nothing of the player as an address: the field is not on the page (rect width ${dom.addressFieldWidth}, address line width ${dom.addressLineWidth})`, (m) => failures = m)

// The re-picked way runs its open to the end: the attempt settles, the page
// publishes, and the recorder shows the way it opened the attempt under.
const settled = await page.waitForFunction(() => window.__netplay.ice !== 'gathering' && window.__netplay.ice !== '', { timeout: 45000 })
check(!!settled, `the re-picked way ran its ICE attempt to the end`, (m) => failures = m)
const published = await page.waitForFunction(() => window.__netplay.link !== '', { timeout: 45000 })
check(!!published, `the re-picked way published its own offer: ${JSON.stringify(await page.evaluate(() => window.__netplay.link))}`, (m) => failures = m)
const trace = await page.evaluate(() => window.__trace)
const ways = trace.map((row) => row.split('/')[0]).filter((way, i, all) => i === 0 || way !== all[i - 1])
check(JSON.stringify(ways) === '["","local","global"]', `the page ran its open under the way it had picked, then under the new one, in that order: ${JSON.stringify(ways)}`, (m) => failures = m)
check(trace.some((row) => row.startsWith('local/gathering')) && trace.some((row) => row.startsWith('global/gathering')) && trace.some((row) => row.startsWith('global/') && !row.startsWith('global/gathering')), `the attempt ran under the first way and then under the new one, to a finish: ${trace.length} states, first 12 ${JSON.stringify(trace.slice(0, 12))}`, (m) => failures = m)

await browser.close()
await report([{ label: 'the address a player types, and switching the way', n: failures, bad: failures > 0 }])
if (failures) { console.log(`FAIL ${failures}`); process.exitCode = 1 }
