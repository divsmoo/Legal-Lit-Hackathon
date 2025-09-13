// scripts/app.js
// Minimal JS to:
// - Toggle mobile nav
// - Demo generation (mock) + risk engine on index.html
// - MCQ check + risk analysis per module pages
// Accessible, no external dependencies.

// ---------- NAV ----------
const navToggle = document.querySelector(".nav-toggle");
const navList = document.querySelector("[data-nav]");
if (navToggle && navList) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navList.style.display = expanded ? "none" : "flex";
  });
}

// ---------- RISK ENGINE ----------
/**
 * Analyze text for:
 * - PII: emails, phones, sensitive keywords
 * - Hallucination risk: missing citations, absolute language
 * - Currency/specificity: very old years, vague references
 * Returns { riskLevel: 'GREEN'|'AMBER'|'RED', findings: {...}, tips: [] }
 */
function analyze(text) {
  const lower = (text || "").toLowerCase();

  // PII (very rough heuristics — demo only)
  const emailRe = /\b[\w.+-]+@[\w.-]+\.\w{2,}\b/g;
  const phoneRe = /\b(?:\+?\d{1,3}[-.\s]?)?(?:\d{8,12})\b/g;
  const piiKwRe = /\b(nric|passport|dob|address|client)\b/g;

  const piiFindings = [];
  if (emailRe.test(lower)) piiFindings.push("Possible email detected");
  if (phoneRe.test(lower)) piiFindings.push("Possible phone number detected");
  if (piiKwRe.test(lower)) piiFindings.push("Sensitive keyword (NRIC/Passport/DOB/Address/Client)");

  // Hallucination & tone
  const certaintyRe = /\b(always|never|guarantee[sd]?|will succeed|certain)\b/g;
  const citationLikeRe = /(section\s+\d+|cap\.\s*\d+|\b\[\d{4}\]\b|v\.\s|https?:\/\/)/gi;

  const noCitations = !citationLikeRe.test(text || "");
  const strongLanguage = certaintyRe.test(lower);

  // Currency / specificity
  const oldYearRe = /\b(19[6-9]\d|200[0-9]|201[0-4])\b/g;
  const vagueLawRe = /\b(as per the law|under the law|the act)\b/g;

  const currencyFindings = [];
  if (oldYearRe.test(lower)) currencyFindings.push("Contains older year — verify currency");
  if (vagueLawRe.test(lower)) currencyFindings.push("Vague legal reference — specify statute/section");

  // Aggregate score
  const score =
    (piiFindings.length ? 2 : 0) +
    (noCitations ? 1 : 0) +
    (strongLanguage ? 1 : 0) +
    (currencyFindings.length ? 1 : 0);

  const riskLevel = score >= 3 ? "RED" : score === 2 ? "AMBER" : "GREEN";

  // Tips
  const tips = [];
  if (piiFindings.length) tips.push("Remove/obfuscate PII before using AI.");
  if (noCitations) tips.push("Ask for sources: statute names, sections, case citations.");
  if (strongLanguage) tips.push("Avoid absolute language; prefer 'may', 'subject to', 'depends on facts'.");
  if (currencyFindings.length) tips.push("State jurisdiction & date (e.g., 'Singapore law, as of Sep 2025').");
  tips.push("Review with a qualified lawyer before relying on outputs.");

  return {
    riskLevel,
    findings: {
      pii: piiFindings,
      hallucination: [
        noCitations ? "No citations detected — verify authority." : "Signals of sources present.",
        strongLanguage ? "Contains absolute language — soften claims." : "Tone appears non-absolute."
      ],
      currency: currencyFindings
    },
    tips
  };
}

// ---------- INDEX DEMO ----------
const promptEl = document.getElementById("prompt");
const outputEl = document.getElementById("output");
const genBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");

const riskBadge = document.getElementById("riskBadge");
const riskSummary = document.getElementById("riskSummary");
const piiList = document.getElementById("piiList");
const hallucinationList = document.getElementById("hallucinationList");
const tipsList = document.getElementById("tipsList");

// Simple mock generator: returns a safe-ish template (no external APIs)
function mockGenerate() {
  return `Dear Sir/Madam,

This letter provides notice to terminate the tenancy for the property at 123 Example Road, Singapore 123456.
Pursuant to Clause 7 (Termination) of the Tenancy Agreement, the tenancy will end on 30 November 2025.

Please arrange handover and return of the security deposit within the agreed timeframe, subject to inspection and applicable law.
This is an educational example and does not constitute legal advice.

Sincerely,
[Your Name]`;
}

// if (genBtn && outputEl) {
//   genBtn.addEventListener("click", () => {
//     outputEl.textContent = mockGenerate();

//     // analyze combined prompt + output
//     const analysis = analyze(`${promptEl?.value || ""}\n\n${outputEl.textContent}`);

//     // paint results
//     if (riskBadge) {
//       riskBadge.textContent =
//         analysis.riskLevel === "RED" ? "High" :
//         analysis.riskLevel === "AMBER" ? "Medium" : "Low";
//       riskBadge.className = "badge " + (
//         analysis.riskLevel === "RED" ? "bad" :
//         analysis.riskLevel === "AMBER" ? "warn" : "ok"
//       );
//     }

//     if (riskSummary) {
//       riskSummary.innerHTML = "";
//       const li = document.createElement("li");
//       li.textContent = `Risk level: ${analysis.riskLevel}`;
//       riskSummary.appendChild(li);
//     }

//     if (piiList) {
//       piiList.innerHTML = "";
//       if (analysis.findings.pii.length === 0) {
//         const li = document.createElement("li"); li.textContent = "No obvious PII detected."; piiList.appendChild(li);
//       } else {
//         analysis.findings.pii.forEach(f => { const li = document.createElement("li"); li.textContent = f; piiList.appendChild(li); });
//       }
//     }

//     if (hallucinationList) {
//       hallucinationList.innerHTML = "";
//       analysis.findings.hallucination.forEach(f => { const li = document.createElement("li"); li.textContent = f; hallucinationList.appendChild(li); });
//       analysis.findings.currency.forEach(f => { const li = document.createElement("li"); li.textContent = f; hallucinationList.appendChild(li); });
//     }

//     if (tipsList) {
//       tipsList.innerHTML = "";
//       analysis.tips.forEach(t => { const li = document.createElement("li"); li.textContent = t; tipsList.appendChild(li); });
//     }

//     window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
//   });
// }

if (clearBtn && outputEl) {
  clearBtn.addEventListener("click", () => {
    outputEl.textContent = "";
    if (riskBadge) { riskBadge.textContent = "–"; riskBadge.className = "badge"; }
    [riskSummary, piiList, hallucinationList, tipsList].forEach(ul => { if (ul) ul.innerHTML = ""; });
  });
}

// ---------- MODULE MCQs ----------
/**
 * MCQ answers (by module)
 * Keep content simple and transparent for the hackathon.
 */
const MCQ_ANSWERS = {
  letter: {
    correct: "B",
    // We also run risk analysis on the shown mock to educate.
    sourceEl: "letterOutput",
    feedbackEl: "letterFeedback",
    risk: {
      containerId: "letterRisk",
      badgeId: "letterBadge",
      sumId: "letterRiskSummary",
      piiId: "letterPII",
      halId: "letterHallucination"
    }
  },
  summary: {
    correct: "B",
    sourceEl: "summaryOutput",
    feedbackEl: "summaryFeedback",
    risk: {
      containerId: "summaryRisk",
      badgeId: "summaryBadge",
      sumId: "summaryRiskSummary",
      piiId: "summaryPII",
      halId: "summaryHallucination"
    }
  },
  clause: {
    correct: "B",
    sourceEl: "clauseOutput",
    feedbackEl: "clauseFeedback",
    risk: {
      containerId: "clauseRisk",
      badgeId: "clauseBadge",
      sumId: "clauseRiskSummary",
      piiId: "clausePII",
      halId: "clauseHallucination"
    }
  }
};

// Bind all MCQ forms
document.querySelectorAll("form.mcq").forEach(form => {
  const moduleKey = form.getAttribute("data-module");
  const config = MCQ_ANSWERS[moduleKey];
  if (!config) return;

  // Check Answer
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const choice = form.querySelector("input[type=radio]:checked");
    const feedback = document.getElementById(config.feedbackEl);
    if (!feedback) return;

    if (!choice) {
      feedback.textContent = "Please select an option.";
      feedback.style.color = "#b45309"; // amber-ish
      return;
    }

    if (choice.value === config.correct) {
      feedback.textContent = "Correct — well spotted.";
      feedback.style.color = "#166534"; // green-ish
    } else {
      feedback.textContent = "Not quite. Review the output and try again.";
      feedback.style.color = "#7f1d1d"; // red-ish
    }
  });

  // Show Risk Coaching
  const showBtn = form.querySelector("[data-show-analysis]");
  if (showBtn) {
    showBtn.addEventListener("click", () => {
      const src = document.getElementById(config.sourceEl);
      if (!src) return;
      const text = src.textContent || "";

      const a = analyze(text);

      const wrap = document.getElementById(config.risk.containerId);
      const badge = document.getElementById(config.risk.badgeId);
      const sum = document.getElementById(config.risk.sumId);
      const pii = document.getElementById(config.risk.piiId);
      const hal = document.getElementById(config.risk.halId);

      if (wrap) wrap.hidden = false;

      if (badge) {
        badge.textContent = a.riskLevel === "RED" ? "High" : a.riskLevel === "AMBER" ? "Medium" : "Low";
        badge.className = "badge " + (a.riskLevel === "RED" ? "bad" : a.riskLevel === "AMBER" ? "warn" : "ok");
      }

      if (sum) { sum.innerHTML = ""; const li = document.createElement("li"); li.textContent = `Risk level: ${a.riskLevel}`; sum.appendChild(li); }

      if (pii) {
        pii.innerHTML = "";
        if (a.findings.pii.length === 0) {
          const li = document.createElement("li"); li.textContent = "No obvious PII detected."; pii.appendChild(li);
        } else a.findings.pii.forEach(f => { const li = document.createElement("li"); li.textContent = f; pii.appendChild(li); });
      }

      if (hal) {
        hal.innerHTML = "";
        a.findings.hallucination.forEach(f => { const li = document.createElement("li"); li.textContent = f; hal.appendChild(li); });
        a.findings.currency.forEach(f => { const li = document.createElement("li"); li.textContent = f; hal.appendChild(li); });
      }
    });
  }
});

// --- DeepSeek caller ---
async function callDeepseek(prompt) {
  const res = await fetch("/api/deepseek", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || JSON.stringify(err) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const data = await res.json();
  return data.answer || "";
}

// --- Generate (real) ---
if (genBtn && outputEl) {
  genBtn.addEventListener("click", async () => {
    const userPrompt = promptEl?.value || "";
    outputEl.textContent = "Thinking…"; // Show progress message

    try {
      const answer = await callDeepseek(userPrompt);
      outputEl.textContent = answer;

      // ✅ Only unhide demo-output if we have a real answer
      if (outputEl.textContent.trim() && outputEl.textContent.trim() !== "Thinking…") {
        const demoOutput = document.getElementById("demo-output");
        if (demoOutput) demoOutput.hidden = false;
      }

      // Analyze and update risk panel
      const analysis = analyze(`${userPrompt}\n\n${answer}`);

      if (riskBadge) {
        riskBadge.textContent =
          analysis.riskLevel === "RED" ? "High" :
          analysis.riskLevel === "AMBER" ? "Medium" : "Low";
        riskBadge.className = "badge " + (
          analysis.riskLevel === "RED" ? "bad" :
          analysis.riskLevel === "AMBER" ? "warn" : "ok"
        );
      }

      if (riskSummary) {
        riskSummary.innerHTML = "";
        const li = document.createElement("li");
        li.textContent = `Risk level: ${analysis.riskLevel}`;
        riskSummary.appendChild(li);
      }

      if (piiList) {
        piiList.innerHTML = "";
        if (analysis.findings.pii.length === 0) {
          const li = document.createElement("li");
          li.textContent = "No obvious PII detected.";
          piiList.appendChild(li);
        } else {
          analysis.findings.pii.forEach(f => {
            const li = document.createElement("li");
            li.textContent = f;
            piiList.appendChild(li);
          });
        }
      }

      if (hallucinationList) {
        hallucinationList.innerHTML = "";
        analysis.findings.hallucination.forEach(f => {
          const li = document.createElement("li");
          li.textContent = f;
          hallucinationList.appendChild(li);
        });
        analysis.findings.currency.forEach(f => {
          const li = document.createElement("li");
          li.textContent = f;
          hallucinationList.appendChild(li);
        });
      }

      if (tipsList) {
        tipsList.innerHTML = "";
        analysis.tips.forEach(t => {
          const li = document.createElement("li");
          li.textContent = t;
          tipsList.appendChild(li);
        });
      }

      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

    } catch (e) {
      outputEl.textContent = `Error: ${e.message}`;
    }
  });
}