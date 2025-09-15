// assets/main.js

// Load dataset
async function loadDataset() {
  try {
    const resp = await fetch("data/index.json");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (err) {
    console.error("Failed to load dataset:", err);
    return [];
  }
}

// ---------- Build Filters ----------

// Country filter
function buildCountryOptions(records, selectEl) {
  const countries = new Map();

  records.forEach(r => {
    const country = (r.country || "").trim();
    const cc = (r.cc || "").trim();
    if (!country) return;

    const label = cc ? `${country} (${cc})` : country;
    countries.set(country.toLowerCase(), label);
  });

  selectEl.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "All countries";
  selectEl.appendChild(allOpt);

  [...countries.values()]
    .sort((a, b) => a.localeCompare(b))
    .forEach(label => {
      const opt = document.createElement("option");
      opt.value = label.replace(/\s*\([A-Z]{2}\)$/, ""); // store pure name
      opt.textContent = label;
      selectEl.appendChild(opt);
    });
}

// Accreditation Body filter
function buildAccBodyOptions(records, selectEl) {
  const bodies = new Set();
  records.forEach(r => {
    if (r.accreditation_body) bodies.add(r.accreditation_body.trim());
  });

  selectEl.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "All bodies";
  selectEl.appendChild(allOpt);

  [...bodies].sort().forEach(body => {
    const opt = document.createElement("option");
    opt.value = body;
    opt.textContent = body;
    selectEl.appendChild(opt);
  });
}

// Status filter
function buildStatusOptions(records, selectEl) {
  const statuses = new Set();
  records.forEach(r => {
    if (r.status) statuses.add(r.status.trim());
  });

  selectEl.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "All statuses";
  selectEl.appendChild(allOpt);

  [...statuses].sort().forEach(status => {
    const opt = document.createElement("option");
    opt.value = status;
    opt.textContent = status;
    selectEl.appendChild(opt);
  });
}

// Scope filter
function buildScopeOptions(records, selectEl) {
  const scopes = new Set();
  records.forEach(r => {
    if (r.scope) scopes.add(r.scope.trim());
  });

  selectEl.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "All scopes";
  selectEl.appendChild(allOpt);

  [...scopes].sort().forEach(scope => {
    const opt = document.createElement("option");
    opt.value = scope;
    opt.textContent = scope;
    selectEl.appendChild(opt);
  });
}

// ---------- Render List ----------
function renderList(records, container) {
  container.innerHTML = "";

  if (!records.length) {
    container.textContent = "No records found.";
    return;
  }

  records.forEach(r => {
    const div = document.createElement("div");
    div.className = "hcb-card";
    div.innerHTML = `
      <h3>${r.name || "Unknown"}</h3>
      <p><strong>Country:</strong> ${r.country || ""}</p>
      <p><strong>Accreditation Body:</strong> ${r.accreditation_body || ""}</p>
      <p><strong>Status:</strong> ${r.status || ""}</p>
      <p><strong>Scope:</strong> ${r.scope || ""}</p>
    `;
    container.appendChild(div);
  });
}

// ---------- Filtering ----------
function applyFilters(data) {
  const country = document.querySelector("#filter-country")?.value || "";
  const body = document.querySelector("#filter-body")?.value || "";
  const status = document.querySelector("#filter-status")?.value || "";
  const scope = document.querySelector("#filter-scope")?.value || "";

  return data.filter(r => {
    if (country && r.country && !r.country.toLowerCase().includes(country.toLowerCase())) {
      return false;
    }
    if (body && r.accreditation_body !== body) return false;
    if (status && r.status !== status) return false;
    if (scope && r.scope !== scope) return false;
    return true;
  });
}

// ---------- Init ----------
(async function init() {
  const data = await loadDataset();
  if (!data.length) return;

  const countrySel = document.querySelector("#filter-country");
  const bodySel = document.querySelector("#filter-body");
  const statusSel = document.querySelector("#filter-status");
  const scopeSel = document.querySelector("#filter-scope");
  const container = document.querySelector("#results");

  if (countrySel) buildCountryOptions(data, countrySel);
  if (bodySel) buildAccBodyOptions(data, bodySel);
  if (statusSel) buildStatusOptions(data, statusSel);
  if (scopeSel) buildScopeOptions(data, scopeSel);

  function update() {
    const filtered = applyFilters(data);
    renderList(filtered, container);
  }

  [countrySel, bodySel, statusSel, scopeSel].forEach(sel => {
    if (sel) sel.addEventListener("change", update);
  });

  update();
})();
