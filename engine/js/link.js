// The peer link and the resync policy. The consumer supplies the transport
// object that carries the channel; the engine holds the state a peer
// connection has, the close event, and the rule that keeps one simulation
// authoritative. The engine receives a transport and never builds one, so it
// names no channel class.

export function createLink(transport) {
  const link = {
    transport,
    peer: null,
    open: false,
    closed: false,
    closeReason: null,
    states: { signaling: 'new', connection: 'new', iceConnection: 'new' },
    closeHandlers: [],
    streams: {},
    resyncs: 0,
    authoritative: true,

    // Pair an identity: the link reports a peer only after this call, so a
    // link that got no transport and no pair call reports no peer at all.
    pair(peer) {
      link.peer = peer;
      link.open = true;
      return peer;
    },

    // Record one state value a peer connection reports, so the link holds the
    // state the connection has.
    report(name, value) {
      link.states[name] = value;
      if (name === 'connection' || name === 'iceConnection') link.open = value === 'connected';
      return value;
    },

    // Own a command stream under a label, so a resync can clear and count it.
    attachStream(stream, label) {
      link.streams[label] = stream;
      return stream;
    },

    // The applied and dropped counts of every stream this link owns.
    counts() {
      const out = {};
      for (const label in link.streams) {
        const stream = link.streams[label];
        out[label] = { applied: stream.applied, dropped: stream.dropped };
      }
      return out;
    },

    // Register a handler for the close event.
    onClose(handler) {
      link.closeHandlers.push(handler);
    },

    // The close event: it fires once, and every handler sees the reason.
    close(reason) {
      if (link.closed) return false;
      link.closed = true;
      link.open = false;
      link.closeReason = reason;
      for (const handler of link.closeHandlers) handler(reason);
      return true;
    },

    // The resync policy: one simulation stays authoritative, so a resync
    // re-sends state instead of replaying inputs. Every buffered intent is
    // dropped and counted, because the re-sent state already carries its
    // effect.
    resync(state) {
      link.resyncs += 1;
      let dropped = 0;
      for (const label in link.streams) dropped += link.streams[label].dropAll();
      return { state, dropped };
    },
  };
  return link;
}
