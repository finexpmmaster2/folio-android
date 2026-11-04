#!/usr/bin/env bash
# EAS pre-install hook: Capacitor 8 compiles for Java 21, EAS Android images ship JDK 17 (or 11).
# Download Temurin 21 and point Gradle at it. Runs only on EAS builders.
set -euo pipefail
[ "${EAS_BUILD:-}" = "true" ] || exit 0
JDK="$HOME/jdk21"
if [ ! -x "$JDK/bin/java" ]; then
  mkdir -p "$JDK"
  curl -fsSL "https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse" | tar -xz -C "$JDK" --strip-components=1
fi
"$JDK/bin/java" -version
grep -q '^org.gradle.java.home=' android/gradle.properties || echo "org.gradle.java.home=$JDK" >> android/gradle.properties
