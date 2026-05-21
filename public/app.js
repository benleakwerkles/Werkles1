const profiles = [
  {
    id: "nate-morales",
    name: "Nate Morales",
    role: "operator",
    industry: "plumbing",
    city: "Cleveland, OH",
    capitalNeeded: 45000,
    capitalAvailable: 5000,
    years: 12,
    skills: ["field", "license", "estimating", "customers"],
    needs: ["sales", "admin", "books", "capital"],
    goals: ["leave", "start", "partner"],
    verified: ["licenseFront", "licenseBack", "faceCapture", "phone", "identity", "history", "license", "references"],
    summary: "Licensed service plumber with a repeat customer list. Wants a partner who can sell, schedule, and help fund the first trucks."
  },
  {
    id: "dana-cole",
    name: "Dana Cole",
    role: "builder",
    industry: "logistics",
    city: "Akron, OH",
    capitalNeeded: 20000,
    capitalAvailable: 0,
    years: 9,
    skills: ["ops", "hiring", "admin", "field"],
    needs: ["capital", "sales", "books"],
    goals: ["leave", "equity", "partner"],
    verified: ["licenseFront", "licenseBack", "faceCapture", "phone", "identity", "history", "references"],
    summary: "Warehouse floor lead who trains crews, fixes broken processes, and wants an equity path instead of another promotion promise."
  },
  {
    id: "imara-singh",
    name: "Imara Singh",
    role: "builder",
    industry: "hvac",
    city: "Cleveland, OH",
    capitalNeeded: 15000,
    capitalAvailable: 8000,
    years: 7,
    skills: ["sales", "admin", "customers", "estimating"],
    needs: ["license", "field", "capital"],
    goals: ["start", "partner", "equity"],
    verified: ["licenseFront", "licenseBack", "faceCapture", "phone", "identity", "history"],
    summary: "HVAC dispatcher and inside sales closer. Knows the seasonal call flow and wants to pair with a licensed tech."
  },
  {
    id: "victor-price",
    name: "Victor Price",
    role: "operator",
    industry: "electrical",
    city: "Toledo, OH",
    capitalNeeded: 70000,
    capitalAvailable: 15000,
    years: 15,
    skills: ["field", "license", "estimating", "equipment"],
    needs: ["sales", "admin", "capital"],
    goals: ["buy", "scale", "partner"],
    verified: ["licenseFront", "licenseBack", "faceCapture", "phone", "identity", "funds", "history", "license"],
    summary: "Master electrician looking at a retiring owner's book of small commercial accounts. Needs closing capital and back-office help."
  },
  {
    id: "mayra-lopez",
    name: "Mayra Lopez",
    role: "connector",
    industry: "services",
    city: "Detroit, MI",
    capitalNeeded: 10000,
    capitalAvailable: 10000,
    years: 11,
    skills: ["books", "admin", "ops", "hiring"],
    needs: ["field", "sales", "license"],
    goals: ["equity", "partner", "scale"],
    verified: ["licenseFront", "licenseBack", "faceCapture", "phone", "identity", "funds", "history", "references"],
    summary: "Back-office manager for a local services company. Can clean up books, payroll, permits, scheduling, and vendor chaos."
  },
  {
    id: "sean-brooks",
    name: "Sean Brooks",
    role: "backer",
    industry: "contracting",
    city: "Cincinnati, OH",
    capitalNeeded: 0,
    capitalAvailable: 85000,
    years: 6,
    skills: ["capital", "sales", "books", "admin"],
    needs: ["field", "license", "estimating"],
    goals: ["start", "buy", "partner"],
    verified: ["licenseFront", "licenseBack", "faceCapture", "phone", "identity", "funds", "references"],
    summary: "Backer with home-service sales experience. Wants a real operator, not a passive paper deal."
  },
  {
    id: "jules-farrow",
    name: "Jules Farrow",
    role: "spark",
    industry: "services",
    city: "Cleveland, OH",
    capitalNeeded: 25000,
    capitalAvailable: 3000,
    years: 3,
    skills: ["idea", "customers", "sales"],
    needs: ["ops", "field", "books", "capital"],
    goals: ["start", "partner", "equity"],
    verified: ["licenseFront", "licenseBack", "faceCapture", "phone", "identity", "references"],
    summary: "Has a tested lead source for recurring local service work and early customer interest. Needs operators, books, and proof under pressure."
  },
  {
    id: "anton-bell",
    name: "Anton Bell",
    role: "operator",
    industry: "auto",
    city: "Youngstown, OH",
    capitalNeeded: 35000,
    capitalAvailable: 4000,
    years: 13,
    skills: ["field", "equipment", "customers", "estimating"],
    needs: ["capital", "books", "admin"],
    goals: ["leave", "start", "partner"],
    verified: ["licenseFront", "licenseBack", "faceCapture", "phone", "identity", "history", "references"],
    summary: "Diesel mechanic with fleet contacts and diagnostic equipment. Wants a shop partner who can handle billing and first-truck money."
  },
  {
    id: "erica-henson",
    name: "Erica Henson",
    role: "connector",
    industry: "contracting",
    city: "Columbus, OH",
    capitalNeeded: 30000,
    capitalAvailable: 40000,
    years: 14,
    skills: ["ops", "hiring", "sales", "admin", "capital"],
    needs: ["license", "field", "estimating"],
    goals: ["scale", "buy", "partner"],
    verified: ["licenseFront", "licenseBack", "faceCapture", "phone", "identity", "funds", "history", "references"],
    summary: "Former contractor ops lead with capital and hard-won crew, cash, and calendar judgment. Looking for overlooked crews ready to own more of the upside."
  },
  {
    id: "malik-porter",
    name: "Malik Porter",
    role: "builder",
    industry: "plumbing",
    city: "Canton, OH",
    capitalNeeded: 12000,
    capitalAvailable: 2000,
    years: 5,
    skills: ["field", "customers", "equipment"],
    needs: ["license", "capital", "admin"],
    goals: ["leave", "equity", "partner"],
    verified: ["licenseFront", "licenseBack", "faceCapture", "phone", "identity", "history"],
    summary: "Service tech with weekend side jobs and a loyal neighborhood customer base. Wants to level up without getting buried by debt."
  }
];

const roleLabels = {
  builder: "Builder",
  operator: "Operator",
  backer: "Backer",
  connector: "Connector",
  spark: "Spark"
};

const industryLabels = {
  plumbing: "Plumbing",
  hvac: "HVAC",
  electrical: "Electrical",
  contracting: "Contracting",
  logistics: "Logistics",
  auto: "Auto / diesel",
  services: "Local services"
};

const skillLabels = {
  field: "field work",
  license: "license",
  sales: "sales",
  ops: "operations",
  admin: "admin",
  hiring: "hiring",
  books: "books",
  estimating: "estimating",
  customers: "customer base",
  equipment: "equipment",
  capital: "capital",
  idea: "idea / lead"
};

const proofLabels = {
  licenseFront: "driver's license front",
  licenseBack: "driver's license back",
  faceCapture: "face capture",
  phone: "linked phone",
  identity: "identity",
  funds: "funds snapshot",
  history: "work history support",
  license: "license",
  references: "reference checks"
};

const requiredProof = ["licenseFront", "licenseBack", "faceCapture", "phone"];
const platformDisclaimer = "Werkles is a partner discovery and verification platform. We do not facilitate any securities transaction, loan, investment, or sale of business. Werkles never holds or transmits funds.";

const storageKeys = {
  profile: "werkles.profile.v5",
  intros: "werkles.intros.v4"
};

const state = {
  filter: "all",
  search: "",
  deckIndex: 0,
  deckComplete: false,
  intros: new Set(loadJson(storageKeys.intros, []))
};

const profileNameInput = document.querySelector("#profileName");
const profilePhoneInput = document.querySelector("#profilePhone");
const profilePhoneConsentInput = document.querySelector("#profilePhoneConsent");
const roleInput = document.querySelector("#role");
const industryInput = document.querySelector("#industry");
const profileCityInput = document.querySelector("#profileCity");
const profileStateInput = document.querySelector("#profileState");
const radiusInput = document.querySelector("#radius");
const capitalAvailableInput = document.querySelector("#capitalAvailable");
const capitalNeededInput = document.querySelector("#capitalNeeded");
const capitalAvailableValue = document.querySelector("#capitalAvailableValue");
const capitalNeededValue = document.querySelector("#capitalNeededValue");
const candidateCard = document.querySelector("#candidateCard");
const introQueue = document.querySelector("#introQueue");
const verifiedCount = document.querySelector("#verifiedCount");
const gateStatus = document.querySelector("#gateStatus");
const searchInput = document.querySelector("#searchInput");
const graph = document.querySelector("#matchGraph");
const graphContext = graph.getContext("2d");
const profileStatus = document.querySelector("#profileStatus");
const betaForm = document.querySelector("#betaForm");
const betaEmail = document.querySelector("#betaEmail");
const betaRole = document.querySelector("#betaRole");
const betaStatus = document.querySelector("#betaStatus");
const heroMatchScore = document.querySelector("#heroMatchScore");

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  if (value === 0) return "$0";
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function normalizeState(value) {
  return String(value || "").trim().toUpperCase().slice(0, 2);
}

function formatLocation(city, stateCode) {
  return [String(city || "").trim(), normalizeState(stateCode)].filter(Boolean).join(", ");
}

function parseLocation(value) {
  const parts = String(value || "").split(",");
  return {
    city: parts[0]?.trim() || "Cleveland",
    state: normalizeState(parts[1] || "OH") || "OH"
  };
}

function selectedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function setCheckedValues(name, values) {
  const valueSet = new Set(values || []);
  document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = valueSet.has(input.value);
  });
}

function withRequiredProof(values) {
  return Array.from(new Set([...requiredProof, ...(values || [])]));
}

function normalizeRole(role) {
  const legacy = {
    worker: "builder",
    capital: "backer",
    hybrid: "connector"
  };
  return legacy[role] || role || "builder";
}

function getUserProfile() {
  return {
    id: "you",
    name: profileNameInput.value.trim() || "You",
    phone: profilePhoneInput.value.trim(),
    phoneConsent: profilePhoneConsentInput.checked,
    role: roleInput.value,
    industry: industryInput.value,
    locationCity: profileCityInput.value.trim() || "Cleveland",
    locationState: normalizeState(profileStateInput.value || "OH"),
    city: formatLocation(profileCityInput.value || "Cleveland", profileStateInput.value || "OH"),
    radius: Number(radiusInput.value || 0),
    capitalAvailable: Number(capitalAvailableInput.value),
    capitalNeeded: Number(capitalNeededInput.value),
    skills: selectedValues("skills"),
    goals: selectedValues("goals"),
    verified: withRequiredProof(selectedValues("verify"))
  };
}

function hydrateProfile() {
  const saved = loadJson(storageKeys.profile, null);
  if (!saved) return;

  profileNameInput.value = saved.name || "Ben";
  profilePhoneInput.value = saved.phone || "";
  profilePhoneConsentInput.checked = Boolean(saved.phoneConsent);
  roleInput.value = normalizeRole(saved.role);
  industryInput.value = saved.industry || "plumbing";
  const savedLocation = parseLocation(saved.city || formatLocation(saved.locationCity, saved.locationState));
  profileCityInput.value = saved.locationCity || savedLocation.city;
  profileStateInput.value = saved.locationState || savedLocation.state;
  radiusInput.value = saved.radius || 75;
  capitalAvailableInput.value = saved.capitalAvailable ?? 50000;
  capitalNeededInput.value = saved.capitalNeeded ?? 0;
  setCheckedValues("skills", saved.skills || []);
  setCheckedValues("goals", saved.goals || []);
  setCheckedValues("verify", withRequiredProof(saved.verified || []));
}

function sameState(left, right) {
  const leftState = left.split(",").pop()?.trim().toLowerCase();
  const rightState = right.split(",").pop()?.trim().toLowerCase();
  return Boolean(leftState && rightState && leftState === rightState);
}

function complementaryRoles(userRole, candidateRole) {
  if (userRole === "connector" || candidateRole === "connector") return 16;
  if (userRole === "spark" && candidateRole !== "spark") return 12;
  if (candidateRole === "spark" && userRole !== "spark") return 10;
  if (userRole === candidateRole) return userRole === "builder" ? 8 : 6;
  const pair = [userRole, candidateRole].sort().join(":");
  const weights = {
    "backer:operator": 20,
    "backer:builder": 16,
    "builder:operator": 14,
    "backer:connector": 14,
    "connector:operator": 15,
    "builder:connector": 13,
    "operator:spark": 12,
    "backer:spark": 10,
    "connector:spark": 14,
    "builder:spark": 9
  };
  return weights[pair] || 8;
}

function sharedCount(left, right) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).length;
}

function scoreProfile(user, candidate) {
  const reasons = [];
  let score = 18;

  const roleScore = complementaryRoles(user.role, candidate.role);
  score += roleScore;
  if (roleScore >= 14) reasons.push(`${roleLabels[user.role]} fits ${roleLabels[candidate.role].toLowerCase()}`);

  if (user.industry === candidate.industry) {
    score += 18;
    reasons.push(`same arena: ${industryLabels[user.industry]}`);
  }

  if (sameState(user.city, candidate.city)) {
    score += 10;
    reasons.push("same-state reach");
  }

  const userCoversNeeds = sharedCount(user.skills, candidate.needs);
  if (userCoversNeeds > 0) {
    score += Math.min(22, userCoversNeeds * 7);
    reasons.push(`you cover ${userCoversNeeds} need${userCoversNeeds > 1 ? "s" : ""}`);
  }

  const missingCoreSkills = ["field", "license", "ops", "sales", "books", "admin"].filter((skill) => !user.skills.includes(skill));
  const candidateCoversNeeds = sharedCount(candidate.skills, missingCoreSkills);
  if (candidateCoversNeeds > 0) {
    score += Math.min(12, candidateCoversNeeds * 4);
    reasons.push("complementary skill stack");
  }

  const sharedGoals = sharedCount(user.goals, candidate.goals);
  if (sharedGoals > 0) {
    score += Math.min(12, sharedGoals * 4);
    reasons.push(`${sharedGoals} shared outcome${sharedGoals > 1 ? "s" : ""}`);
  }

  if (candidate.capitalNeeded > 0 && user.capitalAvailable >= candidate.capitalNeeded) {
    score += 16;
    reasons.push(`your ${money(user.capitalAvailable)} can fund the ask`);
  } else if (candidate.capitalNeeded > 0 && user.capitalAvailable >= candidate.capitalNeeded * 0.5) {
    score += 8;
    reasons.push("partial money fit");
  }

  if (user.capitalNeeded > 0 && candidate.capitalAvailable >= user.capitalNeeded) {
    score += 14;
    reasons.push("candidate can fund your ask");
  }

  if (candidate.verified.length >= 4) {
    score += 7;
    reasons.push("strong proof signals");
  } else if (candidate.verified.length >= 2) {
    score += 4;
    reasons.push("some proof signals");
  }

  return {
    ...candidate,
    score: Math.max(1, Math.min(99, Math.round(score))),
    reasons: reasons.slice(0, 5)
  };
}

function getScoredMatches() {
  const user = getUserProfile();
  return profiles
    .map((profile) => scoreProfile(user, profile))
    .sort((left, right) => right.score - left.score);
}

function getFilteredMatches() {
  const search = state.search.toLowerCase();

  return getScoredMatches()
    .filter((profile) => state.filter === "all" || profile.role === state.filter)
    .filter((profile) => {
      if (!search) return true;
      const haystack = [
        profile.name,
        profile.city,
        roleLabels[profile.role],
        industryLabels[profile.industry],
        profile.summary,
        ...profile.skills.map((skill) => skillLabels[skill] || skill),
        ...profile.needs.map((skill) => skillLabels[skill] || skill)
      ].join(" ").toLowerCase();
      return haystack.includes(search);
    });
}

function getActiveMatch() {
  const matches = getFilteredMatches();
  if (!matches.length) return null;
  state.deckIndex = ((state.deckIndex % matches.length) + matches.length) % matches.length;
  return matches[state.deckIndex];
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function renderCandidate() {
  const matches = getFilteredMatches();
  const profile = getActiveMatch();
  const topMatch = getScoredMatches()[0];
  heroMatchScore.textContent = topMatch ? `${topMatch.score}%` : "0%";

  if (state.deckComplete && matches.length) {
    candidateCard.innerHTML = `
      <div class="candidate-empty">
        <div>
          <h3>No fit. Keep building.</h3>
          <p>You reached the end of this deck. Adjust the filters, search a different arena, or restart the deck.</p>
          <button class="button button-dark" type="button" data-restart-deck>Restart deck</button>
        </div>
      </div>
    `;
    drawGraph(matches.slice(0, 5));
    return;
  }

  if (!profile) {
    candidateCard.innerHTML = `<div class="candidate-empty">No matches found. Loosen the filters or search for another trade.</div>`;
    drawGraph([]);
    return;
  }

  const added = state.intros.has(profile.id);
  const visibleSkills = profile.skills.slice(0, 5).map((skill) => `<span class="tag">${escapeHtml(skillLabels[skill] || skill)}</span>`).join("");
  const verified = profile.verified.length >= 3 ? `<span class="verified-tag">${escapeHtml(profile.verified.length)} proof signals</span>` : "";
  const reasons = profile.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("");
  const profileId = escapeHtml(profile.id);

  candidateCard.innerHTML = `
    <div class="candidate-top">
      <span class="avatar ${escapeHtml(profile.role)}" aria-hidden="true">${escapeHtml(initials(profile.name))}</span>
      <div>
        <h3>${escapeHtml(profile.name)}</h3>
        <div class="meta-row">
          <span class="tag">${escapeHtml(roleLabels[profile.role])}</span>
          <span class="tag">${escapeHtml(industryLabels[profile.industry])}</span>
          <span class="tag">${escapeHtml(profile.city)}</span>
          ${verified}
        </div>
      </div>
      <span class="score">${escapeHtml(profile.score)}%</span>
    </div>

    <p class="candidate-summary">${escapeHtml(profile.summary)}</p>

    <div class="candidate-stats">
      <div><strong>${escapeHtml(profile.years)}</strong><span>years in arena</span></div>
      <div><strong>${escapeHtml(money(profile.capitalNeeded))}</strong><span>money needed</span></div>
      <div><strong>${escapeHtml(money(profile.capitalAvailable))}</strong><span>money available</span></div>
    </div>

    <div class="tag-row">${visibleSkills}</div>
    <ul class="reason-list">${reasons}</ul>
    <p class="compliance-note">${escapeHtml(platformDisclaimer)}</p>

    <div class="candidate-actions">
      <button class="button button-dark" type="button" data-intro="${profileId}">${added ? "Checking the Blueprint" : "Request intro"}</button>
      <button class="button button-outline" type="button" data-save="${profileId}">${added ? "Remove shortlist" : "Shortlist"}</button>
      <button class="button button-outline" type="button" data-next>Pass for now</button>
      <span class="status-line">${escapeHtml(state.deckIndex + 1)} of ${escapeHtml(matches.length)}</span>
    </div>
  `;

  drawGraph(matches.slice(0, 5));
}

function renderMetrics() {
  document.querySelector("#builderCount").textContent = profiles.filter((profile) => profile.role === "builder").length;
  document.querySelector("#operatorCount").textContent = profiles.filter((profile) => profile.role === "operator").length;
  document.querySelector("#backerCount").textContent = profiles.filter((profile) => profile.role === "backer").length;
  document.querySelector("#introCount").textContent = state.intros.size;
}

function renderTrust() {
  const verified = withRequiredProof(selectedValues("verify"));
  const totalProofInputs = document.querySelectorAll(`input[name="verify"]`).length;
  const phoneDigits = profilePhoneInput.value.replace(/\D/g, "");
  const gateReady = requiredProof.every((proof) => verified.includes(proof)) && phoneDigits.length >= 10 && profilePhoneConsentInput.checked;
  verifiedCount.textContent = `${verified.length}/${totalProofInputs}`;
  gateStatus.textContent = gateReady
    ? "Account gate ready in prototype: license front/back, face capture, phone present, and phone consent checked."
    : "License front/back, face capture, linked phone, and phone consent required before account activation.";
}

function renderIntroQueue() {
  const queued = profiles.filter((profile) => state.intros.has(profile.id));

  if (!queued.length) {
    introQueue.className = "intro-queue empty";
    introQueue.textContent = "No intro requests yet.";
    return;
  }

  introQueue.className = "intro-queue";
  introQueue.innerHTML = queued
    .map((profile) => `
      <div class="intro-item">
        <span class="mini-avatar">${escapeHtml(initials(profile.name))}</span>
        <span>
          <strong>${escapeHtml(profile.name)}</strong>
          <small>${escapeHtml(roleLabels[profile.role])} - ${escapeHtml(industryLabels[profile.industry])}</small>
        </span>
      </div>
    `)
    .join("");
}

function drawGraph(matches) {
  const width = graph.width;
  const height = graph.height;
  graphContext.clearRect(0, 0, width, height);
  graphContext.fillStyle = "#f8faf9";
  graphContext.fillRect(0, 0, width, height);

  graphContext.strokeStyle = "#d9e0dc";
  graphContext.lineWidth = 1;
  for (let x = 40; x < width; x += 80) {
    graphContext.beginPath();
    graphContext.moveTo(x, 0);
    graphContext.lineTo(x, height);
    graphContext.stroke();
  }
  for (let y = 40; y < height; y += 80) {
    graphContext.beginPath();
    graphContext.moveTo(0, y);
    graphContext.lineTo(width, y);
    graphContext.stroke();
  }

  const center = { x: width / 2, y: height / 2 };
  graphContext.fillStyle = "#111312";
  graphContext.beginPath();
  graphContext.arc(center.x, center.y, 28, 0, Math.PI * 2);
  graphContext.fill();
  graphContext.fillStyle = "#d6ff59";
  graphContext.font = "900 13px Inter, sans-serif";
  graphContext.textAlign = "center";
  graphContext.textBaseline = "middle";
  graphContext.fillText("YOU", center.x, center.y);

  const roleColors = {
    builder: "#0b9f69",
    operator: "#6f3ff5",
    backer: "#d69a24",
    connector: "#ff4fa7",
    spark: "#c8612c"
  };

  matches.forEach((match, index) => {
    const angle = -Math.PI / 2 + index * ((Math.PI * 2) / Math.max(matches.length, 5));
    const distance = 58 + (99 - match.score) * 1.25;
    const x = center.x + Math.cos(angle) * distance;
    const y = center.y + Math.sin(angle) * distance;

    graphContext.strokeStyle = "rgba(17, 19, 18, 0.25)";
    graphContext.lineWidth = Math.max(2, match.score / 24);
    graphContext.beginPath();
    graphContext.moveTo(center.x, center.y);
    graphContext.lineTo(x, y);
    graphContext.stroke();

    graphContext.fillStyle = roleColors[match.role] || "#111312";
    graphContext.beginPath();
    graphContext.arc(x, y, 21, 0, Math.PI * 2);
    graphContext.fill();
    graphContext.fillStyle = "#ffffff";
    graphContext.font = "900 11px Inter, sans-serif";
    graphContext.fillText(initials(match.name), x, y);
  });
}

function render() {
  capitalAvailableValue.textContent = money(Number(capitalAvailableInput.value));
  capitalNeededValue.textContent = money(Number(capitalNeededInput.value));
  renderTrust();
  renderMetrics();
  renderIntroQueue();
  renderCandidate();
}

function saveProfile(message = "Profile saved in this browser.") {
  saveJson(storageKeys.profile, getUserProfile());
  profileStatus.textContent = message;
}

function buildBrief() {
  const profile = getUserProfile();
  const topMatches = getScoredMatches().slice(0, 3);
  return [
    `Werkles profile: ${profile.name}`,
    `Lane: ${roleLabels[profile.role]}`,
    `Arena: ${industryLabels[profile.industry]}`,
    `City: ${profile.city}`,
    `Money available: ${money(profile.capitalAvailable)}`,
    `Money needed: ${money(profile.capitalNeeded)}`,
    `Phone verified: ${profile.phone && profile.phoneConsent ? "yes" : "no"}`,
    `Skills: ${profile.skills.map((skill) => skillLabels[skill] || skill).join(", ") || "none selected"}`,
    `Goals: ${profile.goals.join(", ") || "none selected"}`,
    `Proof signals: ${profile.verified.map((proof) => proofLabels[proof] || proof).join(", ") || "none selected"}`,
    "",
    "Top matches:",
    ...topMatches.map((match) => `- ${match.name}: ${match.score}% fit, ${roleLabels[match.role]}, ${industryLabels[match.industry]}`)
  ].join("\n");
}

async function copyBrief() {
  const brief = buildBrief();
  try {
    await navigator.clipboard.writeText(brief);
    profileStatus.textContent = "Founder brief copied.";
  } catch {
    profileStatus.textContent = brief;
  }
}

function saveIntroState() {
  saveJson(storageKeys.intros, Array.from(state.intros));
}

function moveDeck(direction) {
  const matches = getFilteredMatches();
  if (!matches.length) return;

  if (direction > 0 && state.deckIndex >= matches.length - 1) {
    state.deckComplete = true;
    renderCandidate();
    return;
  }

  if (state.deckComplete && direction < 0) {
    state.deckComplete = false;
    state.deckIndex = matches.length - 1;
    renderCandidate();
    return;
  }

  state.deckComplete = false;
  state.deckIndex = (state.deckIndex + direction + matches.length) % matches.length;
  renderCandidate();
}

document.querySelector("#profileForm").addEventListener("input", () => {
  state.deckIndex = 0;
  state.deckComplete = false;
  saveProfile("Profile updated.");
  render();
});

document.querySelector(".verification-list").addEventListener("input", () => {
  saveProfile("Verification updated.");
  render();
});

document.querySelector("#saveProfile").addEventListener("click", () => {
  saveProfile();
  render();
});

document.querySelector("#copyBrief").addEventListener("click", copyBrief);

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  state.deckIndex = 0;
  state.deckComplete = false;
  renderCandidate();
});

document.querySelector(".segment-control").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  state.deckIndex = 0;
  state.deckComplete = false;
  document.querySelectorAll(".segment").forEach((segment) => segment.classList.toggle("is-active", segment === button));
  renderCandidate();
});

candidateCard.addEventListener("click", (event) => {
  if (event.target.closest("[data-restart-deck]")) {
    state.deckIndex = 0;
    state.deckComplete = false;
    renderCandidate();
    return;
  }

  const introButton = event.target.closest("[data-intro], [data-save]");
  if (event.target.closest("[data-next]")) {
    moveDeck(1);
    return;
  }
  if (!introButton) return;
  const id = introButton.dataset.intro || introButton.dataset.save;
  if (state.intros.has(id)) {
    state.intros.delete(id);
  } else {
    state.intros.add(id);
  }
  saveIntroState();
  render();
});

document.querySelector("#prevMatch").addEventListener("click", () => moveDeck(-1));
document.querySelector("#nextMatch").addEventListener("click", () => moveDeck(1));
document.querySelector("#saveMatch").addEventListener("click", () => {
  const active = getActiveMatch();
  if (!active) return;
  if (state.intros.has(active.id)) {
    state.intros.delete(active.id);
  } else {
    state.intros.add(active.id);
  }
  saveIntroState();
  render();
});

document.querySelector("#clearIntros").addEventListener("click", () => {
  state.intros.clear();
  saveIntroState();
  render();
});

betaForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  betaStatus.textContent = "Checking the Blueprint...";

  try {
    const response = await fetch("/api/beta", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: betaEmail.value.trim(),
        lane: betaRole.value
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Could not save beta signup.");
    }

    betaStatus.textContent = "Invite request saved. Activation still requires license front/back, face capture, and phone link.";
    betaEmail.value = "";
  } catch (error) {
    betaStatus.textContent = error.message;
  }
});

hydrateProfile();
render();
