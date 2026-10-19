# Spec Delta

## Purpose

Adds the reproducibility the network mode depends on: the piece sequence is drawn from a seed, not from browser entropy.

## ADDED Requirements

### Requirement: The piece sequence is reproducible from a seed

The system SHALL draw the piece type and the spawn column from a seeded deterministic source rather than from browser entropy. Two matches with the same seed SHALL produce the same piece types and the same spawn columns in the same order. The seed SHALL NOT change the piece rules, the fall speed, the ramp, or the scoring.

#### Scenario: The same seed replays the same queue

- **WHEN** two matches run with the same seed and the same number of completed pieces
- **THEN** each match spawned the same piece types in the same order and at the same columns

#### Scenario: No draw reads browser entropy

- **WHEN** the game source is searched for an unseeded entropy call in the piece draw
- **THEN** no occurrence appears in it

#### Scenario: A seed changes only the sequence

- **WHEN** a match runs with a different seed
- **THEN** the piece sequence differs while the fall speed, the ramp and the scoring rules are unchanged

### Requirement: The seed is fixed before the first tick

The system SHALL fix the match seed before the first tick of that match, together with the duration. A rematch SHALL take a new seed, and the seed SHALL NOT be chosen by the player.

#### Scenario: The seed exists before play

- **WHEN** the duration is confirmed and the preparation flow has not fixed a seed
- **THEN** no match tick has run

#### Scenario: A rematch reseeds

- **WHEN** a match ends and a new match starts
- **THEN** the new match runs with a seed that differs from the finished match's seed
