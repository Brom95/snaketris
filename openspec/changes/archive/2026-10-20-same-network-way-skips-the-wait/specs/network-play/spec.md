## ADDED Requirements

### Requirement: The same-network way works before any candidate wait

A page running under the same-network way SHALL do its own work — read the port it named in its own description, rebuild the line it hands over, and aim at the peer its link named — before any candidate wait, since that way names no server for a wait to wait on. A page running under the way that does ask a server SHALL keep its publish and its channel behind the wait as before.

#### Scenario: a page opened at a link its peer published

- **WHEN** a page on the same-network way opened a link that names its peer's address and port, and its own candidate wait has not finished
- **THEN** the page reads its own port out of its own description and aims at the peer it holds, and its step paints the line its player carries

#### Scenario: the way that asks a server

- **WHEN** a page runs under the way that asks a server for candidates and its attempt is still waiting
- **THEN** the page still publishes nothing and builds no channel until the wait resolves, as before
