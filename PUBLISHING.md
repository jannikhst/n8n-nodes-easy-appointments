# Publishing to npm

This document provides instructions on how to publish your n8n-nodes-easy-appointments package to npm.

## Prerequisites

1. You need an npm account. If you don't have one, create it at [npmjs.com](https://www.npmjs.com/signup).
2. You need to be logged in to npm on your local machine.

## Preparation Steps

1. Run the cleanup script to remove example files:
   ```bash
   ./cleanup.sh
   ```

2. Make sure your package.json has the correct information:
   - Author name and email
   - Repository URL
   - Version number (increment for updates)

3. Build the package to ensure everything compiles correctly:
   ```bash
   pnpm build
   ```

4. Run the linter to check for any issues:
   ```bash
   pnpm lint
   ```

## Publishing Process

1. Login to npm if you haven't already:
   ```bash
   npm login
   ```

2. Publish the package:
   ```bash
   npm publish
   ```

   If this is your first time publishing this package and you want to make it public:
   ```bash
   npm publish --access public
   ```

## After Publishing

1. Create a GitHub release with the same version number.
2. Update the n8n community nodes documentation if needed.

## Updating the Package

When you want to update the package:

1. Update the version in package.json (follow semantic versioning):
   - Patch version (0.1.0 -> 0.1.1) for bug fixes
   - Minor version (0.1.0 -> 0.2.0) for new features
   - Major version (0.1.0 -> 1.0.0) for breaking changes

2. Follow the same preparation and publishing steps as above.

## Testing Before Publishing

It's recommended to test your package locally before publishing:

1. Link your package locally:
   ```bash
   npm link
   ```

2. In your n8n installation directory:
   ```bash
   npm link n8n-nodes-easy-appointments
   ```

3. Start n8n and test your nodes.

## Troubleshooting

- If you get an error about the package name being already taken, you may need to choose a different name.
- If you get permission errors, make sure you're logged in with the correct npm account.
