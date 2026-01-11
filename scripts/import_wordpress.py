#!/usr/bin/env python3
"""Convert a WordPress WXR export into Hugo content."""

from __future__ import annotations

import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {
    "content": "http://purl.org/rss/1.0/modules/content/",
    "dc": "http://purl.org/dc/elements/1.1/",
    "wp": "http://wordpress.org/export/1.2/",
    "excerpt": "http://wordpress.org/export/1.2/excerpt/",
}


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9\-\s]", "", text)
    text = re.sub(r"\s+", "-", text)
    return text or "untitled"


def main(xml_path: Path, dest_root: Path) -> None:
    if not xml_path.exists():
        raise SystemExit(f"Export file not found: {xml_path}")

    dest_root.mkdir(parents=True, exist_ok=True)
    tree = ET.parse(xml_path)
    channel = tree.getroot().find("channel")
    if channel is None:
        raise SystemExit("Invalid WordPress export: missing channel element")

    count = 0
    for item in channel.findall("item"):
        post_type = item.find("wp:post_type", NS)
        if post_type is None or (post_type.text or "") != "post":
            continue

        status_el = item.find("wp:status", NS)
        status = (status_el.text if status_el is not None else "draft") or "draft"

        title = (item.findtext("title") or "").strip() or "Untitled"
        slug = (item.findtext("wp:post_name", default="", namespaces=NS) or "").strip()
        if not slug:
            slug = slugify(title)

        test_slug = slug
        suffix = 1
        while (dest_root / test_slug).exists():
            suffix += 1
            test_slug = f"{slug}-{suffix}"
        slug = test_slug

        date = (item.findtext("wp:post_date", default="", namespaces=NS) or "").strip()
        content_html = (item.findtext("content:encoded", default="", namespaces=NS) or "").strip()
        excerpt = (item.findtext("excerpt:encoded", default="", namespaces=NS) or "").strip()

        categories: list[str] = []
        tags: list[str] = []
        for cat in item.findall("category"):
            domain = cat.get("domain")
            value = (cat.text or "").strip()
            if not value:
                continue
            if domain == "category":
                categories.append(value)
            elif domain == "post_tag":
                tags.append(value)

        fm: list[str] = ["---", f"title: {json.dumps(title)}"]
        if date:
            fm.append(f"date: {date}")
        fm.append(f"slug: {slug}")
        if categories:
            fm.append("categories:")
            fm.extend(f"  - {c}" for c in categories)
        if tags:
            fm.append("tags:")
            fm.extend(f"  - {t}" for t in tags)
        if excerpt:
            fm.append("description: >-")
            for line in excerpt.replace("\r\n", "\n").splitlines():
                fm.append(f"  {line}")
        fm.append(f"draft: {'false' if status == 'publish' else 'true'}")
        fm.append("---")

        output_dir = dest_root / slug
        output_dir.mkdir(parents=True, exist_ok=True)
        output_file = output_dir / "index.md"
        with output_file.open("w", encoding="utf-8") as fh:
            fh.write("\n".join(fm))
            fh.write("\n\n")
            fh.write(html.unescape(content_html))
            fh.write("\n")

        count += 1

    print(f"Imported {count} posts into {dest_root}/")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: import_wordpress.py <export.xml> <dest_dir>")
    main(Path(sys.argv[1]), Path(sys.argv[2]))
