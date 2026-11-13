#!/usr/bin/env python3
"""Shrinks images already stored in Supabase Storage to cut egress.

Overwrites each object IN PLACE (same path), so URLs saved in database rows keep working.
Originals are saved to a local backup folder first. Defaults to a dry run.

  export SUPABASE_URL=https://<project>.supabase.co
  export SUPABASE_SERVICE_ROLE_KEY=...        # never commit or ship this key
  python3 -I scripts/ops/compress-storage-images.py                 # dry run: prints savings
  python3 -I scripts/ops/compress-storage-images.py --apply         # backs up, then overwrites
  python3 -I scripts/ops/compress-storage-images.py --apply --bucket avatars

Needs Pillow (pip install Pillow). Safe to re-run: files that are already small are skipped.
"""
import argparse, io, json, os, sys, urllib.error, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image, ImageOps

BUCKETS = {'listing-images': 1600, 'place-photos': 1600, 'avatars': 512}
MIN_SAVING = 0.20            # only overwrite when the new file is at least 20% smaller
SKIP_BELOW_BYTES = 150_000   # already small enough
CACHE_CONTROL = 'max-age=31536000'
EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp')

def request(method, url, key, data=None, headers=None):
    req = urllib.request.Request(url, data=data, method=method, headers={'Authorization': f'Bearer {key}', 'apikey': key, **(headers or {})})
    with urllib.request.urlopen(req, timeout=120) as res:
        return res.read()

def list_objects(base, key, bucket, prefix=''):
    """Yields every object path under prefix (recursing into folders)."""
    offset = 0
    while True:
        body = json.dumps({'prefix': prefix, 'limit': 100, 'offset': offset, 'sortBy': {'column': 'name', 'order': 'asc'}}).encode()
        items = json.loads(request('POST', f'{base}/storage/v1/object/list/{bucket}', key, body, {'Content-Type': 'application/json'}))
        for item in items:
            path = f'{prefix}{item["name"]}'
            if item.get('id') is None:
                yield from list_objects(base, key, bucket, path + '/')
            else:
                yield path, item.get('metadata', {}).get('size', 0)
        if len(items) < 100:
            return
        offset += 100

def shrink(raw, max_edge):
    """Returns (bytes, content_type) of a resized JPEG/PNG/WebP, or None if not worth it."""
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw)))
    fmt = (Image.open(io.BytesIO(raw)).format or 'JPEG').upper()
    w, h = im.size
    if max(w, h) > max_edge:
        r = max_edge / max(w, h)
        im = im.resize((round(w * r), round(h * r)), Image.LANCZOS)
    out = io.BytesIO()
    if fmt == 'PNG' and im.mode in ('RGBA', 'LA', 'P'):
        im.save(out, 'PNG', optimize=True); ctype = 'image/png'
    elif fmt == 'WEBP':
        im.save(out, 'WEBP', quality=75, method=6); ctype = 'image/webp'
    else:
        im.convert('RGB').save(out, 'JPEG', quality=75, optimize=True, progressive=True); ctype = 'image/jpeg'
    data = out.getvalue()
    return (data, ctype) if len(data) <= len(raw) * (1 - MIN_SAVING) else None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true', help='back up and overwrite (default is dry run)')
    ap.add_argument('--bucket', choices=BUCKETS, help='only this bucket')
    ap.add_argument('--backup-dir', default='storage-backup', help='where originals are saved before overwriting')
    args = ap.parse_args()
    base, key = os.environ.get('SUPABASE_URL', '').rstrip('/'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not base or not key:
        sys.exit('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.')
    before = after = changed = scanned = failed = 0
    for bucket, max_edge in BUCKETS.items():
        if args.bucket and bucket != args.bucket: continue
        for path, size in list_objects(base, key, bucket):
            if not path.lower().endswith(EXTENSIONS): continue
            scanned += 1
            if size and size < SKIP_BELOW_BYTES: continue
            url = f'{base}/storage/v1/object/{bucket}/{urllib.parse.quote(path)}'
            try:
                raw = request('GET', url, key)
                result = shrink(raw, max_edge)
                if not result: continue
                data, ctype = result
                before += len(raw); after += len(data); changed += 1
                print(f'{"WRITE" if args.apply else "would shrink"} {bucket}/{path}: {len(raw)//1024} KB -> {len(data)//1024} KB')
                if args.apply:
                    backup = Path(args.backup_dir) / bucket / path
                    backup.parent.mkdir(parents=True, exist_ok=True)
                    backup.write_bytes(raw)
                    request('PUT', url, key, data, {'Content-Type': ctype, 'x-upsert': 'true', 'cache-control': CACHE_CONTROL})
            except (urllib.error.URLError, OSError, ValueError) as error:
                failed += 1
                print(f'FAILED {bucket}/{path}: {error}', file=sys.stderr)
    print(f'\nscanned {scanned} images, {"shrunk" if args.apply else "would shrink"} {changed}, failed {failed}')
    print(f'{before/1e6:.1f} MB -> {after/1e6:.1f} MB (saves {(before-after)/1e6:.1f} MB)')
    if not args.apply: print('Dry run only. Re-run with --apply to write.')

if __name__ == '__main__':
    main()
