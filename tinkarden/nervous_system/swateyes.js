"use strict";

const RISK = Object.freeze({
  GNAT: "GNAT",
  MOSQUITO: "MOSQUITO",
  WOUND: "WOUND",
  FRACTURE: "FRACTURE",
});

const ACTION_READ = new Set([
  "read",
  "file_read",
  "query",
  "state_query",
  "status",
  "inspect",
  "list",
  "search",
]);

const ACTION_WRITE = new Set([
  "write",
  "file_write",
  "edit",
  "patch",
  "create",
  "update",
]);

const ACTION_WOUND = new Set([
  "commit",
  "canonical_commit",
  "server_reboot",
  "reboot",
  "restart_server",
  "package_install",
  "install_package",
  "npm_install",
  "pip_install",
]);

const ACTION_FRACTURE = new Set([
  "delete",
  "remove",
  "rm",
  "secret_access",
  "read_secret",
  "network_mutation",
  "irreversible_network_mutation",
  "deploy_mutation",
  "dns_change",
  "permission_change",
]);

function classifyRisk(actionPayload = {}) {
  const payload = normalizePayload(actionPayload);

  if (isFracture(payload)) return RISK.FRACTURE;
  if (isWound(payload)) return RISK.WOUND;
  if (isMosquito(payload)) return RISK.MOSQUITO;
  if (isGnat(payload)) return RISK.GNAT;

  return RISK.WOUND;
}

function normalizePayload(actionPayload) {
  const payload = actionPayload && typeof actionPayload === "object" ? actionPayload : {};
  const type = normalizeToken(payload.type || payload.action || payload.operation || payload.kind);
  const target = normalizeText(payload.target || payload.path || payload.branch || payload.package || payload.url);
  const branch = normalizeText(payload.branch || payload.gitBranch || payload.ref);
  const scope = normalizeText(payload.scope || payload.environment || payload.context);
  const reversible = payload.reversible === true || normalizeToken(payload.reversibility) === "reversible";
  const localDev =
    payload.localDev === true ||
    payload.local_dev === true ||
    normalizeToken(payload.branchType) === "local_dev" ||
    branch.includes("dev") ||
    branch.includes("local") ||
    scope.includes("local") ||
    scope.includes("dev");

  return {
    original: payload,
    type,
    target,
    branch,
    scope,
    reversible,
    localDev,
  };
}

function isGnat(payload) {
  return ACTION_READ.has(payload.type) || payload.original.readOnly === true || payload.original.read_only === true;
}

function isMosquito(payload) {
  const isWrite = ACTION_WRITE.has(payload.type) || payload.original.write === true;
  return isWrite && payload.reversible && payload.localDev && !isCanonicalBranch(payload);
}

function isWound(payload) {
  if (ACTION_WOUND.has(payload.type)) return true;
  if (payload.type === "commit" && isCanonicalBranch(payload)) return true;
  if (payload.original.packageInstall === true || payload.original.package_install === true) return true;
  if (payload.original.serverReboot === true || payload.original.server_reboot === true) return true;
  return false;
}

function isFracture(payload) {
  if (ACTION_FRACTURE.has(payload.type)) return true;
  if (payload.original.destructive === true || payload.original.irreversible === true) return true;
  if (payload.original.deletes === true || payload.original.delete === true) return true;
  if (payload.original.secrets === true || payload.original.secret === true || payload.original.secretAccess === true) {
    return true;
  }
  if (payload.original.networkMutation === true || payload.original.network_mutation === true) return true;
  return false;
}

function isCanonicalBranch(payload) {
  const branch = payload.branch || payload.target;
  return branch === "main" || branch === "master" || branch === "origin/main" || branch.includes("canonical");
}

function normalizeToken(value) {
  return normalizeText(value).replace(/[\s-]+/g, "_");
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

module.exports = {
  RISK,
  classifyRisk,
};
