/**
 * ScamShield analyzer.
 *
 * Pure, dependency-free pattern matching. This module is shared by the
 * browser app and the Node test suite, and it never touches the network.
 */

const SIGNALS = [
  {
    id: "urgency",
    weight: 12,
    title: "Pressure to act fast",
    pattern:
      /\b(urgent|immediately|right away|right now|act now|final warning|last chance|within \d+\s*(minutes?|hours?)|expires? (today|soon|in \d+\s*(minutes?|hours?|days?))|asap)\b/i,
    advice:
      "Urgency is a pressure tactic. Pause and verify the sender through a channel you already trust.",
  },
  {
    id: "account-threat",
    weight: 18,
    title: "Threat to your account",
    pattern:
      /\b(account (?:will be|has been|is) (?:suspended|closed|locked|deactivated|restricted)|verify your account|unusual (?:activity|login)|unauthori[sz]ed (?:access|transaction|login)|suspicious (?:activity|login))\b/i,
    advice:
      "Open the organisation's official app or type its address yourself. Do not use the link in the message.",
  },
  {
    id: "credentials",
    weight: 32,
    title: "Request for passwords or codes",
    pattern:
      /\b(password|passcode|pin\b|otp\b|one[- ]time (?:code|password|pin)|verification code|security code|login details|account details|social security|ssn\b|card number|cvv\b|expiry date)\b/i,
    advice:
      "No legitimate organisation asks for a password, PIN, card number, or one-time code by message. Never share them.",
  },
  {
    id: "crypto",
    weight: 32,
    title: "Request for wallet secrets",
    pattern:
      /\b(seed phrase|recovery phrase|private key|wallet address|connect your wallet|validate your wallet|metamask)\b/i,
    advice:
      "A seed phrase or private key gives total control of a wallet. No legitimate service needs it. Never share it.",
  },
  {
    id: "remote-access",
    weight: 26,
    title: "Remote access or app install",
    pattern:
      /\b(remote access|anydesk|teamviewer|screen share|screen sharing|install (?:this|the) app|download (?:this|the) apk|enable macros?|allow macros?)\b/i,
    advice:
      "Remote-access tools and unknown app installs let a stranger control your device. Do not install anything a sender asks for.",
  },
  {
    id: "money",
    weight: 18,
    title: "Payment or transfer request",
    pattern:
      /\b(gift cards?|itunes card|google play card|steam card|wire transfer|western union|moneygram|bitcoin|crypto(?:currency)?|usdt|ethereum|zelle|cash app|venmo|paypal|bank transfer|payment link)\b/i,
    advice:
      "Scams often demand gift cards, crypto, or a transfer because these are hard to reverse. Pay only through a channel you chose.",
  },
  {
    id: "secrecy",
    weight: 20,
    title: "Asks you to keep it secret",
    pattern:
      /\b(do not tell|don'?t tell|keep (?:this|it) (?:between us|secret|quiet)|confidential|don'?t call the (?:bank|police)|don'?t talk to)\b/i,
    advice:
      "Secrecy protects the scammer, not you. Tell someone you trust and check with the organisation directly.",
  },
  {
    id: "too-good",
    weight: 16,
    title: "Too good to be true",
    pattern:
      /\b(you(?:'ve| have) won|you are a winner|congratulations|lottery|prize|claim your|free (?:iphone|gift|money|vacation)|guaranteed (?:returns?|profit|income)|double your (?:money|investment)|risk[- ]free)\b/i,
    advice:
      "Unexpected prizes and guaranteed returns are bait. You should never pay a fee to receive a prize.",
  },
  {
    id: "payment-fee",
    weight: 18,
    title: "Fee before delivery or release",
    pattern:
      /\b(processing fee|release fee|customs fee|delivery fee|clearance fee|tax payment|small fee|administration fee)\b/i,
    advice:
      "A fee to release a parcel, prize, or refund is a classic advance-fee scam. Do not pay it.",
  },
  {
    id: "tech-support",
    weight: 18,
    title: "Fake tech support",
    pattern:
      /\b(tech support|virus(?:es)? (?:found|detected)|your (?:computer|device) is infected|microsoft support|apple support|call (?:this|our) (?:number|support)|refund (?:is )?(?:waiting|ready))\b/i,
    advice:
      "Real software vendors do not cold-call about viruses. Close the message and open the vendor's official support site yourself.",
  },
  {
    id: "job",
    weight: 14,
    title: "Suspicious job offer",
    pattern:
      /\b(work from home|earn \$?\d[\d,]* (?:per|a|each) (?:day|week|hour)|no experience (?:needed|required)|send (?:your )?(?:id|passport|photo)|training fee|equipment fee)\b/i,
    advice:
      "Legitimate employers do not ask for fees, passport photos, or bank details before an interview. Verify the company independently.",
  },
  {
    id: "legal-threat",
    weight: 12,
    title: "Legal or police threat",
    pattern:
      /\b(legal action|lawsuit|arrest warrant|you will be arrested|police report|court date|fine of)\b/i,
    advice:
      "Threats of arrest are used to frighten you into paying. Real authorities do not demand payment by message.",
  },
  {
    id: "delivery",
    weight: 10,
    title: "Delivery problem",
    pattern:
      /\b(parcel|package|shipment|delivery)\b[^.!?]{0,60}\b(fee|failed|held|customs|reschedule|address)\b/i,
    advice:
      "Track a parcel through the retailer or courier's official app, not through a link in an unexpected message.",
  },
  {
    id: "attachment",
    weight: 16,
    title: "Unexpected attachment",
    pattern:
      /\b(open (?:the|this) attachment|see attached|attached (?:invoice|receipt|document)|enable (?:macros?|editing))\b/i,
    advice:
      "Unexpected attachments can carry malware. Do not open them, even if the message looks routine.",
  },
  {
    id: "greeting",
    weight: 6,
    title: "Generic greeting",
    pattern:
      /\b(dear (?:customer|user|client|friend|member)|valued customer|dear sir\/madam)\b/i,
    advice:
      "A generic greeting suggests a bulk message. Real organisations usually know your name.",
  },
  {
    id: "qr",
    weight: 8,
    title: "Push to scan a QR code",
    pattern: /\b(scan (?:this|the) qr|qr code)\b/i,
    advice:
      "QR codes can hide a malicious link. Check the address before you open it, or navigate to the official site yourself.",
  },
  {
    id: "callback",
    weight: 8,
    title: "Call this number",
    pattern:
      /\b(call (?:this|the) number|call us (?:back|now)|phone (?:us|me) (?:back|now))\b/i,
    advice:
      "Do not call a number from an unexpected message. Find the organisation's number on its official website or your card.",
  },
  {
    id: "investment",
    weight: 10,
    title: "Investment or romance hook",
    pattern:
      /\b(investment opportunity|financial advisor|trading platform|guaranteed profit|met (?:you )?on (?:facebook|instagram|whatsapp|tinder))\b/i,
    advice:
      "Investment and romance scams build trust over time. Verify the person and the platform independently before sending money.",
  },
];

const SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "ow.ly",
  "shorturl.at",
  "cutt.ly",
  "rebrand.ly",
  "buff.ly",
  "rb.gy",
  "tiny.cc",
]);

const RISKY_TLDS = new Set([
  "zip",
  "mov",
  "top",
  "xyz",
  "click",
  "link",
  "country",
  "gq",
  "tk",
  "ml",
  "cf",
  "work",
  "support",
  "cam",
  "rest",
]);

const BRANDS = {
  paypal: ["paypal.com"],
  apple: ["apple.com", "icloud.com"],
  microsoft: ["microsoft.com", "live.com", "office.com"],
  amazon: ["amazon.com", "amazon.co.uk"],
  netflix: ["netflix.com"],
  google: ["google.com", "gmail.com"],
  facebook: ["facebook.com", "fb.com"],
  instagram: ["instagram.com"],
  whatsapp: ["whatsapp.com"],
  chase: ["chase.com"],
  wellsfargo: ["wellsfargo.com"],
  bankofamerica: ["bankofamerica.com"],
};

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"')]+/gi;

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function officialHost(host, domains) {
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function snippet(text, index, length) {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 40);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end).replace(/\s+/g, " ").trim()}${suffix}`;
}

function addFinding(findings, id, weight, title, advice, evidence) {
  if (findings.some((finding) => finding.id === id)) return;
  findings.push({ id, weight, title, advice, evidence });
}

function analyzeLinks(text, findings) {
  const seen = new Set();
  const urls = text.match(URL_PATTERN) || [];
  const links = [];

  for (const raw of urls) {
    const url = raw.replace(/[.,;:!?]+$/, "");
    if (seen.has(url)) continue;
    seen.add(url);

    const host = hostOf(url);
    if (!host) continue;
    links.push(url);

    if (SHORTENERS.has(host) || [...SHORTENERS].some((short) => host.endsWith(`.${short}`))) {
      addFinding(
        findings,
        "short-link",
        20,
        "Shortened link hides its destination",
        "Expand or avoid shortened links. Type the organisation's address yourself instead.",
        url
      );
    }

    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.startsWith("[")) {
      addFinding(
        findings,
        "ip-link",
        24,
        "Link uses a raw IP address",
        "Real organisations use domain names. A raw IP address is a strong warning sign.",
        url
      );
    }

    if (host.includes("xn--")) {
      addFinding(
        findings,
        "punycode-link",
        24,
        "Link uses a disguised international domain",
        "Punycode can make a lookalike domain appear legitimate. Do not trust it.",
        url
      );
    }

    const authority = url.split("://")[1]?.split("/")[0] || "";
    if (authority.includes("@")) {
      addFinding(
        findings,
        "at-link",
        20,
        "Link hides its real destination with @",
        "Everything before @ can be decorative. The real host comes after it. Avoid the link.",
        url
      );
    }

    if (url.startsWith("http://")) {
      addFinding(
        findings,
        "http-link",
        10,
        "Link is not encrypted",
        "Avoid entering personal details on a page that does not use HTTPS.",
        url
      );
    }

    const tld = host.split(".").pop();
    if (RISKY_TLDS.has(tld)) {
      addFinding(
        findings,
        "risky-tld",
        10,
        "Unusual domain ending",
        "Some cheap domain endings are popular with scam campaigns. Verify the organisation independently.",
        url
      );
    }

    for (const [brand, domains] of Object.entries(BRANDS)) {
      if (host.includes(brand) && !officialHost(host, domains)) {
        addFinding(
          findings,
          "lookalike-link",
          24,
          "Brand name in a lookalike domain",
          "The real organisation does not use this address. Go to its official site by typing the address yourself.",
          url
        );
        break;
      }
    }

    const labels = host.split(".").filter(Boolean);
    if (labels.length >= 4 && !host.startsWith("www.")) {
      addFinding(
        findings,
        "deep-subdomain",
        6,
        "Link has many subdomains",
        "Long subdomain chains can disguise the real destination. Check the part just before the domain ending.",
        url
      );
    }
  }

  return links;
}

function bandFor(score) {
  if (score >= 32) return "high";
  if (score >= 18) return "caution";
  if (score > 0) return "low";
  return "none";
}

function summaryFor(band) {
  if (band === "high") {
    return "This message matches several known scam patterns. Do not reply, pay, click, or share any code.";
  }
  if (band === "caution") {
    return "Some warning signs are present. Slow down and verify the sender through a channel you already trust.";
  }
  if (band === "low") {
    return "A few weak signals appeared, but nothing conclusive. If money, codes, or links are involved, verify anyway.";
  }
  return "No common scam patterns stood out. That is not a guarantee. Trust your instincts and verify anything unexpected.";
}

function nextStepsFor(band, findings) {
  const ids = new Set(findings.map((finding) => finding.id));
  const steps = [];

  if (band === "high") {
    steps.push("Do not reply, call the number in the message, open any link, or send money.");
  }
  if (ids.has("credentials")) {
    steps.push("If you shared a password or code, change that password now and turn on two-factor authentication.");
  }
  if (ids.has("crypto")) {
    steps.push("Never share a seed phrase or private key. Move funds only through a wallet you control.");
  }
  if (ids.has("money") || ids.has("payment-fee")) {
    steps.push("Call your bank using the number on the back of your card, never a number from the message.");
  }
  if (ids.has("remote-access")) {
    steps.push("Disconnect from the internet, uninstall remote-access software you did not intend to install, and run a malware scan.");
  }
  if (ids.has("short-link") || ids.has("ip-link") || ids.has("punycode-link") || ids.has("lookalike-link") || ids.has("at-link") || ids.has("http-link")) {
    steps.push("Do not open the link. Type the organisation's address yourself or use its official app.");
  }
  if (band !== "none" && band !== "low") {
    steps.push("Verify the sender through a separate channel you already trust, such as the official app or a saved phone number.");
    steps.push("Report the message to the organisation's official fraud team and your local cybercrime authority.");
  }
  if (band === "low" || band === "none") {
    steps.push("If the message asks for money, codes, or a click, verify it anyway before acting.");
  }

  return [...new Set(steps)];
}

/**
 * Analyze a message and return a risk score, band, findings, links, and advice.
 * @param {string} text
 */
export function analyzeMessage(text) {
  const clean = String(text ?? "").replace(/\r\n/g, "\n").trim();
  if (!clean) {
    return {
      score: 0,
      band: "none",
      summary: "Paste a message to check it.",
      findings: [],
      links: [],
      nextSteps: [],
    };
  }

  const findings = [];
  const flat = clean.replace(/\s+/g, " ");

  for (const signal of SIGNALS) {
    const match = signal.pattern.exec(flat);
    if (match) {
      addFinding(
        findings,
        signal.id,
        signal.weight,
        signal.title,
        signal.advice,
        snippet(flat, match.index, match[0].length)
      );
    }
  }

  const links = analyzeLinks(clean, findings);

  findings.sort((a, b) => b.weight - a.weight || a.title.localeCompare(b.title));

  const rawScore = findings.reduce((total, finding) => total + finding.weight, 0);
  const score = Math.min(100, rawScore);
  const band = bandFor(score);

  return {
    score,
    band,
    summary: summaryFor(band),
    findings,
    links,
    nextSteps: nextStepsFor(band, findings),
  };
}

export { SIGNALS };
