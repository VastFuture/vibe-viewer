# npm-publish

Publish vibe-viewer to npm registry.

## Trigger

When user says "publish", "发布", "npm publish", "发版", "release to npm", or any npm publishing intent.

## Pre-flight Checks

Run these IN ORDER. If any fails, STOP and tell the user.

1. **Working tree must be clean**
   ```bash
   git status -s
   ```
   If output is not empty: tell user to commit or stash changes first.

2. **Build must succeed**
   ```bash
   npm run build
   ```
   If exit code != 0: tell user the build failed, show the error, STOP.

3. **npm login check**
   ```bash
   npm whoami
   ```
   If fails: tell user to run `npm login` first, STOP.

4. **Verify dist/ is fresh**
   ```bash
   ls dist/cli.js dist/server.js dist/public/app.js dist/public/index.html dist/public/style.css
   ```
   If any file missing: build didn't output correctly, STOP.

## Version Bump

Ask the user which version bump:
- `patch` (0.1.2 → 0.1.3): bug fixes, minor changes
- `minor` (0.1.2 → 0.2.0): new features, backward compatible
- `major` (0.1.2 → 1.0.0): breaking changes

Then run:
```bash
npm version <patch|minor|major>
```

This auto-commits a version tag.

## Publish

```bash
npm publish
```

`prepublishOnly` hook runs `npm run build` automatically, but we already built and verified above — the hook is a safety net.

## Post-publish

1. **Push the version tag**
   ```bash
   git push && git push --tags
   ```

2. **Confirm**
   ```bash
   npm view vibe-viewer version
   ```
   Show the user the published version number.

## Rollback

If publish succeeds but something is wrong:
```bash
npm unpublish vibe-viewer@<version> --force
```
Note: npm only allows unpublish within 72 hours for security reasons.