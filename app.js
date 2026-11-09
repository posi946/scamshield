import { analyzeMessage } from "./analyzer.js";

const form = document.querySelector("#check-form");
const message = document.querySelector("#message");
const result = document.querySelector("#result");
const scoreValue = document.querySelector("#score-value");
const scoreMeter = document.querySelector("#score-meter");
const bandLabel = document.querySelector("#band-label");
const bandSummary = document.querySelector("#band-summary");
const findingsList = document.querySelector("#findings-list");
const findingsCount = document.querySelector("#findings-count");
const nextList = document.querySelector("#next-list");
const copyButton = document.querySelector("#copy-report");
const resetButton = document.querySelector("#reset");
const exampleButton = document.querySelector("#example");
const clearButton = document.querySelector("#clear");

const EXAMPLES = [
  `URGENT: Your account will be suspended within 24 hours. To verify your identity, reply with the 6-digit code we just sent and confirm your card number. A processing fee of $49.99 must be paid by gift card. Do not tell anyone. Click http://paypal-secure-verify.top/login`,
  `Your parcel could not be delivered. A customs fee of $2.99 is outstanding. Reschedule here: https://bit.ly/parcel-redelivery. If the fee is not paid today, the package will be returned.`,
  `Hi Ada, the team meeting moved to 3pm in room 2. I have attached the agenda. See you there. Kwame`,
  `Congratulations! You have won a $1,000 gift card. Claim your prize now by sending your name, address, and a small administration fee in bitcoin. This offer expires today.`,
];

let exampleIndex = 0;
let lastReport = null;

function severityFor(weight) {
  if (weight >= 22) return "high";
  if (weight >= 12) return "medium";
  return "low";
}

function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function renderFindings(findings) {
  clearNode(findingsList);
  findingsCount.textContent =
    findings.length === 0
      ? "No common red flags found"
      : `${findings.length} ${findings.length === 1 ? "signal" : "signals"} found`;

  for (const finding of findings) {
    const item = document.createElement("li");
    item.className = `finding severity-${severityFor(finding.weight)}`;

    const head = document.createElement("div");
    head.className = "finding-head";

    const title = document.createElement("h3");
    title.textContent = finding.title;

    const weight = document.createElement("span");
    weight.className = "weight";
    weight.textContent = `+${finding.weight}`;

    head.append(title, weight);

    const advice = document.createElement("p");
    advice.className = "advice";
    advice.textContent = finding.advice;

    const evidence = document.createElement("blockquote");
    evidence.textContent = finding.evidence;

    item.append(head, advice, evidence);
    findingsList.append(item);
  }
}

function renderNextSteps(steps) {
  clearNode(nextList);
  for (const step of steps) {
    const item = document.createElement("li");
    item.textContent = step;
    nextList.append(item);
  }
}

function renderResult(analysis) {
  result.hidden = false;
  result.className = `result band-${analysis.band}`;

  scoreValue.textContent = String(analysis.score);
  scoreMeter.style.width = `${Math.max(4, analysis.score)}%`;
  bandLabel.textContent =
    analysis.band === "high"
      ? "High risk"
      : analysis.band === "caution"
        ? "Caution"
        : analysis.band === "low"
          ? "Low risk"
          : "No signals";

  bandSummary.textContent = analysis.summary;
  renderFindings(analysis.findings);
  renderNextSteps(analysis.nextSteps);

  lastReport = analysis;
  result.scrollIntoView({ behavior: "smooth", block: "start" });
  result.querySelector("h2")?.focus?.({ preventScroll: true });
}

function buildReport(analysis) {
  const lines = [
    "ScamShield report",
    `Risk: ${analysis.band.toUpperCase()} (${analysis.score}/100)`,
    "",
    "Signals:",
    ...(analysis.findings.length
      ? analysis.findings.map((finding) => `- ${finding.title} (+${finding.weight})`)
      : ["- None of the common patterns matched"]),
    "",
    "Do this next:",
    ...analysis.nextSteps.map((step) => `- ${step}`),
    "",
    "Generated locally by ScamShield. This is guidance, not a guarantee.",
  ];
  return lines.join("\n");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderResult(analyzeMessage(message.value));
});

exampleButton.addEventListener("click", () => {
  message.value = EXAMPLES[exampleIndex % EXAMPLES.length];
  exampleIndex += 1;
  message.focus();
});

clearButton.addEventListener("click", () => {
  message.value = "";
  result.hidden = true;
  lastReport = null;
  message.focus();
});

resetButton.addEventListener("click", () => {
  message.value = "";
  result.hidden = true;
  lastReport = null;
  message.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

copyButton.addEventListener("click", async () => {
  if (!lastReport) return;
  const report = buildReport(lastReport);
  try {
    await navigator.clipboard.writeText(report);
    copyButton.textContent = "Copied";
  } catch {
    const area = document.createElement("textarea");
    area.value = report;
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    copyButton.textContent = "Copied";
  }
  window.setTimeout(() => {
    copyButton.textContent = "Copy report";
  }, 1800);
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* Offline support is a bonus, not a requirement. */
    });
  });
}

// A small demo hook so the result view can be linked to or screenshotted.
const demo = new URLSearchParams(location.search).get("example");
if (demo !== null) {
  const index = Math.max(0, Math.min(EXAMPLES.length - 1, (Number(demo) || 1) - 1));
  message.value = EXAMPLES[index];
  renderResult(analyzeMessage(message.value));
}
