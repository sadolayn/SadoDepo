// Batak bilgisayar rakipleri — "düşünen" yapay zekâ.
// Kart atarken: görmediği kartları (kimin hangi renkte bittiği, kimin yükseltemediği gibi ipuçlarına uyarak)
// yüzlerce kez rastgele dağıtır, her olası kartı bu dağıtımlarda elin sonuna kadar oynatır ve
// ortalamada en çok puan getireni seçer. İhalede de elini dört koz için ayrı ayrı deneyip
// kaç el alabileceğini ölçer; tutma ihtimali iyi değilse ihaleye girmez.
// Kart: { s: "♠", r: 2..14 } · o (ayarlar): { esli, yuk, kozBas }
(function () {
  const SU = ["♠", "♥", "♣", "♦"];
  const idc = (c) => c.s + c.r;
  const partner = (p) => (p + 2) % 4;
  const same = (a, b, o) => a === b || (o.esli && partner(a) === b);
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // ---------- Kurallar (oyundakiyle aynı) ----------
  function beats(a, b, T) { return a.s === b.s ? a.r > b.r : a.s === T; }
  function winner(t, T) { let w = t[0]; for (const x of t) if (beats(x.card, w.card, T)) w = x; return w; }
  function legal(hand, trick, T, broken, o) {
    if (!trick.length) {
      if (!broken && !(o.esli && o.kozBas)) { const nt = hand.filter((c) => c.s !== T); if (nt.length) return nt; }
      return hand;
    }
    const led = trick[0].card.s, best = winner(trick, T).card;
    const sm = hand.filter((c) => c.s === led);
    if (sm.length) {
      if (best.s === led && (o.yuk || led === T)) { const hi = sm.filter((c) => c.r > best.r); if (hi.length) return hi; }
      return sm;
    }
    const tr = hand.filter((c) => c.s === T);
    if (tr.length) {
      if (best.s === T) { const hi = tr.filter((c) => c.r > best.r); if (hi.length) return hi; }
      return tr;
    }
    return hand;
  }
  // El sonu puanı (batak.html'deki puanlamayla aynı)
  function deltas(tk, b, k, o) {
    const side = tk[b] + (o.esli ? tk[partner(b)] : 0);
    const bp = side >= k ? k * 15 + (side - k) * 10 : -k * 10;
    const other = (t) => (t > 0 ? t * 10 : -50);
    if (o.esli) { const os = other(13 - side); return [0, 1, 2, 3].map((p) => (same(p, b, o) ? bp : os)); }
    return [0, 1, 2, 3].map((p) => (p === b ? bp : other(tk[p])));
  }
  // Bot için değer: kendi puanı eksi rakiplerin ortalaması (eşlide taraf farkı)
  function util(d, x, o) {
    if (o.esli) return d[x] - d[(x + 1) % 4];
    let s = 0; for (let q = 0; q < 4; q++) if (q !== x) s += d[q];
    return d[x] - s / 3;
  }

  // ---------- Hızlı sezgisel oyuncu (deneme oyunlarında herkes böyle oynar) ----------
  function boss(c, hand, played) {
    for (let r = c.r + 1; r <= 14; r++) { const k = c.s + r; if (!played.has(k) && !hand.some((h) => h.s === c.s && h.r === r)) return false; }
    return true;
  }
  const lowest = (cs, T) => cs.reduce((a, c) => ((a.s === T) - (c.s === T) || a.r - c.r) > 0 ? c : a);
  function policy(S, p) {
    const hand = S.h[p], T = S.T, o = S.o, L = legal(hand, S.trick, T, S.broken, o);
    if (L.length === 1) return L[0];
    const isB = (c) => boss(c, hand, S.played);
    const onBid = same(p, S.b, o);
    if (!S.trick.length) {
      let outT = 0, myT = 0;
      for (let r = 2; r <= 14; r++) { if (hand.some((c) => c.s === T && c.r === r)) myT++; else if (!S.played.has(T + r)) outT++; }
      if (onBid && outT > 0) { const bt = L.find((c) => c.s === T && isB(c)); if (bt) return bt; }
      const nb = L.filter((c) => c.s !== T && isB(c));
      if (nb.length) return nb[0];
      if (onBid && outT > 0 && myT > outT) { const lt = L.filter((c) => c.s === T); if (lt.length) return lowest(lt, T); }
      const side = L.filter((c) => c.s !== T), pool = side.length ? side : L;
      const cnt = {}; for (const c of hand) cnt[c.s] = (cnt[c.s] || 0) + 1;
      // İhaleci uzun renginden, karşı taraf kısa renginden (koz kesmek için) açar
      let pick = null;
      for (const c of pool) {
        if (!pick) { pick = c; continue; }
        const d = onBid ? cnt[c.s] - cnt[pick.s] : cnt[pick.s] - cnt[c.s];
        if (d > 0 || (d === 0 && c.r < pick.r)) pick = c;
      }
      return pick;
    }
    const bw = winner(S.trick, T), best = bw.card;
    const win = [], lose = [];
    for (const c of L) (beats(c, best, T) ? win : lose).push(c);
    if (bw.p !== p && same(bw.p, p, o) && lose.length && (S.trick.length === 3 || isB(best) || (best.s === T && S.trick[0].card.s !== T))) return lowest(lose, T);
    if (win.length) {
      win.sort((a, b) => (a.s === T) - (b.s === T) || a.r - b.r);
      if (S.trick.length === 3) return win[0];
      const bs = win.find(isB);
      if (bs) return bs;
      return win[0].s === T && S.trick[0].card.s !== T ? win[0] : win[win.length - 1];
    }
    return lowest(L, T);
  }
  function play(S, p, c) {
    const h = S.h[p]; h.splice(h.indexOf(c), 1);
    S.trick.push({ p, card: c }); S.played.add(idc(c));
    if (c.s === S.T) S.broken = true;
    if (S.trick.length === 4) { const w = winner(S.trick, S.T).p; S.tk[w]++; S.trick = []; S.turn = w; }
    else S.turn = (p + 1) % 4;
  }
  function rollout(S) { while (S.h[S.turn].length) play(S, S.turn, policy(S, S.turn)); return S; }
  const clone = (S) => ({ h: S.h.map((a) => a.slice()), trick: S.trick.slice(), T: S.T, broken: S.broken, played: new Set(S.played), tk: S.tk.slice(), turn: S.turn, b: S.b, o: S.o });

  // ---------- Görülmeyen kartları ipuçlarına uygun dağıt ----------
  function sample(c) {
    const knownIds = new Set(), unk = [];
    for (const q of c.known) for (const x of c.hands[q]) knownIds.add(idc(x));
    for (const s of SU) for (let r = 2; r <= 14; r++) { const k = s + r; if (!c.played.has(k) && !knownIds.has(k)) unk.push({ s, r }); }
    const qs = [0, 1, 2, 3].filter((q) => !c.known.includes(q));
    const ok = (q, x) => !c.voids[q][x.s] && !(c.caps[q][x.s] && x.r > c.caps[q][x.s]);
    for (let t = 0; t < 40; t++) {
      const rem = {}; qs.forEach((q) => (rem[q] = c.counts[q]));
      const H = [0, 1, 2, 3].map((q) => (c.known.includes(q) ? c.hands[q].slice() : []));
      const cards = shuffle(unk.slice()).map((x) => [x, qs.filter((q) => ok(q, x)).length]).sort((a, b) => a[1] - b[1]);
      let fail = false;
      for (const [x] of cards) {
        const cand = qs.filter((q) => rem[q] > 0 && ok(q, x));
        if (!cand.length) { fail = true; break; }
        let tot = 0; for (const q of cand) tot += rem[q];
        let r = Math.random() * tot, q = cand[0];
        for (const y of cand) { r -= rem[y]; if (r < 0) { q = y; break; } }
        H[q].push(x); rem[q]--;
      }
      if (!fail) return H;
    }
    const H = [0, 1, 2, 3].map((q) => (c.known.includes(q) ? c.hands[q].slice() : []));
    const u = shuffle(unk);
    for (const q of qs) H[q] = u.splice(0, c.counts[q]);
    return H;
  }

  // ---------- Kart seçimi ----------
  // c: { x, hands, known, counts, trick, T, broken, played, tk, b, k, voids, caps, o, ms }
  function pick(c) {
    const L = legal(c.hands[c.x], c.trick, c.T, c.broken, c.o);
    if (L.length === 1) return L[0];
    const sum = L.map(() => 0), t0 = now(), ms = c.ms == null ? 300 : c.ms, minN = c.min || 30, maxN = c.max || 600;
    let n = 0;
    while (n < maxN && (n < minN || now() - t0 < ms)) {
      const H = sample(c);
      const base = { h: H, trick: c.trick.map((t) => ({ p: t.p, card: t.card })), T: c.T, broken: c.broken, played: new Set(c.played), tk: c.tk.slice(), turn: c.x, b: c.b, o: c.o };
      L.forEach((m, i) => {
        const S = clone(base);
        play(S, c.x, S.h[c.x].find((y) => y.s === m.s && y.r === m.r));
        rollout(S);
        sum[i] += util(deltas(S.tk, c.b, c.k, c.o), c.x, c.o);
      });
      n++;
    }
    let bi = 0;
    for (let i = 1; i < L.length; i++) {
      const d = sum[i] - sum[bi];
      if (d > 1e-6 || (Math.abs(d) <= 1e-6 && ((L[i].s === c.T) - (L[bi].s === c.T) || L[i].r - L[bi].r) < 0)) bi = i;
    }
    return L[bi];
  }

  // ---------- İhale ----------
  // Eli her koz için n kez rastgele dağıtılmış masada oynatır; sonuçlar (alınan eller) saklanır
  function bidEval(hand, b, o, dengeli, n) {
    n = n || 60;
    const mine = new Set(hand.map(idc)), rest = [];
    for (const s of SU) for (let r = 2; r <= 14; r++) if (!mine.has(s + r)) rest.push({ s, r });
    const deals = [];
    for (let i = 0; i < n; i++) {
      let H;
      for (let t = 0; t < (dengeli ? 25 : 1); t++) {
        const d = shuffle(rest.slice()), qs = [0, 1, 2, 3].filter((q) => q !== b);
        H = []; H[b] = hand.slice();
        qs.forEach((q, j) => (H[q] = d.slice(j * 13, j * 13 + 13)));
        if (!dengeli || qs.every((q) => SU.every((s) => { const m = H[q].filter((c) => c.s === s).length; return m >= 2 && m <= 5; }))) break;
      }
      deals.push(H);
    }
    const res = {};
    for (const T of SU) res[T] = deals.map((H) => rollout({ h: H.map((a) => a.slice()), trick: [], T, broken: false, played: new Set(), tk: [0, 0, 0, 0], turn: b, b, o }).tk);
    return res;
  }
  function bidScore(ev, b, k, o, T) {
    let u = 0, made = 0;
    for (const tk of ev[T]) {
      u += util(deltas(tk, b, k, o), b, o);
      if (tk[b] + (o.esli ? tk[partner(b)] : 0) >= k) made++;
    }
    return { u: u / ev[T].length, p: made / ev[T].length };
  }
  // Bu elle en fazla kaça kadar çıkılır (0: ihaleye girme)
  function bidLimit(ev, b, o, minb) {
    let best = 0;
    for (let k = minb; k <= 13; k++) for (const T of SU) { const s = bidScore(ev, b, k, o, T); if (s.u > 0 && s.p >= 0.55) best = k; }
    return best;
  }
  function bestTrump(ev, b, k, o) {
    let bt = SU[0], bu = -1e9;
    for (const T of SU) { const s = bidScore(ev, b, k, o, T); if (s.u > bu) { bu = s.u; bt = T; } }
    return bt;
  }

  // ---------- Oyundan ipucu çıkarma ----------
  // Kart atılmadan önce çağrılır: kim hangi renkte bitti, kim yükseltemedi
  function observe(info, p, c, trick, T, broken, o, hand) {
    const v = info.voids[p], cap = info.caps[p];
    if (!trick.length) {
      if (c.s === T && !broken && !(o.esli && o.kozBas)) SU.forEach((s) => { if (s !== T) v[s] = true; });
      return;
    }
    const led = trick[0].card.s, best = winner(trick, T).card;
    if (c.s !== led) {
      v[led] = true;
      if (c.s !== T) v[T] = true;
      else if (best.s === T && c.r < best.r) cap[T] = Math.min(cap[T] || 99, best.r);
    } else if (best.s === led && (o.yuk || led === T) && c.r < best.r) cap[led] = Math.min(cap[led] || 99, best.r);
  }
  const newInfo = () => ({ voids: [0, 1, 2, 3].map(() => ({})), caps: [0, 1, 2, 3].map(() => ({})) });

  const API = { legal, deltas, pick, bidEval, bidLimit, bestTrump, observe, newInfo, policy, rollout };
  if (typeof window !== "undefined") window.BatakAI = API;
  if (typeof module !== "undefined") module.exports = API;
})();
