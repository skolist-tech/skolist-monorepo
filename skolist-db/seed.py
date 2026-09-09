#!/usr/bin/env python3
"""
Master seed script: auto-discover and run Python seed scripts in order.

Run this AFTER `supabase db reset` to apply SQL seeds.

A seed script is any `*.py` directly under `python_seeds/` whose name:
  - starts with `_`
  - contains `_seed_`

Examples:
  python_seeds/_001_seed_orgs.py          # committed
  python_seeds/_local_seed_experiments.py # local-only (gitignored)

Usage:
    python seed.py
"""

import importlib
import sys
import time
from pathlib import Path
from typing import Callable, List, Optional, Tuple


# ANSI color codes for better terminal output
class Colors:
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"


def print_header(message: str):
    """Print a formatted header."""
    print(f"\n{Colors.BOLD}{Colors.HEADER}{'=' * 70}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}{message.center(70)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}{'=' * 70}{Colors.ENDC}\n")


def print_success(message: str):
    """Print a success message."""
    print(f"{Colors.OKGREEN}✓ {message}{Colors.ENDC}")


def print_error(message: str):
    """Print an error message."""
    print(f"{Colors.FAIL}✗ {message}{Colors.ENDC}")


def print_warning(message: str):
    """Print a warning message."""
    print(f"{Colors.WARNING}⚠ {message}{Colors.ENDC}")


def print_info(message: str):
    """Print an info message."""
    print(f"{Colors.OKCYAN}ℹ {message}{Colors.ENDC}")


def is_seed_script(path: Path) -> bool:
    """True if filename starts with `_` and contains `_seed_`."""
    name = path.name
    return (
        path.is_file()
        and path.suffix == ".py"
        and name.startswith("_")
        and "_seed_" in name
        and not name.startswith("__")
    )


def discover_seed_scripts() -> List[Tuple[str, str]]:
    """
    Discover seed scripts under python_seeds/ (top-level only).
    Returns sorted list of (module_name, file_path).
    """
    python_seeds_dir = Path(__file__).parent / "python_seeds"

    if not python_seeds_dir.exists():
        print_error(f"python_seeds/ directory not found at {python_seeds_dir}")
        return []

    seed_files = sorted(
        p for p in python_seeds_dir.iterdir() if is_seed_script(p)
    )
    return [(f"python_seeds.{p.stem}", str(p)) for p in seed_files]


def resolve_entry_point(module, stem: str) -> Optional[Callable]:
    """
    Resolve the callable to run for a seed module.

    Prefer `seed_<suffix>` from the filename (`_001_seed_orgs` → `seed_orgs`),
    then common fallbacks (`main`, `seed`).
    """
    candidates: List[str] = []
    if "_seed_" in stem:
        suffix = stem.split("_seed_", 1)[1]
        candidates.append(f"seed_{suffix}")
        # Historical alias: _003_seed_activities exposes seed_activity
        if suffix == "activities":
            candidates.append("seed_activity")
    candidates.extend(["main", "seed"])

    for name in candidates:
        fn = getattr(module, name, None)
        if callable(fn):
            return fn
    return None


def run_seed_script(module_name: str, file_path: str) -> bool:
    """
    Run a single seed script.
    Returns True if successful, False otherwise.
    """
    script_name = Path(file_path).stem

    print(f"\n{Colors.BOLD}{Colors.OKBLUE}▶ Running: {script_name}{Colors.ENDC}")
    print(f"  Module: {module_name}")
    print(f"  Path: {file_path}")
    print()

    start_time = time.time()

    try:
        module = importlib.import_module(module_name)
        main_func = resolve_entry_point(module, script_name)

        if not main_func:
            print_error(f"No entry point found in {module_name}")
            print_info(
                "Expected a callable named after the file "
                "(e.g. seed_orgs for _001_seed_orgs), or main / seed"
            )
            return False

        main_func()

        elapsed_time = time.time() - start_time
        print()
        print_success(f"Completed {script_name} in {elapsed_time:.2f}s")

        return True

    except Exception as e:
        elapsed_time = time.time() - start_time
        print()
        print_error(f"Failed to run {script_name} after {elapsed_time:.2f}s")
        print_error(f"Error: {str(e)}")

        import traceback

        print(f"\n{Colors.FAIL}Traceback:{Colors.ENDC}")
        traceback.print_exc()

        return False


def main():
    """Main entry point for the seed script."""
    print_header("Skolist Database Python Seed Scripts")

    print_info("Auto-discovers python_seeds/_…_seed_….py (sorted by name).")
    print_info("Make sure you've run 'supabase db reset' first to apply SQL seeds.\n")

    # Ensure skolist-db root is on sys.path for `python_seeds.*` imports
    root = Path(__file__).resolve().parent
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))

    seed_scripts = discover_seed_scripts()

    if not seed_scripts:
        print_warning("No seed scripts found in python_seeds/")
        print_info(
            "Add scripts named like: _001_seed_orgs.py "
            "(must start with `_` and contain `_seed_`)"
        )
        sys.exit(1)

    print(f"Found {len(seed_scripts)} seed script(s):")
    for _module_name, file_path in seed_scripts:
        print(f"  • {Path(file_path).stem}")

    results = []
    for module_name, file_path in seed_scripts:
        success = run_seed_script(module_name, file_path)
        results.append((Path(file_path).stem, success))

    print_header("Seed Summary")

    success_count = sum(1 for _, success in results if success)
    failure_count = len(results) - success_count

    for script_name, success in results:
        if success:
            print_success(f"{script_name}")
        else:
            print_error(f"{script_name}")

    print()
    print(f"Total: {len(results)} script(s)")
    print(f"Success: {success_count}")
    print(f"Failed: {failure_count}")

    if failure_count > 0:
        print()
        print_error("Some seed scripts failed. Check the logs above for details.")
        sys.exit(1)

    print()
    print_success("All seed scripts completed successfully!")
    print()


if __name__ == "__main__":
    main()
