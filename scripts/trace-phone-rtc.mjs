// What the phone (guest) page does to its own RTCPeerConnection, and whether its
// own SDP ever names a port. The host publishes; the phone opens the link.
//
// Run: node scripts/trace-phone-rtc.mjs
import { chromium } from '@playwright/test'
import { resolve as pathResolve } from 'node:path'
import { readFileSync } from 'node:fs'
const { freshPage, exposeSingletons, BASE } = await import(import.meta.resolve('./harness.mjs'))
const ROOT = pathResolve(import.meta.dirname, '..')

// The tracer must run before the page's modules, so it rides in the HTML the
// shared server hands back: a classic script runs before deferred modules.
const TRACE = [
  '<script>(() => {',
  '  window.__rtc = { created: 0, setLocal: 0, setRemote: 0, createAnswer: 0, createOffer: 0, addIce: 0, iceEvents: 0, pcs: [] };',
  '  const Orig = window.RTCPeerConnection;',
  '  window.RTCPeerConnection = new Proxy(Orig, { construct: (target, args) => { const pc = new Orig(...args); window.__rtc.created++; window.__rtc.pcs.push(pc); return pc; } });',
  '  var proto = Orig.prototype;',
  '  function wrap(name, bucket) { var orig = proto[name]; if (!orig) return; proto[name] = function(...rest) { window.__rtc[bucket]++; if ((bucket === 'setLocal' || bucket === 'setRemote') && rest.length > 0) window.__rtc[name + 'Sdp'] = String(rest[0] && rest[0].sdp); return orig.call(this, ...rest) } }',
  '  wrap("setLocalDescription", "setLocal"); wrap("setRemoteDescription", "setRemote"); wrap("createAnswer", "createAnswer"); wrap("createOffer", "createOffer"); wrap("addIceCandidate", "addIce");',

  '})()</script>'
].join('\n')

const browser = await chromium.launch()
const context = await browser.newContext()
const host = await freshPage(context, ROOT)
const route = (page) =>
  page.route(BASE + '**', (r) => {
    const file = pathResolve(ROOT, r.request().url().slice(BASE.length).split('#')[0].split('?')[0])
    try {
      return r.fulfill({ status: 200, contentType: file.endsWith('.html') ? 'text/html' : 'text/javascript', body: (file.endsWith('.html') ? TRACE + '\n' : '') + readFileSync(file) })
    } catch {
      return r.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' })
    }
  })

route(host)
await host.goto(BASE + 'snaketris.html', { waitUntil: 'load' })
await exposeSingletons(host)
await host.click('#menu-item-two-player')
await host.click('#way-item-network-local')
await host.waitForFunction(() => document.getElementById('pairing-title')?.checkVisibility(), { timeout: 45000 })
await host.fill('#pairing-address', '192.168.10.4')
await host.waitForFunction(() => (window.__netplay.port ?? window.__netplay.lobby.port) !== 0, { timeout: 60000 })
const published = await host.evaluate(() => (window.__netplay.link ?? window.__netplay.lobby.link) || '')

const phone = await context.newPage()
route(phone)

await phone.goto(published, { waitUntil: 'load' })
await exposeSingletons(phone)
await phone.waitForFunction(() => (window.__netplay.peerAddress ?? window.__netplay.lobby.peerAddress) !== '', { timeout: 30000 }).catch(() => {})
await phone.waitForFunction(() => false, { timeout: 12000 }).then(null, () => {})

const seen = await phone.evaluate(`(() => {
  const pcs = window.__rtc.pcs
  const describe = (pc) => {
    if (!pc) return null
    const own = pc.localDescription ? pc.localDescription.sdp : ''
    const remote = pc.remoteDescription ? pc.remoteDescription.sdp : ''
    const cand = (sdp) => sdp.split('\\n').filter((l) => l.indexOf('a=candidate') === 0)
    const ports = (sdp) => cand(sdp).map((l) => l.split(' ')[5])
    return {
      state: (() => { try { return pc.connectionState } catch { return 'unknown' } })(),
      ownLines: own.split('\\n').length,
      ownCandidates: cand(own).length,
      ownPorts: ports(own),
      remoteCandidates: cand(remote).length,
      remotePorts: ports(remote),
      signalingState: (() => { try { return pc.signalingState } catch { return 'unknown' } })()
    }
  }
  const L = (typeof window.__netplay.lobby === 'object' ? window.__netplay.lobby : window.__netplay)
  return {
    counters: window.__rtc ? { created: window.__rtc.created, setLocal: window.__rtc.setLocal, setRemote: window.__rtc.setRemote, createAnswer: window.__rtc.createAnswer, addIce: window.__rtc.addIce, iceEvents: window.__rtc.iceEvents ?? null } : null,
    pcs: pcs.map(describe),
    lobbyPort: L.port,
    address: L.address,
    peerAddress: L.peerAddress,
    peerPort: L.peerPort,
    aimed: L.aimed,
    paired: L.paired,
    secret: L.secret === '' ? '' : 'held',
    addressLine: document.getElementById('pairing-address-line')?.textContent ?? '',
    peerLine: document.getElementById('pairing-peer-line')?.textContent ?? '',
    copyValue: document.getElementById('copy-pairing-address')?.textContent ?? ''
  }
})()`)

await browser.close()
console.log('link published by the host: ' + published.split('#')[0])
console.log(JSON.stringify(seen, null, 1))
