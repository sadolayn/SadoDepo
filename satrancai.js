/* Satranç motoru (Sadolayn) — kurallar + arama, 8 Kasım 2026.
   Aynı dosya üç yerde çalışır: sayfada (window.Satranc: kurallar, notasyon), Web Worker'da (hamle düşünme; arayüz donmaz)
   ve Node'da (testler: perft). Tahta 0x88 düzeninde: kare = sıra*16 + sütun (a1 = 0, h8 = 119).
   Taşlar: 1 piyon, 2 at, 3 fil, 4 kale, 5 vezir, 6 şah; siyah taşlara +8.
   Arama: iteratif derinleştirme, alfa-beta (PVS), yer değiştirme tablosu, sessizlik araması, MVV-LVA + katil hamle + geçmiş sıralaması,
   boş hamle budaması, geç hamle azaltma, şah uzatması. Değerlendirme: taş değeri + taş-kare tabloları (oyun ortası/oyun sonu karışımı),
   piyon yapısı, fil çifti, açık hat kalesi, şah önü piyonları, oyun sonunda karşı şahı kenara sıkıştırma. */
(function (G) {
  "use strict";
  const PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6;
  const F_CAP = 1, F_EP = 2, F_CASTLE = 4, F_DBL = 8;
  const NOFF = [33, 31, 18, 14, -33, -31, -18, -14], BOFF = [15, 17, -15, -17], ROFF = [16, -16, 1, -1], KOFF = [15, 16, 17, 1, -1, -15, -16, -17];
  const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  // ===== Zobrist anahtarları (iki 32 bitlik parça: çakışma neredeyse imkânsız) =====
  let seed = 0x2545f491;
  const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed | 0; };
  const ZLO = new Int32Array(16 * 128), ZHI = new Int32Array(16 * 128);
  for (let i = 0; i < 16 * 128; i++) { ZLO[i] = rnd(); ZHI[i] = rnd(); }
  const ZCL = new Int32Array(16), ZCH = new Int32Array(16), ZEL = new Int32Array(8), ZEH = new Int32Array(8);
  for (let i = 0; i < 16; i++) { ZCL[i] = rnd(); ZCH[i] = rnd(); }
  for (let i = 0; i < 8; i++) { ZEL[i] = rnd(); ZEH[i] = rnd(); }
  const SIDEL = rnd(), SIDEH = rnd();
  // Rok hakları: 1 beyaz kısa, 2 beyaz uzun, 4 siyah kısa, 8 siyah uzun. Şah ya da kale oynayınca (veya kale alınınca) hak düşer.
  const CMASK = new Int8Array(128).fill(15);
  CMASK[0] = 13; CMASK[7] = 14; CMASK[4] = 12; CMASK[112] = 7; CMASK[119] = 11; CMASK[116] = 3;

  function Pos() {
    this.b = new Int8Array(128); this.turn = 0; this.castle = 0; this.ep = -1; this.half = 0; this.full = 1;
    this.kw = 4; this.kb = 116; this.lo = 0; this.hi = 0;
    this.st = []; this.hl = []; this.hh = []; // geri alma yığını; önceki konumların anahtarları (tekrar kontrolü)
  }
  function rehash(p) {
    let lo = 0, hi = 0;
    for (let s = 0; s < 128; s++) { if (s & 0x88) { s += 7; continue; } const x = p.b[s]; if (x) { lo ^= ZLO[x * 128 + s]; hi ^= ZHI[x * 128 + s]; } }
    lo ^= ZCL[p.castle]; hi ^= ZCH[p.castle];
    if (p.ep >= 0) { lo ^= ZEL[p.ep & 7]; hi ^= ZEH[p.ep & 7]; }
    if (p.turn) { lo ^= SIDEL; hi ^= SIDEH; }
    p.lo = lo; p.hi = hi;
  }
  const sqName = (s) => "abcdefgh"[s & 7] + ((s >> 4) + 1);
  const sqOf = (n) => (n.charCodeAt(1) - 49) * 16 + (n.charCodeAt(0) - 97);
  const PCH = { p: 1, n: 2, b: 3, r: 4, q: 5, k: 6 };
  function fromFen(fen) {
    const p = new Pos(), f = (fen || START).trim().split(/\s+/);
    let r = 7, c = 0;
    for (const ch of f[0]) {
      if (ch === "/") { r--; c = 0; } else if (ch >= "1" && ch <= "8") c += +ch;
      else { const lo = ch.toLowerCase(), t = PCH[lo], col = ch === lo ? 8 : 0, sq = r * 16 + c; p.b[sq] = t | col; if (t === KING) { if (col) p.kb = sq; else p.kw = sq; } c++; }
    }
    p.turn = f[1] === "b" ? 8 : 0;
    const cs = f[2] || "-"; p.castle = (cs.includes("K") ? 1 : 0) | (cs.includes("Q") ? 2 : 0) | (cs.includes("k") ? 4 : 0) | (cs.includes("q") ? 8 : 0);
    p.ep = f[3] && f[3] !== "-" ? sqOf(f[3]) : -1;
    p.half = +f[4] || 0; p.full = +f[5] || 1;
    rehash(p); return p;
  }
  function toFen(p) {
    let s = "";
    for (let r = 7; r >= 0; r--) {
      let e = 0;
      for (let c = 0; c < 8; c++) { const x = p.b[r * 16 + c]; if (!x) { e++; continue; } if (e) { s += e; e = 0; } const ch = " pnbrqk"[x & 7]; s += x & 8 ? ch : ch.toUpperCase(); }
      if (e) s += e; if (r) s += "/";
    }
    const cs = (p.castle & 1 ? "K" : "") + (p.castle & 2 ? "Q" : "") + (p.castle & 4 ? "k" : "") + (p.castle & 8 ? "q" : "");
    return `${s} ${p.turn ? "b" : "w"} ${cs || "-"} ${p.ep >= 0 ? sqName(p.ep) : "-"} ${p.half} ${p.full}`;
  }

  // ===== Saldırı ve hamle üretimi =====
  function attacked(p, sq, by) {
    const b = p.b;
    if (by === 0) { let s = sq - 15; if (!(s & 0x88) && b[s] === 1) return true; s = sq - 17; if (!(s & 0x88) && b[s] === 1) return true; }
    else { let s = sq + 15; if (!(s & 0x88) && b[s] === 9) return true; s = sq + 17; if (!(s & 0x88) && b[s] === 9) return true; }
    const kn = KNIGHT | by, kg = KING | by, bi = BISHOP | by, rk = ROOK | by, qn = QUEEN | by;
    for (let i = 0; i < 8; i++) {
      let s = sq + NOFF[i]; if (!(s & 0x88) && b[s] === kn) return true;
      s = sq + KOFF[i]; if (!(s & 0x88) && b[s] === kg) return true;
    }
    for (let i = 0; i < 4; i++) {
      const d = BOFF[i]; let s = sq + d;
      while (!(s & 0x88)) { const x = b[s]; if (x) { if (x === bi || x === qn) return true; break; } s += d; }
      const e = ROFF[i]; s = sq + e;
      while (!(s & 0x88)) { const x = b[s]; if (x) { if (x === rk || x === qn) return true; break; } s += e; }
    }
    return false;
  }
  const inCheck = (p) => attacked(p, p.turn ? p.kb : p.kw, p.turn ^ 8);
  const leftInCheck = (p) => attacked(p, p.turn ? p.kw : p.kb, p.turn); // hamleyi yapan taraf şahını açıkta bıraktı mı
  function addPromo(out, f, t, fl) { for (let pr = 5; pr >= 2; pr--) out.push(f | (t << 7) | (pr << 14) | (fl << 18)); }
  function gen(p, caps) {
    const out = [], b = p.b, us = p.turn, them = us ^ 8;
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) { sq += 7; continue; }
      const pc = b[sq]; if (!pc || (pc & 8) !== us) continue;
      const t = pc & 7;
      if (t === PAWN) {
        const dir = us ? -16 : 16, r = sq >> 4, last = us ? 1 : 6, start = us ? 6 : 1, to = sq + dir;
        if (!b[to]) {
          if (r === last) addPromo(out, sq, to, 0);
          else if (!caps) { out.push(sq | (to << 7)); if (r === start && !b[to + dir]) out.push(sq | ((to + dir) << 7) | (F_DBL << 18)); }
        }
        for (let k = -1; k <= 1; k += 2) {
          const c = to + k; if (c & 0x88) continue; const x = b[c];
          if (x && (x & 8) === them) { if (r === last) addPromo(out, sq, c, F_CAP); else out.push(sq | (c << 7) | (F_CAP << 18)); }
          else if (c === p.ep && !x) out.push(sq | (c << 7) | ((F_CAP | F_EP) << 18));
        }
      } else if (t === KNIGHT || t === KING) {
        const off = t === KNIGHT ? NOFF : KOFF;
        for (let i = 0; i < 8; i++) {
          const to = sq + off[i]; if (to & 0x88) continue; const x = b[to];
          if (!x) { if (!caps) out.push(sq | (to << 7)); } else if ((x & 8) === them) out.push(sq | (to << 7) | (F_CAP << 18));
        }
        if (t === KING && !caps) {
          if (us === 0 && sq === 4) {
            if (p.castle & 1 && !b[5] && !b[6] && b[7] === ROOK && !attacked(p, 4, 8) && !attacked(p, 5, 8)) out.push(4 | (6 << 7) | (F_CASTLE << 18));
            if (p.castle & 2 && !b[3] && !b[2] && !b[1] && b[0] === ROOK && !attacked(p, 4, 8) && !attacked(p, 3, 8)) out.push(4 | (2 << 7) | (F_CASTLE << 18));
          } else if (us === 8 && sq === 116) {
            if (p.castle & 4 && !b[117] && !b[118] && b[119] === (ROOK | 8) && !attacked(p, 116, 0) && !attacked(p, 117, 0)) out.push(116 | (118 << 7) | (F_CASTLE << 18));
            if (p.castle & 8 && !b[115] && !b[114] && !b[113] && b[112] === (ROOK | 8) && !attacked(p, 116, 0) && !attacked(p, 115, 0)) out.push(116 | (114 << 7) | (F_CASTLE << 18));
          }
        }
      } else {
        const off = t === BISHOP ? BOFF : t === ROOK ? ROFF : KOFF, n = off.length;
        for (let i = 0; i < n; i++) {
          const d = off[i]; let to = sq + d;
          while (!(to & 0x88)) {
            const x = b[to];
            if (!x) { if (!caps) out.push(sq | (to << 7)); }
            else { if ((x & 8) === them) out.push(sq | (to << 7) | (F_CAP << 18)); break; }
            to += d;
          }
        }
      }
    }
    return out;
  }
  function make(p, m) {
    const b = p.b, from = m & 127, to = (m >> 7) & 127, pr = (m >> 14) & 15, fl = m >>> 18, us = p.turn, pc = b[from];
    let capSq = to, cap = b[to];
    if (fl & F_EP) { capSq = to + (us ? 16 : -16); cap = b[capSq]; }
    p.st.push(m, cap, p.castle, p.ep, p.half, p.lo, p.hi);
    p.hl.push(p.lo); p.hh.push(p.hi);
    let lo = p.lo ^ ZLO[pc * 128 + from], hi = p.hi ^ ZHI[pc * 128 + from];
    if (cap) { lo ^= ZLO[cap * 128 + capSq]; hi ^= ZHI[cap * 128 + capSq]; b[capSq] = 0; }
    const np = pr ? pr | us : pc;
    b[to] = np; b[from] = 0; lo ^= ZLO[np * 128 + to]; hi ^= ZHI[np * 128 + to];
    if (fl & F_CASTLE) {
      let rf, rt; if (to === from + 2) { rf = from + 3; rt = from + 1; } else { rf = from - 4; rt = from - 1; }
      const rk = b[rf]; b[rt] = rk; b[rf] = 0;
      lo ^= ZLO[rk * 128 + rf] ^ ZLO[rk * 128 + rt]; hi ^= ZHI[rk * 128 + rf] ^ ZHI[rk * 128 + rt];
    }
    if ((pc & 7) === KING) { if (us) p.kb = to; else p.kw = to; }
    lo ^= ZCL[p.castle]; hi ^= ZCH[p.castle]; p.castle &= CMASK[from] & CMASK[to]; lo ^= ZCL[p.castle]; hi ^= ZCH[p.castle];
    if (p.ep >= 0) { lo ^= ZEL[p.ep & 7]; hi ^= ZEH[p.ep & 7]; }
    p.ep = -1;
    if (fl & F_DBL) { // geçerken alma karesi yalnızca yanında karşı piyon varsa işaretlenir (tekrar sayımı doğru olsun)
      const ep = PAWN | (us ^ 8), l = to - 1, r = to + 1;
      if ((!(l & 0x88) && b[l] === ep) || (!(r & 0x88) && b[r] === ep)) { p.ep = (from + to) >> 1; lo ^= ZEL[p.ep & 7]; hi ^= ZEH[p.ep & 7]; }
    }
    p.half = (pc & 7) === PAWN || cap ? 0 : p.half + 1;
    if (us) p.full++;
    p.turn = us ^ 8; p.lo = lo ^ SIDEL; p.hi = hi ^ SIDEH;
  }
  function unmake(p) {
    const st = p.st;
    p.hi = st.pop(); p.lo = st.pop(); p.half = st.pop(); p.ep = st.pop(); p.castle = st.pop(); const cap = st.pop(), m = st.pop();
    p.hl.pop(); p.hh.pop();
    p.turn ^= 8; const us = p.turn; if (us) p.full--;
    const b = p.b, from = m & 127, to = (m >> 7) & 127, pr = (m >> 14) & 15, fl = m >>> 18;
    const pc = pr ? PAWN | us : b[to];
    b[from] = pc; b[to] = 0;
    if (fl & F_EP) b[to + (us ? 16 : -16)] = cap; else b[to] = cap;
    if (fl & F_CASTLE) { if (to === from + 2) { b[from + 3] = b[from + 1]; b[from + 1] = 0; } else { b[from - 4] = b[from - 1]; b[from - 1] = 0; } }
    if ((pc & 7) === KING) { if (us) p.kb = from; else p.kw = from; }
  }
  function makeNull(p) {
    p.st.push(0, 0, p.castle, p.ep, p.half, p.lo, p.hi); p.hl.push(p.lo); p.hh.push(p.hi);
    if (p.ep >= 0) { p.lo ^= ZEL[p.ep & 7]; p.hi ^= ZEH[p.ep & 7]; }
    p.ep = -1; p.half = 0; p.turn ^= 8; p.lo ^= SIDEL; p.hi ^= SIDEH;
  }
  function unmakeNull(p) {
    const st = p.st; p.hi = st.pop(); p.lo = st.pop(); p.half = st.pop(); p.ep = st.pop(); p.castle = st.pop(); st.pop(); st.pop();
    p.hl.pop(); p.hh.pop(); p.turn ^= 8;
  }
  function legal(p) {
    const L = gen(p, false), out = [];
    for (let i = 0; i < L.length; i++) { make(p, L[i]); if (!leftInCheck(p)) out.push(L[i]); unmake(p); }
    return out;
  }
  function perft(p, d) {
    if (d === 0) return 1;
    const L = gen(p, false); let n = 0;
    for (let i = 0; i < L.length; i++) { make(p, L[i]); if (!leftInCheck(p)) n += d === 1 ? 1 : perft(p, d - 1); unmake(p); }
    return n;
  }
  function toUci(m) { const pr = (m >> 14) & 15; return sqName(m & 127) + sqName((m >> 7) & 127) + (pr ? " pnbrq"[pr] : ""); }
  function fromUci(p, u) { const L = legal(p); for (let i = 0; i < L.length; i++) if (toUci(L[i]) === u) return L[i]; return 0; }

  // ===== Oyun durumu: mat, pat, üç tekrar, 50 hamle, yetersiz taş =====
  function repCount(p) {
    const n = p.hl.length, lim = Math.max(0, n - p.half); let c = 1;
    for (let i = n - 2; i >= lim; i -= 2) if (p.hl[i] === p.lo && p.hh[i] === p.hi) c++;
    return c;
  }
  function isRep(p) {
    const n = p.hl.length, lim = Math.max(0, n - p.half);
    for (let i = n - 2; i >= lim; i -= 2) if (p.hl[i] === p.lo && p.hh[i] === p.hi) return true;
    return false;
  }
  function insufficient(p) {
    let minors = 0, bsq = [];
    for (let s = 0; s < 128; s++) {
      if (s & 0x88) { s += 7; continue; }
      const t = p.b[s] & 7; if (!t || t === KING) continue;
      if (t === PAWN || t === ROOK || t === QUEEN) return false;
      minors++; if (t === BISHOP) bsq.push(((s >> 4) + (s & 7)) & 1);
    }
    if (minors <= 1) return true;
    return bsq.length === minors && bsq.every((x) => x === bsq[0]); // yalnızca aynı renk karede filler
  }
  function status(p) {
    const L = legal(p), chk = inCheck(p);
    if (!L.length) return chk ? { over: true, reason: "mat", winner: p.turn ^ 8, check: true, legal: L } : { over: true, reason: "pat", legal: L };
    if (p.half >= 100) return { over: true, reason: "50", legal: L, check: chk };
    if (repCount(p) >= 3) return { over: true, reason: "tekrar", legal: L, check: chk };
    if (insufficient(p)) return { over: true, reason: "malzeme", legal: L, check: chk };
    return { over: false, check: chk, legal: L };
  }
  // Türkçe notasyon: Ş şah, V vezir, K kale, F fil, A at; piyonun harfi yok
  const TRL = ["", "", "A", "F", "K", "V", "Ş"];
  function san(p, m, L) {
    L = L || legal(p);
    const from = m & 127, to = (m >> 7) & 127, pr = (m >> 14) & 15, fl = m >>> 18, t = p.b[from] & 7;
    let s;
    if (fl & F_CASTLE) s = to > from ? "O-O" : "O-O-O";
    else if (t === PAWN) s = (fl & F_CAP ? "abcdefgh"[from & 7] + "x" : "") + sqName(to) + (pr ? "=" + TRL[pr] : "");
    else {
      s = TRL[t];
      const others = L.filter((x) => x !== m && ((x >> 7) & 127) === to && (p.b[x & 127] & 7) === t).map((x) => x & 127);
      if (others.length) {
        if (others.every((o) => (o & 7) !== (from & 7))) s += "abcdefgh"[from & 7];
        else if (others.every((o) => (o >> 4) !== (from >> 4))) s += (from >> 4) + 1;
        else s += sqName(from);
      }
      s += (fl & F_CAP ? "x" : "") + sqName(to);
    }
    make(p, m);
    if (inCheck(p)) s += legal(p).length ? "+" : "#";
    unmake(p);
    return s;
  }

  // ===== Değerlendirme =====
  const VAL = [0, 100, 320, 330, 500, 900, 0];
  const T = [null,
    [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
    [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
  ];
  const KEND = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];
  // Kare tablosu dizini: tablolar beyazın gözünden, üst satır 8. sıra
  const IW = new Int8Array(128), IB = new Int8Array(128);
  for (let s = 0; s < 128; s++) { if (s & 0x88) continue; const r = s >> 4, f = s & 7; IW[s] = (7 - r) * 8 + f; IB[s] = r * 8 + f; }
  const MOBC = [0, 0, 4, 6, 7, 13, 0], MOBM = [0, 0, 4, 5, 2, 1, 0], MOBE = [0, 0, 4, 5, 4, 2, 0];
  const PASS_MG = [0, 5, 10, 15, 25, 40, 60, 0], PASS_EG = [0, 10, 20, 35, 60, 100, 150, 0];
  const CDIST = (s) => { const r = s >> 4, f = s & 7; return Math.max(3 - r, r - 4) + Math.max(3 - f, f - 4); };
  const wPF = new Int8Array(8), bPF = new Int8Array(8), wMin = new Int8Array(8), bMax = new Int8Array(8);
  function evaluate(p) {
    const b = p.b;
    let mg = 0, eg = 0, phase = 0, wB = 0, bB = 0, wMat = 0, bMat = 0;
    wPF.fill(0); bPF.fill(0); wMin.fill(8); bMax.fill(-1);
    const pawns = [], rooks = [];
    for (let s = 0; s < 128; s++) {
      if (s & 0x88) { s += 7; continue; }
      const x = b[s]; if (!x) continue;
      const t = x & 7, black = x & 8, i = black ? IB[s] : IW[s];
      let m1, e1;
      if (t === KING) { m1 = T[6][i]; e1 = KEND[i]; }
      else { m1 = VAL[t] + T[t][i]; e1 = VAL[t] + (t === PAWN ? 0 : T[t][i] >> 1); }
      if (t === KNIGHT || t === BISHOP) phase += 1; else if (t === ROOK) phase += 2; else if (t === QUEEN) phase += 4;
      if (t === BISHOP) { if (black) bB++; else wB++; }
      if (t >= KNIGHT && t <= QUEEN) { // hareket alanı: taşın gidebildiği kare sayısı (ortalamaya göre)
        const off = t === KNIGHT ? NOFF : t === BISHOP ? BOFF : t === ROOK ? ROFF : KOFF, n = off.length, own = black;
        let mob = 0;
        for (let j = 0; j < n; j++) {
          const d = off[j]; let q = s + d;
          while (!(q & 0x88)) { const y = b[q]; if (y && (y & 8) === own) break; mob++; if (y || t === KNIGHT) break; q += d; }
        }
        m1 += (mob - MOBC[t]) * MOBM[t]; e1 += (mob - MOBC[t]) * MOBE[t];
      }
      if (t !== PAWN && t !== KING) { if (black) bMat += VAL[t]; else wMat += VAL[t]; }
      if (t === PAWN) {
        const f = s & 7, r = s >> 4; pawns.push(s);
        if (black) { bPF[f]++; if (r > bMax[f]) bMax[f] = r; } else { wPF[f]++; if (r < wMin[f]) wMin[f] = r; }
        if (black) bMat += 100; else wMat += 100;
      } else if (t === ROOK) rooks.push(s);
      if (black) { mg -= m1; eg -= e1; } else { mg += m1; eg += e1; }
    }
    // Piyon yapısı: geçer piyon, çift piyon, yalnız piyon
    for (let k = 0; k < pawns.length; k++) {
      const s = pawns[k], f = s & 7, r = s >> 4, black = b[s] & 8;
      const adjL = f > 0, adjR = f < 7;
      if (!black) {
        const iso = (!adjL || !wPF[f - 1]) && (!adjR || !wPF[f + 1]);
        if (iso) { mg -= 10; eg -= 14; }
        let passed = bMax[f] <= r && (!adjL || bMax[f - 1] <= r) && (!adjR || bMax[f + 1] <= r);
        if (passed && wMin[f] === r) { mg += PASS_MG[r]; eg += PASS_EG[r]; } else if (passed) { mg += PASS_MG[r] >> 1; eg += PASS_EG[r] >> 1; }
      } else {
        const iso = (!adjL || !bPF[f - 1]) && (!adjR || !bPF[f + 1]);
        if (iso) { mg += 10; eg += 14; }
        const passed = (wMin[f] === 8 || wMin[f] >= r) && (!adjL || wMin[f - 1] >= r) && (!adjR || wMin[f + 1] >= r);
        const rr = 7 - r;
        if (passed && bMax[f] === r) { mg -= PASS_MG[rr]; eg -= PASS_EG[rr]; } else if (passed) { mg -= PASS_MG[rr] >> 1; eg -= PASS_EG[rr] >> 1; }
      }
    }
    for (let f = 0; f < 8; f++) { if (wPF[f] > 1) { mg -= 12 * (wPF[f] - 1); eg -= 18 * (wPF[f] - 1); } if (bPF[f] > 1) { mg += 12 * (bPF[f] - 1); eg += 18 * (bPF[f] - 1); } }
    for (let k = 0; k < rooks.length; k++) {
      const s = rooks[k], f = s & 7, black = b[s] & 8, own = black ? bPF[f] : wPF[f], opp = black ? wPF[f] : bPF[f];
      const v = !own ? (!opp ? 20 : 10) : 0; if (black) { mg -= v; eg -= v >> 1; } else { mg += v; eg += v >> 1; }
    }
    if (wB >= 2) { mg += 30; eg += 45; } if (bB >= 2) { mg -= 30; eg -= 45; }
    // Şah önü piyonları (oyun ortası)
    const shield = (k, black) => {
      const r = k >> 4, f = k & 7, dir = black ? -16 : 16, pw = PAWN | (black ? 8 : 0); let n = 0;
      if (black ? r < 6 : r > 1) return 0;
      for (let df = -1; df <= 1; df++) { if (f + df < 0 || f + df > 7) continue; const s1 = k + dir + df, s2 = s1 + dir; if (!(s1 & 0x88) && b[s1] === pw) n += 12; else if (!(s2 & 0x88) && b[s2] === pw) n += 6; }
      return n;
    };
    mg += shield(p.kw, 0) - shield(p.kb, 1);
    // Oyun sonu: önde olan taraf karşı şahı kenara sıkıştırsın, kendi şahını yaklaştırsın (mat verebilsin)
    if (phase < 10) {
      const diff = wMat - bMat;
      if (Math.abs(diff) >= 300) {
        const win = diff > 0, lk = win ? p.kb : p.kw, wk = win ? p.kw : p.kb;
        const dist = Math.abs((lk >> 4) - (wk >> 4)) + Math.abs((lk & 7) - (wk & 7));
        const v = CDIST(lk) * 12 + (14 - dist) * 5;
        eg += win ? v : -v;
      }
    }
    if (phase > 24) phase = 24;
    let sc = ((mg * phase + eg * (24 - phase)) / 24) | 0;
    // Yalnızca hafif taşla mat olmaz: o tarafın üstünlüğü pek sayılmaz
    if (sc > 0 && wMat - 0 < 400 && !wPF.some((x) => x)) sc >>= 3;
    if (sc < 0 && bMat < 400 && !bPF.some((x) => x)) sc >>= 3;
    return (p.turn ? -sc : sc) + 10;
  }

  // ===== Arama =====
  const INF = 32000, MATE = 30000, MAXPLY = 96;
  const TTS = 1 << 19, TTM = TTS - 1;
  let ttHi = null, ttMv, ttSc, ttDp, ttFl;
  const killers = new Int32Array(MAXPLY * 2), hist = new Int32Array(16 * 128);
  let nodes = 0, stop = false, deadline = 0;
  const now = typeof performance !== "undefined" && performance.now ? () => performance.now() : () => Date.now();
  function ttInit() { if (!ttHi) { ttHi = new Int32Array(TTS); ttMv = new Int32Array(TTS); ttSc = new Int16Array(TTS); ttDp = new Int8Array(TTS); ttFl = new Int8Array(TTS); } }
  const hasPieces = (p) => { const us = p.turn; for (let s = 0; s < 128; s++) { if (s & 0x88) { s += 7; continue; } const x = p.b[s]; if (x && (x & 8) === us) { const t = x & 7; if (t !== PAWN && t !== KING) return true; } } return false; };
  function order(p, L, ttm, ply) {
    const sc = new Int32Array(L.length), b = p.b, k1 = killers[ply * 2], k2 = killers[ply * 2 + 1];
    for (let i = 0; i < L.length; i++) {
      const m = L[i], fl = m >>> 18, pr = (m >> 14) & 15, to = (m >> 7) & 127;
      if (m === ttm) sc[i] = 3e6;
      else if (fl & F_CAP) sc[i] = 1e6 + (fl & F_EP ? 1 : b[to] & 7) * 100 - (b[m & 127] & 7) + (pr === QUEEN ? 5e4 : 0);
      else if (pr) sc[i] = pr === QUEEN ? 9e5 : -1e5;
      else if (m === k1) sc[i] = 8e5;
      else if (m === k2) sc[i] = 7e5;
      else sc[i] = hist[b[m & 127] * 128 + to];
    }
    return sc;
  }
  function pick(L, sc, i) { let bi = i; for (let j = i + 1; j < L.length; j++) if (sc[j] > sc[bi]) bi = j; if (bi !== i) { const t = L[i]; L[i] = L[bi]; L[bi] = t; const u = sc[i]; sc[i] = sc[bi]; sc[bi] = u; } return L[i]; }
  function qs(p, alpha, beta, ply) {
    if ((++nodes & 2047) === 0 && now() > deadline) stop = true;
    if (stop) return 0;
    const stand = evaluate(p);
    if (ply >= MAXPLY - 1) return stand;
    if (stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    const L = gen(p, true), sc = order(p, L, 0, Math.min(ply, MAXPLY - 1));
    let best = stand;
    for (let i = 0; i < L.length; i++) {
      const m = pick(L, sc, i), fl = m >>> 18;
      if (fl & F_CAP && !((m >> 14) & 15)) { const v = fl & F_EP ? 100 : VAL[p.b[(m >> 7) & 127] & 7]; if (stand + v + 200 < alpha) continue; } // delta budaması
      make(p, m);
      if (leftInCheck(p)) { unmake(p); continue; }
      const s = -qs(p, -beta, -alpha, ply + 1);
      unmake(p);
      if (stop) return 0;
      if (s > best) { best = s; if (s > alpha) { alpha = s; if (s >= beta) break; } }
    }
    return best;
  }
  function negamax(p, depth, alpha, beta, ply, canNull) {
    if ((++nodes & 2047) === 0 && now() > deadline) stop = true;
    if (stop) return 0;
    if (ply > 0 && (p.half >= 100 || isRep(p))) return 0;
    if (ply >= MAXPLY - 2) return evaluate(p);
    // Mat uzaklığı budaması
    const ma = -MATE + ply, mb = MATE - ply - 1; if (ma > alpha) alpha = ma; if (mb < beta) beta = mb; if (alpha >= beta) return alpha;
    const chk = inCheck(p);
    if (chk) depth++;
    if (depth <= 0) return qs(p, alpha, beta, ply);
    const idx = p.lo & TTM; let ttm = 0;
    if (ttFl[idx] && ttHi[idx] === p.hi) {
      ttm = ttMv[idx];
      if (ttDp[idx] >= depth && ply > 0) {
        let s = ttSc[idx]; if (s > MATE - 200) s -= ply; else if (s < -MATE + 200) s += ply;
        const f = ttFl[idx];
        if (f === 1 || (f === 2 && s >= beta) || (f === 3 && s <= alpha)) return s;
      }
    }
    const pv = beta - alpha > 1;
    if (canNull && !chk && !pv && depth >= 3 && ply > 0 && hasPieces(p) && evaluate(p) >= beta) {
      makeNull(p); const s = -negamax(p, depth - 3, -beta, -beta + 1, ply + 1, false); unmakeNull(p);
      if (stop) return 0;
      if (s >= beta) return s >= MATE - 200 ? beta : s;
    }
    const L = gen(p, false), sc = order(p, L, ttm, ply), a0 = alpha;
    let best = -INF, bm = 0, legalN = 0;
    for (let i = 0; i < L.length; i++) {
      const m = pick(L, sc, i), fl = m >>> 18, quiet = !(fl & F_CAP) && !((m >> 14) & 15);
      make(p, m);
      if (leftInCheck(p)) { unmake(p); continue; }
      legalN++;
      let s;
      if (legalN === 1) s = -negamax(p, depth - 1, -beta, -alpha, ply + 1, true);
      else {
        let r = 0;
        if (depth >= 3 && legalN > 3 && quiet && !chk && !inCheck(p)) r = legalN > 8 && depth >= 5 ? 2 : 1;
        s = -negamax(p, depth - 1 - r, -alpha - 1, -alpha, ply + 1, true);
        if (s > alpha && r) s = -negamax(p, depth - 1, -alpha - 1, -alpha, ply + 1, true);
        if (s > alpha && s < beta) s = -negamax(p, depth - 1, -beta, -alpha, ply + 1, true);
      }
      unmake(p);
      if (stop) return 0;
      if (s > best) {
        best = s; bm = m;
        if (s > alpha) {
          alpha = s;
          if (s >= beta) {
            if (quiet) { if (killers[ply * 2] !== m) { killers[ply * 2 + 1] = killers[ply * 2]; killers[ply * 2] = m; } const h = p.b[m & 127] * 128 + ((m >> 7) & 127); hist[h] += depth * depth; if (hist[h] > 6e5) for (let j = 0; j < hist.length; j++) hist[j] >>= 1; }
            break;
          }
        }
      }
    }
    if (!legalN) return chk ? -MATE + ply : 0;
    let ss = best; if (ss > MATE - 200) ss += ply; else if (ss < -MATE + 200) ss -= ply;
    if (ttDp[idx] <= depth || ttHi[idx] !== p.hi) {
      ttHi[idx] = p.hi; ttMv[idx] = bm; ttSc[idx] = ss; ttDp[idx] = depth; ttFl[idx] = best >= beta ? 2 : best > a0 ? 1 : 3;
    }
    return best;
  }
  // En iyi hamleyi ara: ms süre sınırı, maxDepth derinlik sınırı
  function think(p, ms, maxDepth) {
    ttInit(); killers.fill(0); for (let j = 0; j < hist.length; j++) hist[j] >>= 2;
    const t0 = now(); deadline = t0 + ms; stop = false; nodes = 0;
    const root = legal(p);
    if (!root.length) return null;
    let best = root[0], bestScore = 0, done = 0;
    if (root.length === 1) return { move: best, score: 0, depth: 0, nodes: 0, ms: 0 };
    // Önceki aramadan kalan en iyi hamle öne
    const idx = p.lo & TTM; if (ttFl[idx] && ttHi[idx] === p.hi) { const k = root.indexOf(ttMv[idx]); if (k > 0) { root.splice(k, 1); root.unshift(ttMv[idx]); } }
    else { const sc = order(p, root, 0, 0); const o = root.map((m, i) => [m, sc[i]]).sort((a, b) => b[1] - a[1]); for (let i = 0; i < o.length; i++) root[i] = o[i][0]; }
    for (let d = 1; d <= (maxDepth || 64); d++) {
      let alpha = -INF, bs = -INF, bm = 0;
      for (let i = 0; i < root.length; i++) {
        const m = root[i]; make(p, m);
        let s;
        if (i === 0) s = -negamax(p, d - 1, -INF, -alpha, 1, true);
        else { s = -negamax(p, d - 1, -alpha - 1, -alpha, 1, true); if (!stop && s > alpha) s = -negamax(p, d - 1, -INF, -alpha, 1, true); }
        unmake(p);
        if (stop) break;
        if (s > bs) { bs = s; bm = m; if (s > alpha) alpha = s; }
      }
      if (bm) { best = bm; bestScore = bs; const k = root.indexOf(bm); root.splice(k, 1); root.unshift(bm); }
      if (stop) break;
      done = d;
      if (Math.abs(bs) > MATE - 200) break;
      if (now() - t0 > ms * 0.5) break;
    }
    return { move: best, score: bestScore, depth: done, nodes, ms: Math.round(now() - t0) };
  }
  // Her kök hamleye tam pencereyle puan (kolay seviyelerde "insanca" seçim için)
  function rootScores(p, depth, ms) {
    ttInit(); killers.fill(0);
    const t0 = now(); deadline = t0 + ms; stop = false; nodes = 0;
    const out = [];
    for (const m of legal(p)) { make(p, m); const s = -negamax(p, depth - 1, -INF, INF, 1, true); unmake(p); if (stop) break; out.push([m, s]); }
    out.sort((a, b) => b[1] - a[1]);
    return { list: out, done: !stop, nodes, ms: Math.round(now() - t0) };
  }
  // Açılış kitabı: birkaç bilinen yol (çeşitlilik için)
  const BOOK = [
    "e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7", "e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 c2c3 g8f6 d2d3 d7d6",
    "e2e4 e7e5 g1f3 b8c6 d2d4 e5d4 f3d4 g8f6 d4c6 b7c6", "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6",
    "e2e4 c7c5 g1f3 b8c6 d2d4 c5d4 f3d4 g8f6 b1c3 e7e5", "e2e4 e7e6 d2d4 d7d5 b1c3 g8f6 c1g5 f8e7",
    "e2e4 c7c6 d2d4 d7d5 b1c3 d5e4 c3e4 c8f5 e4g3 f5g6", "e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 d2d4 g8f6",
    "d2d4 d7d5 c2c4 e7e6 b1c3 g8f6 c1g5 f8e7 e2e3 e8g8", "d2d4 d7d5 c2c4 c7c6 g1f3 g8f6 b1c3 d5c4",
    "d2d4 g8f6 c2c4 e7e6 b1c3 f8b4 e2e3 e8g8", "d2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6 g1f3 e8g8",
    "d2d4 g8f6 g1f3 d7d5 c1f4 e7e6 e2e3 c7c5", "c2c4 e7e5 b1c3 g8f6 g1f3 b8c6 g2g3 d7d5",
    "g1f3 d7d5 g2g3 g8f6 f1g2 e7e6 e1g1 f8e7", "e2e4 e7e5 b1c3 g8f6 g1f3 b8c6 d2d4 e5d4 f3d4 f8b4",
    "e2e4 g7g6 d2d4 f8g7 b1c3 d7d6 g1f3 g8f6", "e2e4 e7e5 g1f3 d7d6 d2d4 g8f6 b1c3 b8d7",
  ].map((s) => s.split(" "));
  function bookMove(p, hist) {
    if (hist.length >= 10) return 0;
    const c = BOOK.filter((l) => l.length > hist.length && hist.every((u, i) => l[i] === u)).map((l) => l[hist.length]);
    if (!c.length) return 0;
    return fromUci(p, c[Math.floor(Math.random() * c.length)]);
  }
  // Seviyeye göre hamle: 1 Kolay · 2 Orta · 3 Zor · 4 Usta
  const LEVELS = { 1: { ms: 500 }, 2: { ms: 1200 }, 3: { ms: 1000 }, 4: { ms: 2500 } };
  function play(p, lvl, histUci) {
    const t0 = now();
    const res = (m, extra) => Object.assign({ move: m, ms: Math.round(now() - t0) }, extra || {});
    if (lvl >= 2) { const bm = bookMove(p, histUci || []); if (bm) return res(bm, { book: true, depth: 0, nodes: 0 }); }
    if (lvl === 1 || lvl === 2) {
      const L = legal(p); if (!L.length) return null;
      if (lvl === 1 && Math.random() < 0.2) return res(L[Math.floor(Math.random() * L.length)], { rnd: true, depth: 0 });
      const r = rootScores(p, lvl === 1 ? 2 : 3, LEVELS[lvl].ms);
      if (!r.done || !r.list.length) { const t = think(p, 400, lvl === 1 ? 2 : 3); return res(t.move, { depth: t.depth, nodes: t.nodes }); }
      const top = r.list[0][1];
      const margin = lvl === 1 ? 150 : Math.random() < 0.1 ? 90 : 25;
      const c = r.list.filter((x) => x[1] >= top - margin && (top < MATE - 200 || x[1] === top));
      const x = c[Math.floor(Math.random() * c.length)];
      return res(x[0], { score: x[1], depth: lvl === 1 ? 2 : 3, nodes: r.nodes });
    }
    const t = think(p, LEVELS[lvl].ms, 64);
    return t && res(t.move, { score: t.score, depth: t.depth, nodes: t.nodes });
  }
  function replay(list) { const p = fromFen(START); for (const u of list || []) { const m = fromUci(p, u); if (!m) break; make(p, m); } return p; }

  const API = { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, F_CAP, F_EP, F_CASTLE, F_DBL, START, VAL, Pos, fromFen, toFen, gen, legal, make, unmake, attacked, inCheck, perft,
    toUci, fromUci, status, san, evaluate, think, rootScores, play, replay, sqName, sqOf, repCount, insufficient, BOOK };

  // Web Worker: { id, moves (uci listesi), lvl, mode: "move" | "hint" } → { id, uci, score, depth, nodes, ms }
  if (typeof window === "undefined" && typeof importScripts === "function" && typeof self !== "undefined") {
    self.onmessage = (e) => {
      const d = e.data || {};
      try {
        const p = replay(d.moves);
        const r = d.mode === "hint" ? think(p, d.ms || 900, 64) : play(p, d.lvl || 2, d.moves);
        self.postMessage({ id: d.id, uci: r && r.move ? toUci(r.move) : null, score: r && r.score, depth: r && r.depth, nodes: r && r.nodes, ms: r && r.ms, book: !!(r && r.book) });
      } catch (err) { self.postMessage({ id: d.id, uci: null, err: String(err) }); }
    };
  }
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else G.Satranc = API;
})(typeof self !== "undefined" ? self : this);
