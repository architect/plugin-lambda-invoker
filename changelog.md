# Architect Lambda invoker plugin

---

## [1.0.0] 2023-02-10

### Added

- Added option to repeat last invocation
- Added support for `customLambdas` created by `set.customLambdas` Architect plugins


### Changed

- Updated dependencies


### Fixed

- Gracefully cancel invocation if esc key is pressed
- Fixes a TypeError issue where colors.symbols may be undefined; thanks @dakota002

---

## [0.1.0 - 0.1.1] 2022-03-27

### Added

- Added event source mocks for `@events`, `queues`, `@scheduled`, `@tables-streams`
- Added warning for empty payloads on all invocations of pragmas not noted

---
