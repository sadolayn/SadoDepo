#!/usr/bin/env python3
"""CLAUDE.md'deki güvenlik kuralını zorlar (PreToolUse).

- Write/Edit: keşif/ham dosya adlarına ve .env'e yazmayı, içerikte gizli anahtar
  görünen yazmaları engeller.
- Bash: `git add -f` ile yok sayılan dosya eklemeyi ve gizli anahtar ya da yasaklı
  dosya içeren commit'leri engeller.
Çıkış kodu 2 = işlem durdurulur, stderr Claude'a gösterilir.
"""
import fnmatch
import json
import os
import re
import subprocess
import sys

YASAK_AD = ["kesif*", "*.kesif.*", "ham_*", "*.env", ".env*"]

# Firebase web yapılandırması (alerts.html) tarayıcıda görünür olacak şekilde
# tasarlandı; CLAUDE.md bu dosyayı istisna sayıyor.
ISTISNA = {"alerts.html"}

GIZLI = [
    (r"ghp_[A-Za-z0-9]{30,}", "GitHub token"),
    (r"github_pat_[A-Za-z0-9_]{30,}", "GitHub token"),
    (r"gho_[A-Za-z0-9]{30,}", "GitHub token"),
    (r"sk-(?:ant-|proj-)?[A-Za-z0-9_\-]{20,}", "API anahtarı (sk-)"),
    (r"AKIA[0-9A-Z]{16}", "AWS anahtarı"),
    (r"xox[abprs]-[A-Za-z0-9\-]{10,}", "Slack token"),
    (r"-----BEGIN [A-Z ]*PRIVATE KEY-----", "özel anahtar"),
    (r"AIza[0-9A-Za-z_\-]{35}", "Google API anahtarı"),
]


def dur(mesaj):
    print("⛔ SadoDepo güvenlik kuralı (CLAUDE.md): " + mesaj, file=sys.stderr)
    sys.exit(2)


def yasak_ad_mi(yol):
    ad = os.path.basename(yol)
    return any(fnmatch.fnmatch(ad, d) for d in YASAK_AD)


def gizli_bul(metin):
    for desen, ne in GIZLI:
        if re.search(desen, metin or ""):
            return ne
    return None


def yazma(girdi):
    yol = girdi.get("file_path") or girdi.get("notebook_path") or ""
    if yasak_ad_mi(yol):
        dur(f"'{os.path.basename(yol)}' keşif/ham ya da .env dosyası gibi görünüyor; "
            "bu tür dosyalar depoya yazılmaz. Gerekirse depo dışında (/tmp) çalış.")
    if os.path.basename(yol) in ISTISNA:
        return
    metin = girdi.get("content", "") + girdi.get("new_string", "")
    for e in girdi.get("edits", []) or []:
        metin += e.get("new_string", "")
    ne = gizli_bul(metin)
    if ne:
        dur(f"yazılan içerikte {ne} var gibi görünüyor. Anahtar/token depoya girmez; "
            "GitHub Secrets kullan.")


def git(*arg):
    r = subprocess.run(["git", *arg], capture_output=True, text=True,
                       cwd=os.environ.get("CLAUDE_PROJECT_DIR") or None)
    return r.stdout if r.returncode == 0 else ""


def diff_tara(diff):
    dosya = None
    for satir in diff.splitlines():
        if satir.startswith("+++ b/"):
            dosya = satir[6:]
            if yasak_ad_mi(dosya):
                dur(f"commit'te yasaklı dosya var: {dosya}")
        elif satir.startswith("+") and not satir.startswith("+++"):
            if dosya and os.path.basename(dosya) in ISTISNA:
                continue
            ne = gizli_bul(satir)
            if ne:
                dur(f"commit'te {ne} var gibi görünüyor ({dosya}). Commit durduruldu.")


def komut(girdi):
    k = girdi.get("command", "")
    if re.search(r"\bgit\s+add\b[^;&|]*\s(-f|--force)\b", k):
        dur("`git add -f` .gitignore'u (keşif/ham dosya engelini) atlar; kullanma.")
    if re.search(r"\bgit\b[^;&|]*\bcommit\b", k):
        diff = git("diff", "--cached", "--no-color", "-U0")
        if re.search(r"\scommit\b[^;&|]*\s(-a|--all|-am)\b", k):
            diff += git("diff", "--no-color", "-U0")
        diff_tara(diff)


def main():
    try:
        veri = json.load(sys.stdin)
    except Exception:
        return
    arac = veri.get("tool_name", "")
    girdi = veri.get("tool_input", {}) or {}
    if arac in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
        yazma(girdi)
    elif arac == "Bash":
        komut(girdi)


if __name__ == "__main__":
    main()
