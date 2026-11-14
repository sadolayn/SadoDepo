/* Dilekçe Örnekleri — Word (.docx) çıktısı. Dış kütüphane yok: küçük bir ZIP yazıcısı (sıkıştırmasız) ve
   WordprocessingML ile A4, Times New Roman 12 punto belge üretir. Kullanıcı metni XML'e kaçırılarak yazılır.
   Kullanım: DilekceDocx(model, { imza: { png: Uint8Array, w, h } | null, baslik }) → Blob */
(function () {
  "use strict";
  var enc = new TextEncoder();
  // ---- CRC32 + ZIP (store) ----
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) { // [{ad, veri: Uint8Array}]
    var parca = [], merkez = [], ofs = 0;
    var u16 = function (v) { return [v & 255, (v >>> 8) & 255]; }, u32 = function (v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; };
    files.forEach(function (f) {
      var ad = enc.encode(f.ad), c = crc32(f.veri), n = f.veri.length;
      var yerel = [].concat([0x50, 0x4B, 0x03, 0x04], u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c), u32(n), u32(n), u16(ad.length), u16(0));
      parca.push(new Uint8Array(yerel), ad, f.veri);
      merkez.push(new Uint8Array([].concat([0x50, 0x4B, 0x01, 0x02], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c), u32(n), u32(n), u16(ad.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(ofs))), ad);
      ofs += yerel.length + ad.length + n;
    });
    var mBoy = merkez.reduce(function (s, x) { return s + x.length; }, 0);
    var son = new Uint8Array([].concat([0x50, 0x4B, 0x05, 0x06], u16(0), u16(0), u16(files.length), u16(files.length), u32(mBoy), u32(ofs), u16(0)));
    return new Blob(parca.concat(merkez, [son]), { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }
  // ---- XML yardımcıları ----
  function x(s) { // XML kaçırma + geçersiz denetim karakterlerini at
    return String(s == null ? "" : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  function run(t, o) {
    o = o || {};
    var rpr = (o.b ? "<w:b/>" : "") + (o.u ? '<w:u w:val="single"/>' : "") + (o.renk ? '<w:color w:val="' + o.renk + '"/>' : "");
    return String(t).split("\n").map(function (s, i) {
      return "<w:r>" + (rpr ? "<w:rPr>" + rpr + "</w:rPr>" : "") + (i ? "<w:br/>" : "") + '<w:t xml:space="preserve">' + x(s) + "</w:t></w:r>";
    }).join("");
  }
  function par(ic, o) {
    o = o || {};
    var ppr = '<w:spacing w:before="' + (o.once || 0) + '" w:after="' + (o.sonra == null ? 120 : o.sonra) + '" w:line="300" w:lineRule="auto"/>'
      + (o.ind ? '<w:ind w:left="' + (o.ind.sol || 0) + '"' + (o.ind.ilk ? ' w:firstLine="' + o.ind.ilk + '"' : "") + "/>" : "")
      + (o.jc ? '<w:jc w:val="' + o.jc + '"/>' : "");
    return "<w:p><w:pPr>" + ppr + "</w:pPr>" + ic + "</w:p>";
  }
  function resim(rid, w, h) {
    var cx = 1440000, cy = Math.round(cx * h / w); // 4 cm genişlik
    if (cy > 720000) { cx = Math.round(cx * 720000 / cy); cy = 720000; }
    return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="1" name="İmza"/>'
      + '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
      + '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="imza.png"/><pic:cNvPicPr/></pic:nvPicPr>'
      + '<pic:blipFill><a:blip r:embed="' + rid + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
      + '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  }

  window.DilekceDocx = function (m, o) {
    o = o || {};
    var B = [], SAG = { sol: 5400 };
    m.bas.forEach(function (b) { B.push(par(run(b, { b: true }), { jc: "center", sonra: 0 })); });
    if (m.yer) B.push(par(run(m.yer, { b: true }), { jc: "right", once: 60, sonra: 0 }));
    if (m.konu) B.push(par(run("Konu: ", { b: true }) + run(m.konu), { once: 480, sonra: 240 }));
    else B.push(par("", { sonra: 240 }));
    if (m.rows) {
      var tr = m.rows.map(function (r) {
        var hc = function (ic, w) { return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/></w:tcPr>' + ic + "</w:tc>"; };
        return "<w:tr>" + hc(par(run(r[0] ? r[0] + " :" : "", { b: true }), { sonra: 120 }), 2700) + hc(par(run(r[1]), { sonra: 120 }), 6650) + "</w:tr>";
      }).join("");
      B.push('<w:tbl><w:tblPr><w:tblW w:w="9350" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>'
        + '<w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="113" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="2700"/><w:gridCol w:w="6650"/></w:tblGrid>' + tr + "</w:tbl>");
    } else {
      m.paras.concat(m.kp ? [m.kp] : []).forEach(function (p) {
        if (/^– /.test(p)) p.split("\n").forEach(function (l, i, a) { B.push(par(run(l), { ind: { sol: 709 }, sonra: i === a.length - 1 ? 120 : 20 })); });
        else B.push(par(run(p), { jc: "both", ind: { ilk: 709 } }));
      });
    }
    B.push(par(run(m.tarih), { jc: "center", ind: SAG, once: 480, sonra: 0 }));
    B.push(par(run(m.ad, { b: true }), { jc: "center", ind: SAG, sonra: 0 }));
    if (m.rol) B.push(par(run(m.rol), { jc: "center", ind: SAG, sonra: 0 }));
    if (o.imza) B.push(par(resim("rIdImza", o.imza.w, o.imza.h), { jc: "center", ind: SAG, once: 60, sonra: 0 }));
    B.push(par(run("İmza", { renk: "777777" }), { jc: "center", ind: SAG, sonra: 0 }));
    if (m.ilet.length) {
      B.push(par("", { sonra: 240 }));
      m.ilet.forEach(function (i) { B.push(par(run(i[0] + ": ", { b: true }) + run(i[1]), { sonra: 40 })); });
    }
    if (m.ekler.length) {
      B.push(par(run("EKLER:", { b: true, u: true }), { once: 300, sonra: 60 }));
      m.ekler.forEach(function (e, i) { B.push(par(run((i + 1) + "- " + e), { sonra: 40 })); });
    }
    var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">'
      + "<w:body>" + B.join("")
      + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1134" w:bottom="1134" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>';
    var stil = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
      + '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="tr-TR"/></w:rPr></w:rPrDefault>'
      + "<w:pPrDefault><w:pPr><w:spacing w:after=\"0\"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>";
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rIdStil" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
      + (o.imza ? '<Relationship Id="rIdImza" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/imza.png"/>' : "") + "</Relationships>";
    var tip = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>'
      + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
      + '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
      + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';
    var kok = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
      + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>';
    var core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">'
      + "<dc:title>" + x(o.baslik || "Dilekçe") + "</dc:title><dc:creator>Sadolayn</dc:creator></cp:coreProperties>";
    var F = [
      { ad: "[Content_Types].xml", veri: enc.encode(tip) }, { ad: "_rels/.rels", veri: enc.encode(kok) },
      { ad: "docProps/core.xml", veri: enc.encode(core) },
      { ad: "word/document.xml", veri: enc.encode(doc) }, { ad: "word/styles.xml", veri: enc.encode(stil) },
      { ad: "word/_rels/document.xml.rels", veri: enc.encode(rels) }
    ];
    if (o.imza) F.push({ ad: "word/media/imza.png", veri: o.imza.png });
    return zip(F);
  };
})();
