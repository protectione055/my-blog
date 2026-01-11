#!/usr/bin/env python3
"""Copy legacy WordPress/self-hosted images into page bundles and rewrite links."""
from __future__ import annotations

import re
import shutil
import subprocess
from itertools import count
from pathlib import Path
from typing import Dict
from urllib.parse import urlparse, unquote

REPO_ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = REPO_ROOT / "content"
UPLOADS_ROOT = Path("/www/wwwroot/ironmanzzm.top/wp-content/uploads")
IMG_PATTERN = re.compile(
    r"(https?://(?:www\.ironmanzzm\.top/wp-content/uploads|img\.ironmanzzm\.top/blog-img)/[^\s\"'<>]+)"
)


def _download_http(url: str, dest: Path, insecure: bool = False) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["curl", "-fsSL", url, "-o", str(dest)]
    if insecure:
        cmd.insert(2, "-k")
    result = subprocess.run(cmd, check=False, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"curl exited with {result.returncode}")


def copy_asset(url: str, dest: Path) -> None:
    parsed = urlparse(url)
    prefix = "/wp-content/uploads/"
    if not parsed.path.startswith(prefix):
        raise ValueError(f"Unsupported URL path: {url}")
    relative = unquote(parsed.path[len(prefix) :])
    source = UPLOADS_ROOT / relative
    if not source.exists():
        raise FileNotFoundError(f"Missing source asset: {source}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, dest)


def infer_extension(url: str) -> str:
    parsed = urlparse(url)
    suffix = Path(parsed.path).suffix
    if not suffix or len(suffix) > 5:
        return ".png"
    return suffix


def process_file(md_file: Path) -> bool:
    text = md_file.read_text(encoding="utf-8")
    matches = IMG_PATTERN.findall(text)
    if not matches:
        return False

    replacements: Dict[str, str] = {}
    counter = count(1)
    images_dir = md_file.parent / "images"

    for url in matches:
        if url in replacements:
            continue
        ext = infer_extension(url)
        idx = next(counter)
        dest_name = f"image-{idx:02d}{ext}"
        dest_path = images_dir / dest_name
        while dest_path.exists():
            idx = next(counter)
            dest_name = f"image-{idx:02d}{ext}"
            dest_path = images_dir / dest_name
        parsed = urlparse(url)
        if parsed.netloc.startswith("www.") and parsed.path.startswith("/wp-content/uploads/"):
            copy_asset(url, dest_path)
            action = "Copied"
        elif parsed.netloc.startswith("img.") and parsed.path.startswith("/blog-img/"):
            download_url = url
            if parsed.scheme == "https":
                download_url = url.replace("https://", "http://", 1)
            _download_http(download_url, dest_path, insecure=True)
            action = "Downloaded"
        else:
            raise ValueError(f"Unhandled asset host: {url}")
        replacements[url] = f"images/{dest_name}"
        print(f"{action} {url} -> {dest_path.relative_to(REPO_ROOT)}")

    for url, rel in replacements.items():
        text = text.replace(url, rel)

    md_file.write_text(text, encoding="utf-8")
    return True


def main() -> None:
    if not UPLOADS_ROOT.exists():
        raise SystemExit(f"Uploads directory not found: {UPLOADS_ROOT}")
    processed_files = 0
    for md_file in CONTENT_DIR.rglob("index.md"):
        try:
            if process_file(md_file):
                processed_files += 1
        except Exception as exc:  # pylint: disable=broad-except
            print(f"Failed to process {md_file}: {exc}")
    print(f"Updated {processed_files} content files")


if __name__ == "__main__":
    main()
