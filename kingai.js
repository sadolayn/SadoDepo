// King bilgisayar rakipleri — "düşünen" yapay zekâ.
// Kart atarken: görmediği kartları, oyunda ortaya çıkan ipuçlarına uyarak (kim hangi rengi bitirdi, kim
// hangi kartı atmak zorundayken atmadı) yüzlerce kez dağıtır; her kartı bu dağıtımlarda elin sonuna kadar
// oynatıp ortalamada en iyisini seçer. Oyun seçerken de her koz ve cezayı aynı şekilde dener.
// Durum S: { h[4], trick, ct, T, tb, hb, played:Set, v[4] (renk boşlukları), tw[4] (alınan el), tk[4] (ceza adedi), turn }
(function () {
  const SU = ["♠", "♥", "♣", "♦"];
  const PUAN = { el: 50, kupa: 30, erkek: 60, kiz: 100, rifki: 320, son: 180 };
  const MAX = { el: 13, kupa: 13, erkek: 8, kiz: 4, rifki: 1, son: 2 };
  const TOPLAM = { el: 650, kupa: 390, erkek: 480, kiz: 400, rifki: 320, son: 360 };
  const idc = (c) => c.s + c.r;
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const DECK = []; for (const s of SU) for (let r = 2; r <= 14; r++) DECK.push({ s, r });

  // ---------- Kurallar (king.html ile aynı) ----------
  const beats = (a, b, S) => (a.s === b.s ? a.r > b.r : S.ct === "koz" && a.s === S.T);
  function winner(t, S) { let w = t[0]; for (const x of t) if (beats(x.card, w.card, S)) w = x; return w; }
  const isPen = (c, ct) => (ct === "kupa" && c.s === "♥") || (ct === "erkek" && (c.r === 13 || c.r === 11)) || (ct === "kiz" && c.r === 12) || (ct === "rifki" && c.s === "♥" && c.r === 13);
  function legal(hand, S) {
    const ct = S.ct, trick = S.trick;
    if (!trick.length) {
      if (ct === "koz" && !S.tb) { const nt = hand.filter((c) => c.s !== S.T); if (nt.length) return nt; }
      if ((ct === "kupa" || ct === "rifki") && !S.hb) { const nh = hand.filter((c) => c.s !== "♥"); if (nh.length) return nh; }
      return hand;
    }
    const led = trick[0].card.s, best = winner(trick, S).card;
    const same = hand.filter((c) => c.s === led);
    if (same.length) {
      if (ct === "koz" && best.s === led) { const hi = same.filter((c) => c.r > best.r); if (hi.length) return hi; }
      if (ct === "rifki" && led === "♥") { const kh = same.find((c) => c.r === 13); if (kh && trick.some((t) => t.card.s === "♥" && t.card.r === 14)) return [kh]; }
      if (ct === "kiz") { const q = same.find((c) => c.r === 12); if (q && trick.some((t) => t.card.s === led && t.card.r > 12)) return [q]; }
      return same;
    }
    if (ct === "koz") {
      const tr = hand.filter((c) => c.s === S.T);
      if (tr.length) { if (best.s === S.T) { const hi = tr.filter((c) => c.r > best.r); if (hi.length) return hi; } return tr; }
      return hand;
    }
    if (ct === "rifki") { const kh = hand.find((c) => c.s === "♥" && c.r === 13); if (kh) return [kh]; }
    if (ct === "kupa") { const h = hand.filter((c) => c.s === "♥"); if (h.length) return h; }
    if (ct === "kiz") { const q = hand.filter((c) => c.r === 12); if (q.length) return q; }
    if (ct === "erkek") { const m = hand.filter((c) => c.r === 13 || c.r === 11); if (m.length) return m; }
    return hand;
  }
  function penaltyOf(ct, cards, trickNo) {
    if (ct === "el") return 1;
    if (ct === "kupa") return cards.filter((c) => c.s === "♥").length;
    if (ct === "erkek") return cards.filter((c) => c.r === 13 || c.r === 11).length;
    if (ct === "kiz") return cards.filter((c) => c.r === 12).length;
    if (ct === "rifki") return cards.some((c) => c.s === "♥" && c.r === 13) ? 1 : 0;
    if (ct === "son") return trickNo >= 12 ? 1 : 0;
    return 0;
  }
  function over(S) {
    if (S.ct === "koz" || S.ct === "el" || S.ct === "son") return !S.h[0].length && !S.trick.length;
    return S.tk.reduce((a, b) => a + b, 0) >= MAX[S.ct] || (!S.h[0].length && !S.trick.length);
  }
  function play(S, p, c) {
    const h = S.h[p]; h.splice(h.indexOf(c), 1);
    if (S.trick.length && c.s !== S.trick[0].card.s) S.v[p][S.trick[0].card.s] = true;
    S.trick.push({ p, card: c }); S.played.add(idc(c));
    if (S.ct === "koz" && c.s === S.T) S.tb = true;
    if (c.s === "♥") S.hb = true;
    if (S.trick.length < 4) { S.turn = (p + 1) % 4; return; }
    const w = winner(S.trick, S).p;
    S.tw[w]++;
    if (S.ct !== "koz") S.tk[w] += penaltyOf(S.ct, S.trick.map((t) => t.card), 13 - S.h[0].length);
    S.trick = []; S.turn = w;
  }
  const score = (S, q) => (S.ct === "koz" ? S.tw[q] * 50 : -S.tk[q] * PUAN[S.ct]);
  const clone = (S) => ({ h: S.h.map((a) => a.slice()), trick: S.trick.slice(), ct: S.ct, T: S.T, tb: S.tb, hb: S.hb, played: new Set(S.played), v: S.v.map((x) => ({ ...x })), tw: S.tw.slice(), tk: S.tk.slice(), turn: S.turn });

  // ---------- Hızlı sezgisel oyuncu (deneme oyunlarında herkes böyle oynar) ----------
  function outAll(S, hand, suit) {
    const out = [];
    for (let r = 2; r <= 14; r++) { const k = suit + r; if (!S.played.has(k) && !hand.some((h) => h.s === suit && h.r === r)) out.push(r); }
    return out;
  }
  function policy(S, p) {
    const hand = S.h[p], L = legal(hand, S);
    if (L.length === 1) return L[0];
    // bu çağrı boyunca her rengin dışarıdaki kartları bir kez hesaplanır
    const memo = {};
    const outstanding = (S, hand, suit) => memo[suit] || (memo[suit] = outAll(S, hand, suit));
    const isBoss = (S, c, hand) => outstanding(S, hand, c.s).every((r) => r < c.r);
    const ct = S.ct, T = S.T, trick = S.trick, v = S.v;
    const after = []; for (let i = trick.length + 1; i < 4; i++) after.push((p + i - trick.length) % 4);
    const opps = [0, 1, 2, 3].filter((x) => x !== p);
    if (ct === "koz") {
      const lowest = (cs) => cs.reduce((a, c) => (((a.s === T) - (c.s === T) || a.r - c.r) > 0 ? c : a));
      const myT = hand.filter((c) => c.s === T).length, outT = outstanding(S, hand, T).length;
      if (!trick.length) {
        const boss = L.filter((c) => c.s !== T && isBoss(S, c, hand) && (outT === 0 || !opps.some((o) => v[o][c.s])));
        if (boss.length) return boss.reduce((a, c) => (c.r > a.r ? c : a));
        const tl = L.filter((c) => c.s === T);
        if (tl.length && myT >= outT && outT > 0) { const tb = tl.filter((c) => isBoss(S, c, hand)); return (tb.length ? tb : tl).reduce((a, c) => (c.r > a.r ? c : a)); }
        const side = L.filter((c) => c.s !== T);
        if (side.length && myT > 0) {
          const len = (s) => hand.filter((c) => c.s === s).length;
          const sh = side.reduce((a, c) => ((len(c.s) - len(a.s) || c.r - a.r) < 0 ? c : a));
          if (len(sh.s) <= 2 && sh.r < 12) return sh;
        }
        return lowest(L);
      }
      const best = winner(trick, S).card;
      const win = L.filter((c) => beats(c, best, S)).sort((a, b) => (a.s === T) - (b.s === T) || a.r - b.r);
      if (win.length) {
        if (trick.length === 3) return win[0];
        const safe = win.filter((c) => {
          if (c.s === T) return outstanding(S, hand, T).every((r) => r < c.r) || after.every((o) => v[o][T]);
          return outstanding(S, hand, c.s).every((r) => r < c.r) && !(after.some((o) => v[o][c.s] && !v[o][T]) && outT > 0);
        });
        if (safe.length) return safe[0];
        const nt = win.filter((c) => c.s !== T);
        return nt.length ? nt[nt.length - 1] : win[0];
      }
      return lowest(L);
    }
    const pen = (c) => isPen(c, ct);
    const trickNo = 14 - hand.length;
    if (ct === "son" && trickNo <= 11) {
      if (!trick.length) return L.reduce((a, c) => (c.r > a.r ? c : a));
      const best = winner(trick, S).card, win = L.filter((c) => beats(c, best, S));
      return (win.length ? win : L).reduce((a, c) => (c.r > a.r ? c : a));
    }
    if (!trick.length) {
      let bc = null, bs = Infinity;
      for (const c of L) {
        const out = outstanding(S, hand, c.s);
        let sc;
        if (!out.length) sc = 1000 + c.r;
        else {
          const lower = out.filter((r) => r < c.r).length;
          sc = (lower === out.length ? 500 : 0) + (lower / out.length) * 100;
          sc += opps.filter((o) => v[o][c.s]).length * 40;
          if (pen(c)) sc += 200;
          if (ct === "kiz" && out.includes(12) && c.r > 12) sc += 300;
          if (ct === "erkek" && (out.includes(13) || out.includes(11)) && c.r > 11) sc += 150;
          if (ct === "rifki" && c.s === "♥" && c.r === 14 && out.includes(13)) sc += 400;
          sc += c.r * 0.5;
        }
        if (sc < bs) { bs = sc; bc = c; }
      }
      return bc;
    }
    const led = trick[0].card.s, best = winner(trick, S).card;
    const loses = L.filter((c) => !beats(c, best, S));
    if (loses.length) {
      if (loses.some((c) => c.s === led)) return loses.reduce((a, c) => (((pen(c) - pen(a)) || c.r - a.r) > 0 ? c : a));
      const danger = (c) => {
        let d = (pen(c) ? 200 : 0) + c.r;
        if (outstanding(S, hand, c.s).filter((r) => r < c.r).length >= 2) d += 20;
        const n = hand.filter((h) => h.s === c.s).length;
        d += (5 - Math.min(5, n)) * 4; // kısa renkten at: yeni boşluk açılır
        if (n === 1 && c.r >= 11) d += 15;
        return d;
      };
      return loses.reduce((a, c) => (danger(c) > danger(a) ? c : a));
    }
    const nonPen = L.filter((c) => !pen(c)), pool = nonPen.length ? nonPen : L;
    const canOver = (c) => after.some((o) => !v[o][led]) && outstanding(S, hand, led).some((r) => r > c.r);
    if (trick.length === 3 || !L.some(canOver)) return pool.reduce((a, c) => (c.r > a.r ? c : a));
    return pool.reduce((a, c) => (c.r < a.r ? c : a));
  }
  function rollout(S) { let g = 60; while (g-- > 0 && !over(S)) play(S, S.turn, policy(S, S.turn)); return S; }

  // ---------- İpuçları ----------
  // p, c kartını atmadan hemen önce çağrılır. Elinde X olsaydı c'yi atamayacak idiyse X onda yok demektir.
  const newInfo = () => ({ excl: [0, 1, 2, 3].map(() => new Set()) });
  function observe(info, p, c, S) {
    const ex = info.excl[p];
    for (const X of DECK) {
      if (X.s === c.s && X.r === c.r) continue;
      const k = idc(X);
      if (S.played.has(k) || ex.has(k)) continue;
      if (!legal([c, X], S).includes(c)) ex.add(k);
    }
  }

  // ---------- Görülmeyen kartları dağıt ----------
  function sample(S, x, info, known) {
    known = known || [x];
    const seen = new Set(); for (const q of known) for (const c of S.h[q]) seen.add(idc(c));
    const unk = [];
    for (const c of DECK) { const k = idc(c); if (!S.played.has(k) && !seen.has(k)) unk.push(c); }
    const qs = [0, 1, 2, 3].filter((q) => !known.includes(q));
    const ok = (q, c) => !info.excl[q].has(idc(c));
    for (let t = 0; t < 40; t++) {
      const rem = {}; qs.forEach((q) => (rem[q] = S.h[q].length));
      const H = S.h.map((h, q) => (known.includes(q) ? h.slice() : []));
      const cards = shuffle(unk.slice()).map((c) => [c, qs.filter((q) => ok(q, c)).length]).sort((a, b) => a[1] - b[1]);
      let fail = false;
      for (const [c] of cards) {
        const cand = qs.filter((q) => rem[q] > 0 && ok(q, c));
        if (!cand.length) { fail = true; break; }
        let tot = 0; for (const q of cand) tot += rem[q];
        let r = Math.random() * tot, q = cand[0];
        for (const y of cand) { r -= rem[y]; if (r < 0) { q = y; break; } }
        H[q].push(c); rem[q]--;
      }
      if (!fail) return H;
    }
    const H = S.h.map((h, q) => (known.includes(q) ? h.slice() : []));
    const u = shuffle(unk); for (const q of qs) H[q] = u.splice(0, S.h[q].length);
    return H;
  }

  // ---------- Kart seçimi ----------
  // util(puanlar[4], x) → bot için değer. opt: { ms, min, max }
  function pick(S, x, info, util, opt) {
    opt = opt || {};
    const L = legal(S.h[x], S);
    if (L.length === 1) return L[0];
    const sum = L.map(() => 0), t0 = now(), ms = opt.ms == null ? 300 : opt.ms, minN = opt.min || 30, maxN = opt.max || 800;
    let n = 0;
    while (n < maxN && (n < minN || now() - t0 < ms)) {
      const base = clone(S); base.h = sample(S, x, info); base.turn = x;
      L.forEach((m, i) => {
        const R = clone(base);
        play(R, x, R.h[x].find((y) => y.s === m.s && y.r === m.r));
        rollout(R);
        sum[i] += util([0, 1, 2, 3].map((q) => score(R, q)), x);
      });
      n++;
    }
    let bi = 0;
    for (let i = 1; i < L.length; i++) if (sum[i] > sum[bi] + 1e-6) bi = i;
    return L[bi];
  }

  // ---------- Oyun seçimi ----------
  // opts: [{ct, T}] · her seçenek aynı rastgele masalarda oynatılır; "adil pay"a göre en kârlısı seçilir
  function choose(hand, p, opts, util, opt) {
    opt = opt || {};
    if (opts.length === 1) return opts[0];
    const n = opt.n || 60, mine = new Set(hand.map(idc)), rest = DECK.filter((c) => !mine.has(idc(c)));
    const deals = [];
    for (let i = 0; i < n; i++) { const d = shuffle(rest.slice()), H = []; let k = 0; for (let q = 0; q < 4; q++) H[q] = q === p ? hand.slice() : d.slice(k, (k += 13)); deals.push(H); }
    const fair = (o) => (o.ct === "koz" ? 13 * 50 / 4 : -TOPLAM[o.ct] / 4);
    let best = opts[0], bv = -Infinity;
    for (const o of opts) {
      let s = 0;
      for (const H of deals) {
        const S = rollout({ h: H.map((a) => a.slice()), trick: [], ct: o.ct, T: o.T || null, tb: false, hb: false, played: new Set(), v: [{}, {}, {}, {}], tw: [0, 0, 0, 0], tk: [0, 0, 0, 0], turn: p });
        const f = fair(o);
        s += util([0, 1, 2, 3].map((q) => score(S, q) - f), p);
      }
      const val = s / n + (o.bonus || 0);
      if (val > bv) { bv = val; best = o; }
    }
    return best;
  }

  const API = { legal, observe, newInfo, pick, choose, policy, rollout, score, PUAN };
  if (typeof window !== "undefined") window.KingAI = API;
  if (typeof module !== "undefined") module.exports = API;
})();
