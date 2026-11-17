#!/usr/bin/env python3
"""Install the original Rider–Waite–Smith artwork used by the site."""

import argparse
import io
import json
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parent.parent
SOURCES = (
    "https://cdn.tarostarot.com/downloads/tarot-card-images-1909-v1.zip",
    "https://codeload.github.com/TaroSchenker/tarot-card-data/zip/refs/heads/main",
)
MAX_ARCHIVE = 20 * 1024 * 1024
MAX_CARD = 512 * 1024
PROJECT_FILES = (
    "index.html", "style.css", "app.js", "deck.js", "reading.js", "art.js",
    "README.md", "INSTALL-ART.cmd", "scripts/install-art.py", ".github/workflows/pages.yml",
)


def expected_cards():
    manifest = (ROOT / "art.js").read_text(encoding="utf-8")
    paths = json.loads(manifest.removeprefix("const artUrls = ").strip().removesuffix(";"))
    names = set(paths.values())
    if len(paths) != 78 or len(names) != 78:
        raise ValueError("The artwork manifest must have 78 unique entries.")

    expected = {}
    for path in names:
        relative = PurePosixPath(path)
        if relative.parent != PurePosixPath("assets/cards") or relative.suffix != ".webp":
            raise ValueError(f"Invalid artwork path: {path}")
        expected[relative.name] = ROOT.joinpath(*relative.parts)
    return expected


def valid_webp(data):
    return (
        len(data) >= 20
        and data[:4] == b"RIFF"
        and data[8:12] == b"WEBP"
        and data[12:16] in (b"VP8 ", b"VP8L", b"VP8X")
        and int.from_bytes(data[4:8], "little") + 8 == len(data)
    )


def missing_cards(expected):
    return [
        name for name, path in sorted(expected.items())
        if not path.is_file() or not valid_webp(path.read_bytes())
    ]


def read_cards(archive, expected):
    with zipfile.ZipFile(archive) as source:
        selected = {}
        for info in source.infolist():
            name = PurePosixPath(info.filename).name
            if info.is_dir() or name not in expected:
                continue
            if name in selected:
                raise ValueError(f"More than one entry for {name}")
            if not 0 < info.file_size <= MAX_CARD:
                raise ValueError(f"Invalid file size for {name}")
            data = source.read(info)
            if not valid_webp(data):
                raise ValueError(f"Invalid WebP file: {name}")
            selected[name] = data

    absent = sorted(expected.keys() - selected.keys())
    if absent:
        raise ValueError("Missing artwork in ZIP: " + ", ".join(absent))
    return selected


def fetch_cards(expected):
    for url in SOURCES:
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "Arcana-Artwork-Installer/1.0"})
            with urllib.request.urlopen(request, timeout=30) as response:
                data = response.read(MAX_ARCHIVE + 1)
            if len(data) > MAX_ARCHIVE:
                raise ValueError("Artwork archive exceeds the download size limit.")
            return read_cards(io.BytesIO(data), expected)
        except (OSError, ValueError, zipfile.BadZipFile) as error:
            print(f"Could not fetch {url}: {error}", file=sys.stderr)
    raise ValueError("Download the original artwork ZIP in your browser and use --archive PATH.")


def install_cards(cards, expected):
    destination = ROOT / "assets" / "cards"
    destination.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".artwork-", dir=destination.parent) as temp:
        staging = Path(temp)
        for name, data in cards.items():
            (staging / name).write_bytes(data)
        for name, target in expected.items():
            (staging / name).replace(target)


def package_project(expected):
    package = ROOT / "arcana-github-complete.zip"
    with tempfile.TemporaryDirectory(prefix=".package-", dir=ROOT) as temp:
        staged = Path(temp) / package.name
        with zipfile.ZipFile(staged, "w", zipfile.ZIP_DEFLATED) as archive:
            for name in PROJECT_FILES:
                archive.write(ROOT / name, name)
            for path in sorted(expected.values()):
                archive.write(path, path.relative_to(ROOT).as_posix())
        staged.replace(package)
    print(f"Created {package}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--archive", type=Path, help="Install from an already downloaded ZIP.")
    mode.add_argument("--check", action="store_true", help="Verify all local images without downloading.")
    parser.add_argument("--package", action="store_true", help="Create a ZIP containing the site and all 78 images.")
    arguments = parser.parse_args()

    try:
        cards = expected_cards()
        missing = missing_cards(cards)
        if arguments.check:
            if missing:
                raise ValueError(f"{len(missing)} missing or invalid files: " + ", ".join(missing))
        elif arguments.archive:
            install_cards(read_cards(arguments.archive, cards), cards)
        elif missing:
            install_cards(fetch_cards(cards), cards)

        if missing_cards(cards):
            raise ValueError("The local artwork installation is incomplete.")
        if arguments.package:
            package_project(cards)
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        print(f"Artwork setup failed: {error}", file=sys.stderr)
        return 1

    print(f"Verified {len(cards)} WebP files in assets/cards/.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

