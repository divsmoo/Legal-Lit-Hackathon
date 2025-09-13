import re
from collections import defaultdict

def analyze_text(text):
    issues = []
    score = 0
    stats = defaultdict(int)
    unsafe_sentences = set()

    def add_issue(category, message, severity, sentence, issue_type):
        nonlocal score
        issues.append({
            "category": category,
            "message": message,
            "severity": severity,
            "type": issue_type,
            "source": sentence.strip()
        })
        stats[category] += 1
        score += {"Critical": 3, "Major": 2, "Minor": 1}[severity]
        unsafe_sentences.add(sentence.strip())

    # Split input into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())

    for sentence in sentences:
        s = sentence.lower()

        # 1. Contract clause references
        if "terminate" in s or "termination" in s:
            if not re.search(r"(clause|section|pursuant)", s, re.I):
                add_issue("Termination", "No reference to a clause or section — termination notice may be invalid.", "Major", sentence, "Contract Risk")

        # 2. Immediate termination without notice period
        if "immediate" in s and not re.search(r"\d+\s*(day|week|month)", s):
            add_issue("Termination", "Immediate termination without notice period may breach contract.", "Critical", sentence, "Contractual Breach Risk")

        # 3. Payment demand deadlines
        if re.search(r"(pay|repay|settle|outstanding)", s) and not re.search(r"\d+\s*(day|week|month)", s):
            add_issue("Payment Demand", "No clear payment deadline (e.g. 'within 14 days') specified.", "Major", sentence, "Contract Risk")

        # 4. Aggressive/Defamatory language
        defamation_terms = ["dishonest", "fraud", "bad faith", "cheat", "scam"]
        if any(term in s for term in defamation_terms):
            add_issue("Defamation Risk", "Potentially defamatory language detected — consider rephrasing.", "Critical", sentence, "Legal Breach Risk")

        # 5. Privacy: Email
        if re.search(r"\b\S+@\S+\.\S+\b", sentence):
            add_issue("Privacy", "Email detected — redact or anonymize if needed.", "Major", sentence, "Privacy Breach")

        # 6. Privacy: NRIC
        if re.search(r"\b[STFG]\d{7}[A-Z]\b", sentence):
            add_issue("Privacy", "NRIC detected — possible PDPA breach.", "Critical", sentence, "Privacy Breach")

        # 7. Privacy: Phone
        if re.search(r"\+?\d{8,}", sentence):
            add_issue("Privacy", "Phone number detected — consider redaction.", "Minor", sentence, "Privacy Risk")

        # 8. Overbroad confidentiality clauses
        if re.search(r"(forever|under any circumstances|at all times)", s):
            add_issue("Contract Scope", "Overbroad confidentiality language detected — may be unenforceable.", "Major", sentence, "Contract Risk")

        # 9. No disclaimer
        if "legal advice" not in s and ("disclaimer" in s or "advice" in s):
            add_issue("Disclaimer", "No disclaimer found — could be construed as legal advice.", "Minor", sentence, "Risk of Misinterpretation")

        # 10. Vague obligations
        vague_terms = ["appropriate arrangements", "reasonable time", "as soon as possible"]
        if any(term in s for term in vague_terms):
            add_issue("Clarity", "Vague obligation language detected — may create disputes.", "Major", sentence, "Contract Risk")

    # Risk grade
    if score <= 3:
        grade = "🟢 Low Risk"
    elif score <= 7:
        grade = "🟠 Medium Risk"
    else:
        grade = "🔴 High Risk"

    return {
        "grade": grade,
        "total_score": score,
        "unsafe_lines": list(unsafe_sentences),
        "issues": issues,
        "stats": dict(stats)
    }