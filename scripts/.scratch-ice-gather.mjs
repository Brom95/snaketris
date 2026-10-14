// scripts/.scratch-ice-gather.mjs — does the icecandidate event fire once a
// local description is set? The ICE preload needs gathering to start.
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com/');

const probe = await page.evaluate(async () => {
  const out = { events: [], fired: false, state: null, err: null, offerSdp: null };
  try {
    const pc = new window.RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
    });
    pc.onicecandidate = (event) => {
      out.events.push({
        candidate: event.candidate ? event.candidate.candidate.slice(0, 40) : null,
        endOfCandidates: event.candidate === null,
      });
      out.fired = true;
    };
    const offer = await pc.createOffer();
    out.offerSdp = offer.sdp.slice(0, 60);
    await pc.setLocalDescription(offer);
    out.state = pc.iceGatheringState;
    await new Promise((next) => setTimeout(next, 4000));
    out.state = pc.iceGatheringState;
    pc.close();
  } catch (error) {
    out.err = String(error);
  }
  return out;
});

console.log(JSON.stringify(probe, null, 2));
await browser.close();
