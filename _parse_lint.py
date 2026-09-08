import json
from collections import Counter

d = json.load(open("_eslint.json", encoding="utf-8"))
skip = ("node_modules", ".expo", "dist", "worker")
msgs = []
for f in d:
    fp = f.get("filePath", "").replace("/", "\\")
    if any(s in fp for s in skip):
        continue
    for m in f.get("messages", []):
        msgs.append({
            "file": fp,
            "line": m.get("line"),
            "col": m.get("column"),
            "sev": m.get("severity"),
            "rule": m.get("ruleId"),
            "msg": (m.get("message") or "").split("\n")[0][:140],
        })

print("messages", len(msgs), "files", len({m["file"] for m in msgs}))
print("errors", sum(1 for m in msgs if m["sev"]==2), "warnings", sum(1 for m in msgs if m["sev"]==1))
print("\nRULES")
for (rule, sev), c in Counter((m["rule"], m["sev"]) for m in msgs).most_common():
    print(f"  {sev} {c:4}  {rule}")
print("\nALL")
for m in sorted(msgs, key=lambda x: (x["file"], x["line"] or 0)):
    kind = "error" if m["sev"]==2 else "warn"
    rel = m["file"].split("Gida\\Gida\\")[-1]
    print(f"{rel}:{m['line']}:{m['col']}  {kind}  [{m['rule']}] {m['msg']}")
