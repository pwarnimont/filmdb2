#!/usr/bin/env python3
"""Create a project virtual environment and install requirements."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
VENV_DIR = ROOT_DIR / 'venv'
REQUIREMENTS_FILE = ROOT_DIR / 'requirements.txt'


def venv_python() -> Path:
  if os.name == 'nt':
    return VENV_DIR / 'Scripts' / 'python.exe'
  return VENV_DIR / 'bin' / 'python'


def venv_pip() -> Path:
  if os.name == 'nt':
    return VENV_DIR / 'Scripts' / 'pip.exe'
  return VENV_DIR / 'bin' / 'pip'


def main() -> None:
  if not REQUIREMENTS_FILE.exists():
    print('requirements.txt not found. Nothing to install.', file=sys.stderr)
    sys.exit(1)

  if not VENV_DIR.exists():
    print(f'Creating virtual environment at {VENV_DIR}...')
    subprocess.check_call([sys.executable, '-m', 'venv', str(VENV_DIR)])
  else:
    print(f'Virtual environment already exists at {VENV_DIR}.')

  pip_executable = venv_pip()
  print('Installing dependencies from requirements.txt...')
  subprocess.check_call([str(pip_executable), 'install', '-r', str(REQUIREMENTS_FILE)])

  python_exec = venv_python()
  print('\nEnvironment ready! Activate it with:')
  if os.name == 'nt':
    activate_script = VENV_DIR / 'Scripts' / 'activate'
    print(f'  {activate_script}')
  else:
    print('  source venv/bin/activate')
  print('\nUse the virtual environment Python at:')
  print(f'  {python_exec}')


if __name__ == '__main__':
  try:
    main()
  except subprocess.CalledProcessError as exc:  # pragma: no cover
    print(f'Command failed with exit code {exc.returncode}', file=sys.stderr)
    sys.exit(exc.returncode)
