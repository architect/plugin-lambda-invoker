# Architect Lambda invoker plugin

---

## [2.0.0] 2024-04-23

### Added

- Added functionality for passing unmarshalled JSON as the payload for `@tables-streams` invocations


### Changed

- Breaking change: removed support for Node.js 14.x (now EOL, and no longer available to created in AWS Lambda)

---

## [1.2.0] 2023-08-30

### Added

- Added exportable `invoke` interface; fixes #1446

---

## [1.1.0] 2023-08-07

### Added

- Added support from mocks in `sandbox-invoke-mocks.cjs`, `sandbox-invoke-mocks.mjs` filenames, and importing as ES modules from `sandbox-invoke-mocks.js` (and `.mjs`, of course); fixes #6, thanks @danactive!
  - Note: per [Node.js #2806](https://github.com/nodejs/help/issues/2806), ES module data may be cached in Sandbox, which is intended to be a semi-long-lived process. If using ES modules, you may need to restart Sandbox when updating your mocks.

---

## [1.0.1] 2023-07-31

### Fixed

- Fixed missing `ansi-colors` dependency; thanks @lpsinger!

---

## [1.1.0] 2023-08-07

### Added

- Added support from mocks in `sandbox-invoke-mocks.cjs`, `sandbox-invoke-mocks.mjs` filenames, and importing as ES modules from `sandbox-invoke-mocks.js` (and `.mjs`, of course); fixes #6, thanks @danactive!
  - Note: per [Node.js #2806](https://github.com/nodejs/help/issues/2806), ES module data may be cached in Sandbox, which is intended to be a semi-long-lived process. If using ES modules, you may need to restart Sandbox when updating your mocks.

---

## [1.0.1] 2023-07-31

### Fixed

- Fixed missing `ansi-colors` dependency; thanks @lpsinger!

---

## [1.0.1] 2023-03-22

### Added
- Added functionality for passing unmarshalled json as the payload for tables-streams invocations


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
