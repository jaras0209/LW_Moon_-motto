/* Golden Moon card renderer. Same-origin artwork + live text, never a baked quote.
 * No libraries, remote render services, or bundled font files are required.
 */
(() => {
  'use strict';
  const WIDTH = 1080, HEIGHT = 1350;
  // Prioritise Traditional Chinese fonts with stable CJK punctuation metrics.
  const SERIF = '"Source Han Serif TW Web", serif';
  const SANS = '"Source Han Serif TW Web", serif';
  const CLOSE = new Set(Array.from('\u3001\u3002\uff0c\uff01\uff1f\uff1b\uff1a\u300d\u300f\uff09\u3011\u300b\u2026,.!?;:)]}\u201d\u2019'));
  const OPEN = new Set(Array.from('\u300c\u300e\uff08\u3010\u300a([\u201c\u2018'));
  const squash = (text) => text.replace(/\s+/gu, '');
  const clamp = (n, lo, hi, fallback) => Number.isFinite(Number(n)) ? Math.max(lo, Math.min(hi, Number(n))) : fallback;
  let words, graphemes;
  try {
    words = new Intl.Segmenter('zh-Hant', { granularity: 'word' });
    graphemes = new Intl.Segmenter('zh-Hant', { granularity: 'grapheme' });
  } catch {}
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
      if (squash(item.lines.join('')) === squash(item.text)) return item.lines.map((line) => line.trim());
      console.warn('Ignored mismatching lines for item', item.id || '');
    }
    if (/\n/.test(item.text)) return item.text.replace(/\r\n?/g, '\n').split('\n').map((p) => p.trim()).filter(Boolean);
    const result = item.text.match(/[^\u3002\uff01\uff1f\uff1b\uff0c!?;\n]+[\u3002\uff01\uff1f\uff1b\uff0c!?;]*[\u300d\u300f\uff09\u3011\u300b\u201d\u2019]*|[\u3002\uff01\uff1f\uff1b\uff0c!?;]+/gu);
    return (result || [item.text]).map((p) => p.trim()).filter(Boolean);
  }

  function layout(context, item, options = {}) {
    const width = clamp(options.textWidth, 620, 830, 790);
    const top = 487, bottom = 1090, available = bottom - top;
    const max = clamp(options.maxFontSize, 42, 82, 72);
    const min = clamp(options.minFontSize, 18, 36, 24);
    const phrases = requestedPhrases(item);
    for (let size = max; size >= min; size--) {
      context.font = `600 ${size}px ${SERIF}`;
      const lines = phrases.flatMap((phrase) => wrapBalanced(context, phrase, width));
      const metrics = context.measureText('\u795eMg');
      const ascent = metrics.actualBoundingBoxAscent || size * .9;
      const descent = Math.max(metrics.actualBoundingBoxDescent || size * .18, size * .14);
      const lineHeight = size * 1.50;
      const height = ascent + descent + (lines.length - 1) * lineHeight;
      if (height <= available) {
        const start = top + (available - height) / 2 + ascent;
        return { lines, size, lineHeight, start, width, top, bottom, ascent, descent };
      }
    }
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

  function rounded(context, x, y, w, h, r) {
    context.beginPath(); context.moveTo(x+r,y);
    context.arcTo(x+w,y,x+w,y+h,r); context.arcTo(x+w,y+h,x,y+h,r);
    context.arcTo(x,y+h,x,y,r); context.arcTo(x,y,x+w,y,r); context.closePath();
  }

  function single(context, text, size, maxWidth, family = SERIF, weight = 600) {
    while (size > 12) {
      context.font = `${weight} ${size}px ${family}`;
      if (context.measureText(text).width <= maxWidth) return size;
      size--;
    }
    return size;
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
    const assetUrl = new URL('./assets/card-background.webp', document.baseURI);
    const ready = loadImage(assetUrl.href).then((value) => {
      artwork = value;
      if (!value) console.warn('Card background unavailable; using local vector fallback.');
      return Boolean(value);
    });

    function render(item) {
      const fitted = layout(context,item,config.card || {});
      context.save();
      context.setTransform(1,0,0,1,0,0); context.globalAlpha=1;
      context.clearRect(0,0,WIDTH,HEIGHT);
      if (artwork) context.drawImage(artwork,0,0,WIDTH,HEIGHT); else fallbackArt(context);

      // Rabbit in the moon.
      context.save();
      context.translate(736,170);
      context.scale(129/rabbit.width,146/rabbit.height);
      context.fillStyle=config.rabbitTone==='white'?'#ffffff':'#000000';
      context.fill(rabbit.path);
      context.restore();

      const brand=String(config.brand || '馬力全開 · 中秋佳節');
      const event=String(config.eventLine || '2026.09.19 · 新店文山農場');
      const label=String(config.cardTitle || '今晚 神給你的話');

      // Top-left hierarchy: phrase descriptor first, then the card's main label.
      context.textBaseline='alphabetic';
      context.textAlign='left';
      context.fillStyle='#e2c477';
      single(context,'A WORD FOR YOU',24,280,SERIF,700);
      context.fillText('A WORD FOR YOU',82,108);
      context.strokeStyle='#d7b772';
      context.lineWidth=1.15;
      context.beginPath();
      context.moveTo(82,118); context.lineTo(270,118);
      context.stroke();

      const red=context.createLinearGradient(0,134,0,198);
      red.addColorStop(0,'#803039'); red.addColorStop(1,'#65252e');
      rounded(context,80,138,360,64,32);
      context.fillStyle=red; context.fill();
      context.strokeStyle='#e2bd6d'; context.lineWidth=1.8; context.stroke();
      context.textAlign='center';
      context.fillStyle='#fff6df';
      single(context,label,33,312,SERIF,700);
      context.fillText(label,260,180);

      // Main centered message block.
      context.font=`600 ${fitted.size}px ${SERIF}`;
      context.fillStyle='#fff8e6';
      context.textAlign='center';
      context.textBaseline='alphabetic';
      fitted.lines.forEach((line,index)=>{
        const baseline=fitted.start+index*fitted.lineHeight;
        context.fillText(line,540,baseline);
      });

      // Bottom centered event identity; supportive, not competing with the message.
      context.textAlign='center';
      context.fillStyle='#f6e5b6';
      single(context,brand,30,620,SERIF,700);
      context.fillText(brand,540,1200);
      context.strokeStyle='#c8aa64';
      context.lineWidth=1;
      context.beginPath();
      context.moveTo(385,1214); context.lineTo(695,1214);
      context.stroke();
      context.fillStyle='#ded7b7';
      single(context,event,22,580,SERIF,500);
      context.fillText(event,540,1245);

      context.restore();
      return fitted;
    }
    return {ready,render};
  }

  window.MoonCardRenderer=Object.freeze({create,layout,wrapBalanced});
})();
