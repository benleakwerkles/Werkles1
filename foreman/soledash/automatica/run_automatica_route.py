#!/usr/bin/env python3
"""Run one Maker Automatica route and always write a receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import platform
import shutil
import socket
import subprocess
import sys
from pathlib import Path
from typing import Any


SOLEDASH_ROOT = Path(__file__).resolve().parents[1]
ROUTE_MAP_PATH = SOLEDASH_ROOT / "AUTOMATICA_ROUTE_MAP.json"
RECEIPTS_DIR = SOLEDASH_ROOT / "receipts"
ACTIONS_DIR = SOLEDASH_ROOT / "actions"


def now_stamp() -> str:
    return dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_route_map() -> dict[str, Any]:
    return json.loads(ROUTE_MAP_PATH.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def run_command(args: list[str], timeout: int = 10) -> dict[str, Any]:
    try:
        completed = subprocess.run(args, capture_output=True, text=True, timeout=timeout, check=False)
        return {
            "ok": completed.returncode == 0,
            "returncode": completed.returncode,
            "stdout": completed.stdout.strip(),
            "stderr": completed.stderr.strip(),
            "command": " ".join(args),
        }
    except Exception as exc:  # noqa: BLE001 - receipts should capture failures
        return {
            "ok": False,
            "returncode": None,
            "stdout": "",
            "stderr": f"{type(exc).__name__}: {exc}",
            "command": " ".join(args),
        }


def ping_host(host: str) -> dict[str, Any]:
    if platform.system().lower() == "windows":
        args = ["ping", "-n", "1", "-w", "1200", host]
    else:
        args = ["ping", "-c", "1", "-W", "1", host]
    return run_command(args, timeout=5)


def tcp_check(host: str, port: int, timeout: float = 1.5) -> dict[str, Any]:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return {"host": host, "port": port, "listening": True, "error": ""}
    except Exception as exc:  # noqa: BLE001 - receipt evidence
        return {"host": host, "port": port, "listening": False, "error": f"{type(exc).__name__}: {exc}"}


def command_exists(command: str) -> bool:
    return shutil.which(command) is not None


def glob_exists(pattern: str) -> bool:
    expanded = os.path.expandvars(pattern)
    return bool(list(Path(expanded).parent.glob(Path(expanded).name)))


def read_json_if_exists(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception:
        return None


def make_base_receipt(route: dict[str, Any], args: argparse.Namespace) -> dict[str, Any]:
    action_id = args.action_id or f"automatica_{route['route_id']}_{now_stamp()}"
    card_id = args.card_id or f"automatica_card_{route['route_id']}"
    approval_id = args.approval_id or f"approval_{route['route_id']}_{now_stamp()}"
    expected_return_location = args.expected_return_location or f"#automatica/{card_id}"
    return {
        "schema_version": "AUTOMATICA_ROUTE_RECEIPT.v0.1",
        "receipt_id": f"{route['receipt_prefix']}_{now_stamp()}",
        "card_id": card_id,
        "parent_card_id": card_id,
        "action_id": action_id,
        "approval_id": approval_id,
        "route_id": route["route_id"],
        "card_label": route["card_label"],
        "target_owner": route["target_owner"],
        "target_machine": route["target_machine"],
        "created_at": now_iso(),
        "approval_status": "approved",
        "expected_return_location": expected_return_location,
        "receipt_contract": ["decision", "why", "evidence", "assumption", "blocker", "next_action", "confidence"],
        "decision": "UNKNOWN",
        "why": "UNKNOWN",
        "evidence": [],
        "assumption": "UNKNOWN",
        "blocker": "UNKNOWN",
        "next_action": "UNKNOWN",
        "confidence": "low",
        "status": "started",
        "route_specific": {},
        "safety": {
            "credentials_captured": False,
            "passwords_logged": False,
            "public_ports_changed": False,
            "router_changed": False,
            "production_deploy": False,
            "payment_or_subscription_change": False,
        },
    }


def handle_spanzee_remote_check(receipt: dict[str, Any], _args: argparse.Namespace) -> dict[str, Any]:
    host = "10.1.10.63"
    ping = ping_host(host)
    ssh = tcp_check(host, 22)
    rdp = tcp_check(host, 3389)
    reachable = bool(ping["ok"] or ssh["listening"] or rdp["listening"])
    remote_available = bool(ssh["listening"] or rdp["listening"])
    blocker = "none"
    decision = "remote_access_available"
    if not reachable:
        blocker = "Spanzee did not respond to ping, SSH, or RDP probe from this machine."
        decision = "blocked_not_reachable"
    elif not remote_available:
        blocker = "Spanzee is reachable but neither SSH nor RDP is listening."
        decision = "blocked_no_remote_listener"

    receipt.update(
        {
            "status": "passed" if remote_available else "blocked",
            "decision": decision,
            "why": "Automatica route needs a porch-usable command/control path before Spanzee can act as a real node.",
            "evidence": [
                {"kind": "ping", "host": host, "ok": ping["ok"], "returncode": ping["returncode"], "stdout": ping["stdout"][-500:]},
                {"kind": "tcp", "service": "ssh", **ssh},
                {"kind": "tcp", "service": "rdp", **rdp},
            ],
            "assumption": "10.1.10.63 is still assigned to Spanzee / DESKTOP-UL1T2KE on the trusted LAN.",
            "blocker": blocker,
            "next_action": "If blocked, run the Spanzee workstation/remote finisher locally on Spanzee, then rerun this route.",
            "confidence": "medium" if reachable else "medium-low",
            "route_specific": {
                "reachable": reachable,
                "ssh_listening": bool(ssh["listening"]),
                "rdp_listening": bool(rdp["listening"]),
                "remote_access_method_available": remote_available,
                "available_methods": [name for name, yes in {"ssh": ssh["listening"], "rdp": rdp["listening"]}.items() if yes],
                "blocker": blocker,
            },
        }
    )
    return receipt


def collect_monitor_status() -> dict[str, Any]:
    ps = shutil.which("powershell") or shutil.which("pwsh")
    if not ps:
        return {"status": "UNKNOWN", "monitor_count": "UNKNOWN", "evidence_status": "powershell_missing"}
    command = (
        "Add-Type -AssemblyName System.Windows.Forms; "
        "[System.Windows.Forms.Screen]::AllScreens | ForEach-Object { "
        "[pscustomobject]@{DeviceName=$_.DeviceName;Primary=$_.Primary;"
        "X=$_.Bounds.X;Y=$_.Bounds.Y;Width=$_.Bounds.Width;Height=$_.Bounds.Height} "
        "} | ConvertTo-Json -Depth 4"
    )
    result = run_command([ps, "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], timeout=10)
    if not result["ok"] or not result["stdout"]:
        return {"status": "UNKNOWN", "monitor_count": "UNKNOWN", "evidence_status": "command_failed", "error": result["stderr"]}
    try:
        parsed = json.loads(result["stdout"])
    except json.JSONDecodeError:
        return {"status": "UNKNOWN", "monitor_count": "UNKNOWN", "evidence_status": "json_parse_failed"}
    items = parsed if isinstance(parsed, list) else [parsed]
    return {
        "status": "observed",
        "monitor_count": len(items),
        "layout_positions": items,
        "evidence_status": "observed",
    }


def handle_ui_cleanup(receipt: dict[str, Any], _args: argparse.Namespace) -> dict[str, Any]:
    powertoys_paths = [
        r"%ProgramFiles%\PowerToys\PowerToys.exe",
        r"%LOCALAPPDATA%\PowerToys\PowerToys.exe",
    ]
    fancy_paths = [
        r"%LOCALAPPDATA%\Microsoft\PowerToys\FancyZones\zones-settings.json",
        r"%LOCALAPPDATA%\Microsoft\PowerToys\FancyZones\custom-layouts.json",
        r"%LOCALAPPDATA%\Microsoft\PowerToys\FancyZones\applied-layouts.json",
    ]
    powertoys_present = any(glob_exists(path) for path in powertoys_paths)
    fancy_present = any(glob_exists(path) for path in fancy_paths)
    monitor_status = collect_monitor_status()
    desktop = Path.home() / "Desktop"
    public_desktop = Path(os.environ.get("PUBLIC", r"C:\Users\Public")) / "Desktop"
    desktop_shortcuts = []
    for folder in [desktop, public_desktop]:
        if folder.exists():
            desktop_shortcuts.extend(path.name for path in folder.glob("*.lnk"))
    required_shortcut_terms = ["SoleDash", "Aeye", "Receipts"]
    shortcut_gaps = [term for term in required_shortcut_terms if not any(term.lower() in item.lower() for item in desktop_shortcuts)]
    friction = []
    if not powertoys_present:
        friction.append("PowerToys is missing or not detectable on this machine.")
    if not fancy_present:
        friction.append("FancyZones layout is missing or not frozen.")
    if monitor_status.get("monitor_count") != 5:
        friction.append("Five-monitor layout is not verified on this machine.")
    if shortcut_gaps:
        friction.append("Missing operator shortcuts: " + ", ".join(shortcut_gaps))
    if not friction:
        friction.append("No top UI friction detected by local route probe; confirm with Ben on the active operator surface.")

    blocker = "none" if powertoys_present and fancy_present and not shortcut_gaps else "Operator UI standard is not fully evidenced on this machine."
    receipt.update(
        {
            "status": "passed" if blocker == "none" else "partial",
            "decision": "route_to_dink_ender_ui_cleanup",
            "why": "Ben needs reduced UI friction across the workstation surfaces without being taught coding-stack operations.",
            "evidence": [
                {"kind": "local_path_probe", "powertoys_present": powertoys_present, "fancyzones_present": fancy_present},
                {"kind": "monitor_probe", **monitor_status},
                {"kind": "desktop_shortcut_probe", "shortcut_count": len(desktop_shortcuts), "shortcut_gaps": shortcut_gaps},
            ],
            "assumption": "This local machine is representative enough to produce a route receipt, but final layout truth must come from the active operator machine receipts.",
            "blocker": blocker,
            "next_action": "Run CAPTURE_OPERATOR_UI_STACK.py on Betsy and target machines, then have Dink/Ender freeze the accepted FancyZones and shortcut standard.",
            "confidence": "medium",
            "route_specific": {
                "powertoys_fancyzones_status": {
                    "powertoys_present": powertoys_present,
                    "fancyzones_config_present": fancy_present,
                },
                "monitor_layout_status": monitor_status,
                "startup_shortcut_gaps": shortcut_gaps,
                "top_ui_friction": friction[:5],
            },
        }
    )
    return receipt


def inspect_repo(repo_path: Path) -> dict[str, Any]:
    state: dict[str, Any] = {
        "repo_path": str(repo_path),
        "repo_exists": repo_path.exists(),
        "package_json_exists": False,
        "site_files_found": [],
        "scripts": {},
    }
    if not repo_path.exists():
        return state
    package_path = repo_path / "package.json"
    if package_path.exists():
        state["package_json_exists"] = True
        try:
            package = json.loads(package_path.read_text(encoding="utf-8"))
            state["scripts"] = package.get("scripts", {})
        except Exception as exc:  # noqa: BLE001
            state["package_json_error"] = f"{type(exc).__name__}: {exc}"
    candidates = [
        "app/page.tsx",
        "app/layout.tsx",
        "pages/index.tsx",
        "src/app/page.tsx",
        "src/pages/index.tsx",
        "public",
    ]
    for relative in candidates:
        path = repo_path / relative
        if path.exists():
            state["site_files_found"].append(relative)
    return state


def handle_kindsir_cleanup(receipt: dict[str, Any], args: argparse.Namespace) -> dict[str, Any]:
    repo_path = Path(args.repo_path).expanduser()
    repo_state = inspect_repo(repo_path)
    proposed_files = [
        "home page or landing route",
        "site metadata/title/description",
        "navigation and footer copy",
        "primary CTA/contact path",
        "public assets/screenshots or media",
    ]
    top_actions = [
        "Capture current live and local site state before edits.",
        "Identify stale copy, broken links, and unclear calls to action.",
        "Simplify above-the-fold message and route users to the next useful action.",
        "Clean navigation/footer and remove placeholder or duplicate sections.",
        "Run visual pass and create a no-deploy cleanup receipt for Maker/Ender review.",
    ]
    blocker = "none" if repo_state["repo_exists"] else "Local Werkles/kindsir repo path was not found from this machine."
    receipt.update(
        {
            "status": "partial" if repo_state["repo_exists"] else "blocked",
            "decision": "route_to_maker_ender_site_cleanup",
            "why": "kindsir.com cleanup is product/site work and should route to Maker/Ender with a receipt before any production deploy.",
            "evidence": [{"kind": "local_repo_probe", **repo_state}],
            "assumption": "kindsir.com source lives in or near the configured Werkles repo path unless Maker provides a more specific site repo.",
            "blocker": blocker,
            "next_action": "Maker/Ender should confirm the site repo/page path, perform a no-deploy cleanup pass, and write touched/proposed files into the next receipt.",
            "confidence": "medium" if repo_state["repo_exists"] else "low",
            "route_specific": {
                "current_site_state": {
                    "local_repo_state": repo_state,
                    "live_site_state": "UNKNOWN_NOT_FETCHED_BY_THIS_ROUTE",
                    "production_deploy_performed": False,
                },
                "top_5_cleanup_actions": top_actions,
                "files_pages_touched_or_proposed": {
                    "touched": [],
                    "proposed": proposed_files,
                },
            },
        }
    )
    return receipt


def handle_sue_research(receipt: dict[str, Any], _args: argparse.Namespace) -> dict[str, Any]:
    receipt.update(
        {
            "status": "blocked",
            "decision": "route_to_thufir_skybro_for_disambiguation",
            "why": "SUE is ambiguous without a source phrase, market context, or target document; research should not invent meaning.",
            "evidence": [
                {
                    "kind": "ambiguity_check",
                    "term": "SUE",
                    "possible_meaning_classes": ["person/name", "legal action", "acronym", "product/service label", "internal shorthand"],
                }
            ],
            "assumption": "The phrase may be related to Kind Sir business/research language, but no local evidence pins it down.",
            "blocker": "Need source context or Thufir/Skybro web research pass before asserting what SUE means.",
            "next_action": "Ask Thufir/Skybro to search the term with Kind Sir context, identify the intended meaning, and return a sourced research receipt.",
            "confidence": "medium-low",
            "route_specific": {
                "sue_meaning_context": {
                    "answer": "AMBIGUOUS",
                    "safe_interpretation": "Do not assume SUE means lawsuit, person name, or acronym until source context is supplied.",
                },
                "research_findings": [],
                "next_action": "Run research with source context and citations; update receipt with findings.",
            },
        }
    )
    return receipt


def handle_grading_research(receipt: dict[str, Any], _args: argparse.Namespace) -> dict[str, Any]:
    receipt.update(
        {
            "status": "blocked",
            "decision": "route_to_thufir_skybro_for_market_search",
            "why": "Market/search findings and competitor examples are time-sensitive and require a live research pass.",
            "evidence": [
                {
                    "kind": "route_requirement",
                    "required_outputs": ["market/search findings", "competitor/service examples", "recommended next action"],
                    "live_search_performed": False,
                }
            ],
            "assumption": "Kind Sir grading research likely concerns a service/product comparison, but the exact grading domain is not fixed in this route packet.",
            "blocker": "No live web research execution is attached to this local route run.",
            "next_action": "Thufir/Skybro should run a sourced market scan and return examples, positioning notes, and one recommended next action.",
            "confidence": "medium-low",
            "route_specific": {
                "market_search_findings": [],
                "competitor_or_service_examples": [],
                "recommended_next_action": "Run live search with the exact grading domain and attach sources in a follow-up receipt.",
            },
        }
    )
    return receipt


HANDLERS = {
    "spanzee_remote_check": handle_spanzee_remote_check,
    "ui_cleanup_across_screens": handle_ui_cleanup,
    "kindsir_com_cleanup": handle_kindsir_cleanup,
    "kind_sir_sue_research": handle_sue_research,
    "kind_sir_grading_research": handle_grading_research,
}


def run_route(route: dict[str, Any], args: argparse.Namespace) -> dict[str, Any]:
    receipt = make_base_receipt(route, args)
    action_id = receipt["action_id"]
    try:
        handler = HANDLERS[route["handler"]]
        receipt = handler(receipt, args)
    except Exception as exc:  # noqa: BLE001 - route must receipt failures
        receipt.update(
            {
                "status": "failed",
                "decision": "route_failed",
                "why": "The Automatica route runner hit an exception but still wrote a receipt.",
                "evidence": [{"kind": "exception", "error": f"{type(exc).__name__}: {exc}"}],
                "assumption": "The route map is present but the handler or local evidence path needs repair.",
                "blocker": f"{type(exc).__name__}: {exc}",
                "next_action": "Dink should repair the route handler and rerun the card.",
                "confidence": "high",
            }
        )

    receipt_path = RECEIPTS_DIR / f"{receipt['receipt_id']}.json"
    action_path = ACTIONS_DIR / f"{action_id}.json"
    action = {
        "schema_version": "AUTOMATICA_ACTION.v0.1",
        "card_id": receipt["card_id"],
        "parent_card_id": receipt["parent_card_id"],
        "action_id": action_id,
        "approval_id": receipt["approval_id"],
        "route_id": route["route_id"],
        "card_label": route["card_label"],
        "target_owner": route["target_owner"],
        "target_machine": route["target_machine"],
        "created_at": receipt["created_at"],
        "approval_status": receipt.get("approval_status", "approved"),
        "expected_return_location": receipt.get("expected_return_location"),
        "status": receipt["status"],
        "command": route["command"],
        "receipt_path": str(receipt_path.relative_to(SOLEDASH_ROOT.parent.parent)),
        "decision": receipt["decision"],
        "blocker": receipt["blocker"],
        "next_action": receipt["next_action"],
    }
    receipt["receipt_path"] = str(receipt_path.relative_to(SOLEDASH_ROOT.parent.parent))
    receipt["receipt_drawer_archive_path"] = receipt["receipt_path"]
    receipt["action_path"] = str(action_path.relative_to(SOLEDASH_ROOT.parent.parent))
    write_json(receipt_path, receipt)
    write_json(action_path, action)
    return {"route_id": route["route_id"], "status": receipt["status"], "receipt_path": str(receipt_path)}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Maker Automatica real routes.")
    parser.add_argument("route_id", nargs="?", help="Route id from AUTOMATICA_ROUTE_MAP.json.")
    parser.add_argument("--all", action="store_true", help="Run all routes.")
    parser.add_argument(
        "--repo-path",
        default=r"C:\Users\BenLeak\Desktop\github\Werkles",
        help="Local repo path used by site cleanup route.",
    )
    parser.add_argument("--action-id", default=None, help="Stable action id allocated by the originating card.")
    parser.add_argument("--card-id", default=None, help="Stable originating card id.")
    parser.add_argument("--approval-id", default=None, help="Approval id allocated when the operator approved the card.")
    parser.add_argument("--expected-return-location", default=None, help="UI location where the receipt should return.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    route_map = load_route_map()
    routes = route_map["routes"]
    if args.all:
        selected = routes
    elif args.route_id:
        selected = [route for route in routes if route["route_id"] == args.route_id]
        if not selected:
            print(f"Unknown route_id: {args.route_id}", file=sys.stderr)
            return 2
    else:
        print("Provide a route_id or --all.", file=sys.stderr)
        return 2

    results = [run_route(route, args) for route in selected]
    print(json.dumps({"ran": results}, indent=2))
    return 0 if all(result["status"] not in {"failed"} for result in results) else 1


if __name__ == "__main__":
    sys.exit(main())
