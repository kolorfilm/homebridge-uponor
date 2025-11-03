# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

