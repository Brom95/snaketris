// netplay.test.js — the pairing secret's own invariants: the address and port a
// page names in the link it hands over, and the secret that rides beside it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const netplay = await import('../js/netplay.js');






test('a same-network page still waiting for its address publishes nothing', async () => {
  netplay.noteAddress('');
  netplay.publish('offer-blob', 0, 'https://example.com/snaketris.html');
  assert.equal(netplay.lobby.link, '', 'a page with no address hands over no link');
});

test('an address is four number groups and nothing else counts', async () => {
  netplay.noteAddress('100.107.90.10');
  assert.equal(netplay.lobby.address, '100.107.90.10', 'a dotted quad is an address');
  netplay.noteAddress('http://100.107.90.10');
  assert.equal(netplay.lobby.addressBad, true, 'a value naming a scheme is not an address');
  netplay.noteAddress('');
  assert.equal(netplay.lobby.addressBad, false, 'no address typed is waiting, not a bad address');
  netplay.noteAddress('100.107.90.10:3478');
  assert.equal(netplay.lobby.addressBad, true, 'a port typed with the quad is not an address the player types');
  netplay.noteAddress('256.107.90.10');
  assert.equal(netplay.lobby.addressBad, true, 'a group over one byte is not an address');
  netplay.noteAddress('100.107.90.10.5');
  assert.equal(netplay.lobby.addressBad, true, 'five groups is not an address');
  netplay.noteAddress('100.107.90');
  assert.equal(netplay.lobby.addressBad, true, 'three groups is not an address');
  netplay.noteAddress('0.0.0.0');
  assert.equal(netplay.lobby.address, '0.0.0.0', 'each group may be zero');
  netplay.noteAddress('255.255.255.255');
  assert.equal(netplay.lobby.address, '255.255.255.255', 'a group may reach one byte');
});

test('the typed address and the port read ride in the pairing link once', async () => {
  netplay.noteAddress('100.107.90.10');
  netplay.noteOwnPort('a=candidate:1 1 udp 1 100.107.90.10 3478 typ host');
  netplay.publish('offer-blob', 0, 'https://example.com/snaketris.html');
  assert.equal(netplay.lobby.link.split('#')[0].split('?')[1], 'a=100.107.90.10&p=3478',
    'the link names the address and the port this page read, each exactly once');
  assert.equal(netplay.lobby.link.includes('a=100.107.90.10'), true, 'the link carries the address');
  assert.equal(netplay.lobby.link.includes('p=3478'), true, 'the link carries the port this page read');
});

test('a port read after the page published reaches the line it shows', async () => {
  netplay.noteAddress('100.107.90.10');
  netplay.lobby.port = 0;
  netplay.publish('offer-blob', 0, 'https://example.com/snaketris.html');
  assert.equal(
    netplay.lobby.link.includes('&p='),
    false,
    'the line names no port while the page has not read one',
  );
  netplay.noteOwnPort('a=candidate:1 1 udp 1 100.107.90.10 3478 typ host');
  assert.equal(
    netplay.refreshLink(),
    true,
    'the refresh reports the line it rebuilt',
  );
  assert.equal(
    netplay.lobby.link.includes('&p=3478'),
    true,
    'the refreshed line names the port the page read',
  );
  assert.equal(
    netplay.refreshLink(),
    false,
    'a page whose line already names every value it holds is left alone',
  );
});

test('the peer candidate names the address the peer announced', async () => {
  const calls = [];
  const pc = {
    addIceCandidate: (candidate) => { calls.push(candidate); },
    remoteDescription: { sdp: 'offer\nm=webrtc-datachannel 7 INET_FQDN_PORT 0\nice' },
  };
  netplay.notePeerAddress('https://example.com/snaketris.html?a=100.107.90.10&p=3478');
  const crafted = netplay.craftPeerCandidate(pc);
  assert.equal(crafted, true, 'a peer address and port make a candidate');
  assert.equal(calls.length, 1, 'exactly one candidate was handed over');
  assert.equal(calls[0].sdpMid, 'webrtc-datachannel', 'the candidate answers the description this page holds');
  assert.equal(calls[0].sdpMLineIndex, 7, 'the candidate rides the m= index of that description');
  assert.equal(calls[0].sdpDescription, 'candidate:9 1 udp 2113937151 100.107.90.10 3478 typ host', 'the candidate names the peer address and port');
});

test('no candidate is offered before this page holds a remote description', async () => {
  const pc = { addIceCandidate: (candidate) => { throw new Error('never reached'); } };
  assert.equal(netplay.craftPeerCandidate(pc), false, 'a candidate has no media line to bind to yet');
});

test('an announcement that is not an address is refused', async () => {
  assert.equal(netplay.learnPeerAnnouncement('nonsense'), false, 'a channel message that names no dotted-quad sets nothing');
});
