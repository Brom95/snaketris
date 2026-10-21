// Reproduce the reported LAN flow and print what each page holds at every hop:
// the host types its address, the phone opens the published link, the phone
// types its OWN address, and the host is then offered the phone's line.
//
// Run: node scripts/trace-typed-address.mjs
import { chromium } from '@playwright/test'
import { resolve as pathResolve } from 'node:path'
import { readFileSync } from 'node:fs'
const { freshPage, exposeSingletons, BASE } = await import(import.meta.resolve('./harness.mjs'))
const ROOT = pathResolve(import.meta.dirname, '..')

const HOST_IP = '192.168.10.4'
const PHONE_IP = '192.168.10.70'

const browser = await chromium.launch()
const context = await browser.newContext()
const host = await freshPage(context, ROOT)

const route = (page) =>
  page.route(BASE + '**', (r) => {
    const file = pathResolve(ROOT, r.request().url().slice(BASE.length).split('#')[0].split('?')[0])
    try {
      return r.fulfill({ status: 200, contentType: file.endsWith('.html') ? 'text/html' : 'text/javascript', body: readFileSync(file) })
    } catch {
      return r.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' })
    }
  })

route(host)
await host.goto(BASE + 'snaketris.html', { waitUntil: 'load' })
await exposeSingletons(host)
// Drive the menu to the network flow's pairing step, and stop there: a host that
// presses Pair leaves the step, and the peer field that takes the other device's
// line belongs to the step.
await host.click('#menu-item-two-player')
await host.click('#way-item-network-local')
await host.waitForFunction(() => document.getElementById('pairing-title')?.checkVisibility(), { timeout: 45000 })

// The page object the modules use, however the harness exposes it.
const probe = (page) =>
  page.evaluate(`(() => {
    const n = window.__netplay ?? {}
    const L = (typeof n.lobby === 'object' ? n.lobby : n)
    const id = (name) => document.getElementById(name)
    const vis = (name) => { const e = id(name); return e && e.checkVisibility() }
    const txt = (name) => { const e = id(name); return e ? e.textContent : '(no element)' }
    const pick = (key) => (key in L) ? L[key] : n[key]
    return {
      state: window.__game?.screen?.state ?? window.__state?.screen?.state ?? null,
      address: pick('address'), addressBad: pick('addressBad'), ownPort: pick('port'),
      peerAddress: pick('peerAddress'), peerPort: pick('peerPort'),
      aimed: pick('aimed'), paired: pick('paired'),
      secret: pick('secret') === '' ? '' : 'held', offer: pick('offer') === '' ? '' : 'held',
      link: pick('link'),
      addressField: id('pairing-address')?.value ?? '(no field)',
      peerField: id('pairing-peer')?.value ?? '(no field)',
      peerFieldVisible: vis('pairing-peer'),
      addressLineVisible: vis('pairing-address-line'),
      addressLine: txt('pairing-address-line'),
      peerLineVisible: vis('pairing-peer-line'),
      peerLine: txt('pairing-peer-line'),
      waitingLine: vis('pairing-waiting') ? txt('pairing-waiting') : '(not shown)',
      copyAddressVisible: vis('copy-pairing-address'),
      linkHeld: (() => { const L = window.__netplay.link ?? null; return L ? 'link' : 'none' })(),
      transport: (() => { const L = window.__netplay.link ?? null; const t = L && L.transport; return t ? (t.connection ? 'pc=' + (t.connection.localDescription ? 'has-local-desc' : 'no-desc') : 'no-connection') : 'no-transport' })(),
      candidates: (() => { try { const L = window.__netplay.link; return L && L.transport && L.transport.connection ? L.transport.connection.localDescription.sdp.split('\\n').filter((l) => l.startsWith('a=candidate')).length : 0 } catch { return -1 } })(),
      rtcp: (typeof RTCPeerConnection === 'function')
    }
  })()`)

const fatal = []
async function wait(page, fn, label, timeout = 25000) {
  try { await page.waitForFunction(fn, { timeout }); return true }
  catch (e) { fatal.push(label); return false }
}

// The host types its LAN address.
await host.fill('#pairing-address', HOST_IP)
await wait(host, () => true, 'paint after the host types', 8000)
const hostTyped = await probe(host)

// Its offer rides in the link, and its own port appears once ICE binds a socket.
await wait(host, () => (window.__netplay.port ?? window.__netplay.lobby.port) !== 0, 'host reads its own port', 40000)
const hostPublished = await probe(host)
const published = await host.evaluate(() => (window.__netplay.link ?? window.__netplay.lobby.link) || '')
console.log('PUBLISHED: ' + published)

// The phone opens the pairing link the host published.
const phoneCtx = await browser.newContext({ viewport: { width: 430, height: 932 } })
const phone = await freshPage(phoneCtx, ROOT)
route(phone)

// Count what the phone page actually asks of its RTCPeerConnection.
const installTrace = async (page) =>
  await page.evaluate(`() => {
    window.__rtc = { created: 0, setLocal: 0, setRemote: 0, answer: 0, candidates: [], ice: 0 }
    const proto = RTCPeerConnection.prototype
    let p = proto
    window.__RTCPeerConnection = RTCPeerConnection
    const Orig = RTCPeerConnection
    function Traced(...a) { const pc = new Orig(...a); window.__rtc.created++; pc.addIceCandidate = (c) => { window.__rtc.candidates.push(c.sdpDescription.slice(0, 120)) }; return pc }
    window.__RTCPeerConnection = Traced
    window.__rtc.setLocal = 0
  })()
await installTrace(phone)
if (!published.includes('a=')) { console.log('NO CARRIED VALUES IN THE LINK: ' + published) }
await phone.goto(published, { waitUntil: 'load' })
await exposeSingletons(phone)
try { await phone.waitForFunction(() => (window.__netplay.peerAddress ?? window.__netplay.lobby.peerAddress) !== '', { timeout: 30000 }) } catch (e) { fatal.push('phone peerAddress timed out') }
const phoneOpened = await probe(phone)

// The phone types its OWN address — the reported action.
await phone.fill('#pairing-address', PHONE_IP)
await phone.waitForFunction(() => false, { timeout: 12000 }).then(null, () => {})
const phoneTyped = await probe(phone)

// Does the phone answer the offer that rode in the link's fragment?
await wait(phone, () => (window.__netplay.paired ?? window.__netplay.lobby.paired) === true, 'the phone answers the offer', 20000)
const phoneAnswered = await probe(phone)

// The other hand-carry: the phone's own line, pasted into the host's peer field.
const phoneLine = (phoneAnswered.address + ':' + phoneAnswered.ownPort)
if (phoneAnswered.address) {
  await host.fill('#pairing-peer', phoneLine)
  await host.waitForFunction(() => false, { timeout: 6000 }).then(null, () => {})
}
const hostCarried = await probe(host)

await browser.close()

const rows = [
  ['HOST, after typing its address', hostTyped],
  ['HOST, after publishing its offer', hostPublished],
  ['PHONE, after opening the link', phoneOpened],
  ['PHONE, after typing its own address', phoneTyped],
  ['PHONE, after the answer window', phoneAnswered],
  ['HOST, after the phone line was pasted', hostCarried]
]
for (const [label, snap] of rows) {
  console.log('=== ' + label)
  const keys = Object.keys(snap ?? {}); keys.sort();
  for (const key of keys) {
    console.log('  ' + key + ': ' + JSON.stringify(snap?.[key]))
  }
}
try { const rtc = await phone.evaluate('window.__rtc ?? null'); console.log('phone RTC counters: ' + JSON.stringify(rtc)) } catch (e) { console.log('counters: ' + e) }
console.log('\nlink the host published: ' + JSON.stringify(published))
console.log('phone line the host was offered: ' + phoneLine)
console.log('waits that timed out: ' + JSON.stringify(fatal, null, 1))
