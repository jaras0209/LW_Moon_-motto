/* Golden Moon clean centered edition (2026-09-17).
 * Same approved illustration + live, ink-centered text; never a baked quote.
 * No inter-line ornaments. Preserve the existing baseline pitch and text area.
 * No libraries, remote render services, or bundled font files are required.
 */
(() => {
  'use strict';
  const WIDTH = 1080, HEIGHT = 1350;
  const SERIF = '"Noto Serif TC","Noto Serif CJK TC","Songti TC","PMingLiU",serif';
  const SANS = '"Noto Sans TC","Noto Sans CJK TC","PingFang TC","Microsoft JhengHei",sans-serif';
  const CLOSE = new Set(Array.from('\u3001\u3002\uff0c\uff01\uff1f\uff1b\uff1a\u300d\u300f\uff09\u3011\u300b\u2026,.!?;:)]}\u201d\u2019'));
  const OPEN = new Set(Array.from('\u300c\u300e\uff08\u3010\u300a([\u201c\u2018'));
  const squash = (text) => text.replace(/\s+/gu, '');
  const clamp = (n, lo, hi, fallback) => Number.isFinite(Number(n)) ? Math.max(lo, Math.min(hi, Number(n))) : fallback;
  let words, graphemes;
  try {
    words = new Intl.Segmenter('zh-Hant', { granularity: 'word' });
    graphemes = new Intl.Segmenter('zh-Hant', { granularity: 'grapheme' });
  } catch { /* The fallback still preserves all characters. */ }
  const chars = (text) => graphemes ? [...graphemes.segment(text)].map((s) => s.segment) : Array.from(text);

  function tokens(text) {
    const raw = words ? [...words.segment(text)].map((s) => s.segment) : (text.match(/[A-Za-z0-9]+(?:['.-][A-Za-z0-9]+)*|\s+|./gu) || []);
    const result = [];
    let prefix = '';
    for (const piece of raw) {
      if (/^\s+$/u.test(piece)) { prefix += ' '; continue; }
      if (chars(piece).every((char) => OPEN.has(char))) { prefix += piece; continue; }
      if (chars(piece).every((char) => CLOSE.has(char)) && result.length) {
        result[result.length - 1] += prefix + piece; prefix = ''; continue;
      }
      result.push(prefix + piece); prefix = '';
    }
    if (prefix && result.length) result[result.length - 1] += prefix;
    return result;
  }

  // Balanced word wrapping. First prefer lexical boundaries, then break only
  // a token that is itself wider than the safe area. Never drop punctuation.
  function wrapBalanced(context, phrase, width) {
    let parts = tokens(phrase.trim());
    parts = parts.flatMap((part) => {
      if (context.measureText(part.trim()).width <= width) return [part];
      const pieces = [];
      for (const char of chars(part)) {
        if (CLOSE.has(char) && pieces.length) pieces[pieces.length - 1] += char;
        else pieces.push(char);
      }
      return pieces;
    });
    const n = parts.length;
    if (!n) return [];
    const fullWidth = context.measureText(parts.join('').trim()).width;
    if (fullWidth <= width) return [parts.join('').trim()];
    const lineCount = Math.ceil(fullWidth / width);
    const target = Math.min(width, fullWidth / lineCount * 1.05);
    const costs = Array(n + 1).fill(Infinity), next = Array(n + 1).fill(0);
    costs[n] = 0;
    for (let i = n - 1; i >= 0; i--) {
      let value = '';
      for (let j = i; j < n; j++) {
        value += parts[j];
        const actual = context.measureText(value.trim()).width;
        if (actual > width) break;
        const penalty = (actual - target) ** 2 + (actual < target * .42 ? width ** 2 * .35 : 0);
        const cost = penalty + costs[j + 1];
        if (cost < costs[i]) { costs[i] = cost; next[i] = j + 1; }
      }
    }
    if (!Number.isFinite(costs[0])) throw new Error('Unbreakable text exceeds safe width');
    const lines = [];
    for (let i = 0; i < n; i = next[i]) lines.push(parts.slice(i, next[i]).join('').trim());
    return lines;
  }

  function requestedPhrases(item) {
    if (Array.isArray(item.lines) && item.lines.length && item.lines.every((line) => typeof line === 'string' && line.trim())) {
      // A layout hint cannot silently replace the actual message.
      if (squash(item.lines.join('')) === squash(item.text)) return item.lines.map((line) => line.trim());
      console.warn('Ignored mismatching lines for item', item.id || '');
    }
    if (/\n/.test(item.text)) return item.text.replace(/\r\n?/g, '\n').split('\n').map((p) => p.trim()).filter(Boolean);
    // Phrase breaks, not character-per-line vertical writing.
    const result = item.text.match(/[^\u3002\uff01\uff1f\uff1b\uff0c!?;\n]+[\u3002\uff01\uff1f\uff1b\uff0c!?;]*[\u300d\u300f\uff09\u3011\u300b\u201d\u2019]*|[\u3002\uff01\uff1f\uff1b\uff0c!?;]+/gu);
    return (result || [item.text]).map((p) => p.trim()).filter(Boolean);
  }

  // A single design grid is shared by the screen canvas and its PNG export.
  // The text area is below the red title plaque and above the lake foreground.
  const DESIGN = Object.freeze({
    width: WIDTH, height: HEIGHT,
    textLeft: 115, textRight: 965, textTop: 480, textBottom: 1136,
    centerX: WIDTH / 2, centerY: (480 + 1136) / 2
  });

  function layout(context, item, options = {}) {
    if (!item || typeof item.text !== 'string' || !item.text.trim()) {
      throw new Error('A non-empty message is required');
    }
    const width = clamp(options.textWidth, 620, 850, 790);
    const top = DESIGN.textTop, bottom = DESIGN.textBottom;
    const max = Math.round(clamp(options.maxFontSize, 42, 82, 72));
    const min = Math.round(clamp(options.minFontSize, 18, 36, 24));
    const phrases = requestedPhrases(item);
    context.save();
    try {
      // Explicit alignment prevents a brand/header draw or a previous draw from
      // leaking left alignment into measurement of the message.
      context.textAlign = 'center';
      context.textBaseline = 'alphabetic';
      context.direction = 'ltr';
      for (let size = max; size >= min; size--) {
        context.font = `600 ${size}px ${SERIF}`;
        const lines = phrases.flatMap((phrase) => wrapBalanced(context, phrase, width));
        // Keep the exact pitch used by the preceding release, independently of
        // decoration. In particular, removing rules must NOT change 1.57 to
        // 1.48 and pull the lines closer together. An older showDividers=false
        // config keeps its existing compact pitch, but never paints dividers.
        const legacyLoosePitch = options.showDividers !== false && lines.length > 1 && lines.length <= 8 && size >= 38;
        const lineHeight = size * (legacyLoosePitch ? 1.57 : 1.48);
        const metrics = lines.map((text, index) => {
          const m = context.measureText(text);
          const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
          return {
            text, offset: index * lineHeight,
            ascent: finite(m.actualBoundingBoxAscent, size * .90),
            descent: finite(m.actualBoundingBoxDescent, size * .14),
            inkLeft: finite(m.actualBoundingBoxLeft, m.width / 2),
            inkRight: finite(m.actualBoundingBoxRight, m.width / 2)
          };
        });
        const inkTop = Math.min(...metrics.map((m) => m.offset - m.ascent));
        const inkBottom = Math.max(...metrics.map((m) => m.offset + m.descent));
        const height = inkBottom - inkTop;
        if (height > bottom - top) continue;
        const start = DESIGN.centerY - (inkTop + inkBottom) / 2;
        const rows = metrics.map((m) => {
          // Full-width punctuation and serif side bearings have uneven blank
          // space. Center the actual painted ink, not merely the advance width.
          const x = DESIGN.centerX + (m.inkLeft - m.inkRight) / 2;
          const y = start + m.offset;
          return { text: m.text, x, y, left: x - m.inkLeft, right: x + m.inkRight,
            top: y - m.ascent, bottom: y + m.descent };
        });
        if (rows.some((r) => r.left < DESIGN.textLeft || r.right > DESIGN.textRight)) continue;
        return {
          lines, rows, size, lineHeight, start, width, top, bottom, height,
          centerX: DESIGN.centerX, centerY: DESIGN.centerY, align: 'center',
          ascent: Math.max(...metrics.map((m) => m.ascent)),
          descent: Math.max(...metrics.map((m) => m.descent)), dividers: false
        };
      }
    } finally { context.restore(); }
    throw new Error('Message exceeds the card safe area; use shorter content or fewer manual breaks');
  }

  function loadImage(url) {
    return new Promise((resolve) => {
      const image = new Image();
      const timeout = setTimeout(() => finish(null), 8000);
      let finished = false;
      function finish(value) {
        if (finished) return;
        finished = true; clearTimeout(timeout);
        image.onload = image.onerror = null; resolve(value);
      }
      image.onload = () => finish(image);
      image.onerror = () => finish(null);
      image.src = url;
    });
  }

  function diamond(context, x, y, radius = 9) {
    context.beginPath(); context.moveTo(x, y - radius);
    context.quadraticCurveTo(x + radius * .28, y - radius * .28, x + radius, y);
    context.quadraticCurveTo(x + radius * .28, y + radius * .28, x, y + radius);
    context.quadraticCurveTo(x - radius * .28, y + radius * .28, x - radius, y);
    context.quadraticCurveTo(x - radius * .28, y - radius * .28, x, y - radius);
    context.fill();
  }
  function rounded(context, x, y, w, h, r) {
    context.beginPath(); context.moveTo(x+r,y);
    context.arcTo(x+w,y,x+w,y+h,r); context.arcTo(x+w,y+h,x,y+h,r);
    context.arcTo(x,y+h,x,y,r); context.arcTo(x,y,x+w,y,r); context.closePath();
  }
  function single(context, text, size, maxWidth, family = SERIF, weight = 600) {
    while (size > 12) {
      context.font = `${weight} ${size}px ${family}`;
      if (context.measureText(text).width <= maxWidth) return;
      size--;
    }
  }

  function fallbackArt(context) {
    const sky = context.createLinearGradient(0,0,0,1350);
    sky.addColorStop(0,'#063d30'); sky.addColorStop(.7,'#133e30'); sky.addColorStop(1,'#072b25');
    context.fillStyle = sky; context.fillRect(0,0,WIDTH,HEIGHT);
    const glow = context.createRadialGradient(805,199,90,805,199,215);
    glow.addColorStop(0,'#f2d98355'); glow.addColorStop(1,'#f2d98300');
    context.fillStyle=glow;context.fillRect(570,0,480,450);
    const moon = context.createRadialGradient(760,158,10,805,199,145);
    moon.addColorStop(0,'#fff0ba'); moon.addColorStop(1,'#e8c567');
    context.fillStyle=moon;context.beginPath();context.arc(805,199,143,0,Math.PI*2);context.fill();
    context.strokeStyle='#d9b66f';context.lineWidth=2;context.strokeRect(23,23,1034,1304);
    for (const [x,y,sx,sy] of [[23,23,1,1],[1057,23,-1,1],[23,1327,1,-1],[1057,1327,-1,-1]]) {
      context.save();context.translate(x,y);context.scale(sx,sy);context.strokeRect(-7,-7,20,20);context.strokeRect(7,7,20,20);context.restore();
    }
    for (const [offset,color] of [[0,'#173e30'],[50,'#092f26'],[100,'#05271f']]) {
      context.fillStyle=color;context.beginPath();context.moveTo(0,1090+offset);
      context.bezierCurveTo(200,1010+offset,300,1260,540,1190+offset/3);
      context.bezierCurveTo(800,1080+offset,900,1090+offset,1080,1050+offset);
      context.lineTo(1080,1350);context.lineTo(0,1350);context.fill();
    }
  }

  function create(canvas, config = {}, rabbit) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is not supported');
    let artwork = null;
    const assetUrl = new URL('./assets/card-background.webp?v=centered-reference-2', document.baseURI);
    const ready = loadImage(assetUrl.href).then((value) => {
      artwork = value;
      if (!value) console.warn('Card background unavailable; using local vector fallback.');
      return Boolean(value);
    });
    function render(item) {
      // Layout first: invalid content does not erase the previous successful card.
      const fitted = layout(context,item,config.card || {});
      context.save();
      context.setTransform(1,0,0,1,0,0); context.globalAlpha=1;
      context.clearRect(0,0,WIDTH,HEIGHT);
      if (artwork) context.drawImage(artwork,0,0,WIDTH,HEIGHT); else fallbackArt(context);
      context.save();context.translate(736,170);context.scale(129/rabbit.width,146/rabbit.height);
      context.fillStyle=config.rabbitTone==='white'?'#ffffff':'#000000';context.fill(rabbit.path);context.restore();
      context.fillStyle='#f6e5b6';context.textAlign='left';context.textBaseline='alphabetic';
      const brand=String(config.brand || '\u99ac\u529b\u5168\u958b \u00b7 \u4e2d\u79cb\u4f73\u7bc0');
      single(context,brand,30,492);context.fillText(brand,80,105);
      context.strokeStyle='#c8aa64';context.lineWidth=1;context.beginPath();context.moveTo(81,119);context.lineTo(365,119);context.stroke();
      context.fillStyle='#ded7b7';
      const event=String(config.eventLine || '2026.09.19 \u00b7 \u65b0\u5e97\u6587\u5c71\u8fb2\u5834');
      single(context,event,22,475,SERIF,500);context.fillText(event,80,150);
      context.textAlign='center';
      const red=context.createLinearGradient(0,380,0,446);red.addColorStop(0,'#803039');red.addColorStop(1,'#65252e');
      rounded(context,321,380,438,68,34);context.fillStyle=red;context.fill();
      context.strokeStyle='#e2bd6d';context.lineWidth=1.8;context.stroke();
      context.fillStyle='#e6c16f';diamond(context,303,414,7);diamond(context,777,414,7);
      const label=String(config.cardTitle || '\u4eca\u665a \u795e\u7d66\u4f60\u7684\u8a71');
      context.fillStyle='#fff6df';single(context,label,35,394);context.fillText(label,540,426);

      context.font=`600 ${fitted.size}px ${SERIF}`;
      context.fillStyle='#fff8e6';context.direction='ltr';
      context.textAlign='center';context.textBaseline='alphabetic';
      // Body rows keep their measured ink centers and their original baselines.
      // No rules, diamonds, dots, or other ornaments are painted in the gaps.
      for (const row of fitted.rows) {
        context.fillText(row.text,row.x,row.y);
      }

      // The English caption lives below the reading area, inside the gold frame.
      // It does not consume any body space or change the established line pitch.
      context.save();
      context.font=`600 22px Georgia,${SERIF}`;
      context.fillStyle='#ecd59a';
      context.shadowColor='rgba(3, 28, 22, 0.85)';
      context.shadowBlur=4;
      const caption='A WORD FOR YOU';
      const captionMetrics=context.measureText(caption);
      const captionLeft=Number.isFinite(captionMetrics.actualBoundingBoxLeft) ? captionMetrics.actualBoundingBoxLeft : captionMetrics.width/2;
      const captionRight=Number.isFinite(captionMetrics.actualBoundingBoxRight) ? captionMetrics.actualBoundingBoxRight : captionMetrics.width/2;
      context.fillText(caption,DESIGN.centerX+(captionLeft-captionRight)/2,1300);
      context.restore();
      // No blessing sentence, citation, reference, category, ID, or guide line.
      context.restore();
      return fitted;
    }
    return {ready,render};
  }
  window.MoonCardRenderer=Object.freeze({create,layout,wrapBalanced,design:DESIGN,version:'clean-centered-3'});
})();
