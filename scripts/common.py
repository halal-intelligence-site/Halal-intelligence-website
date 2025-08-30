import os, time, json, hashlib
from datetime import datetime
from typing import Dict, Any, List
import requests

CACHE_DIR = ".cache"
os.makedirs(CACHE_DIR, exist_ok=True)
HEADERS = {"User-Agent": "HalalIntelligenceBot/1.0 (+https://www.halalintelligence.org)"}

def _sig_path(url: str) -> str:
    return os.path.join(CACHE_DIR, hashlib.sha1(url.encode("utf-8")).hexdigest() + ".sig")

def head_signature(url: str, timeout=20) -> str:
    r = requests.head(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
    return (r.headers.get("ETag") or r.headers.get("Last-Modified") or str(int(time.time())))

def changed_since_last(url: str) -> bool:
    sig = head_signature(url)
    p = _sig_path(url)
    old = ""
    if os.path.exists(p):
        old = open(p, "r", encoding="utf-8").read().strip()
    if sig != old:
        open(p, "w", encoding="utf-8").write(sig)
        return True
    return False

def get_html(url: str, timeout=30) -> str:
    r = requests.get(url, headers=HEADERS, timeout=timeout)
    r.raise_for_status()
    return r.text

def get_bytes(url: str, timeout=60) -> bytes:
    r = requests.get(url, headers=HEADERS, timeout=timeout)
    r.raise_for_status()
    return r.content

def normalize_record(x: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": x.get("id"),
        "name": x.get("name"),
        "country": x.get("country"),
        "cc": x.get("cc"),
        "scopes": sorted(list(set(x.get("scopes", [])))),
        "accs": sorted(list(set(x.get("accs", [])))),
        "status": x.get("status", "Accredited"),
        "lastVerified": x.get("lastVerified") or datetime.utcnow().date().isoformat(),
        "site": x.get("site") or "",
        "evidence": x.get("evidence") or ""
    }

def write_json(path: str, data: List[Dict[str, Any]]):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
