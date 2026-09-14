(() => {
  'use strict';

  const cfg = window.PROVERB_APP_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  const canvas = $('#proverbCanvas');
  const ctx = canvas.getContext('2d');
  const title = String(cfg.pageTitle || '神給你的一句話');
  const cardTitle = String(cfg.cardTitle || '今晚 神給你的話');
  const serif = '"Noto Serif TC","Noto Serif CJK TC","PingFang TC","Microsoft JhengHei",serif';
  const sans = '"Noto Sans TC","Noto Sans CJK TC","PingFang TC","Microsoft JhengHei",sans-serif';
  const rabbitColor = cfg.rabbitTone === 'white' ? '#ffffff' : '#000000';
  const rabbitPath = new Path2D($('#rabbitShape').getAttribute('d'));
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const variants = ['rabbit-peek-left', 'rabbit-peek-right', 'rabbit-jump'];

  let proverbs = [];
  let selected = null;
  let renderVersion = 0;
  let imageUrl = '';
  let cachedFile = null;
  let fileName = '';
  let revealTimer;
  let toastTimer;
  let toastCallback = null;
  let sharing = false;

  document.body.dataset.rabbitTone = cfg.rabbitTone === 'white' ? 'white' : 'black';
  if (new URLSearchParams(location.search).get('embed') === '1') document.body.classList.add('embed');
  $('#pageTitle').textContent = title;
  $('#resultTitle').textContent = cardTitle;
  $('#eyebrow').textContent = cfg.eyebrow || 'MID-AUTUMN · A WORD FOR YOU';
  $('#eventLine').textContent = cfg.eventLine || '2026.09.19 · 新店文山農場';
  document.title = `${title}｜${cfg.brand || '馬力全開中秋佳節'}`;

  // Only http(s) URLs may become links. Relative URLs are resolved against this page.
  if (cfg.parentSiteUrl) {
    try {
      const parent = new URL(cfg.parentSiteUrl, document.baseURI);
      if (/^https?:$/.test(parent.protocol)) {
        $('#backLink').href = parent.href;
        $('#topBackLink').href = parent.href;
      }
    } catch (error) { console.warn('Invalid parentSiteUrl', error); }
  }

  function showToast(message, action = null) {
    clearTimeout(toastTimer);
    $('#toastText').textContent = message;
    $('#toastAction').hidden = !action;
    toastCallback = action;
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, action ? 8500 : 3200);
  }

  // Allow-list public fields. Legacy source/citation fields are never used in the
  // DOM, canvas, accessible labels, filenames, clipboard, or share payloads.
  function normalizeItem(item, index) {
    if (typeof item === 'string') return { id: `p${index + 1}`, text: item.trim(), enabled: true };
    if (!item || typeof item !== 'object' || typeof item.text !== 'string') return null;
    return {
      id: typeof item.id === 'string' ? item.id : `p${index + 1}`,
      text: item.text.trim(),
      enabled: item.enabled !== false
    };
  }

  async function loadData() {
    $('#drawBtn').disabled = true;
    $('#moonButton').disabled = true;
    $('#retryBtn').hidden = true;
    $('#loadState').hidden = false;
    $('#statusText').textContent = '正在準備…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      if (!ctx) throw new Error('Canvas 2D unavailable');
      const url = new URL(cfg.dataUrl || './data/proverbs.json', document.baseURI);
      url.searchParams.set('v', Date.now().toString());
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const source = Array.isArray(data) ? data : data?.items;
      if (!Array.isArray(source)) throw new Error('Expected an items array');
      proverbs = source.map(normalizeItem).filter((item) => item && item.enabled && item.text);
      if (!proverbs.length) throw new Error('No enabled messages');
      $('#drawBtn').disabled = false;
      $('#moonButton').disabled = false;
      $('#loadState').hidden = true;
    } catch (error) {
      console.error('Message data unavailable', error);
      $('#statusText').textContent = '暫時無法載入，請再試一次。';
      $('#retryBtn').hidden = false;
    } finally { clearTimeout(timeout); }
  }

  function pickRandom() {
    let pool = proverbs;
    if (cfg.avoidImmediateRepeat !== false && selected && proverbs.length > 1) {
      const alternatives = proverbs.filter((item) => item.text !== selected.text);
      if (alternatives.length) pool = alternatives;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function animateReveal() {
    clearTimeout(revealTimer);
    const scene = $('#moonScene');
    const rabbit = $('#moonRabbit');
    scene.classList.remove('is-revealing');
    rabbit.classList.remove('show', ...variants);
    $('#resultPanel').classList.remove('is-fresh');
    void scene.offsetWidth;
    rabbit.classList.add('show');
    if (!motionQuery.matches) {
      scene.classList.add('is-revealing');
      rabbit.classList.add(variants[Math.floor(Math.random() * variants.length)]);
      $('#resultPanel').classList.add('is-fresh');
      revealTimer = setTimeout(() => scene.classList.remove('is-revealing'), 750);
    }
  }

  function roundRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function wrapText(text, maxWidth, fontSize, family = serif, weight = 700) {
    ctx.font = `${weight} ${fontSize}px ${family}`;
    const lines = [];
    for (const paragraph of String(text).replace(/\r\n?/g, '\n').split('\n')) {
      let line = '';
      for (const char of paragraph) {
        if (line && ctx.measureText(line + char).width > maxWidth) {
          // Avoid starting a Chinese line with a closing punctuation mark.
          if ('，。！？；：、」』）】》'.includes(char) && Array.from(line).length > 1) {
            const characters = Array.from(line);
            const last = characters.pop();
            lines.push(characters.join(''));
            line = last + char;
          } else {
            lines.push(line);
            line = char;
          }
        } else { line += char; }
      }
      lines.push(line);
    }
    return lines;
  }

  function fitText(text, maxWidth, maxHeight) {
    // Fit the complete text, never silently truncate. Very long texts get smaller.
    for (let size = 64; size >= 8; size -= 1) {
      const lines = wrapText(text, maxWidth, size);
      const lineHeight = size * 1.62;
      if (lines.length * lineHeight <= maxHeight) return { size, lines, lineHeight };
    }
    throw new Error('Message too long for a readable card');
  }

  function fitSingleLine(text, size, maxWidth, family = sans, weight = 500) {
    while (size > 10) {
      ctx.font = `${weight} ${size}px ${family}`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
  }

  function randomFor(text) {
    let seed = 2166136261;
    for (const char of text) { seed ^= char.codePointAt(0); seed = Math.imul(seed, 16777619); }
    return () => {
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function drawCard(item) {
    const random = randomFor(item.text);
    ctx.clearRect(0, 0, 1080, 1350);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#F3E6D0';
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = 'rgba(112,81,39,.1)';
    for (let i = 0; i < 600; i += 1) ctx.fillRect(random() * 1080, random() * 1350, 1.4, 1.4);

    ctx.fillStyle = '#24473B';
    roundRect(48, 48, 984, 1254, 12); ctx.fill();
    ctx.strokeStyle = '#C4A361'; ctx.lineWidth = 1.5;
    roundRect(72, 72, 936, 1206, 8); ctx.stroke();

    const glow = ctx.createRadialGradient(782, 256, 40, 782, 256, 220);
    glow.addColorStop(0, 'rgba(239,211,142,.25)');
    glow.addColorStop(1, 'rgba(239,211,142,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(782, 256, 220, 0, Math.PI * 2); ctx.fill();
    const moon = ctx.createRadialGradient(733, 214, 14, 782, 256, 132);
    moon.addColorStop(0, '#FFF6D2'); moon.addColorStop(.5, '#F0DEAC'); moon.addColorStop(1, '#CEA85E');
    ctx.fillStyle = moon; ctx.beginPath(); ctx.arc(782, 256, 132, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(90,67,20,.065)';
    [[736, 225, 24], [828, 224, 13], [807, 313, 30]].forEach(([x,y,r]) => {
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    });
    ctx.save();
    ctx.translate(708, 206); ctx.scale(.84, .84);
    ctx.globalAlpha = 1; ctx.fillStyle = rabbitColor; ctx.fill(rabbitPath);
    ctx.restore();

    ctx.fillStyle = '#D6BD81';
    for (let i = 0; i < 25; i += 1) {
      const x = 126 + random() * 804, y = 225 + random() * 164;
      if ((x - 782) ** 2 + (y - 256) ** 2 < 154 ** 2) continue;
      ctx.globalAlpha = .25 + random() * .4;
      ctx.beginPath(); ctx.arc(x, y, 1.2 + random() * 1.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#EFDEB6';
    const brand = String(cfg.brand || '馬力全開 · 中秋佳節');
    fitSingleLine(brand, 24, 492, sans, 700); ctx.fillText(brand, 120, 145);
    const eventLine = String(cfg.eventLine || '2026.09.19 · 新店文山農場');
    ctx.fillStyle = '#C1C5AF'; fitSingleLine(eventLine, 18, 492); ctx.fillText(eventLine, 120, 180);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#D7BD83'; ctx.font = `500 17px ${sans}`;
    ctx.fillText('A WORD FOR YOU', 540, 420);
    ctx.fillStyle = '#793139'; roundRect(361, 444, 358, 58, 29); ctx.fill();
    ctx.fillStyle = '#FFF6E0'; fitSingleLine(cardTitle, 32, 320, serif, 600);
    ctx.fillText(cardTitle, 540, 482);

    const fitted = fitText(item.text, 760, 464);
    ctx.fillStyle = '#FFF8E8'; ctx.font = `700 ${fitted.size}px ${serif}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let y = 780 - ((fitted.lines.length - 1) * fitted.lineHeight) / 2;
    for (const line of fitted.lines) { ctx.fillText(line, 540, y); y += fitted.lineHeight; }
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#D9BC7E'; ctx.font = `600 64px ${serif}`;
    ctx.textAlign = 'left'; ctx.fillText('「', 112, 582);
    ctx.textAlign = 'right'; ctx.fillText('」', 968, 1043);

    ctx.save();
    roundRect(48, 48, 984, 1254, 12); ctx.clip();
    ctx.fillStyle = '#1B392F';
    ctx.beginPath(); ctx.moveTo(48, 1146);
    ctx.quadraticCurveTo(217, 1070, 378, 1140);
    ctx.quadraticCurveTo(590, 1044, 764, 1137);
    ctx.quadraticCurveTo(922, 1080, 1032, 1132);
    ctx.lineTo(1032,1302); ctx.lineTo(48,1302); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#EDDDB6'; ctx.textAlign = 'center';
    const footer = String(cfg.cardFooter || '願你帶著喜樂而來，也帶著祝福回家');
    fitSingleLine(footer, 27, 820, serif, 500); ctx.fillText(footer, 540, 1199);
    ctx.fillStyle = '#A9B49C'; ctx.font = `500 15px ${sans}`;
    ctx.fillText('MID-AUTUMN · BLESSINGS TO KEEP', 540, 1240);
    ctx.restore();
  }

  function prepareImage(version) {
    cachedFile = null;
    $('#downloadBtn').disabled = true;
    $('#shareBtn').disabled = true;
    canvas.toBlob((blob) => {
      if (version !== renderVersion) return; // Ignore obsolete results after rapid redraws.
      if (!blob) { showToast('圖片產生失敗，請再試一次'); return; }
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      imageUrl = URL.createObjectURL(blob);
      cachedFile = new File([blob], fileName, { type: 'image/png' });
      $('#downloadBtn').disabled = false;
      $('#shareBtn').disabled = false;
    }, 'image/png');
  }

  function makeFileName() {
    // No IDs or source fields in filenames, including legacy IDs containing citations.
    const d = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const stamp = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    return `神給你的一句話-${stamp}-${renderVersion}.png`;
  }

  function draw() {
    if (!proverbs.length) return;
    const item = pickRandom();
    try { drawCard(item); }
    catch (error) {
      console.error('Card render failed', error);
      showToast('這段內容無法產生小卡，請重新抽取');
      if (selected) drawCard(selected);
      return;
    }
    selected = item;
    renderVersion += 1;
    fileName = makeFileName();
    $('#toast').hidden = true;
    $('#resultPanel').hidden = false;
    document.body.classList.add('has-result');
    canvas.setAttribute('aria-label', `${cardTitle}：${item.text}`);
    $('#moonButton').setAttribute('aria-label', '再抽一句');
    $('#resultTitle').focus({ preventScroll: true });
    animateReveal();
    prepareImage(renderVersion);
    // No scroll timer or animation-gated waiting: the result is immediately usable.
  }

  function openImage() {
    if (!imageUrl || !selected) return;
    const dialog = $('#imageDialog');
    $('#saveImage').src = imageUrl;
    $('#saveImage').alt = `${cardTitle}：${selected.text}`;
    $('#toast').hidden = true;
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      const a = document.createElement('a');
      a.href = imageUrl; a.target = '_blank'; a.rel = 'noopener'; a.click();
    }
  }

  function download() {
    if (!cachedFile || !imageUrl) return;
    try {
      const a = document.createElement('a');
      a.href = imageUrl; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      showToast('小卡已準備下載', openImage);
    } catch { openImage(); }
  }

  async function share() {
    if (!selected || !cachedFile || sharing) return;
    if (typeof navigator.share !== 'function') {
      showToast('此瀏覽器不支援分享，可先保存圖片', openImage);
      return;
    }
    sharing = true;
    try {
      // PNG is pre-generated, preserving transient user activation on this click.
      const files = [cachedFile];
      const payload = { title, text: selected.text };
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files })) payload.files = files;
      await navigator.share(payload);
    } catch (error) {
      if (error.name !== 'AbortError') showToast('分享未完成，可先保存圖片', openImage);
    } finally { sharing = false; }
  }

  async function copyText() {
    if (!selected) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(selected.text);
      showToast('文字已複製');
    } catch {
      // Compatibility fallback for restricted embedded contexts, with no extra
      // permanent interface. Never put the content in innerHTML.
      const field = document.createElement('textarea');
      const previousFocus = document.activeElement;
      field.value = selected.text; field.readOnly = true;
      field.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;';
      document.body.appendChild(field); field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* fall through */ }
      field.remove(); previousFocus?.focus({ preventScroll: true });
      showToast(copied ? '文字已複製' : '無法複製，請改用下載或分享');
    }
  }

  $('#drawBtn').addEventListener('click', draw);
  $('#moonButton').addEventListener('click', draw);
  $('#drawAgainBtn').addEventListener('click', draw);
  $('#downloadBtn').addEventListener('click', download);
  $('#shareBtn').addEventListener('click', share);
  $('#copyBtn').addEventListener('click', copyText);
  $('#retryBtn').addEventListener('click', loadData);
  $('#toastAction').addEventListener('click', () => toastCallback?.());
  $('#closeImageBtn').addEventListener('click', () => $('#imageDialog').close());
  $('#imageDialog').addEventListener('close', () => $('#downloadBtn').focus({ preventScroll: true }));
  $('#imageDialog').addEventListener('click', (event) => {
    if (event.target !== $('#imageDialog')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
  });
  document.addEventListener('visibilitychange', () => {
    document.querySelectorAll('.moon-orbit, .moon-glow, .stars i').forEach((el) => {
      el.style.animationPlayState = document.hidden ? 'paused' : 'running';
    });
  });

  // Re-render the same selection when optional web fonts finish loading.
  document.fonts?.ready.then(() => {
    if (selected) {
      try { drawCard(selected); prepareImage(renderVersion); }
      catch (error) { console.warn('Font refresh skipped', error); }
    }
  });
  loadData();
})();
