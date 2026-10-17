// netplay.test.js — the pairing secret's own invariants: the flow a page
// belongs to, and the marker the pairing link carries for the guest to inherit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const netplay = await import('../js/netplay.js');

test('a page opened without a flow marker is not in the local flow', async () => {
  netplay.noteFlowOfLink('https://example.com/snaketris.html');
  assert.notEqual(netplay.lobby.flow, 'local', 'an unmarked page never joins the local flow');
});

test('the flow a guest inherits rides in the link it opened', async () => {
  netplay.noteFlowOfLink('https://example.com/snaketris.html?flow=local#abc');
  assert.equal(netplay.lobby.flow, 'local', 'the marker on the opened link names the flow');
});

test('a page cannot change its flow once it has one', async () => {
  netplay.pickFlow('global');
  assert.equal(netplay.lobby.flow, 'local', 'the flow the link already gave stays');
});

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
});

test('the flow and the typed address ride in the pairing link once', async () => {
  netplay.noteAddress('100.107.90.10');
  netplay.noteOwnPort('a=candidate:1 1 udp 1 100.107.90.10 3478 typ host');
  netplay.publish('offer-blob', 0, 'https://example.com/snaketris.html');
  const marks = netplay.lobby.link.split('flow=local').length - 1;
  assert.equal(marks, 1, 'the link names the flow exactly once');
  assert.equal(netplay.lobby.link.includes('&a=100.107.90.10'), true, 'the link carries the address');
  assert.equal(netplay.lobby.link.includes('&p=3478'), true, 'the link carries the port this page read');
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
