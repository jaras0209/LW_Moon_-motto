(() => {
  'use strict';

  const cfg = window.PROVERB_APP_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  const canvas = $('#proverbCanvas');
  const ctx = canvas.getContext('2d');
  const title = String(cfg.pageTitle || '神給你的一句話');
  const cardTitle = String(cfg.cardTitle || '今晚 神給你的話');
  const rabbitPath = new Path2D($('#rabbitShape').getAttribute('d'));
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const variants = ['rabbit-peek-left', 'rabbit-peek-right', 'rabbit-jump'];

  let proverbs = [];
  let selected = null;
  let renderVersion = 0;
  let exportRevision = 0;
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
      lines: Array.isArray(item.lines) ? item.lines.filter((line) => typeof line === 'string') : undefined,
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
      await renderer.ready;
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

  // Decorative artwork is separate from all changing message text.
  const renderer = window.MoonCardRenderer.create(canvas, cfg, {
    path: rabbitPath,
    width: 141, height: 159
  });
  function drawCard(item) { return renderer.render(item); }

  function prepareImage(version) {
    const revision = ++exportRevision;
    cachedFile = null;
    $('#downloadBtn').disabled = true;
    $('#shareBtn').disabled = true;
    canvas.toBlob((blob) => {
      if (version !== renderVersion || revision !== exportRevision) return; // Ignore obsolete results after rapid redraws.
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
    $('#resultAnnounce').textContent = `${cardTitle}：${item.text}`;
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
