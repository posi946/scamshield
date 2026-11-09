import test from "node:test";
import assert from "node:assert/strict";
import { analyzeMessage } from "../analyzer.js";

const ids = (analysis) => analysis.findings.map((finding) => finding.id);

test("empty input returns a neutral result", () => {
  const result = analyzeMessage("   ");
  assert.equal(result.score, 0);
  assert.equal(result.band, "none");
  assert.deepEqual(result.findings, []);
});

test("a classic bank phishing message scores high and names the tactics", () => {
  const result = analyzeMessage(
    "URGENT: Your account will be suspended within 24 hours. Reply with the 6-digit code we sent and confirm your card number. A processing fee of $49.99 must be paid by gift card. Do not tell anyone. Click http://paypal-secure-verify.top/login"
  );

  assert.equal(result.band, "high");
  assert.ok(result.score >= 55);
  assert.ok(ids(result).includes("urgency"));
  assert.ok(ids(result).includes("account-threat"));
  assert.ok(ids(result).includes("credentials"));
  assert.ok(ids(result).includes("money"));
  assert.ok(ids(result).includes("secrecy"));
  assert.ok(ids(result).includes("lookalike-link"));
  assert.ok(ids(result).includes("http-link"));
  assert.ok(ids(result).includes("risky-tld"));
});

test("a normal work message stays low", () => {
  const result = analyzeMessage(
    "Hi Ada, the team meeting moved to 3pm in room 2. See you there. Kwame"
  );

  assert.ok(result.score < 22);
  assert.ok(!ids(result).includes("credentials"));
  assert.ok(!ids(result).includes("money"));
});

test("a seed phrase request is treated as high risk", () => {
  const result = analyzeMessage(
    "Support here. To validate your wallet, send your seed phrase and private key in this chat."
  );

  assert.equal(result.band, "high");
  assert.ok(ids(result).includes("crypto"));
  assert.ok(result.nextSteps.some((step) => /seed phrase/i.test(step)));
});

test("shortened links are flagged", () => {
  const result = analyzeMessage("Reschedule your parcel here: https://bit.ly/parcel-redelivery");
  assert.ok(ids(result).includes("short-link"));
});

test("raw IP links are flagged", () => {
  const result = analyzeMessage("Login at http://192.168.10.24/verify to keep your account.");
  assert.ok(ids(result).includes("ip-link"));
});

test("punycode links are flagged", () => {
  const result = analyzeMessage("Open https://xn--pypal-4ve.com/login now.");
  assert.ok(ids(result).includes("punycode-link"));
});

test("an @ trick in a link is flagged", () => {
  const result = analyzeMessage("Open https://paypal.com@evil.example/login");
  assert.ok(ids(result).includes("at-link"));
});

test("the score never exceeds 100 and findings are unique", () => {
  const result = analyzeMessage(
    "URGENT final warning: your account will be suspended. Send your password, OTP, card number, CVV, and seed phrase. Pay by gift card, bitcoin, and wire transfer. Do not tell anyone. Install TeamViewer and download this APK. You have won a prize. Call this number. Scan this QR code. Click http://192.168.1.5/xn--paypal.top"
  );

  assert.equal(result.score, 100);
  assert.equal(new Set(ids(result)).size, result.findings.length);
  assert.ok(result.findings.length > 8);
});

test("next steps mention two-factor authentication after a credential request", () => {
  const result = analyzeMessage("Please send your password and the verification code now.");
  assert.ok(result.nextSteps.some((step) => /two-factor/i.test(step)));
});
