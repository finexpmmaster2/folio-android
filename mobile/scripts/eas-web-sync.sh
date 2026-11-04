#!/usr/bin/env bash
# EAS post-install hook: build Folio's web app (repository root) and copy it into the Android project.
# The generated web assets are git-ignored, so cloud builds from the repository create them here.
set -euo pipefail
[ "${EAS_BUILD:-}" = "true" ] || exit 0
(cd .. && npm ci --no-audit --no-fund && npm run build)
npx cap sync android
