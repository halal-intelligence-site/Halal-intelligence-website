from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from scripts.common import get_html, normalize_record

def txt(el) -> str:
    return el.get_text(" ", strip=True) if el else ""

def parse_html_table(url: str, acc_tag: str, selector: Optional[str] = None, country_cc_map=None) -> List[Dict]:
    html = get_html(url)
    soup = BeautifulSoup(html, "lxml")

    table = soup.select_one(selector) if selector else (soup.select_one("table") or soup.find("table"))
    if not table:
        return []

    headers = [txt(th).lower() for th in (table.select("thead th") or table.select("tr th"))]
    rows: List[Dict] = []

    for tr in (table.select("tbody tr") or table.select("tr")):
        tds = tr.find_all("td")
        if not tds:
            continue
        cells = [txt(td) for td in tds]
        if not headers:
            headers = [f"col{i}" for i in range(len(cells))]
        row = dict(zip(headers[:len(cells)], cells))

        name = row.get("name") or row.get("certification body") or row.get("cb") or cells[0]
        country = row.get("country") or row.get("location") or ""
        site = row.get("website") or ""
        status = row.get("status") or "Accredited"

        scopes = []
        for k in ("scope", "scopes", "category", "scheme"):
            if row.get(k):
                scopes = [s.strip() for s in row[k].replace(";", ",").split(",") if s.strip()]
                break

        cc = None
        if country_cc_map and country:
            cc = country_cc_map.get(country.strip().lower())

        rows.append(normalize_record({
            "id": f"{acc_tag}-{name}".lower().replace(" ", "-")[:64],
            "name": name,
            "country": country,
            "cc": cc,
            "scopes": scopes,
            "accs": [acc_tag],
            "status": status,
            "site": site,
            "evidence": url
        }))
    return rows
