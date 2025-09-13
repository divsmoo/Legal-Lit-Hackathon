import re
from collections import defaultdict

def analyze_text(text):
    issues = []
    score = 0
    stats = defaultdict(int)

    def add_issue(category, message, severity):
        nonlocal score
        issues.append({"category": category, "message": message, "severity": severity})
        stats[category] += 1
        # Severity weighting: Critical=3, Major=2, Minor=1
        score += {"Critical": 3, "Major": 2, "Minor": 1}[severity]

    # 1. Contract clause references
    if not re.search(r"(clause|section|pursuant)", text, re.I):
        add_issue("Termination", "No reference to a clause or section — termination notice may be invalid.", "Major")

    # 2. Immediate termination without notice period
    if "immediate" in text.lower() and not re.search(r"\d+\s*(day|week|month)", text, re.I):
        add_issue("Termination", "Immediate termination without notice period may breach contract.", "Critical")

    # 3. Payment demand deadlines
    if re.search(r"(pay|repay|settle|outstanding)", text, re.I) and not re.search(r"\d+\s*(day|week|month)", text, re.I):
        add_issue("Payment Demand", "No clear payment deadline (e.g. 'within 14 days') specified.", "Major")

    # 4. Aggressive/Defamatory language
    defamation_terms = ["dishonest", "fraud", "bad faith", "cheat", "scam"]
    if any(term in text.lower() for term in defamation_terms):
        add_issue("Defamation Risk", "Potentially defamatory language detected — consider rephrasing.", "Critical")

    # 5. Privacy: Email
    for email in re.findall(r"\b\S+@\S+\.\S+\b", text):
        add_issue("Privacy", f"Email detected ({email}) — redact or anonymize if needed.", "Major")

    # 6. Privacy: NRIC
    for nric in re.findall(r"\bS\d{7}[A-Z]\b", text):
        add_issue("Privacy", f"NRIC detected ({nric}) — possible PDPA breach.", "Critical")

    # 7. Privacy: Phone
    for phone in re.findall(r"\+?\d{8,}", text):
        add_issue("Privacy", f"Phone number detected ({phone}) — consider redaction.", "Minor")

    # 8. Overbroad confidentiality clauses
    if re.search(r"(forever|under any circumstances|at all times)", text, re.I):
        add_issue("Contract Scope", "Overbroad confidentiality language detected — may be unenforceable.", "Major")

    # 9. No disclaimer
    if "legal advice" not in text.lower():
        add_issue("Disclaimer", "No disclaimer found — could be construed as legal advice.", "Minor")

    # 10. Vague obligations
    vague_terms = ["appropriate arrangements", "reasonable time", "as soon as possible"]
    if any(term in text.lower() for term in vague_terms):
        add_issue("Clarity", "Vague obligation language detected — may create disputes.", "Major")

    # Determine grade
    if score <= 3:
        grade = "🟢 Low Risk"
    elif score <= 7:
        grade = "🟠 Medium Risk"
    else:
        grade = "🔴 High Risk"

    report = {
        "grade": grade,
        "total_score": score,
        "issue_count": len(issues),
        "stats": dict(stats),
        "issues": issues
    }

    return report


# Example Test Case


report = analyze_text(text)

print(f"RISK GRADE: {report['grade']} (Score: {report['total_score']})")
print("CATEGORY STATS:", report["stats"])
print("\nDETAILED ISSUES:")
for i, issue in enumerate(report["issues"], 1):
    print(f"{i}. [{issue['severity']}] {issue['category']}: {issue['message']}")

