# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1-beta.3] - 2025-11-09

### Added

- **Background polling system**: Accessories are now updated automatically every 10 seconds via background polling
- **Cached values**: All `onGet` handlers now return cached values synchronously (no blocking API calls)
- **Proactive HomeKit updates**: Using `updateValue()` to push updates to HomeKit when values change
- **Comprehensive logging**: All `onSet` handlers now log their actions to the Homebridge console
- **AccessoryHelpers module**: Reusable utility functions for accessory development
- **Comprehensive test suite**: Test files covering all accessories and core modules

### Changed

- **Performance optimization**: All characteristic handlers are now non-blocking and return immediately from cache
- **Improved validation**: Characteristic values are validated against their bounds before being set
- **Better error logging**: Invalid values (e.g., temperatures out of range) are logged with helpful messages
- **TypeScript improvements**: `UponorDevice` type now correctly specifies `undefined` for optional properties
- **Code deduplication**:
  - `adjustThermostatTemperature()` function is now shared between Away and Cooling mode switches
  - Unified error handling in `UponorAPI.ts`

### Fixed

- **"characteristic was supplied illegal value" errors**: Values are now validated before being set to characteristics
- **Temperature validation**: Values like 0°C that fall below the minimum limit (e.g., 5°C) are properly rejected and logged
- **Performance warnings**: Eliminated "This plugin slows down Homebridge" warnings by removing blocking API calls from handlers
- **Humidity validation**: Values outside the 0-100% range are now properly validated and logged

## [1.2.1-beta.2] - 2025-11-08

### Fixed

- Fixed slow/non-responding read handlers that caused "This plugin slows down Homebridge" warnings
- Added comprehensive error handling to all characteristic handlers (CurrentHeatingCoolingState, CurrentTemperature, TargetTemperature, CurrentRelativeHumidity, Name)
- Improved handling of API connection errors (ECONNRESET, ETIMEDOUT, ECONNREFUSED)
- Added validation for all temperature and humidity values to prevent NaN values
- Added default fallback values when API data is unavailable
- Fixed missing `await updateData()` in `isOn()` method
- Improved error messages for better debugging

### Changed

- Increased cache time from 1 second to 5 seconds to reduce API load
- Added 5-second timeout to all API calls
- Enhanced `UponorAPIData` with better validation and default values
- All characteristic handlers now return cached values on error instead of failing

## [1.2.1-beta.1] - 2025-11-08

### Added

- GitHub Actions workflows for automated CI/CD

### Changed

- Updated README.md with correct configuration properties and installation instructions
- Updated dependencies:
  - `axios` from 1.13.1 to 1.13.2
  - `@vitest/coverage-v8` from 4.0.7 to 4.0.8
  - `@vitest/eslint-plugin` from 1.4.0 to 1.4.1
  - `vitest` from 4.0.7 to 4.0.8

## [1.2.1-beta.0] - 2025-11-08

### Fixed

- Fixed "NaN" temperature warnings by adding validation before setting characteristic values
- Fixed "undefined" name warnings by checking if name exists before setting characteristic
- Improved accessory initialization to handle invalid or missing cached data gracefully

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
