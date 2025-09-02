from rapidfuzz import process, fuzz
from scripts.common import write_json, normalize_record
from scripts.adapter_html_table import parse_html_table
from scripts.adapter_pdf_list import parse_pdf_directory

DATA_PATH = "data/index.json"

COUNTRY_CC = {
    "united arab emirates":"AE","uae":"AE","malaysia":"MY","saudi arabia":"SA","singapore":"SG",
    "thailand":"TH","indonesia":"ID","kazakhstan":"KZ","netherlands":"NL","morocco":"MA",
    "turkiye":"TR","turkey":"TR","united states":"US","usa":"US","united kingdom":"GB","uk":"GB",
}

def dedup(records):
    out = []
    for r in records:
        if not r.get("name"):
            continue
        pool = [x["name"] for x in out if (x.get("country")==r.get("country")) or not r.get("country")]
        if pool:
            match, score, idx = process.extractOne(r["name"], pool, scorer=fuzz.token_set_ratio)
            if score >= 93:
                out[idx]["accs"]   = sorted(list(set(out[idx]["accs"]   + r.get("accs", []))))
                out[idx]["scopes"] = sorted(list(set(out[idx]["scopes"] + r.get("scopes", []))))
                if not out[idx].get("site") and r.get("site"):
                    out[idx]["site"] = r["site"]
                continue
        out.append(r)
    return out

def source_gac():
    url = "https://gac.org.sa/accredited-bodies/"
    return parse_html_table(url, acc_tag="GAC", selector=None, country_cc_map=COUNTRY_CC)

def source_eiac():
    url = "https://eiac.gov.ae/directory"
    return parse_html_table(url, acc_tag="EIAC", selector=None, country_cc_map=COUNTRY_CC)

def source_muis():
    url = "https://www.muis.gov.sg/halal/fhcb/"
    return parse_html_table(url, acc_tag="MUIS", selector=None, country_cc_map=COUNTRY_CC)

def source_hak():
    url = "https://english.hak.gov.tr/accredited-hcabs"
    return parse_html_table(url, acc_tag="HAK", selector=None, country_cc_map=COUNTRY_CC)

def source_sfda_pdf():
    url = "https://sfda.gov.sa/sites/default/files/2020-08/sfda-halal.pdf"
    return parse_pdf_directory(url, acc_tag="SFDA")

def build():
    all_rows = []
    for fn in (source_gac, source_eiac, source_muis, source_hak, source_sfda_pdf):
        try:
            all_rows.extend(fn())
        except Exception as e:
            print("WARN:", fn.__name__, "failed:", e)

    all_rows = [normalize_record(r) for r in all_rows if r.get("name")]
    all_rows = dedup(all_rows)

    for r in all_rows:
        if not r.get("cc") and r.get("country"):
            r["cc"] = COUNTRY_CC.get(r["country"].strip().lower())

    all_rows.sort(key=lambda x: (x.get("country") or "", x["name"]))
    write_json(DATA_PATH, all_rows)
    print(f"Wrote {len(all_rows)} rows to {DATA_PATH}")

if __name__ == "__main__":
    build()
