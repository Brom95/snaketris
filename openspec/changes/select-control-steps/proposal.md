# Proposal: Select-Control Steps

## Problem
The SELECT_CONTROL screen currently shows all items as a simultaneous list (P1 layout, P2 layout, Start, Back). The user must scan the whole list to understand what is required. The interface is not intuitive: there are no key hints, no clear indication of which player's turn it is, and no explicit "what do I press next" guidance.

## Proposed UX Principle
**One item per display.** Each step in a sequential flow shows exactly one item at a time. The item replaces the entire menu area (large, centered text). When the user acts on that item, the next item appears. No more than one selectable choice is shown per screen display.

This principle applies to SELECT_CONTROL and establishes a rule for future screens: **the interface never shows more than one selectable item at a time.**

## Scope
- SELECT_CONTROL becomes a sequential step-by-step flow
- Each step shows one prominent item with explicit key hints
- Emoji markers on each step (🐍 🏗️ ⌨️ etc.)
- The main menu and role screen are NOT changed in this scope (they already show lists, which is acceptable for navigation; the principle applies to *action* screens like SELECT_CONTROL where the user must perform a specific action)

## Non-goals
- Changing the main menu or role screen (they stay as lists)
- Adding sound effects
- Changing the game rules
