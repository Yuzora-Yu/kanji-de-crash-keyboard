---
name: browser-minigame-concept-to-release
description: "Use this skill to take a low-cost browser minigame from concept discovery through game-loop analysis, competitive/legal research, static implementation, iterative user testing, release packaging, and future multiplayer planning. It is optimized for solo-first games with simple controls, deep strategy, streaming/SNS potential, public or independently curated data, and minimal backend dependency."
---

# Browser Minigame: Concept to Release

## Primary goal

Create a browser minigame whose rule can be understood quickly but whose repeated decisions produce learning, strategy, recoverable failure, and visible improvement. Deliver working static files and a release-ready ZIP rather than stopping at an idea document.

System and user instructions always take precedence over this skill.

## Core design standard

Do not equate short input time with game quality. The required loop is:

> understand → predict → decide → observe → explain the failure → form the next hypothesis

A strong proposal must answer:

- What does the player predict before acting?
- Which decision changes future options?
- What is random, and when is it revealed?
- Why does a loss feel correct rather than arbitrary?
- What becomes easier after ten plays?
- Why is an expert visibly different from a beginner?
- What can a viewer understand without seeing the player’s hands?

Randomness should create the situation before the decision. Avoid random success/failure after a correct action.

## Concept discovery workflow

### 1. Decompose reference games

Do not copy surface themes. Extract reusable structures such as:

- familiar real-world behavior or common knowledge
- one-sentence objective
- finite board or resource
- visible deterioration over several moves
- short-term reward versus long-term survival
- skillful and funny failure states
- a result screen that tells a story

### 2. Generate mechanisms, not themes

Prefer combinations like:

- general knowledge × resource management
- typing × key durability
- fractions × clearing puzzle
- electrical capacity × packing and scheduling

Reject ideas that are only “a quiz using unusual data” or “a one-click joke” unless they contain a repeatable strategic engine.

### 3. Apply the three-depth test

A candidate should support:

- first play: the goal is clear
- fifth play: the player discovers planning
- fiftieth play: multiple strategies and execution differences exist

### 4. Apply the failure test

After losing, a player should be able to state a specific adjustment such as “I should have saved A” or “I should have waited three seconds.” Reject designs where the only explanation is bad luck.

### 5. Apply the streaming test

The main screen must show the conflict. Do not rely on a hand camera, hidden physical technique, or unverified honor rules. If the interesting action is invisible, redesign the input so the game can verify and display it.

## Multiplayer safety standard

Build solo first. Do not assume a large player population.

Avoid cooperation as the core when griefing, deliberate sabotage, beginner blaming, or streamer targeting can occur. Prefer parallel competition:

- same seed
- same problem sequence
- independent boards
- no direct attacks
- final score comparison

Other players may appear as small status panels, ghost data, medians, or rankings, but should not be able to corrupt another player’s run.

For future online play, separate:

- deterministic problem generation
- participant state
- score calculation
- input event log
- visual rendering

Do not trust client-reported scores in public matchmaking. Recalculate from input logs on the server.

## Public data and legal research

When a concept uses external data:

1. Identify the authoritative source and license.
2. Prefer downloading and converting data at build time instead of calling external APIs during play.
3. Store source, processing notes, and version.
4. Avoid copying official exam questions, proprietary problem order, images, descriptions, or audio.
5. Treat difficulty labels as the game’s independent classification unless official authorization exists.

Competitive research must distinguish:

- same subject
- same input method
- same core resource loop
- direct substitute

A crowded quiz category can still contain an open strategic mechanism.

For patent and trademark work, clearly label the result as preliminary research rather than a legal opinion. Search patents by mechanism, not only title. Search game names by exact match, pronunciation, abbreviation, and adjacent classes.

## Implementation workflow

### 1. Define the minimum playable build

Implement only the loop needed to test the central decision. Avoid accounts, global rankings, gacha, and live multiplayer in the first build.

### 2. Keep static hosting viable

Default stack:

- HTML
- CSS
- vanilla JavaScript
- local JSON or generated JavaScript data
- localStorage
- Canvas/Web Share for result sharing

Use a backend only for features that genuinely require shared state.

### 3. Separate logic from UI

Keep pure or isolated functions for:

- seeded random generation
- word/problem selection
- correctness checking
- resource deterioration and recovery
- scoring
- result comparison
- CPU or ghost simulation

This makes future online verification possible.

### 4. Write player-facing copy

Never paste the requester’s specification or developer notes directly into the game.

Transform internal requirements into short player language:

- explain the action
- explain the danger
- show one example
- preserve surprise where discovery is part of play

Implementation terms such as “client-side,” “same in both modes,” or data structure details belong in README or technical documentation, not the tutorial.

### 5. Make errors educational

At failure, reveal enough information for the next attempt. For knowledge games, show the correct reading and an accepted input example. Do not shame the player.

## Iteration discipline

Treat user corrections as design evidence, not patch requests only.

For every correction:

1. Identify why the previous interpretation was weak.
2. Generalize the lesson.
3. Update both code and design documentation.
4. Check whether the same mistake exists elsewhere.

Examples:

- If actual input uses more keys, score and wear should reflect the actual input rather than a canonical spelling.
- If waiting has a time cost, waiting can remain a valid strategy instead of being prohibited.
- If a control is invisible to viewers or unverifiable by the browser, replace it with a visible, verifiable mechanic.

## CPU opponent design

A CPU opponent must not be only a fixed timer.

Difficulty levels may vary:

- knowledge probability
- typing speed
- typo probability
- risk evaluation
- long-versus-short spelling choice
- reroll timing
- willingness to wait for recovery

CPU and player should receive the same problem set at the same problem index. The CPU must use the same wear, recovery, score, and HP rules as the player.

CPU mode should serve as a technical prototype for future multiplayer:

- shared seed
- independent progress
- opponent status panel
- final comparison

## Verification requirements

Before release, test:

- syntax and load errors
- core answer variants
- scoring from actual input
- resource wear and recovery
- all game-over and clear paths
- result answers
- local score persistence
- share fallback
- deterministic seed equality
- every CPU level makes progress and terminates
- responsive layout

Use automated browser tests where possible. Capture and visually inspect at least the title/setup, active game, and result screens for substantial UI changes.

## Packaging

For a full release, include all files required at the repository root.

For an update patch, include only changed and newly added files, preserving their repository-relative paths. Include:

- versioned ZIP
- SHA-256 file
- CHANGELOG entry
- README update when behavior changes
- roadmap or technical note when future architecture is affected

## Completion criteria

The task is complete only when:

- the game runs in a browser without a build step
- requested modes work
- code and data pass targeted tests
- UI text is player-facing
- the result is packaged for direct repository upload
- future architecture decisions are recorded
- limitations and unverified areas are stated honestly
