(() => {
  'use strict';

  const cfg = window.PROVERB_APP_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);

  const canvas = $('#proverbCanvas');
  const ctx = canvas.getContext('2d');
  const drawBtn = $('#drawBtn');
  const moonButton = $('#moonButton');
  const moonScene = $('#moonScene');
  const moonRabbit = $('#moonRabbit');
  const resultPanel = $('#resultPanel');
  const resultAnnounce = $('#resultAnnounce');
  const statusText = $('#statusText');
  const toast = $('#toast');

  let proverbs = [];
  let meta = {};
  let selected = null;

  const urlParams = new URLSearchParams(location.search);
  if (urlParams.get('embed') === '1') document.body.classList.add('embed');

  $('#backLink').href = cfg.parentSiteUrl || '#';
  $('#bottomBackLink').href = cfg.parentSiteUrl || '#';
  if (cfg.eyebrow) $('#eyebrow').textContent = cfg.eyebrow;
  if (cfg.pageTitle) $('#pageTitle').textContent = cfg.pageTitle;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function normalizeItem(item, index) {
    if (typeof item === 'string') {
      return {
        id: `item-${index + 1}`,
        text: item.trim(),
        reference: '',
        category: '',
        enabled: true
      };
    }

    return {
      id: String(item.id || `item-${index + 1}`),
      text: String(item.text || '').trim(),
      reference: String(item.reference || '').trim(),
      category: String(item.category || '').trim(),
      enabled: item.enabled !== false
    };
  }

  async function loadData() {
    drawBtn.disabled = true;
    moonButton.disabled = true;

    try {
      const url = `${cfg.dataUrl || './data/proverbs.json'}?v=${Date.now()}`;
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      meta = data.meta || {};
      const source = Array.isArray(data) ? data : data.items;
      if (!Array.isArray(source)) throw new Error('JSON 必須包含 items 陣列');

      proverbs = source.map(normalizeItem).filter((item) => item.enabled && item.text);
      if (!proverbs.length) throw new Error('沒有可抽取的箴言');

      statusText.textContent = '準備好了，點一下就開始。';
      $('#dataVersion').textContent = `目前共有 ${proverbs.length} 則箴言${meta.updatedAt ? ` · 更新 ${meta.updatedAt}` : ''}`;
      drawBtn.disabled = false;
      moonButton.disabled = false;
    } catch (error) {
      console.error(error);
      statusText.textContent = '箴言資料載入失敗，請稍後再試。';
      $('#dataVersion').textContent = '箴言資料載入失敗';
      showToast('無法載入箴言資料');
    }
  }

  function pickRandom() {
    // 有放回抽樣：每次都從完整箴言池重新抽取，因此同一句之後可以再次出現。
    // 預設只避免連續兩次完全相同；config.js 設為 false 即可允許立即重複。
    let pool = proverbs;
    const avoidImmediateRepeat = cfg.avoidImmediateRepeat !== false;

    if (avoidImmediateRepeat && proverbs.length > 1 && selected?.id) {
      pool = proverbs.filter((item) => item.id !== selected.id);
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }

  function triggerRevealAnimation() {
    const variants = ['rabbit-peek-left', 'rabbit-peek-right', 'rabbit-jump'];
    const variant = variants[Math.floor(Math.random() * variants.length)];

    moonScene.classList.remove('is-revealing');
    moonRabbit.classList.remove('show', ...variants);
    resultPanel.classList.remove('is-fresh');

    // 重新觸發 CSS animation。
    void moonScene.offsetWidth;

    moonScene.classList.add('is-revealing');
    moonRabbit.classList.add('show', variant);
    resultPanel.classList.add('is-fresh');

    clearTimeout(triggerRevealAnimation.timer);
    triggerRevealAnimation.timer = setTimeout(() => {
      moonScene.classList.remove('is-revealing');
    }, 900);
  }

  function roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function wrapText(text, maxWidth, fontSize) {
    ctx.font = `700 ${fontSize}px "Noto Serif TC","PingFang TC","Microsoft JhengHei",serif`;
    const lines = [];

    String(text).split(/\n/).forEach((paragraph, paragraphIndex, paragraphs) => {
      let line = '';
      for (const char of paragraph) {
        const test = line + char;
        if (line && ctx.measureText(test).width > maxWidth) {
          lines.push(line);
          line = char;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      if (paragraphIndex < paragraphs.length - 1) lines.push('');
    });

    return lines;
  }

  function fitText(text, maxWidth, maxHeight) {
    for (let size = 62; size >= 30; size -= 2) {
      const lines = wrapText(text, maxWidth, size);
      const lineHeight = size * 1.55;
      if (lines.length * lineHeight <= maxHeight) return { size, lines, lineHeight };
    }

    const size = 28;
    return {
      size,
      lines: wrapText(text, maxWidth, size),
      lineHeight: size * 1.5
    };
  }

  function seedFrom(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function rng(seed) {
    let value = seed || 1;
    return () => {
      value |= 0;
      value = value + 0x6D2B79F5 | 0;
      let t = Math.imul(value ^ value >>> 15, 1 | value);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function drawRabbitSilhouette(context) {
    context.save();
    context.translate(776, 302);
    context.fillStyle = 'rgba(76, 54, 29, .23)';

    context.beginPath();
    context.ellipse(15, 28, 41, 28, -.08, 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.arc(-20, 3, 24, 0, Math.PI * 2);
    context.fill();

    context.save();
    context.rotate(-.2);
    context.beginPath();
    context.ellipse(-31, -34, 9, 33, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();

    context.save();
    context.rotate(.12);
    context.beginPath();
    context.ellipse(-10, -36, 8, 31, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();

    context.beginPath();
    context.arc(55, 18, 12, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawCard(item) {
    const width = canvas.width;
    const height = canvas.height;
    const random = rng(seedFrom(item.id + item.text));
    ctx.clearRect(0, 0, width, height);

    const paper = ctx.createLinearGradient(0, 0, 0, height);
    paper.addColorStop(0, '#F6EEDC');
    paper.addColorStop(.64, '#F0E0C6');
    paper.addColorStop(1, '#E8D0AE');
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = .08;
    ctx.fillStyle = '#5A412A';
    for (let i = 0; i < 750; i += 1) {
      ctx.fillRect(random() * width, random() * height, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#24463A';
    roundRect(ctx, 54, 54, width - 108, 1238, 14);
    ctx.fill();

    ctx.strokeStyle = '#C99B4D';
    ctx.lineWidth = 2;
    roundRect(ctx, 76, 76, width - 152, 1194, 10);
    ctx.stroke();

    const glow = ctx.createRadialGradient(780, 260, 10, 780, 260, 240);
    glow.addColorStop(0, 'rgba(238,213,152,.34)');
    glow.addColorStop(1, 'rgba(238,213,152,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(780, 260, 240, 0, Math.PI * 2);
    ctx.fill();

    const moon = ctx.createRadialGradient(735, 220, 20, 780, 260, 145);
    moon.addColorStop(0, '#FFF3C4');
    moon.addColorStop(.55, '#E8CF91');
    moon.addColorStop(1, '#C99B4D');
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(780, 260, 132, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = .12;
    ctx.fillStyle = '#70502D';
    [[730, 215, 24], [825, 205, 18], [812, 315, 31], [710, 290, 13]].forEach(([x, y, radius]) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    drawRabbitSilhouette(ctx);

    ctx.fillStyle = '#E2C985';
    for (let i = 0; i < 34; i += 1) {
      const x = 110 + random() * 760;
      const y = 115 + random() * 365;
      ctx.globalAlpha = .35 + random() * .55;
      ctx.beginPath();
      ctx.arc(x, y, 1 + random() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const serif = '"Noto Serif TC","PingFang TC","Microsoft JhengHei",serif';
    const sans = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';

    ctx.fillStyle = '#E9D39B';
    ctx.textAlign = 'left';
    ctx.font = `800 24px ${sans}`;
    ctx.fillText(cfg.brand || '馬力全開 · 中秋佳節', 120, 140);

    ctx.fillStyle = 'rgba(244,236,215,.72)';
    ctx.font = `600 17px ${sans}`;
    ctx.fillText(cfg.eventLine || '2026.09.19 · 新店文山農場', 120, 176);

    ctx.fillStyle = '#7B2D34';
    roundRect(ctx, 118, 428, 220, 48, 24);
    ctx.fill();
    ctx.fillStyle = '#FFF2D0';
    ctx.font = `800 18px ${sans}`;
    ctx.textAlign = 'center';
    ctx.fillText('今晚給你的話', 228, 460);

    const fitted = fitText(item.text, 740, 470);
    ctx.fillStyle = '#FFF8E8';
    ctx.font = `700 ${fitted.size}px ${serif}`;
    ctx.textAlign = 'center';
    let y = 740 - (fitted.lines.length * fitted.lineHeight) / 2 + fitted.lineHeight * .72;
    fitted.lines.forEach((line) => {
      ctx.fillText(line, 540, y);
      y += fitted.lineHeight;
    });

    ctx.fillStyle = '#D6B86B';
    ctx.font = `900 70px ${serif}`;
    ctx.textAlign = 'left';
    ctx.fillText('「', 120, 590);
    ctx.textAlign = 'right';
    ctx.fillText('」', 960, 990);

    if (item.reference) {
      ctx.font = `700 24px ${sans}`;
      const badgeWidth = Math.min(620, ctx.measureText(item.reference).width + 66);
      ctx.fillStyle = 'rgba(233,211,155,.12)';
      roundRect(ctx, 540 - badgeWidth / 2, 1010, badgeWidth, 52, 26);
      ctx.fill();
      ctx.strokeStyle = 'rgba(233,211,155,.42)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, 540 - badgeWidth / 2, 1010, badgeWidth, 52, 26);
      ctx.stroke();
      ctx.fillStyle = '#E9D39B';
      ctx.textAlign = 'center';
      ctx.fillText(item.reference, 540, 1045);
    }

    ctx.fillStyle = '#17352E';
    ctx.beginPath();
    ctx.moveTo(54, 1195);
    ctx.lineTo(54, 1115);
    ctx.quadraticCurveTo(240, 1050, 390, 1142);
    ctx.quadraticCurveTo(580, 1025, 745, 1138);
    ctx.quadraticCurveTo(900, 1060, 1026, 1110);
    ctx.lineTo(1026, 1292);
    ctx.lineTo(54, 1292);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#C99B4D';
    ctx.beginPath();
    ctx.arc(850, 1165, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(890, 1132, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#F1DEAE';
    ctx.font = `700 20px ${serif}`;
    ctx.fillText(cfg.cardFooter || '願你帶著喜樂而來，也帶著祝福回家', 540, 1199);

    ctx.fillStyle = 'rgba(236,227,203,.62)';
    ctx.font = `500 15px ${sans}`;
    ctx.fillText('MOONLIGHT MESSAGE · MID-AUTUMN', 540, 1235);
  }

  function draw() {
    if (!proverbs.length) return;

    selected = pickRandom();
    drawCard(selected);
    resultPanel.hidden = false;
    document.body.classList.add('has-result');
    triggerRevealAnimation();

    const reference = selected.reference ? ` — ${selected.reference}` : '';
    resultAnnounce.textContent = `你抽到：${selected.text}${reference}`;
    statusText.textContent = selected.reference ? `抽到了 ${selected.reference}` : '今晚的一句話已經出現。';
    drawBtn.querySelector('span').textContent = '再抽一句';
    drawBtn.querySelector('b').textContent = '↻';

    if (window.matchMedia('(max-width: 700px)').matches) {
      setTimeout(() => resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 420);
    }
  }

  function toBlob() {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG 產生失敗')), 'image/png');
    });
  }

  function safeName(text) {
    return text.replace(/[\\/:*?"<>|\s]+/g, '-').replace(/-+/g, '-').slice(0, 38) || 'proverb';
  }

  async function download() {
    if (!selected) return;
    const blob = await toBlob();
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `月下箴言-${safeName(selected.reference || selected.id)}.png`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 1200);
    showToast('小卡已準備下載');
  }

  async function share() {
    if (!selected) return;

    try {
      const blob = await toBlob();
      const file = new File([blob], '月下箴言.png', { type: 'image/png' });
      const text = `${selected.text}${selected.reference ? `\n— ${selected.reference}` : ''}`;

      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ title: '月下箴言', text, files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title: '月下箴言', text });
      } else {
        await navigator.clipboard.writeText(text);
        showToast('此瀏覽器不支援分享，箴言文字已複製');
      }
    } catch (error) {
      if (error.name !== 'AbortError') showToast('分享沒有完成，可以改用下載小卡');
    }
  }

  async function copyText() {
    if (!selected) return;
    const text = `${selected.text}${selected.reference ? `\n— ${selected.reference}` : ''}`;

    try {
      await navigator.clipboard.writeText(text);
      showToast('箴言文字已複製');
    } catch {
      showToast('無法自動複製，請改用下載或分享');
    }
  }

  drawBtn.addEventListener('click', draw);
  moonButton.addEventListener('click', draw);
  $('#drawAgainBtn').addEventListener('click', draw);
  $('#downloadBtn').addEventListener('click', download);
  $('#shareBtn').addEventListener('click', share);
  $('#copyBtn').addEventListener('click', copyText);

  loadData();
})();
