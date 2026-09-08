import json

d = json.load(open("_eslint.json", encoding="utf-8"))
for f in d:
    p = f["filePath"]
    if "public\\" in p or "/public/" in p:
        continue
    for m in f.get("messages", []):
        if m.get("ruleId") in ("react-hooks/refs", "react-hooks/set-state-in-effect"):
            continue
        rel = p.replace(r"C:\Users\eluzi\Documents\Zidexi\Gida\Gida\\", "").replace(
            r"C:\Users\eluzi\Documents\Zidexi\Gida\Gida/", ""
        )
        msg = (m.get("message") or "")[:90].replace("\n", " ")
        print(f"{rel}:{m.get('line')}:{m.get('ruleId')}:{msg}")
