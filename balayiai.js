// Balayı King bilgisayar rakibi (Sadolayn) — "düşünen" yapay zekâ.
// Görmediği kartları (senin elindeki 6 kart ve iki taraftaki kapalı kartlar) ipuçlarına uyarak
// yüzlerce kez dağıtır; her olası kartı bu dağıtımlarda elin sonuna kadar oynatıp en çok el getireni seçer.
// Oyun seçerken de her oyunu (♣ ♦ ♥ ♠ Kozsuz) aynı şekilde dener ve çarpanla birlikte değerlendirir.
// Durum S: { h[2] (el), pl[2] (yığınlar: [kapalı, açık] ya da [açık]), trick, T (koz ya da null), tb, played:Set, tw[2], turn }
(function () {
  const SU = ["♠", "♥", "♣", "♦"];
  const idc = (c) => c.s + c.r;
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const DECK = []; for (const s of SU) for (let r = 2; r <= 14; r++) DECK.push({ s, r });

  // ---------- Kurallar (balayi.html ile aynı) ----------
  const tops = (S, p) => { const o = []; for (const st of S.pl[p]) if (st.length) o.push(st[st.length - 1]); return o; };
  const playable = (S, p) => S.h[p].concat(tops(S, p));
  const beats = (a, b, T) => (a.s === b.s ? a.r > b.r : !!T && a.s === T);
  let YUK = true; // Balayı ayarı: yükseltme zorunlu mu (balayi.html bildirir)
  function legalOf(cs, S) {
    if (!S.trick.length) {
      if (S.T && !S.tb) { const nt = cs.filter((c) => c.s !== S.T); if (nt.length) return nt; }
      return cs;
    }
    const lead = S.trick[0].card, same = cs.filter((c) => c.s === lead.s);
    if (same.length) { if (!YUK && lead.s !== S.T) return same; const hi = same.filter((c) => c.r > lead.r); return hi.length ? hi : same; }
    if (S.T) { const tr = cs.filter((c) => c.s === S.T); if (tr.length) return tr; }
    return cs;
  }
  const legal = (S, p) => legalOf(playable(S, p), S);
  function play(S, p, c) {
    const i = S.h[p].indexOf(c);
    if (i >= 0) S.h[p].splice(i, 1);
    else for (const st of S.pl[p]) if (st.length && st[st.length - 1] === c) { st.pop(); break; }
    S.trick.push({ p, card: c }); S.played.add(idc(c));
    if (S.T && c.s === S.T) S.tb = true;
    if (S.trick.length < 2) { S.turn = 1 - p; return; }
    const w = beats(S.trick[1].card, S.trick[0].card, S.T) ? S.trick[1].p : S.trick[0].p;
    S.tw[w]++; S.trick = []; S.turn = w;
  }
  const clone = (S) => ({ h: S.h.map((a) => a.slice()), pl: S.pl.map((P) => P.map((st) => st.slice())), trick: S.trick.slice(), T: S.T, tb: S.tb, played: new Set(S.played), tw: S.tw.slice(), turn: S.turn, v: S.v.map((x) => ({ ...x })) });

  // ---------- Hızlı sezgisel oyuncu (deneme oyunlarında ikisi de böyle oynar) ----------
  function policy(S, p) {
    const L = legal(S, p);
    if (L.length === 1) return L[0];
    const T = S.T, mine = playable(S, p), inPile = new Set(tops(S, p).map(idc));
    const out = (s) => { const o = []; for (let r = 2; r <= 14; r++) { const k = s + r; if (!S.played.has(k) && !mine.some((c) => c.s === s && c.r === r)) o.push(r); } return o; };
    const isBoss = (c) => out(c.s).every((r) => r < c.r);
    const pref = (a, b) => inPile.has(idc(b)) - inPile.has(idc(a));
    const oppT = T ? out(T).length : 0;
    if (!S.trick.length) {
      const boss = L.filter((c) => c.s !== T && isBoss(c) && (!T || oppT === 0 || !S.v[1 - p][c.s]));
      if (boss.length) return boss.sort((a, b) => b.r - a.r || pref(a, b))[0];
      if (T) {
        const myTr = L.filter((c) => c.s === T), allMy = mine.filter((c) => c.s === T).length;
        if (myTr.length && allMy >= oppT && oppT > 0) { const tb = myTr.filter(isBoss); return (tb.length ? tb : myTr).sort((a, b) => b.r - a.r)[0]; }
      }
      const side = L.filter((c) => c.s !== T), pool = side.length ? side : L;
      return pool.slice().sort((a, b) => a.r - b.r || pref(a, b))[0];
    }
    const lead = S.trick[0].card;
    const win = L.filter((c) => beats(c, lead, T)).sort((a, b) => (a.s === T) - (b.s === T) || a.r - b.r || pref(a, b));
    if (win.length) return win[0];
    return L.slice().sort((a, b) => (a.s === T) - (b.s === T) || a.r - b.r || pref(a, b))[0];
  }
  function rollout(S) {
    let g = 60;
    while (g-- > 0) {
      const L = legal(S, S.turn);
      if (!L.length) break;
      const c = policy(S, S.turn);
      if (S.trick.length && c.s !== S.trick[0].card.s) S.v[S.turn][S.trick[0].card.s] = true;
      play(S, S.turn, c);
    }
    return S;
  }

  // ---------- İpuçları ----------
  // Rakip c'yi atmadan hemen önce: elinde X olsaydı c'yi atamayacak idiyse X elinde yok demektir
  const newInfo = () => ({ excl: [new Set(), new Set()] });
  function observe(info, p, c, S) {
    const ex = info.excl[p];
    for (const X of DECK) {
      const k = idc(X);
      if ((X.s === c.s && X.r === c.r) || S.played.has(k) || ex.has(k)) continue;
      if (!legalOf([c, X], S).includes(c)) ex.add(k);
    }
  }

  // ---------- Görülmeyen kartları dağıt (x'in gözünden) ----------
  function sample(S, x, info) {
    const o = 1 - x, seen = new Set();
    for (const c of S.h[x]) seen.add(idc(c));
    for (const p of [0, 1]) for (const c of tops(S, p)) seen.add(idc(c));
    const unk = shuffle(DECK.filter((c) => !S.played.has(idc(c)) && !seen.has(idc(c))));
    const nH = S.h[o].length;
    const okH = unk.filter((c) => !info.excl[o].has(idc(c)));
    // rakibin eli: yasaklanmamış kartlardan; kalanlar kapalı kartlara
    const hand = (okH.length >= nH ? okH : unk).slice(0, nH);
    const hs = new Set(hand.map(idc)), rest = unk.filter((c) => !hs.has(idc(c)));
    const R = clone(S);
    R.h[o] = hand;
    let k = 0;
    for (const p of [0, 1]) for (const st of R.pl[p]) if (st.length === 2) st[0] = rest[k++];
    return R;
  }

  // ---------- Kart seçimi ----------
  function pick(S, x, info, opt) {
    opt = opt || {};
    const L = legal(S, x);
    if (L.length === 1) return L[0];
    const sum = L.map(() => 0), t0 = now(), ms = opt.ms == null ? 400 : opt.ms, minN = opt.min || 40, maxN = opt.max || 1500;
    let n = 0;
    while (n < maxN && (n < minN || now() - t0 < ms)) {
      const base = sample(S, x, info);
      L.forEach((m, i) => {
        const R = clone(base);
        const c = playable(R, x).find((y) => y.s === m.s && y.r === m.r);
        play(R, x, c); rollout(R);
        sum[i] += R.tw[x] - R.tw[1 - x];
      });
      n++;
    }
    let bi = 0;
    for (let i = 1; i < L.length; i++) if (sum[i] > sum[bi] + 1e-6) bi = i;
    return L[bi];
  }

  // ---------- Oyun seçimi ----------
  // games: [{k: "♣"|..|"NT", x: çarpan}] (henüz seçilmemiş olanlar). Önde gelen: seçmeyen oyuncu.
  // Değer = çarpan × (beklenen el farkı − θ): zayıf elde büyük çarpanı harcamaz, sonraya saklar.
  function choose(S, x, info, games, opt) {
    opt = opt || {};
    if (games.length === 1) return games[0].k;
    const n = opt.n || 80, th = opt.th == null ? 1.5 : opt.th;
    const deals = []; for (let i = 0; i < n; i++) deals.push(sample(S, x, info));
    let best = games[0].k, bv = -Infinity;
    for (const g of games) {
      let s = 0;
      for (const D of deals) {
        const R = clone(D); R.T = g.k === "NT" ? null : g.k; R.tb = false; R.turn = 1 - x;
        rollout(R); s += R.tw[x] - R.tw[1 - x];
      }
      const v = g.x * (s / n - th);
      if (v > bv) { bv = v; best = g.k; }
    }
    return best;
  }

  const API = { yuk: (v) => (YUK = v !== false), legal, observe, newInfo, pick, choose, policy, rollout, playable };
  if (typeof window !== "undefined") window.BalayiAI = API;
  if (typeof module !== "undefined") module.exports = API;
})();
