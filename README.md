# Uponor Plugin for Homebridge

Uponor Smatrix Pulse heating/cooling integration for Homebridge.

## About this Fork

This plugin is a fork and continuation of the original [homebridge-plugin-uponor](https://github.com/alexmobo/homebridge-plugin-uponor). The primary goal of this fork is to modernize and maintain the plugin.

## Installation

Install the plugin via the Homebridge UI or manually via npm:

```bash
npm install -g homebridge-uponor
```

## Configuration

Configure the plugin via the Homebridge UI or manually in your `config.json`:

```json
{
  "platforms": [
    {
      "platform": "UponorPlatform",
      "name": "Uponor",
      "host": "192.168.1.100",
      "refreshInterval": 60000
    }
  ]
}
```

### Configuration Parameters

- `platform` (required): Must be "UponorPlatform"
- `name` (required): Name for the platform (e.g., "Uponor")
- `host` (required): IP address or hostname of your Uponor R-208 module
- `refreshInterval` (optional): Data refresh interval in milliseconds (default: 60000 = 1 minute)

## Supported devices

This integration communicates with Uponor Smatrix Pulse communication module R-208. It should work with all controllers that support this module.

## Accessories

- THERMOSTAT: One Thermostat accessory will be created for each Uponor thermostat.
- COOLING MODE: One Switch to switching between heating and cooling.
- AWAY MODE: One Switch to switching between normal and away.

## Catches and limitations

- Uponor API doesn't support heat/cool switch for single thermostat. switch.uponor_cooling_mode change mode for entire system.
- Uponor API does not support turn off action. When climate entity is turned off on Homebridge, the temperature is set to the minimum (default 5℃) when heating mode is active and to the maximum (default 35℃) when cooling mode is active.

## Development

### Testing

The plugin includes unit tests using Vitest. To run the tests:

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Building

```bash
# Build the plugin
npm run build

# Run linter
npm run lint
```

## Feedback

Your feedback, pull requests or any other contribution are very much welcome.

## Credits

Original plugin by [alexmobo](https://github.com/alexmobo/homebridge-plugin-uponor)  
Maintained and developed by [Michael Päßler](https://github.com/kolorfilm)
