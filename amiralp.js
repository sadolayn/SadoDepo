// ===== Amiral Battı · Sadolayn'a karşı (8 Kasım 2026) =====
// Kurallar: 10×10 deniz, 5 gemi (5-4-3-3-2), gemiler birbirine değemez (çapraz dahil). Vuran bir daha atar.
// Zorluk: Kolay rastgele atar ve vurduğu gemiyi bazen yarım bırakır; Orta dama deseniyle tarar, vurduğunu kovalar;
// Zor kalan filonun binlerce olası dizilişini (değmeme kuralı, ıska, isabet, batan gemiler dahil) örnekleyip en olası kareye atar.
// Yıldız: Kolay 50 · Orta 100 · Zor 200; kazanırsan 2 katı. Oyun her hamlede "amOyun" anahtarına kaydedilir.
(function () {
  "use strict";
  const N = 10, HARF = "ABCDEFGHIJ";
  const FILO = [{ ad: "Uçak gemisi", n: 5 }, { ad: "Muharip", n: 4 }, { ad: "Kruvazör", n: 3 }, { ad: "Denizaltı", n: 3 }, { ad: "Muhrip", n: 2 }];
  const LV = {
    1: { ad: "Kolay", em: "🙂", bedel: 50, not: "Sadolayn gelişigüzel atar, vurduğu gemiyi de bazen yarım bırakır." },
    2: { ad: "Orta", em: "😤", bedel: 100, not: "Sadolayn denizi dama deseniyle tarar, vurduğu gemiyi sonuna kadar kovalar." },
    3: { ad: "Zor", em: "🔥", bedel: 200, not: "Sadolayn kalan gemilerin binlerce olası yerini hesaplar, her atışı en olası kareye yapar. Bol şans!" },
  };
  const kor = (i) => HARF[i % N] + (Math.floor(i / N) + 1);
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];

  // ---------- Motor (DOM'suz) ----------
  function hucreler(g) { const o = []; for (let k = 0; k < g.n; k++) o.push(g.yatay ? g.r * N + g.c + k : (g.r + k) * N + g.c); return o; }
  function hale(cells) { // çevre kareleri (çapraz dahil), geminin kendisi hariç
    const s = new Set(cells), o = [];
    for (const i of cells) { const r = (i / N) | 0, c = i % N;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue; const j = rr * N + cc; if (!s.has(j)) { s.add(j); o.push(j); } } }
    return o;
  }
  const sigar = (g) => g.r >= 0 && g.c >= 0 && (g.yatay ? g.r < N && g.c + g.n <= N : g.c < N && g.r + g.n <= N);
  // "" uygun · "sigmaz" taşıyor · "ust" üst üste · "deger" başka gemiye değiyor
  function uygun(gemiler, g, haric) {
    if (!sigar(g)) return "sigmaz";
    const occ = new Set();
    gemiler.forEach((x, k) => { if (k === haric || !x || x.r == null) return; hucreler(x).forEach((i) => occ.add(i)); });
    const cs = hucreler(g);
    if (cs.some((i) => occ.has(i))) return "ust";
    if (hale(cs).some((i) => occ.has(i))) return "deger";
    return "";
  }
  function rastgeleFilo() {
    for (let t = 0; t < 1000; t++) {
      const G = []; let ok = true;
      for (const f of FILO) {
        let yer = null;
        for (let d = 0; d < 300 && !yer; d++) { const y = Math.random() < 0.5; const g = { n: f.n, yatay: y, r: Math.floor(Math.random() * (y ? N : N - f.n + 1)), c: Math.floor(Math.random() * (y ? N - f.n + 1 : N)) }; if (!uygun(G, g, -1)) yer = g; }
        if (!yer) { ok = false; break; }
        G.push(yer);
      }
      if (ok) return G;
    }
    return null;
  }
  // Sabit yerleşim listesi: her uzunluk için tüm konumlar (kareler + çevre)
  const YER = {};
  for (let L = 2; L <= 5; L++) { YER[L] = [];
    for (const y of [true, false]) for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const g = { n: L, yatay: y, r, c }; if (!sigar(g)) continue; const cs = hucreler(g); YER[L].push({ g, cs, ha: hale(cs) }); } }
  // Boş tahtada her karenin "gemi olma" olasılığı (önsel ısı); Zor'un kendi filosunu dizerken kullanılır
  const ONSEL = (() => { const s = new Float64Array(100); FILO.forEach((f) => YER[f.n].forEach((p) => p.cs.forEach((i) => (s[i] += 1)))); return s; })();
  // Zor: kendi filosunu öngörülemez diz. Tamamen kenara yaslanmış ya da hep ortada duran dizilişler elenir;
  // birkaç rastgele aday arasından ısı haritasında daha az göze batanlardan biri rastgele seçilir.
  function zorFilo() {
    const A = [];
    for (let t = 0; t < 40 && A.length < 14; t++) {
      const G = rastgeleFilo(); if (!G) continue;
      const kenar = G.filter((g) => hucreler(g).some((i) => { const r = (i / N) | 0, c = i % N; return r === 0 || c === 0 || r === N - 1 || c === N - 1; })).length;
      if (kenar < 1 || kenar > 3) continue;
      A.push({ G, s: G.reduce((a, g) => a + hucreler(g).reduce((b, i) => b + ONSEL[i], 0), 0) });
    }
    if (!A.length) return rastgeleFilo();
    A.sort((a, b) => a.s - b.s);
    return rnd(A.slice(0, Math.max(1, Math.ceil(A.length / 2)))).G;
  }
  // Atış dizisinden görüş: 0 bilinmiyor · 1 boş (ıska) · 2 isabet (batmamış) · 3 batmış gemi karesi
  function gorus(gemiler, atis) {
    const k = atis.map((v) => (v === 1 ? 1 : v === 2 ? 2 : 0)), kalan = [];
    gemiler.forEach((g) => { const cs = hucreler(g); if (cs.every((i) => atis[i] === 2)) cs.forEach((i) => (k[i] = 3)); else kalan.push(g.n); });
    return { k, kalan };
  }
  function komsu4(i) { const r = (i / N) | 0, c = i % N, o = []; if (r > 0) o.push(i - N); if (r < N - 1) o.push(i + N); if (c > 0) o.push(i - 1); if (c < N - 1) o.push(i + 1); return o; }
  function kumeler(k) { // birbirine bitişik batmamış isabetler (değmeme kuralı yüzünden her küme tek bir gemi)
    const gor = new Uint8Array(100), out = [];
    for (let i = 0; i < 100; i++) { if (k[i] !== 2 || gor[i]) continue; const q = [i], cl = []; gor[i] = 1;
      while (q.length) { const x = q.pop(); cl.push(x); for (const y of komsu4(x)) if (k[y] === 2 && !gor[y]) { gor[y] = 1; q.push(y); } }
      out.push(cl.sort((a, b) => a - b)); }
    return out;
  }
  function haleBos(k, capraz) { // batan gemilerin çevresi boş; Zor'da isabetlerin çaprazı da boş
    for (let i = 0; i < 100; i++) {
      if (k[i] === 3) for (const j of hale([i])) { if (k[j] === 0) k[j] = 1; }
      if (capraz && k[i] === 2) { const r = (i / N) | 0, c = i % N; for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) { const rr = r + dr, cc = c + dc; if (rr >= 0 && cc >= 0 && rr < N && cc < N && k[rr * N + cc] === 0) k[rr * N + cc] = 1; } }
    }
  }
  function aiKolay(gr) {
    const k = gr.k, bil = [];
    for (let i = 0; i < 100; i++) if (k[i] === 0) bil.push(i);
    const hit = []; for (let i = 0; i < 100; i++) if (k[i] === 2) hit.push(i);
    if (hit.length && Math.random() < 0.5) { const nb = []; hit.forEach((h) => komsu4(h).forEach((j) => { if (k[j] === 0) nb.push(j); })); if (nb.length) return rnd(nb); }
    return rnd(bil);
  }
  function aiOrta(gr) {
    const k = gr.k; // Orta, batan geminin çevresinin boş olduğunu hesaba katmaz (bu yüzden yenilebilir)
    const cl = kumeler(k);
    if (cl.length) {
      const a = cl[0]; let cand = [];
      if (a.length >= 2) { const yatay = ((a[0] / N) | 0) === ((a[1] / N) | 0), bas = a[0], son = a[a.length - 1];
        if (yatay) { if (bas % N > 0 && k[bas - 1] === 0) cand.push(bas - 1); if (son % N < N - 1 && k[son + 1] === 0) cand.push(son + 1); }
        else { if (bas >= N && k[bas - N] === 0) cand.push(bas - N); if (son < 90 && k[son + N] === 0) cand.push(son + N); } }
      if (!cand.length) a.forEach((h) => komsu4(h).forEach((j) => { if (k[j] === 0) cand.push(j); }));
      if (cand.length) return rnd(cand);
    }
    const bil = []; for (let i = 0; i < 100; i++) if (k[i] === 0) bil.push(i);
    const P = bil.filter((i) => (((i / N) | 0) + (i % N)) % 2 === 0);
    return rnd(P.length ? P : bil.length ? bil : [gr.k.indexOf(0)]);
  }
  // Zor: kalan gemilerin birlikte (birbirine değmeden) dizilişlerini örnekler; her kare kaç örnekte gemi altında kaldıysa o kadar olası.
  function aiZor(gr, opt) {
    const k = gr.k.slice(); haleBos(k, true);
    const kalan = gr.kalan.slice().sort((a, b) => b - a);
    const cl = kumeler(k);
    // Her uzunluk için tahtayla çelişmeyen konumlar: kareler boş ya da isabet, çevresinde isabet/batık yok
    const B = {}, BT = {};
    for (const L of new Set(kalan)) { B[L] = []; BT[L] = [];
      for (const p of YER[L]) { let ok = true, hitVar = false;
        for (const i of p.cs) { if (k[i] === 1 || k[i] === 3) { ok = false; break; } if (k[i] === 2) hitVar = true; }
        if (!ok) continue;
        for (const i of p.ha) if (k[i] >= 2) { ok = false; break; }
        if (!ok) continue;
        (hitVar ? BT[L] : B[L]).push(p); } }
    // Her küme için onu tamamen örtebilecek (uzunluk, konum) çiftleri
    const KC = cl.map((a) => { const o = []; for (const L of new Set(kalan)) for (const p of BT[L]) if (a.every((i) => p.cs.includes(i))) o.push([L, p]); return o; });
    const say = new Float64Array(100), blok = new Uint8Array(100), maxS = (opt && opt.ornek) || 2500, t0 = Date.now();
    let kabul = 0;
    const koy = (p) => { for (const i of p.cs) blok[i] = 1; for (const i of p.ha) blok[i] = 1; };
    const bos = (p) => { for (const i of p.cs) if (blok[i]) return false; return true; };
    const secilen = [];
    for (let s = 0; s < maxS * 4 && kabul < maxS; s++) {
      if ((s & 63) === 0 && Date.now() - t0 > 120) break;
      blok.fill(0); secilen.length = 0; const kal = kalan.slice(); let ok = true;
      for (let c = 0; c < KC.length && ok; c++) { // önce isabetli kümeleri örten gemiler
        const L0 = KC[c].filter(([L, p]) => kal.includes(L) && bos(p));
        if (!L0.length) { ok = false; break; }
        const [L, p] = rnd(L0); kal.splice(kal.indexOf(L), 1); koy(p); secilen.push(p);
      }
      for (let j = 0; j < kal.length && ok; j++) { // sonra kalanlar, rastgele boş konumlara
        const A = B[kal[j]]; if (!A.length) { ok = false; break; }
        let p = null; for (let d = 0; d < 40; d++) { const x = A[(Math.random() * A.length) | 0]; if (bos(x)) { p = x; break; } }
        if (!p) { ok = false; break; }
        koy(p); secilen.push(p);
      }
      if (!ok) continue;
      kabul++;
      for (const p of secilen) for (const i of p.cs) if (k[i] === 0) say[i]++;
    }
    let en = -1, eni = [];
    for (let i = 0; i < 100; i++) { if (k[i] !== 0) continue; if (say[i] > en + 1e-9) { en = say[i]; eni = [i]; } else if (Math.abs(say[i] - en) < 1e-9) eni.push(i); }
    if (en > 0) return rnd(eni);
    return aiOrta(gr); // örnek çıkmazsa (çok nadir) Orta'nın yöntemi
  }
  function aiAtis(lvl, gr, opt) { return lvl >= 3 ? aiZor(gr, opt) : lvl === 2 ? aiOrta(gr) : aiKolay(gr); }
  function sim(lvl, n, opt) { // test: AI'ı rastgele filolara karşı oynatır, batırana kadar atış sayısı
    const L = [];
    for (let t = 0; t < n; t++) {
      const G = (opt && opt.zorFilo) ? zorFilo() : rastgeleFilo(), at = Array(100).fill(0), occ = new Set(); G.forEach((g) => hucreler(g).forEach((i) => occ.add(i)));
      let s = 0;
      for (;;) { const gr = gorus(G, at); if (!gr.kalan.length) break; const i = aiAtis(lvl, gr, opt); if (at[i] || i == null || i < 0) throw new Error("AI aynı kareye attı " + i); at[i] = occ.has(i) ? 2 : 1; if (++s > 100) throw new Error("bitmedi"); }
      L.push(s);
    }
    L.sort((a, b) => a - b);
    return { ort: +(L.reduce((a, b) => a + b, 0) / n).toFixed(2), medyan: L[n >> 1], min: L[0], max: L[n - 1] };
  }
  window.AmiralMotor = { N, FILO, hucreler, hale, uygun, rastgeleFilo, zorFilo, gorus, aiAtis, sim };
  if (typeof document === "undefined" || !document.getElementById("amiral")) return;

  // ---------- Arayüz ----------
  const $ = (id) => document.getElementById(id);
  const KAYIT = "amOyun", AYAR = "amAyar", IST = "amIstat";
  const S = { faz: "diz", lvl: 2, auto: true, ses: false, ben: [], sec: 0, rakip: [], bAt: [], rAt: [], sira: "p", atis: 0, isabet: 0, tur: 1, seri: 0, enSeri: 0, son: -1, sonA: -1, st: 0 };
  let hazir = false, aiZaman = null;
  const bosFilo = () => FILO.map((f) => ({ n: f.n, r: null, c: null, yatay: true }));
  S.ben = bosFilo();
  try { const a = JSON.parse(localStorage.getItem(AYAR) || "null"); if (a) { S.lvl = [1, 2, 3].includes(a.l) ? a.l : 2; S.auto = a.auto !== false; S.ses = !!a.ses; } } catch (e) {}
  const ayarYaz = () => { try { localStorage.setItem(AYAR, JSON.stringify({ l: S.lvl, auto: S.auto, ses: S.ses })); } catch (e) {} };

  // Ses (kapalı başlar): su sıçraması, patlama, batış
  let AC = null;
  function ses(tur) {
    if (!S.ses) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume();
      const t = AC.currentTime, uz = tur === "su" ? 0.35 : tur === "bum" ? 0.55 : 0.9;
      const len = Math.floor(AC.sampleRate * uz), buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, tur === "su" ? 3 : 2);
      const src = AC.createBufferSource(); src.buffer = buf;
      const lp = AC.createBiquadFilter(); lp.type = "lowpass";
      lp.frequency.setValueAtTime(tur === "su" ? 2200 : 1100, t); lp.frequency.exponentialRampToValueAtTime(tur === "su" ? 260 : 90, t + uz);
      const g = AC.createGain(); g.gain.value = tur === "su" ? 0.35 : 0.6;
      src.connect(lp).connect(g).connect(AC.destination); src.start(t);
      if (tur !== "su") { const o = AC.createOscillator(), og = AC.createGain(); o.type = "sine"; o.frequency.setValueAtTime(tur === "bat" ? 90 : 120, t); o.frequency.exponentialRampToValueAtTime(35, t + uz); og.gain.setValueAtTime(0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + uz); o.connect(og).connect(AC.destination); o.start(t); o.stop(t + uz); }
    } catch (e) {}
  }
  const titre = (ms) => { try { if (S.ses && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

  // Tahta kur: tip "dusman" (dokunulur), "diz" (dokunulur), "ben" (izleme)
  function tahtaKur(el, tip) {
    const btn = tip !== "ben";
    let h = `<div class="amCols" aria-hidden="true">${HARF.split("").map((x) => `<span>${x}</span>`).join("")}</div><div class="amRows" aria-hidden="true">${Array.from({ length: N }, (_, i) => `<span>${i + 1}</span>`).join("")}</div><div class="amSea">`;
    if (tip === "dusman") h += '<div class="amSonar" aria-hidden="true"><i></i></div>';
    h += '<div class="amLay"></div>';
    for (let i = 0; i < 100; i++) h += btn ? `<button type="button" class="amC" data-i="${i}" aria-label="${kor(i)}"></button>` : `<div class="amC" data-i="${i}"></div>`;
    h += '<div class="amFx"></div></div>';
    el.innerHTML = h;
    el._c = Array.from(el.querySelectorAll(".amC")); el._lay = el.querySelector(".amLay"); el._fx = el.querySelector(".amFx");
  }
  function hucreSinif(el, i, cls) { const c = el._c[i], v = "amC" + (cls ? " " + cls : ""); if (c.className !== v) c.className = v; }
  // Gemi katmanı: anahtarlı; yeni gemi eklenince yalnızca o canlanır
  function gemiCiz(el, list) {
    const var_ = {}; el._lay.querySelectorAll(".amGm").forEach((x) => (var_[x.dataset.k] = x));
    list.forEach((o) => {
      let d = var_[o.key]; delete var_[o.key];
      if (!d) { d = document.createElement("i"); d.dataset.k = o.key; el._lay.appendChild(d); }
      const g = o.g, cls = "amGm" + (g.yatay ? "" : " v") + (o.cls ? " " + o.cls : "");
      if (d.className !== cls) d.className = cls;
      const st = `left:${g.c * 10}%;top:${g.r * 10}%;width:${(g.yatay ? g.n : 1) * 10}%;height:${(g.yatay ? 1 : g.n) * 10}%`;
      if (d.getAttribute("style") !== st) d.setAttribute("style", st);
    });
    Object.values(var_).forEach((x) => x.remove());
  }
  function efekt(el, i, cls, sure) {
    const d = document.createElement("i"); d.className = cls; d.style.left = (i % N) * 10 + "%"; d.style.top = ((i / N) | 0) * 10 + "%";
    el._fx.appendChild(d); if (sure) setTimeout(() => d.remove(), sure); return d;
  }
  const ilk = (el) => { el.classList.add("ilk"); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("ilk"))); };

  const dizBd = $("amDizBd"), dBd = $("amDusmanBd"), bBd = $("amBenBd");
  tahtaKur(dizBd, "diz"); tahtaKur(dBd, "dusman"); tahtaKur(bBd, "ben");

  // ----- Ayar alanı -----
  const bedel = () => LV[S.lvl].bedel;
  function yildizYaz() {
    if (!window.Token) { $("amYildiz").hidden = true; return; }
    const b = Token.bakiye(), v = bedel();
    $("amYildiz").innerHTML = `<span>⭐ Bu ayar: <b>${Token.fmt(v)}</b> Yıldız<br><small style="color:var(--muted)">Kazanırsan ${Token.fmt(v * 2)} · bakiyen ${Token.fmt(b)}</small></span>${b < v ? `<small style="color:var(--red);text-align:right">Yetmiyor,<br>daha kolay seç</small>` : ""}`;
    $("amBasla").textContent = `⚓ Savaşa başla · ${Token.fmt(v)} ⭐`;
  }
  const istOku = () => { try { return JSON.parse(localStorage.getItem(IST) || "{}") || {}; } catch (e) { return {}; } };
  function istMetin(x) { return x && x.o ? `📊 ${LV[S.lvl].ad} seviyesinde: <b>${x.o}</b> oyun · <b>${x.k}</b> galibiyet${x.en ? ` · en az <b>${x.en}</b> atışla kazandın` : ""}${x.o ? ` · ortalama isabet %${Math.round(x.acc / x.o)}` : ""}` : ""; }
  function istYaz() { $("amIstat").innerHTML = istMetin(istOku()[S.lvl]); }
  function lvlYaz() {
    $("amLvl").querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.l === S.lvl));
    $("amLvlHint").textContent = LV[S.lvl].not; istYaz(); yildizYaz();
  }
  $("amLvl").addEventListener("click", (e) => { const b = e.target.closest("button[data-l]"); if (!b) return; S.lvl = +b.dataset.l; ayarYaz(); $("amErr").textContent = ""; lvlYaz(); });
  function ayarlarCiz() {
    document.querySelectorAll(".amAyarlar").forEach((el) => {
      el.innerHTML = `<button type="button" data-a="auto" aria-pressed="${S.auto}">🧭 Otomatik işaretle: ${S.auto ? "açık" : "kapalı"}</button><button type="button" data-a="ses" aria-pressed="${S.ses}" aria-label="Ses ${S.ses ? "açık" : "kapalı"}">${S.ses ? "🔊 Ses açık" : "🔇 Ses kapalı"}</button>`;
    });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".amAyarlar button[data-a]"); if (!b) return;
    if (b.dataset.a === "auto") S.auto = !S.auto; else { S.ses = !S.ses; if (S.ses) ses("su"); }
    ayarYaz(); ayarlarCiz(); if (S.faz !== "diz") savasCiz();
  });
  $("amNasil").addEventListener("toggle", () => { if ($("amNasil").open && window.Rapor) Rapor.bolum("nasil"); });

  // ----- Diziliş -----
  let hayalet = null; // { g, kot }
  function dizMsg(t, bad) { const m = $("amDizMsg"); m.textContent = t; m.classList.toggle("bad", !!bad); }
  function dizCiz() {
    for (let i = 0; i < 100; i++) hucreSinif(dizBd, i, "");
    const L = [];
    S.ben.forEach((g, k) => { if (g.r != null) L.push({ key: "g" + k, g, cls: k === S.sec ? "sec" : "" }); });
    if (hayalet) L.push({ key: "hay" + (hayalet.kot ? "k" : "") + (hayalet.say || 0), g: hayalet.g, cls: "hay" + (hayalet.kot ? " kot" : "") });
    gemiCiz(dizBd, L);
    $("amTray").innerHTML = FILO.map((f, k) => { const g = S.ben[k]; return `<button type="button" data-k="${k}" class="${k === S.sec ? "on" : ""}${g.r != null ? " ok" : ""}${g.yatay ? "" : " v"}" aria-pressed="${k === S.sec}"><b>${f.ad}</b><i>${"<s></s>".repeat(f.n)}</i><small>${f.n} kare · ${g.yatay ? "yatay" : "dikey"}</small></button>`; }).join("");
    const kac = S.ben.filter((g) => g.r != null).length;
    $("amDizSay").textContent = `${kac}/5 dizildi`;
    $("amBasla").disabled = kac < 5;
  }
  function yerles(k, bas, yatay) { // baş kareye göre, taşarsa geri kaydırarak
    const n = S.ben[k].n; let r = (bas / N) | 0, c = bas % N;
    if (yatay) c = Math.max(0, Math.min(c, N - n)); else r = Math.max(0, Math.min(r, N - n));
    return { n, yatay, r, c };
  }
  const HATA = { sigmaz: "Buraya sığmıyor.", ust: "Orada başka bir gemi var.", deger: "Gemiler birbirine değemez, çapraz da olmaz." };
  function kotGoster(g) { hayalet = { g, kot: true, say: Date.now() }; dizCiz(); clearTimeout(kotGoster.t); kotGoster.t = setTimeout(() => { hayalet = null; dizCiz(); }, 700); }
  function koyDene(k, g) {
    const h = uygun(S.ben, g, k);
    if (h) { kotGoster(g); dizMsg(HATA[h], true); return false; }
    Object.assign(S.ben[k], g); hayalet = null;
    const sira = S.ben.findIndex((x) => x.r == null);
    S.sec = sira; dizMsg(sira >= 0 ? `${FILO[k].ad} yerleşti ✓ Sıradaki: ${FILO[sira].ad}.` : "Filon hazır! İstersen gemilere dokunup yerini değiştirebilirsin.");
    dizCiz(); kaydet(); return true;
  }
  const gemiNerede = (i) => S.ben.findIndex((g) => g.r != null && hucreler(g).includes(i));
  function dondur(k) {
    const g = S.ben[k]; if (k < 0 || !g) return;
    if (g.r == null) { g.yatay = !g.yatay; dizMsg(`${FILO[k].ad} artık ${g.yatay ? "yatay" : "dikey"}.`); dizCiz(); return; }
    const bas = g.r * N + g.c, y = !g.yatay;
    for (const b of [bas, bas - (y ? 1 : N), bas - (y ? 2 : 2 * N)]) { if (b < 0) continue; const ng = yerles(k, b, y); if (!uygun(S.ben, ng, k)) { Object.assign(g, ng); dizMsg(`${FILO[k].ad} döndü ↻`); dizCiz(); kaydet(); return; } }
    kotGoster({ n: g.n, yatay: y, r: g.r, c: g.c }); dizMsg("Burada dönemiyor; önce biraz kaydır.", true);
  }
  function dizHucre(i) {
    if (S.faz !== "diz") return;
    const k = gemiNerede(i);
    if (k >= 0 && (S.sec !== k)) { S.sec = k; dizMsg(`${FILO[k].ad} seçildi: yeni yerine dokun ya da bir daha dokunup döndür.`); dizCiz(); return; }
    if (k >= 0 && S.sec === k) { dondur(k); return; }
    if (S.sec == null || S.sec < 0) { dizMsg("Önce aşağıdan bir gemi seç 🙂"); return; }
    const g = S.ben[S.sec]; koyDene(S.sec, yerles(S.sec, i, g.yatay));
  }
  // Fare: üstünde gezinince gölge; bilgisayarda gemiyi sürükleyip bırakabilirsin
  let surukle = null, sonFare = 0;
  const hucreAl = (x, y) => { const e = document.elementFromPoint(x, y), c = e && e.closest && e.closest("#amDizBd .amC"); return c ? +c.dataset.i : -1; };
  dizBd.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || S.faz !== "diz") return;
    const c = e.target.closest(".amC"); if (!c) return; const i = +c.dataset.i, k = gemiNerede(i);
    if (k < 0) return;
    const g = S.ben[k], off = g.yatay ? i % N - g.c : ((i / N) | 0) - g.r;
    surukle = { k, off, i0: i, son: i }; e.preventDefault();
  });
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || S.faz !== "diz") return;
    const i = hucreAl(e.clientX, e.clientY);
    if (surukle) {
      if (i < 0 || i === surukle.son) return; surukle.son = i;
      const g = S.ben[surukle.k], r = ((i / N) | 0) - (g.yatay ? 0 : surukle.off), c = (i % N) - (g.yatay ? surukle.off : 0);
      const ng = { n: g.n, yatay: g.yatay, r: Math.max(0, Math.min(r, g.yatay ? N - 1 : N - g.n)), c: Math.max(0, Math.min(c, g.yatay ? N - g.n : N - 1)) };
      hayalet = { g: ng, kot: !!uygun(S.ben, ng, surukle.k) }; dizCiz(); return;
    }
    if (S.sec == null || S.sec < 0 || i < 0 || gemiNerede(i) >= 0) { if (hayalet && !hayalet.say) { hayalet = null; dizCiz(); } return; }
    const ng = yerles(S.sec, i, S.ben[S.sec].yatay);
    if (!hayalet || hayalet.say || hayalet.g.r !== ng.r || hayalet.g.c !== ng.c || hayalet.g.yatay !== ng.yatay || hayalet.g.n !== ng.n) { hayalet = { g: ng, kot: !!uygun(S.ben, ng, S.sec) }; dizCiz(); }
  });
  document.addEventListener("pointerup", (e) => {
    if (!surukle) return; const s = surukle; surukle = null; sonFare = Date.now();
    if (s.son === s.i0) { hayalet = null; dizHucre(s.i0); return; }
    if (hayalet) { const g = hayalet.g; hayalet = null; S.sec = s.k; koyDene(s.k, g); }
  });
  dizBd.addEventListener("pointerleave", () => { if (!surukle && hayalet && !hayalet.say) { hayalet = null; dizCiz(); } });
  dizBd.addEventListener("click", (e) => { const c = e.target.closest(".amC"); if (!c) return; if (Date.now() - sonFare < 400) return; dizHucre(+c.dataset.i); });
  $("amTray").addEventListener("click", (e) => { const b = e.target.closest("button[data-k]"); if (!b) return; const k = +b.dataset.k; S.sec = S.sec === k ? -1 : k; dizMsg(S.sec >= 0 ? `${FILO[k].ad} seçildi: denizde başlayacağı kareye dokun.` : ""); dizCiz(); });
  $("amDondur").onclick = () => { if (S.sec == null || S.sec < 0) { dizMsg("Döndürmek için önce bir gemi seç."); return; } dondur(S.sec); };
  $("amRastgele").onclick = () => { const G = rastgeleFilo(); S.ben = G.map((g) => ({ ...g })); S.sec = -1; hayalet = null; dizMsg("🎲 Filo rastgele dizildi. Beğenmezsen bir daha dene."); dizCiz(); kaydet(); };
  $("amTemizle").onclick = () => { S.ben = bosFilo(); S.sec = 0; hayalet = null; dizMsg("Deniz boş. Uçak gemisinden başla."); dizCiz(); kaydet(); };
  document.addEventListener("keydown", (e) => { if (S.faz === "diz" && (e.key === "r" || e.key === "R") && e.target.tagName !== "INPUT") dondur(S.sec); });

  // ----- Savaş -----
  const batik = (gemiler, at) => gemiler.map((g) => hucreler(g).every((i) => at[i] === 2));
  const occOf = (gemiler) => { const o = new Int8Array(100).fill(-1); gemiler.forEach((g, k) => hucreler(g).forEach((i) => (o[i] = k))); return o; };
  function msg(t) { const m = $("amSavasMsg"); m.innerHTML = t; m.classList.remove("yeni"); void m.offsetWidth; m.classList.add("yeni"); }
  function savasCiz() {
    const bD = batik(S.rakip, S.bAt), bB = batik(S.ben, S.rAt), bitti = S.faz === "bitti";
    // Düşman denizi
    const oto = new Set();
    if (S.auto) S.rakip.forEach((g, k) => { if (bD[k]) hale(hucreler(g)).forEach((i) => { if (!S.bAt[i]) oto.add(i); }); });
    const dOcc = occOf(S.rakip);
    for (let i = 0; i < 100; i++) {
      const v = S.bAt[i]; let c = v === 1 ? "m" : v === 2 ? "h" + (bD[dOcc[i]] ? " s" : "") : oto.has(i) ? "x" : "";
      if (i === S.son) c += " son";
      hucreSinif(dBd, i, c.trim());
      const b = dBd._c[i]; const dis = bitti || !!v || oto.has(i); if (b.disabled !== dis) b.disabled = dis;
      b.setAttribute("aria-label", kor(i) + (v === 1 ? " ıska" : v === 2 ? " isabet" : oto.has(i) ? " boş" : ""));
    }
    const LD = [];
    S.rakip.forEach((g, k) => { if (bD[k]) LD.push({ key: "d" + k, g, cls: "dbat" }); else if (bitti) LD.push({ key: "k" + k, g, cls: "kalan" }); });
    gemiCiz(dBd, LD);
    dBd.classList.toggle("aktif", S.faz === "savas" && S.sira === "p");
    // Kendi denizin
    for (let i = 0; i < 100; i++) { const v = S.rAt[i]; hucreSinif(bBd, i, (v === 1 ? "m" : v === 2 ? "h" : "") + (i === S.sonA ? " son" : "")); }
    gemiCiz(bBd, S.ben.map((g, k) => ({ key: "b" + k, g, cls: bB[k] ? "olu" : "" })));
    // Filo durumları
    $("amFiloD").innerHTML = FILO.map((f, k) => `<span class="${bD[k] ? "bat" : ""}">${f.ad}<i>${"<s></s>".repeat(f.n)}</i></span>`).join("");
    $("amFiloB").innerHTML = FILO.map((f, k) => { const cs = hucreler(S.ben[k]); return `<span class="${bB[k] ? "bat" : ""}">${f.ad}<i>${cs.map((i) => `<s class="${S.rAt[i] === 2 ? "v" : ""}"></s>`).join("")}</i></span>`; }).join("");
    const acc = S.atis ? Math.round((100 * S.isabet) / S.atis) : 0;
    $("amSay").textContent = `Tur ${S.tur} · ${S.atis} atış · %${acc} isabet`;
    $("amSira").textContent = bitti ? "Oyun bitti" : S.sira === "p" ? "🎯 Sıra sende" : "⏳ Sadolayn nişan alıyor";
    $("amSeriYer").innerHTML = !bitti && S.seri >= 2 ? `<span class="amSeri">🔥 ${S.seri} isabet üst üste!</span>` : "";
    $("amSonA").textContent = S.sonA >= 0 ? `Sadolayn'ın son atışı: ${kor(S.sonA)} ${S.rAt[S.sonA] === 2 ? "🔥" : "· ıska"}` : "";
    $("amLvlRozet").textContent = `${LV[S.lvl].em} ${LV[S.lvl].ad}${S.st ? ` · ⭐ ${window.Token ? Token.fmt(S.st) : S.st}` : ""}`;
    ayarlarCiz();
  }
  function ekran() {
    const sv = S.faz !== "diz";
    $("amAyar").hidden = sv; $("amDiz").hidden = sv; $("amOyun").hidden = !sv;
    document.body.classList.toggle("amSv", sv);
    $("amBirak").parentElement.hidden = S.faz === "bitti";
  }
  $("amBasla").onclick = () => {
    if (S.ben.some((g) => g.r == null)) return;
    $("amErr").textContent = "";
    if (window.Token) {
      const v = bedel();
      if (!Token.koy(v)) { $("amErr").innerHTML = `${LV[S.lvl].ad} seviyesi için <b>${Token.fmt(v)}</b> Yıldız gerekiyor, bakiyen ${Token.fmt(Token.bakiye())}. ${S.lvl > 1 ? "Daha kolay bir seviye seçebilirsin 🙂 " : ""}İş Bankası Gündemi'ndeki <a href="isbank.html">Günün sorusu</a>nda üst üste 10 doğru 500 Yıldız kazandırır.`; return; }
      S.st = v;
    }
    Object.assign(S, { faz: "savas", rakip: (S.lvl === 3 ? zorFilo() : rastgeleFilo()).map((g) => ({ ...g })), bAt: Array(100).fill(0), rAt: Array(100).fill(0), sira: "p", atis: 0, isabet: 0, tur: 1, seri: 0, enSeri: 0, son: -1, sonA: -1 });
    S.sec = -1; hayalet = null; $("amSonuc").hidden = true; $("amSonuc").innerHTML = ""; bekleyenBirak();
    ekran(); dBd._fx.innerHTML = ""; bBd._fx.innerHTML = ""; ilk(dBd); ilk(bBd); savasCiz();
    msg(`Sadolayn filosunu gizledi. İlk atış senin: denizinden bir kareye dokun 🎯`);
    kaydet(); yildizYaz();
    window.scrollTo({ top: 0 });
  };
  dBd.addEventListener("click", (e) => {
    const c = e.target.closest(".amC"); if (!c || c.disabled) return;
    if (S.faz !== "savas" || S.sira !== "p") return;
    atesEt(+c.dataset.i);
  });
  function atesEt(i) {
    if (S.bAt[i]) return;
    const occ = occOf(S.rakip), k = occ[i];
    S.atis++; S.son = i;
    if (k < 0) {
      S.bAt[i] = 1; S.seri = 0; efekt(dBd, i, "sp", 600); ses("su");
      msg(`${kor(i)} · ıska 🌊 Sıra Sadolayn'da.`);
      S.sira = "a"; savasCiz(); kaydet(); aiSira(); return;
    }
    S.bAt[i] = 2; S.isabet++; S.seri++; S.enSeri = Math.max(S.enSeri, S.seri);
    efekt(dBd, i, "bm", 600); titre(15);
    const bat = hucreler(S.rakip[k]).every((j) => S.bAt[j] === 2);
    if (bat) {
      ses("bat");
      const hepsi = batik(S.rakip, S.bAt).every(Boolean);
      msg(`💥 <b>${FILO[k].ad} battı!</b>${hepsi ? "" : ` ${5 - batik(S.rakip, S.bAt).filter(Boolean).length} gemi kaldı. Bir atış daha senin.`}`);
      if (hepsi) { savasCiz(); return bitir(true); }
    } else { ses("bum"); msg(`${kor(i)} · isabet 🔥 Bir atış daha senin.`); }
    savasCiz(); kaydet();
  }
  function bekleyenBirak() { clearTimeout(aiZaman); aiZaman = null; }
  function aiSira() {
    bekleyenBirak();
    aiZaman = setTimeout(() => {
      if (S.faz !== "savas" || S.sira !== "a") return;
      const gr = gorus(S.ben, S.rAt), i = aiAtis(S.lvl, gr);
      bBd._fx.innerHTML = ""; efekt(bBd, i, "ns");
      aiZaman = setTimeout(() => {
        bBd._fx.innerHTML = "";
        if (S.faz !== "savas") return;
        const occ = occOf(S.ben), k = occ[i];
        S.sonA = i;
        if (k < 0) {
          S.rAt[i] = 1; efekt(bBd, i, "sp", 600); ses("su");
          S.sira = "p"; S.tur++;
          msg(`Sadolayn ${kor(i)}'e attı · ıska 🌊 Sıra sende.`);
          savasCiz(); kaydet(); return;
        }
        S.rAt[i] = 2; efekt(bBd, i, "bm", 600); titre(25);
        const bat = hucreler(S.ben[k]).every((j) => S.rAt[j] === 2);
        if (bat) {
          ses("bat");
          if (batik(S.ben, S.rAt).every(Boolean)) { msg(`💥 Sadolayn senin ${FILO[k].ad}'ini de batırdı.`); savasCiz(); return bitir(false); }
          msg(`💥 Sadolayn senin <b>${FILO[k].ad}</b> gemini batırdı! Bir daha atıyor…`);
        } else { ses("bum"); msg(`Sadolayn ${kor(i)}'i vurdu 🔥 Bir daha atıyor…`); }
        savasCiz(); kaydet(); aiSira();
      }, 600);
    }, 380);
  }
  function bitir(kazandi, birakti) {
    bekleyenBirak();
    S.faz = "bitti"; S.seri = 0;
    const acc = S.atis ? Math.round((100 * S.isabet) / S.atis) : 0;
    let yz = "";
    if (S.st && window.Token) { yz = Token.sonuc("amiral", S.st, 2, kazandi ? 2 : 0, kazandi ? "🏆" : "").html; S.st = 0; }
    const A = istOku(), x = A[S.lvl] || { o: 0, k: 0, en: 0, acc: 0 };
    x.o++; x.acc += acc; let rekor = "";
    if (kazandi) { x.k++; if (!x.en || S.atis < x.en) { rekor = x.en ? "yeni" : "ilk"; x.en = S.atis; } }
    A[S.lvl] = x; try { localStorage.setItem(IST, JSON.stringify(A)); } catch (e) {}
    window.Rapor && Rapor.oyun("amiral", !!kazandi, `${LV[S.lvl].ad} | ${S.atis} atış | %${acc} isabet${birakti ? " | bıraktı" : ""}`);
    const baslik = kazandi ? "🏆 Kazandın! Sadolayn'ın filosu battı." : birakti ? "🏳️ Oyunu bıraktın" : "🌊 Sadolayn kazandı";
    const alt = kazandi ? `${LV[S.lvl].em} ${LV[S.lvl].ad} seviyesinde ${S.atis} atışta bitirdin.` : `Sadolayn'ın batmayan gemileri haritada kesik çizgiyle görünüyor.`;
    $("amSonuc").innerHTML = `<div class="amSonuc"><div class="amBig">${baslik}</div><p class="hint" style="margin:0">${alt}</p>
      <div class="amTiles"><div><b>${S.atis}</b><span>atış</span></div><div><b>%${acc}</b><span>isabet</span></div><div><b>${S.tur}</b><span>tur</span></div><div><b>${S.enSeri}</b><span>en uzun seri</span></div></div>
      ${yz}${rekor ? `<span class="amSeri">🏅 ${rekor === "yeni" ? `Yeni rekor: ${S.atis} atış!` : "Bu seviyede ilk galibiyetin!"}</span>` : ""}
      <p class="amIst">${istMetin(x)}</p>
      <button type="button" class="btn-go" id="amYeni">⚓ Yeni oyun</button></div>`;
    $("amSonuc").hidden = false;
    $("amYeni").onclick = yeniOyun;
    try { localStorage.removeItem(KAYIT); } catch (e) {}
    savasCiz(); ekran(); yildizYaz(); istYaz();
    setTimeout(() => $("amSonuc").scrollIntoView({ behavior: "smooth", block: "nearest" }), 450);
  }
  function yeniOyun() {
    bekleyenBirak();
    S.faz = "diz"; S.sec = -1; hayalet = null; $("amSonuc").hidden = true;
    ekran(); dizCiz(); dizMsg("Filon geçen oyundaki gibi dizili. İstersen değiştir, sonra savaşa başla."); lvlYaz(); kaydet();
    window.scrollTo({ top: 0 });
  }
  $("amBirak").onclick = () => {
    const b = $("amBirak");
    if (S.faz !== "savas") return;
    if (!b.classList.contains("emin")) { b.classList.add("emin"); b.textContent = S.st ? `Emin misin? ${Token.fmt(S.st)} Yıldız yanar · Bırak` : "Emin misin? · Bırak"; clearTimeout(b._t); b._t = setTimeout(() => { b.classList.remove("emin"); b.textContent = "Oyunu bırak"; }, 4000); return; }
    b.classList.remove("emin"); b.textContent = "Oyunu bırak";
    msg("Oyunu bıraktın. Sadolayn'ın gemileri ortaya çıktı.");
    bitir(false, true);
  };

  // ----- Kayıt -----
  function kaydet() {
    if (!hazir) return;
    try {
      if (S.faz === "diz") { if (S.ben.some((g) => g.r != null)) localStorage.setItem(KAYIT, JSON.stringify({ v: 1, faz: "diz", ben: S.ben, t: Date.now() })); else localStorage.removeItem(KAYIT); return; }
      if (S.faz !== "savas") { localStorage.removeItem(KAYIT); return; }
      localStorage.setItem(KAYIT, JSON.stringify({ v: 1, faz: "savas", lvl: S.lvl, st: S.st, ben: S.ben, rakip: S.rakip, bAt: S.bAt, rAt: S.rAt, sira: S.sira, atis: S.atis, isabet: S.isabet, tur: S.tur, seri: S.seri, enSeri: S.enSeri, son: S.son, sonA: S.sonA, t: Date.now() }));
    } catch (e) {}
  }
  window.addEventListener("pagehide", kaydet);
  (function geriYukle() {
    let k = null; try { k = JSON.parse(localStorage.getItem(KAYIT) || "null"); } catch (e) {}
    const filoOk = (G) => Array.isArray(G) && G.length === 5 && G.every((g, i) => g && g.n === FILO[i].n);
    if (k && k.v === 1 && Date.now() - k.t < 14 * 864e5 && filoOk(k.ben)) {
      if (k.faz === "diz") { S.ben = k.ben; S.sec = S.ben.findIndex((g) => g.r == null); }
      else if (k.faz === "savas" && filoOk(k.rakip) && Array.isArray(k.bAt) && Array.isArray(k.rAt)) {
        Object.assign(S, { faz: "savas", lvl: k.lvl, st: k.st || 0, ben: k.ben, rakip: k.rakip, bAt: k.bAt, rAt: k.rAt, sira: k.sira === "a" ? "a" : "p", atis: k.atis || 0, isabet: k.isabet || 0, tur: k.tur || 1, seri: k.seri || 0, enSeri: k.enSeri || 0, son: k.son ?? -1, sonA: k.sonA ?? -1 });
      }
    }
    hazir = true;
    ayarlarCiz(); lvlYaz(); dizCiz(); ekran();
    if (S.faz === "savas") {
      ilk(dBd); ilk(bBd); savasCiz();
      msg(`Kaldığın yerden devam: ${S.tur}. tur. ${S.sira === "p" ? "Sıra sende 🎯" : "Sadolayn nişan alıyor…"}`);
      if (S.sira === "a") aiSira();
    } else {
      ilk(dizBd);
      dizMsg(S.ben.every((g) => g.r != null) ? "Filon hazır. Savaşa başlayabilirsin ⚓" : S.ben.some((g) => g.r != null) ? `Kaldığın yerden diz: sıradaki ${FILO[S.sec].ad}.` : "Uçak gemisi seçili: denizde başlayacağı kareye dokun ya da 🎲 ile rastgele diz.");
    }
  })();
})();
