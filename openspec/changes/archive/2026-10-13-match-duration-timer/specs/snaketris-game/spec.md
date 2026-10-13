# Spec Delta

## ADDED Requirements

### Requirement: Match duration is chosen before play
The system SHALL require a match duration before a match starts. The selectable durations SHALL be 1 minute, 3 minutes and 5 minutes. Every match SHALL run with exactly one chosen duration, in single-player and two-player mode alike.

#### Scenario: Three durations offered
- **WHEN** the duration screen is shown
- **THEN** the items "1 minute", "3 minutes" and "5 minutes" are listed and exactly one is highlighted

#### Scenario: No match starts without a duration
- **WHEN** the preparation flow has not confirmed a duration
- **THEN** no match is in progress and the play field is not shown

#### Scenario: The chosen duration drives the countdown
- **WHEN** the player confirms "3 minutes" and the match starts
- **THEN** the match counts down from 3 minutes

### Requirement: Countdown is measured in engine ticks
The system SHALL measure the remaining match time in engine ticks, at 60 ticks per second, and SHALL NOT measure it with wall-clock time. A 1-minute match SHALL last 3600 ticks, a 3-minute match 10800 ticks, and a 5-minute match 18000 ticks.

#### Scenario: One minute is 3600 ticks
- **WHEN** a 1-minute match runs for 3600 engine ticks
- **THEN** the countdown reaches zero on that tick

#### Scenario: A hidden tab does not skip time
- **WHEN** the browser tab is hidden and the page stops receiving frames
- **THEN** the countdown resumes from the tick it reached and does not jump ahead

### Requirement: Countdown reaching zero ends the match
The system SHALL end the match when the countdown reaches zero and SHALL record the end reason as `time up`. The higher side score wins that match.

#### Scenario: Countdown reaches zero
- **WHEN** the remaining match time reaches zero ticks
- **THEN** the match ends and the end reason is `time up`

#### Scenario: Time up compares the two scores
- **WHEN** a match ends with the reason `time up` and no side killed itself
- **THEN** the winner is decided by comparing the two side scores

#### Scenario: A crash still ends the match early
- **WHEN** the snake dies or the stack tops out before the countdown reaches zero
- **THEN** the match ends with that crash reason and the countdown is not reached

### Requirement: First end reason wins when a crash and the countdown expire together
When a crash end and the countdown reaching zero apply on the same tick, the system SHALL keep the crash reason and SHALL NOT replace it with `time up`.

#### Scenario: Crash on the last tick
- **WHEN** the snake dies on the tick where the countdown reaches zero
- **THEN** the end reason is the snake death and the Tetris side wins

### Requirement: Every duration uses one difficulty ramp
The system SHALL ramp difficulty from completed pieces alone. The chosen duration SHALL NOT change the base fall speed, the step factor, the cap, or the snake step interval.

#### Scenario: Same ramp at 5 minutes
- **WHEN** a 5-minute match runs
- **THEN** the fall speed follows the same completed-piece ramp as a 1-minute match

#### Scenario: No duration-based speed
- **WHEN** a 1-minute match and a 5-minute match have completed the same number of pieces
- **THEN** both matches show the same fall speed

## MODIFIED Requirements

### Requirement: Restart after game over
The system SHALL offer a restart so the player can start again from scratch.

#### Scenario: Restarting after game over
- **WHEN** the game ends (self-collision, touching a solid block, a top-out, or the countdown reaching zero)
- **THEN** the player can start a new game from scratch

#### Scenario: A time-up match can be restarted
- **WHEN** a match ends because the countdown reached zero
- **THEN** the player can start a new game from scratch
