#!/usr/bin/env python3
"""Düzenlenen dosyada sözdizimi hatası var mı bakar (PostToolUse).

.js → node --check, .py → py_compile, .json → json.load.
Hata varsa çıkış kodu 2 ve hata metni Claude'a gider; Claude düzeltir.
HTML içindeki <script> blokları da node ile denetlenir.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile


def hata(yol, mesaj):
    print(f"⚠️ Sözdizimi hatası ({os.path.basename(yol)}):\n{mesaj.strip()[:1500]}",
          file=sys.stderr)
    sys.exit(2)


def node_kontrol(yol, kod=None):
    node = shutil.which("node")
    if not node:
        return None
    if kod is None:
        r = subprocess.run([node, "--check", yol], capture_output=True, text=True)
        return r.stderr if r.returncode else None
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(kod)
        gecici = f.name
    try:
        r = subprocess.run([node, "--check", gecici], capture_output=True, text=True)
        return r.stderr.replace(gecici, os.path.basename(yol)) if r.returncode else None
    finally:
        os.unlink(gecici)


def html_scriptleri(yol):
    with open(yol, encoding="utf-8", errors="replace") as f:
        metin = f.read()
    for m in re.finditer(r"<script(?P<a>[^>]*)>(?P<k>.*?)</script>", metin, re.S | re.I):
        a = m.group("a").lower()
        if "src=" in a or ("type=" in a and "javascript" not in a and "module" not in a):
            continue
        kod = m.group("k")
        if not kod.strip():
            continue
        satir = metin[: m.start("k")].count("\n")
        # satır numaraları dosyayla eşleşsin diye başa boş satır ekle
        e = node_kontrol(yol, "\n" * satir + kod)
        if e:
            hata(yol, e)


def main():
    try:
        veri = json.load(sys.stdin)
    except Exception:
        return
    girdi = veri.get("tool_input", {}) or {}
    yol = girdi.get("file_path") or ""
    if not yol or not os.path.isfile(yol):
        return
    uz = os.path.splitext(yol)[1].lower()
    if uz in (".js", ".mjs"):
        e = node_kontrol(yol)
        if e:
            hata(yol, e)
    elif uz == ".py":
        # compile() bellekte derler; depoya __pycache__ bırakmaz
        try:
            with open(yol, encoding="utf-8") as f:
                compile(f.read(), yol, "exec")
        except SyntaxError as ex:
            hata(yol, f"{ex.msg} (satır {ex.lineno})\n{(ex.text or '').rstrip()}")
    elif uz in (".json", ".webmanifest"):
        try:
            with open(yol, encoding="utf-8") as f:
                json.load(f)
        except Exception as ex:
            hata(yol, str(ex))
    elif uz == ".html":
        html_scriptleri(yol)


if __name__ == "__main__":
    main()
