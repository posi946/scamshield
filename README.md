# ScamShield

**Check a message before you click.**

ScamShield is a free, private scam-message checker. Paste a suspicious text, email, or DM and it shows the warning signs it recognises, a 0 to 100 risk score, and a short list of what to do next.

Everything runs in your browser. Nothing you paste is uploaded, stored, or tracked.

[Live demo](https://posi946.github.io/scamshield/) · [Report a bug](https://github.com/posi946/scamshield/issues)

## Why this exists

Scams arrive as ordinary messages: a parcel fee, a bank alert, a job offer, a message from someone you trust. The tactics repeat, even when the wording changes. ScamShield names those tactics so you can slow down and check before you pay, click, or share a code.

It is deliberately small. No account, no server, no analytics, no model download.

## What it checks

- **Pressure:** deadlines, threats, and "act now" language.
- **Account threats:** suspension, unusual login, and verification bait.
- **Credentials:** passwords, PINs, one-time codes, card numbers, and CVVs.
- **Wallet secrets:** seed phrases, private keys, and wallet-connection requests.
- **Remote access:** AnyDesk, TeamViewer, unknown APKs, and macro-enabled files.
- **Payment demands:** gift cards, crypto, wire transfers, and release fees.
- **Secrecy:** "do not tell anyone" and "keep this between us".
- **Bait:** prizes, guaranteed returns, and too-good offers.
- **Links:** shorteners, raw IP addresses, punycode, `@` tricks, lookalike brand domains, risky TLDs, and unencrypted pages.
- **Other common hooks:** fake tech support, job scams, legal threats, delivery problems, QR codes, and callback requests.

Each match is explained, and the score is the capped sum of the matched signal weights.

| Score | Band | Meaning |
| --- | --- | --- |
| 32 to 100 | High risk | At least one strong scam pattern. Do not engage. |
| 18 to 31 | Caution | Some warning signs. Verify through a trusted channel. |
| 1 to 17 | Low risk | Weak signals only. Still verify if money or data is involved. |
| 0 | No signals | No common patterns matched. Not a guarantee. |

## Privacy

- No network requests after the page loads.
- No cookies, analytics, or third-party scripts.
- The text stays in memory. It is not saved to local storage.
- The service worker caches the app shell so it keeps working offline.

## Run it locally

```bash
git clone https://github.com/posi946/scamshield.git
cd scamshield
npm test
npm start
```

Then open <http://localhost:8080>.

The app is plain HTML, CSS, and JavaScript. There is no build step and no runtime dependency.

## Test

```bash
npm test
```

The suite uses Node's built-in test runner and covers the analyzer: empty input, classic phishing, legitimate messages, wallet requests, shortened and lookalike links, score caps, and duplicate suppression.

## Deploy

The site is a static folder, so GitHub Pages can serve it directly:

1. Push to `main`.
2. Open **Settings > Pages**.
3. Set **Source** to **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Save.

## Limits

ScamShield is guidance, not a guarantee. A message can be a scam without matching these patterns, and a legitimate message can use urgent language. It does not inspect attachments, verify senders, or contact any service. If money or personal data is involved, verify through an official app or a phone number you look up yourself.

If you have lost money or shared credentials, contact your bank and your local cybercrime authority immediately.

## Contributing

Issues and pull requests are welcome. If you add a signal, include a test with a realistic message and a legitimate message that should not trigger it.

## License

MIT. See [LICENSE](LICENSE).
