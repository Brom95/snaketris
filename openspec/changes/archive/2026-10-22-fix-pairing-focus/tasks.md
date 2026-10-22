# Tasks

## 1. Focus the address field once per pairing step

- [x] 1.1 In js/ui.js paintPairing, remove the clearing branch so the focus call runs only while the flag is unset
- [x] 1.2 Reset the flag only when the step leaves PAIRING

## 2. Verification

- [x] 2.1 Run the unit tree (npm test) after the focus change
- [x] 2.2 Run the network-local verification script and confirm the Pair control stays reachable with the address field focused
