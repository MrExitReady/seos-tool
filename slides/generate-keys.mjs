#!/usr/bin/env node
// NoteDeck Pro license key generator.
// Usage:  node generate-keys.mjs [count]
// Prints one valid key per line, e.g. NDK-7GQ2M-KX9RA-BF4TN
//
// The salt below MUST match CONFIG.licenseSalt in app.js.
// Keep this file out of your deployed site if you move it — it's in the repo
// for convenience, and since validation is client-side the salt is public
// anyway (soft licensing: it keeps honest people honest, which is the
// standard trade-off for a backend-free micro-app).

import crypto from "node:crypto";

const SALT = "notedeck-v1-7f3k";
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function keyHash(body) {
  const s = SALT + body;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let out = "";
  for (let j = 0; j < 5; j++) {
    out += ALPHABET[h % ALPHABET.length];
    h = Math.imul(h ^ (h >>> 7), 0x01000193) >>> 0;
  }
  return out;
}

function randomSegment() {
  let s = "";
  while (s.length < 5) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return s;
}

const count = Math.max(1, parseInt(process.argv[2] || "1", 10) || 1);
for (let i = 0; i < count; i++) {
  const a = randomSegment();
  const b = randomSegment();
  console.log(`NDK-${a}-${b}-${keyHash(a + b)}`);
}
