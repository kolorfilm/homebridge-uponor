# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0-beta.0] - 2026-05-06

### Added

- Homebridge v2 compatibility: the plugin now declares support for both Homebridge v1 and v2
  via `engines.homebridge: ^1.11.1 || ^2.0.0`, following the official
  [Homebridge v2 migration guide](https://github.com/homebridge/homebridge/wiki/Updating-To-Homebridge-v2.0)

### Changed

- Bumped `engines.node` to `^22.13.0 || ^24.0.0` to align with the Homebridge v2 recommendation
  and to satisfy the stricter requirement of `@matter/nodejs` (`>=22.13.0` on the Node 22 line)
- Bumped the `homebridge` development dependency to `^2.0.1` so lint, type-checking, tests, and
  the build run against the v2 API surface
- Refactored to use the `Logging` interface instead of the concrete `Logger` class, which is the
  more idiomatic typing for Homebridge plugins (no functional change)

### Notes

- No source-level breaking changes were required: the plugin already uses `api.hap.*` helpers,
  `DynamicPlatformPlugin`, and modern `onGet`/`onSet` characteristic handlers, and does not depend
  on any of the APIs removed in HAP-NodeJS v1 (`BatteryService`, `Characteristic.Units/Formats/Perms`,
  `Characteristic.getValue()`, `Accessory.updateReachability()`, etc.)

## [1.4.0] - 2026-03-12

### Changed

- HVAC mode detection now uses actuator state (`stat_cb_actuator`) for more reliable mode reporting
- Updated README to reflect current repository and maintenance status
- Updated production and development dependencies via Dependabot batches
- Added Dependabot guardrail to prevent ESLint v10 proposals until peer dependencies are compatible

### Fixed

- Prevented `TargetHeatingCoolingState` from being set to OFF unexpectedly
- Preserved the previous HVAC state on API errors instead of resetting to OFF
- Applied npm audit lockfile fixes for vulnerable transitive dependencies

## [1.3.0] - 2025-11-09

### Added

- Background polling system (10-second intervals)
- Cached values for non-blocking `onGet` handlers
- Comprehensive logging for all `onSet` operations
- AccessoryHelpers module with reusable utility functions
- Test suite with 203 tests across 8 files
- GitHub Actions CI/CD workflows

### Changed

- Performance optimization: All handlers now return immediately from cache
- Improved validation for temperature and humidity values
- Better error handling with early returns in UponorAPI
- Code deduplication: Shared helpers for common operations
- Increased cache time from 1s to 5s
- Enhanced error messages and logging
- Updated dependencies (axios, vitest, eslint plugins)
- Updated README with correct configuration

### Fixed

- "This plugin slows down Homebridge" warnings
- "characteristic was supplied illegal value" errors
- Temperature and humidity validation issues
- NaN and undefined warnings
- API connection error handling (ECONNRESET, ETIMEDOUT, ECONNREFUSED)
- Accessory initialization with invalid cached data

## [1.2.0] - 2025-11-04

### Added

- Humidity display for thermostats (CurrentRelativeHumidity characteristic)
- Vitest test framework with unit tests for UponorProxy
- Test coverage reporting with v8 provider
- ESLint plugins for improved code quality (`eslint-config-prettier`, `eslint-plugin-import`, `@vitest/eslint-plugin`)
- Import ordering and namespace validation rules
- Comprehensive README with installation and configuration instructions
- CHANGELOG file to track version history
- Better documentation for fork status and maintenance

### Changed

- Refactored from class-based to functional components architecture
- Renamed Spanish strings to English: "Modo frío" → "Cold mode", "Modo Vacaciones" → "Vacation Mode"
- Enhanced ESLint configuration with stricter rules and better organization
- Updated TypeScript configuration for better compatibility
- Simplified module system for Homebridge compatibility
- Updated Node.js engine requirement to v22/v24 (dropped support for older versions)
- Updated Homebridge dependency to v1.11.1
- Updated all npm dependencies to their latest versions
- Migrated ESLint configuration to modern flat config format (eslint.config.mjs)
- Improved package.json metadata (description, keywords)

### Fixed

- Model characteristic warning by providing 'Uponor Smatrix' as fallback value
- Resolved Homebridge warnings: 'characteristic value expected string and received undefined'
- Compatibility with current Node.js and Homebridge versions
- Security vulnerabilities through dependency updates

## Context

This is a fork and continuation of the original [homebridge-plugin-uponor](https://github.com/alexmobo/homebridge-plugin-uponor) by alexmobo. The plugin was modernized to work with current Node.js and Homebridge versions, as the original plugin was no longer maintained.

## [Earlier Versions]

For the history of earlier versions, please refer to the [original repository](https://github.com/alexmobo/homebridge-plugin-uponor).
