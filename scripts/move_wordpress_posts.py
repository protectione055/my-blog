#!/usr/bin/env python3
"""Move imported WordPress posts into the zh/posts section."""
from __future__ import annotations

from pathlib import Path
import shutil

REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = REPO_ROOT / "content" / "WordPress"
TARGET_DIR = REPO_ROOT / "content" / "zh" / "posts"


def update_slug(index_file: Path, new_slug: str) -> None:
    """Ensure the slug front-matter matches the directory name."""
    text = index_file.read_text(encoding="utf-8")
    slug_line = f'slug: "{new_slug}"'

    if not text.lstrip().startswith("---"):
        index_file.write_text(text, encoding="utf-8")
        return

    parts = text.split("---", 2)
    if len(parts) != 3:
        index_file.write_text(text, encoding="utf-8")
        return

    front_matter, body = parts[1], parts[2]
    front_stripped = front_matter.strip("\n")
    lines = front_stripped.split("\n") if front_stripped else []

    for idx, line in enumerate(lines):
        if line.strip().startswith("slug:"):
            lines[idx] = slug_line
            break
    else:
        lines.append(slug_line)

    new_front = "\n" + "\n".join(lines) + "\n"
    index_file.write_text(f"---{new_front}---{body}", encoding="utf-8")


def main() -> None:
    if not SOURCE_DIR.exists():
        raise SystemExit("content/WordPress not found")

    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    moves: list[tuple[Path, Path]] = []
    for src in sorted(p for p in SOURCE_DIR.iterdir() if p.is_dir()):
        dest = TARGET_DIR / src.name
        suffix = 2
        while dest.exists():
            dest = TARGET_DIR / f"{src.name}-{suffix}"
            suffix += 1

        shutil.move(str(src), str(dest))
        index_file = dest / "index.md"
        if index_file.exists():
            update_slug(index_file, dest.name)
        moves.append((src, dest))

    for old, new in moves:
        print(f"Moved {old.relative_to(REPO_ROOT)} -> {new.relative_to(REPO_ROOT)}")

    print(f"Moved {len(moves)} directories into {TARGET_DIR.relative_to(REPO_ROOT)}")

    try:
        SOURCE_DIR.rmdir()
        print("Removed empty content/WordPress directory")
    except OSError:
        pass


if __name__ == "__main__":
    main()
