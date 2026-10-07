#!/usr/bin/env python3
"""Build the birthday site into dist/.

Reads content/people.csv, matches files named <id>_<n>.<ext> or <id>_msg.txt,
and writes dist/ (site files + content + manifest.json). Standard library only.

Usage:  python3 build.py
"""
import csv
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content"
SITE = ROOT / "site"
DIST = ROOT / "dist"

# Groups play in this order; family last.
RELATIONS = ["friend", "close-friend", "school-friend", "college-friend", "relative", "in-laws", "family"]
CLOSING_ID = "kunal"  # kunal_msg.txt / kunal_1.jpg -> closing note

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VIDEO_EXT = {".mp4", ".mov", ".webm", ".m4v"}
TEXT_EXT = {".txt"}

FILE_RE = re.compile(r"^([a-z0-9-]+)_(\d+|msg)(\.[a-z0-9]+)$", re.IGNORECASE)

MAX_FILE_MB = 25  # Cloudflare Pages per-file limit
WARN_IMAGE_MB = 2

warnings = []


def warn(msg):
    warnings.append(msg)


def read_people():
    path = CONTENT / "people.csv"
    if not path.exists():
        sys.exit(f"Missing {path}")
    people = []
    with path.open(encoding="utf-8-sig", newline="") as f:
        for i, row in enumerate(csv.DictReader(f)):
            row = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
            pid = row.get("id", "").lower()
            if not pid:
                continue
            relation = row.get("relation", "").lower()
            if relation not in RELATIONS:
                warn(f"people.csv: '{pid}' has unknown relation '{relation}' (use one of {', '.join(RELATIONS)})")
                continue
            order = row.get("order", "")
            people.append({
                "id": pid,
                "name": row.get("name") or pid,
                "relation": relation,
                "order": int(order) if order.isdigit() else None,
                "row": i,
            })
    return people


def scan_files():
    """Return {id: [(sort_key, filename, kind)]}."""
    found = {}
    for p in sorted(CONTENT.iterdir()):
        if p.name == "people.csv" or p.name.startswith(".") or p.is_dir():
            continue
        m = FILE_RE.match(p.name)
        if not m:
            warn(f"Skipped '{p.name}': name should look like <id>_1.jpg or <id>_msg.txt")
            continue
        pid, n, ext = m.group(1).lower(), m.group(2).lower(), m.group(3).lower()
        if ext in IMAGE_EXT:
            kind = "image"
        elif ext in VIDEO_EXT:
            kind = "video"
        elif ext in TEXT_EXT:
            kind = "text"
        else:
            warn(f"Skipped '{p.name}': unsupported file type '{ext}'")
            continue

        size_mb = p.stat().st_size / (1024 * 1024)
        if size_mb > MAX_FILE_MB:
            warn(f"'{p.name}' is {size_mb:.1f} MB; hosts reject files over {MAX_FILE_MB} MB. Compress it (see README).")
        elif kind == "image" and size_mb > WARN_IMAGE_MB:
            warn(f"'{p.name}' is {size_mb:.1f} MB; consider resizing for faster loading.")
        if ext == ".mov":
            warn(f"'{p.name}' is .mov; some Android/Chrome browsers can't play it. Convert to .mp4 if possible.")

        # msg text comes first, then numbered files in order
        sort_key = -1 if n == "msg" else int(n)
        found.setdefault(pid, []).append((sort_key, p.name, kind))
    return found


def build_items(entries):
    items = []
    for _, name, kind in sorted(entries):
        if kind == "text":
            text = (CONTENT / name).read_text(encoding="utf-8-sig").strip()
            if text:
                items.append({"type": "text", "text": text})
        else:
            items.append({"type": kind, "src": f"content/{name}"})
    return items


def main():
    people = read_people()
    files = scan_files()

    known = {p["id"] for p in people} | {CLOSING_ID}
    for pid in files:
        if pid not in known:
            warn(f"Files for '{pid}' found but '{pid}' is not in people.csv; skipped.")

    groups = []
    for relation in RELATIONS:
        members = [p for p in people if p["relation"] == relation]
        # people with an order come first (lowest first), then by csv row
        members.sort(key=lambda p: (p["order"] is None, p["order"] or 0, p["row"]))
        messages = []
        for p in members:
            items = build_items(files.get(p["id"], []))
            if items:
                messages.append({"name": p["name"], "items": items})
        if messages:
            groups.append({"relation": relation, "messages": messages})

    closing = build_items(files.get(CLOSING_ID, []))
    manifest = {"groups": groups, "closing": closing}

    # Write dist/
    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(SITE, DIST)
    (DIST / "content").mkdir()
    used = {it["src"] for g in groups for m in g["messages"] for it in m["items"] if "src" in it}
    used |= {it["src"] for it in closing if "src" in it}
    for src in used:
        shutil.copy2(ROOT / src, DIST / src)
    (DIST / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False), encoding="utf-8")

    total = sum(len(g["messages"]) for g in groups)
    print(f"Built dist/ with {total} messages across {len(groups)} groups"
          f"{' + closing note' if closing else ''}.")
    # empty placeholder files don't count as content
    waiting = [p["name"] for p in people if not build_items(files.get(p["id"], []))]
    if waiting:
        print(f"No content yet for {len(waiting)}: {', '.join(waiting)}")
    for w in warnings:
        print(f"WARNING: {w}")


if __name__ == "__main__":
    main()
