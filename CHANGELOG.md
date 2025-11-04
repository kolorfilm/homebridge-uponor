# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [1.2.0-beta.1] - 2025-11-04

### Added

- Vitest test framework with unit tests for UponorProxy
- Test coverage reporting with v8 provider
- ESLint plugins: `eslint-config-prettier`, `eslint-plugin-import`, `@vitest/eslint-plugin`
- Import ordering and namespace validation rules

### Changed

- Renamed "Modo frío" to "Cold mode" and "Modo Vacaciones" to "Vacation Mode" throughout the codebase
- Enhanced ESLint configuration with stricter rules and better organization
- Updated TypeScript configuration for better compatibility
- Simplified module system for Homebridge compatibility
- Improved code quality with additional linting rules

## [1.2.0-beta.0] - 2025-11-04

### Added

- Humidity display for thermostats (CurrentRelativeHumidity characteristic)

### Changed

- Refactored from class-based to functional components architecture

### Fixed

- Model characteristic warning by providing 'Uponor Smatrix' as fallback value
- Resolved Homebridge warnings: 'characteristic value expected string and received undefined'

## [1.1.1-beta.0] - 2025-11-03

### Changed

- Updated Node.js engine requirement to v22/v24 (dropped support for older versions)
- Updated Homebridge dependency to v1.11.1
- Updated all npm dependencies to their latest versions:
  - `axios` to v1.13.1
  - `async-mutex` to v0.5.0
  - `bignumber.js` to v9.3.1
  - `eslint` to v9.39.0
  - `typescript` to v5.9.3
  - And many more dev dependencies
- Migrated ESLint configuration to modern flat config format (eslint.config.mjs)
- Improved package.json metadata (description, keywords)

### Added

- Comprehensive README with installation and configuration instructions
- This CHANGELOG file to track version history
- Better documentation for fork status and maintenance

### Fixed

- Compatibility with current Node.js and Homebridge versions
- Security vulnerabilities through dependency updates

## Context

This is a fork and continuation of the original [homebridge-plugin-uponor](https://github.com/alexmobo/homebridge-plugin-uponor) by alexmobo. The plugin was modernized to work with current Node.js and Homebridge versions, as the original plugin was no longer maintained.

## [Earlier Versions]

For the history of earlier versions, please refer to the [original repository](https://github.com/alexmobo/homebridge-plugin-uponor).
