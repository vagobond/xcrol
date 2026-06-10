#!/usr/bin/env python3
"""Verify a Xcrol backup snapshot is restorable.

Usage: verify_restore.py <snapshot_dir>

Steps:
  1. Open <snapshot_dir>/manifest.json.gz; assert no errors.
  2. For every db/*.ndjson.gz file: parse each line as JSON and count rows.
  3. Assert row counts match the manifest's `tables.<name>.rows` field.
  4. Spot-check auth/users.ndjson.gz and storage/catalog.json.gz parse cleanly.

This script does NOT load rows into Postgres — schema-aware load is brittle
and the runbook covers that path. The goal here is to catch the common
failure modes: truncated uploads, gzip corruption, drifted manifests.
"""
from __future__ import annotations

import gzip
import json
import sys
from pathlib import Path


def fail(msg: str) -> None:
    print(f"::error::{msg}")
    sys.exit(1)


def load_gz_json(path: Path):
    with gzip.open(path, "rt", encoding="utf-8") as f:
        return json.load(f)


def count_ndjson_gz(path: Path) -> int:
    n = 0
    with gzip.open(path, "rt", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            json.loads(line)  # raises on corruption
            n += 1
    return n


def main(snapshot_dir: str) -> None:
    root = Path(snapshot_dir)
    manifest_path = root / "manifest.json.gz"
    if not manifest_path.exists():
        fail(f"manifest not found at {manifest_path}")

    manifest = load_gz_json(manifest_path)
    print(f"Manifest generated_at: {manifest.get('generated_at')}")
    print(f"Manifest prefix:       {manifest.get('prefix')}")

    errors = manifest.get("errors") or []
    if errors:
        fail(f"manifest reports {len(errors)} backup errors: {errors[:5]}")

    tables = manifest.get("tables") or {}
    if not tables:
        fail("manifest has no tables — likely empty backup")

    mismatches: list[str] = []
    checked = 0

    for table_name, info in tables.items():
        expected = info.get("rows", 0)
        # auth.users lives under auth/, everything else under db/
        if table_name == "auth.users":
            path = root / "auth" / "users.ndjson.gz"
        else:
            path = root / "db" / f"{table_name}.ndjson.gz"

        if not path.exists():
            mismatches.append(f"{table_name}: file missing ({path.name})")
            continue

        try:
            actual = count_ndjson_gz(path)
        except (OSError, json.JSONDecodeError) as e:
            mismatches.append(f"{table_name}: corrupt — {e}")
            continue

        if actual != expected:
            mismatches.append(f"{table_name}: expected {expected} rows, got {actual}")
        checked += 1

    # Storage catalog sanity check
    catalog_path = root / "storage" / "catalog.json.gz"
    if catalog_path.exists():
        try:
            catalog = load_gz_json(catalog_path)
            buckets = list(catalog.keys())
            total = sum(len(v) for v in catalog.values())
            print(f"Storage catalog: {len(buckets)} buckets, {total} objects")
        except Exception as e:
            mismatches.append(f"storage catalog: {e}")
    else:
        print("Storage catalog missing (non-fatal)")

    if mismatches:
        for m in mismatches:
            print(f"::error::{m}")
        fail(f"{len(mismatches)} verification failure(s) across {checked} tables")

    print(f"OK — verified {checked} tables, all row counts match manifest")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: verify_restore.py <snapshot_dir>", file=sys.stderr)
        sys.exit(2)
    main(sys.argv[1])
