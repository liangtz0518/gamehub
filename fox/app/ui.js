/* 链接聚合站：侧栏选站，主区域以 iframe 打开对应网站。 */
(function () {
  "use strict";

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const app = $("#app");

  /* ---------- 导航数据：链接聚合站（分类 = 侧栏分组，功能 = 网站链接） ---------- */
  const HUB_VERSION = "1";
  function buildFrameUrl(url) {
    const sep = url.includes("?") ? "&" : "?";
    return url + sep + "hub_v=" + HUB_VERSION;
  }

  /* ---------- 版本检测：远程版本号与本地不一致时提示刷新 ---------- */
  const VERSION_CHECK_URL = "https://liangtz0518.github.io/gamehub/version.json";
  const VERSION_CHECK_INTERVAL = 10000;
  let versionUpdateDetected = false;

  async function checkVersion() {
    if (versionUpdateDetected) return;
    try {
      const resp = await fetch(VERSION_CHECK_URL + "?t=" + Date.now(), { cache: "no-store" });
      if (!resp.ok) return;
      const data = await resp.json();
      const remoteVersion = String(data.version || "");
      if (remoteVersion && remoteVersion !== HUB_VERSION) {
        versionUpdateDetected = true;
        const banner = $("#update-banner");
        if (banner) banner.hidden = false;
      }
    } catch (e) {}
  }
  const registry = {
    modules: [
      {
        id: "xyss", name: "逍遥蜀山", version: "", color: "#10b981", collapsed: true,
        features: [
          { id: "xyss-mail", name: "邮件", url: "https://liangtz0518.github.io/gamehub/xyss.html", description: "逍遥蜀山邮件工具" },
          { id: "xyss-score", name: "算分", url: "https://liangtz0518.github.io/gamehub/xyss1.html", description: "逍遥蜀山算分工具" },
        ],
      },
      {
        id: "ddzf", name: "大道争锋", version: "", color: "#f5b50a", collapsed: false,
        features: [
          { id: "ddzf-mail", name: "邮件", url: "https://liangtz0518.github.io/gamehub/ddzf.html", description: "大道争锋邮件工具" },
        ],
      },
      {
        id: "fmj", name: "伏魔诀", version: "", color: "#6366f1", collapsed: true,
        features: [
          { id: "fmj-mail", name: "邮件", url: "https://liangtz0518.github.io/gamehub/fmj.html", description: "伏魔诀邮件工具" },
        ],
      },
      {
        id: "sgqg", name: "上古情歌", version: "", color: "#f43f5e", collapsed: true,
        features: [
          { id: "sgqg-mail", name: "邮件", url: "https://liangtz0518.github.io/gamehub/sgqg.html", description: "上古情歌邮件工具" },
        ],
      },
      {
        id: "other", name: "其他", version: "", color: "#64748b", collapsed: false,
        features: [
          { id: "gs-table", name: "GS工具表", url: "https://www.kdocs.cn/l/coLhd7ebUx09", description: "GS 工具表" },
          { id: "gs-register", name: "GS登记表", url: "https://www.kdocs.cn/l/cey47f36Zyvx", description: "GS 登记表" },
          { id: "gs-weekly", name: "GS周报", url: "https://www.kdocs.cn/l/csaM7qfQtaa9", description: "GS 周报" },
          { id: "gs-training", name: "GS部门培训教程", url: "https://www.kdocs.cn/l/cvX5dg1QecZ1", description: "GS 部门培训教程" },
          { id: "xyss-guide", name: "逍遥蜀山攻略", url: "https://www.kdocs.cn/l/cuSD0UKMPjph?from=docs&startTime=1782893050692&createDirect=true&newFile=true", description: "逍遥蜀山攻略" },
          { id: "gs-plan", name: "GS方案参考", url: "https://www.kdocs.cn/l/cm5oqo4BX4cv", description: "GS 方案参考" },
        ],
      },
      {
        id: "vip", name: "VIP", version: "", color: "#a855f7", collapsed: false,
        features: [
          { id: "vip-plan", name: "方案生成", url: "https://liangtz0518.github.io/gamehub/fasc.htm", description: "VIP 方案生成" },
          { id: "vip-code", name: "礼包码", url: "https://www.kdocs.cn/l/co9KayfzTswb", description: "礼包码" },
          { id: "vip-transfer", name: "转游方案", url: "https://www.kdocs.cn/l/chj77gtoWp3C", description: "转游方案" },
          { id: "vip-service", name: "客服工具表", url: "https://www.kdocs.cn/l/cpMDT20C5kEu", description: "客服工具表" },
        ],
      },
      {
        id: "ops", name: "运营", version: "", color: "#0ea5e9", collapsed: false,
        features: [
          { id: "ops-shushan", name: "蜀山跨服", url: "https://liangtz0518.github.io/gamehub/hf.html", description: "蜀山跨服" },
          { id: "ops-dadao", name: "大道跨服", url: "https://liangtz0518.github.io/gamehub/hf-ddzf.html", description: "大道跨服" },
          { id: "ops-chat", name: "聊天速查", url: "https://liangtz0518.github.io/gamehub/GSLT.html", description: "聊天速查" },
        ],
      },
    ],
  };

  /* ---------- 侧栏 SVG 图标 ---------- */
  const LINK_ICON = '<path d="M10 13.5a4.5 4.5 0 0 0 6.4 0l2.1-2.1a4.5 4.5 0 0 0-6.4-6.4L11 5.9"/><path d="M14 10.5a4.5 4.5 0 0 0-6.4 0l-2.1 2.1a4.5 4.5 0 0 0 6.4 6.4L13 18.1"/>';
  const CATEGORY_ICONS = {
    xyss: '<path d="M3.5 18h17M5 18l3.5-9 3.5 6 2-3.5L19 18z"/>',
    ddzf: '<path d="M14.5 3.5 20 9l-8 8-6 1 1-6z"/><path d="m13 5 6 6"/>',
    fmj: '<path d="M12 3 20 6v5.5c0 4.6-3.2 7.8-8 9.5-4.8-1.7-8-4.9-8-9.5V6z"/>',
    sgqg: '<path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z"/>',
    other: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 9v11"/>',
    vip: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    ops: '<path d="M4 19V5M4 19h16"/><path d="m8 15 3.5-4 3 2.5L19 8"/>',
  };
  const ICONS = Object.fromEntries(Object.entries(CATEGORY_ICONS).map(([m, shape]) => [`${m}/__cat`, shape]));
  // 每个网站按名称/用途配一枚独立图标，侧栏一眼能区分。
  const FEATURE_ICONS = {
    "xyss-mail":    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
    "xyss-score":   '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18h8"/>',
    "ddzf-mail":    '<path d="M3 6.5h18v12H3z"/><path d="m3 7 9 6 9-6"/><path d="M12 3.5v3"/>',
    "fmj-mail":     '<path d="M3 6.5h18v12H3z"/><path d="m3 7 9 6 9-6"/><path d="m10.5 12 1.2 1.2 2.3-2.5"/>',
    "sgqg-mail":    '<path d="M3 6.5h18v12H3z"/><path d="m3 7 9 6 9-6"/><circle cx="12" cy="12" r="1.4"/>',
    "gs-table":     '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11M15 9v11"/>',
    "gs-register":  '<path d="M8 4h10a2 2 0 0 1 2 2v14H6V6a2 2 0 0 1 2-2z"/><path d="M9 9h6M9 13h6M9 17h4"/>',
    "gs-weekly":    '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M9 14h6M9 17h4"/>',
    "gs-training":  '<path d="M3 7 12 3l9 4-9 4z"/><path d="M7 9.5V14c0 1.7 2.2 3 5 3s5-1.3 5-3V9.5"/>',
    "xyss-guide":   '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4z"/>',
    "gs-plan":      '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z"/>',
    "vip-plan":     '<path d="m12 3 2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="m18.5 16 .7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    "vip-code":     '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8v12M3 13h18"/><path d="M12 8c-3 0-4-1-4-2.5S10 3 12 5c2-2 4-1 4 .5S15 8 12 8z"/>',
    "vip-transfer": '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    "vip-service":  '<path d="M4 13v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="12" width="4" height="7" rx="2"/><rect x="17" y="12" width="4" height="7" rx="2"/>',
    "ops-shushan":  '<path d="m3 19 6-11 4 7 3-5 5 9z"/>',
    "ops-dadao":    '<path d="M14 4 5 13l-1 6 6-1 9-9M13 5l6 6"/>',
    "ops-chat":     '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  };
  const svg = (shape) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shape}</svg>`;
  const featureIcon = (m, f) => svg(FEATURE_ICONS[f] || LINK_ICON);
  const categoryIcon = (m) => { const s = ICONS[`${m}/__cat`]; return s ? svg(s) : svg(LINK_ICON); };
  const CHEVRON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m5 9 7 7 7-7"/></svg>';

  const byId = (moduleId, featureId) => {
    const module = registry.modules.find((m) => m.id === moduleId) || {};
    const feature = (module.features || []).find((f) => f.id === featureId) || {};
    return { module, feature };
  };
  const allFeatures = () => registry.modules.flatMap((m) => m.features.map((f) => ({ module: m, feature: f })));

  /* ---------- 侧栏导航 ---------- */
  const nav = $("#nav");
  // 分类折叠状态：每次打开按默认设置，不记忆手动操作。
  const collapsedModules = new Set(registry.modules.filter((m) => m.collapsed).map((m) => m.id));
  try { localStorage.removeItem("gt-nav-collapsed"); } catch (e) {}
  let current = { moduleId: null, featureId: null };

  function featureButton(module, f) {
    return `<button class="nav-feature" data-module="${module.id}" data-feature="${f.id}" aria-label="${f.name}">
      <span class="icon">${featureIcon(module.id, f.id)}</span>
      <span class="name" title="${f.name}">${f.name}</span>
    </button>`;
  }

  function renderNav() {
    nav.innerHTML = registry.modules.map((module) => `
      <div class="nav-module${collapsedModules.has(module.id) ? " collapsed" : ""}" data-module-id="${module.id}">
        <button type="button" class="nav-module-title" aria-expanded="${!collapsedModules.has(module.id)}" title="v${module.version}">
          <span class="name">${module.name}</span><span class="caret">${CHEVRON}</span>
        </button>
        <div class="nav-items"><div class="nav-items-inner">${module.features.map((f) => featureButton(module, f)).join("")}</div></div>
      </div>`).join("");
    $$(".nav-module-title", nav).forEach((btn) => btn.addEventListener("click", () => {
      const box = btn.closest(".nav-module");
      const id = box.dataset.moduleId;
      const nowCollapsed = !box.classList.contains("collapsed");
      box.classList.toggle("collapsed", nowCollapsed);
      btn.setAttribute("aria-expanded", String(!nowCollapsed));
      nowCollapsed ? collapsedModules.add(id) : collapsedModules.delete(id);
      if (!nowCollapsed) {
        box.classList.remove("just-opened"); void box.offsetWidth; box.classList.add("just-opened");
        setTimeout(() => box.classList.remove("just-opened"), 560);
      }
      // 分组展开/收起时图标会连续移动，选中底块跟着每一帧贴住目标。
      followMarker(320);
    }));
    $$(".nav-feature", nav).forEach((btn) => btn.addEventListener("click", () => openFeature(btn.dataset.module, btn.dataset.feature)));

    const peekOrder = [$("#sidebar .brand"), ...$$(".nav-module-title, .nav-feature, .nav-page", nav)];
    peekOrder.forEach((el, i) => el && el.style.setProperty("--peek-i", String(Math.min(i, 9))));
    // nav.innerHTML 会换掉 marker 节点，重新插回来。
    refreshMarker(true);
  }

  function setNavActive() {
    $$(".nav-feature[data-feature]").forEach((btn) => btn.classList.toggle("active", btn.dataset.module === current.moduleId && btn.dataset.feature === current.featureId));
    // 换功能时底块滑到新的一项；连续快点几下也从当前位置接着走。
    refreshMarker();
  }

  /* ---------- 侧栏悬停展开（桌面）/ 更多面板（手机） ---------- */
  const sidebar = $("#sidebar");
  const MOBILE = window.matchMedia("(max-width: 760px)");
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 悬停 / 键盘焦点 / 触屏点按 / 底部小菜单，四种临时展开的原因；鼠标移开、焦点离开、菜单关掉就收回去。
  let peeking = false, hovered = false, focused = false, tapped = false;
  let peekIn = 0, peekOut = 0;
  const tip = document.createElement("div");
  tip.id = "sidebar-tip"; tip.hidden = true; tip.setAttribute("role", "tooltip"); document.body.append(tip);
  let tipTimer = 0;
  const hideTip = () => { clearTimeout(tipTimer); tipTimer = 0; tip.hidden = true; };

  function paint() {
    app.classList.toggle("sidebar-is-collapsed", !peeking);
    app.classList.toggle("sidebar-is-peek", peeking);
  }
  function startPeek() {
    clearTimeout(peekIn); peekIn = 0;
    if (peeking || MOBILE.matches) return;
    peeking = true;
    paint();
    hideTip();
  }
  function beginPeek() {
    if (MOBILE.matches) return;
    clearTimeout(peekOut); peekOut = 0;
    app.classList.remove("sidebar-is-peek-out");
    if (peeking) return;
    // 鼠标只是扫过时别整块弹一下：先等 80ms 确认要停在这里；键盘焦点、触屏点按和菜单不等。
    if (hovered && !focused && !tapped) {
      if (!peekIn) peekIn = setTimeout(() => { peekIn = 0; if (hovered || focused || tapped) startPeek(); }, 80);
      return;
    }
    startPeek();
  }
  function endPeek() {
    clearTimeout(peekIn); peekIn = 0;
    if (!peeking) return;
    clearTimeout(peekOut);
    peeking = false;
    // 收起时先让 200ms 的裁切过渡把侧栏收回去，再换回静态的 72px 图标栏（留 20ms 余量）。
    if (reduceMotion() || MOBILE.matches) {
      app.classList.remove("sidebar-is-peek", "sidebar-is-peek-out");
      paint();
      return;
    }
    app.classList.add("sidebar-is-peek-out");
    peekOut = setTimeout(() => {
      peekOut = 0;
      app.classList.remove("sidebar-is-peek", "sidebar-is-peek-out");
      paint();
    }, 220);
  }
  const syncPeek = () => {
    if (hovered || focused || tapped) beginPeek();
    else endPeek();
  };

  // 只认真鼠标：触屏点一下浏览器会补发 mouseenter，却不补 mouseleave，侧栏就一直开着。
  const isMouse = (e) => e.pointerType === "mouse";
  sidebar.addEventListener("pointerenter", (e) => { if (isMouse(e)) { hovered = true; syncPeek(); } });
  sidebar.addEventListener("pointerleave", (e) => { if (isMouse(e)) { hovered = false; tapped = false; syncPeek(); hideTip(); } });

  // 触屏：点空白处展开，点了会跳转的按钮或点侧栏外面就收起。
  const ACTION = ".brand, .nav-feature, .nav-page:not(.sb-tool), .sb-pop button, .sb-pop input, a[href]";
  sidebar.addEventListener("pointerdown", (e) => {
    if (isMouse(e) || MOBILE.matches || !(e.target instanceof Element)) return;
    if (e.target.closest(ACTION)) return;
    tapped = true;
    syncPeek();
  });
  sidebar.addEventListener("click", (e) => {
    if (!tapped || !(e.target instanceof Element) || !e.target.closest(ACTION)) return;
    tapped = false;
    syncPeek();
  });
  document.addEventListener("pointerdown", (e) => {
    if (!tapped || (e.target instanceof Node && sidebar.contains(e.target))) return;
    tapped = false;
    syncPeek();
  });
  // 关键：鼠标点击产生的焦点没有 :focus-visible，不能算「键盘正在用侧栏」，否则点完移开鼠标就不收起了。
  sidebar.addEventListener("focusin", (e) => {
    if (!(e.target instanceof HTMLElement) || !e.target.matches(":focus-visible")) return;
    focused = true;
    syncPeek();
  });
  sidebar.addEventListener("focusout", (e) => {
    if (e.relatedTarget instanceof Node && sidebar.contains(e.relatedTarget)) return;
    focused = false;
    syncPeek();
  });
  MOBILE.addEventListener("change", () => {
    clearTimeout(peekOut); clearTimeout(peekIn);
    peekOut = 0; peekIn = 0;
    peeking = false; hovered = false; focused = false; tapped = false;
    app.classList.remove("sidebar-is-peek", "sidebar-is-peek-out");
    paint();
  });

  const ITEM = ".brand, .nav-feature, .nav-page";
  function showTip(e) {
    if (peekIn) return;
    const button = e.target.closest?.(ITEM);
    if (!button || !app.classList.contains("sidebar-is-collapsed") || MOBILE.matches) return;
    const label = button.querySelector(".name")?.textContent?.trim() || button.getAttribute("aria-label") || "";
    if (!label) return;
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => {
      tipTimer = 0;
      if (!app.classList.contains("sidebar-is-collapsed") || !button.isConnected) return;
      const r = button.getBoundingClientRect();
      tip.textContent = label;
      tip.style.left = `${Math.round(Math.max(r.right, sidebar.getBoundingClientRect().right) + 8)}px`;
      tip.style.top = `${Math.round(r.top + (r.height - 32) / 2)}px`;
      tip.hidden = false;
    }, 90);
  }
  sidebar.addEventListener("pointerover", (e) => { if (isMouse(e)) showTip(e); });
  sidebar.addEventListener("pointerout", (e) => {
    const button = e.target.closest?.(ITEM);
    if (button && !button.contains(e.relatedTarget)) hideTip();
  });
  sidebar.addEventListener("focusin", (e) => { if (e.target.matches?.(":focus-visible")) showTip(e); });
  sidebar.addEventListener("focusout", hideTip);
  nav.addEventListener("scroll", hideTip);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    hideTip();
    if (tapped) { tapped = false; syncPeek(); }
  });
  window.addEventListener("resize", hideTip);

  const moreButton = $("#more-button"), moreSheet = $("#more-sheet");
  moreButton.addEventListener("click", () => {
    const open = !app.classList.contains("more-open");
    app.classList.toggle("more-open", open);
    moreButton.setAttribute("aria-expanded", String(open));
  });
  moreSheet.addEventListener("click", (e) => { if (e.target.closest("button, a") && !e.target.closest("[data-keep-sheet]")) closeMore(); });
  function closeMore() { app.classList.remove("more-open"); moreButton.setAttribute("aria-expanded", "false"); }
  document.addEventListener("pointerdown", (e) => { if (app.classList.contains("more-open") && !moreSheet.contains(e.target) && !moreButton.contains(e.target)) closeMore(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMore(); });
  nav.addEventListener("click", (e) => { if (e.target.closest(".nav-feature")) closeMore(); });
  MOBILE.addEventListener("change", (e) => { if (!e.matches) closeMore(); });


  /* ---------- 全站浮动滚动条 ---------- */
  const HIDE_AFTER = 900, MIN_THUMB = 24, INSET = 2;
  const bars = new Map();
  const isViewport = (el) => el === document.scrollingElement || el === document.documentElement || el === document.body;
  const boxOf = (el) => {
    if (isViewport(el)) return { top: 0, left: 0, width: innerWidth, height: innerHeight };
    const rect = el.getBoundingClientRect();
    return { top: rect.top + el.clientTop, left: rect.left + el.clientLeft, width: el.clientWidth, height: el.clientHeight };
  };
  function makeThumb(bar, axis) {
    const thumb = document.createElement("div");
    thumb.className = `gt-scrollthumb is-${axis}`;
    thumb.setAttribute("aria-hidden", "true");
    thumb.addEventListener("pointerenter", () => clearTimeout(bar.timer));
    thumb.addEventListener("pointerleave", () => { if (!bar.drag) hideLater(bar); });
    thumb.addEventListener("pointerdown", (event) => startDrag(event, bar, axis));
    document.body.append(thumb);
    return thumb;
  }
  function placeBar(bar) {
    const { el } = bar, box = boxOf(el);
    const sh = el.scrollHeight, ch = isViewport(el) ? innerHeight : el.clientHeight;
    const sw = el.scrollWidth, cw = isViewport(el) ? innerWidth : el.clientWidth;
    const showY = sh > ch + 1 && box.height > MIN_THUMB * 2;
    const showX = sw > cw + 1 && box.width > MIN_THUMB * 2;
    if (showY) {
      bar.y ??= makeThumb(bar, "y");
      const track = box.height - INSET * 2;
      const size = Math.max(MIN_THUMB, (track * ch) / sh);
      const at = ((track - size) * el.scrollTop) / Math.max(1, sh - ch);
      Object.assign(bar.y.style, { top: `${box.top + INSET + at}px`, left: `${box.left + box.width - 9}px`, height: `${size}px` });
    }
    if (showX) {
      bar.x ??= makeThumb(bar, "x");
      const track = box.width - INSET * 2 - (showY ? 10 : 0);
      const size = Math.max(MIN_THUMB, (track * cw) / sw);
      const at = ((track - size) * el.scrollLeft) / Math.max(1, sw - cw);
      Object.assign(bar.x.style, { left: `${box.left + INSET + at}px`, top: `${box.top + box.height - 9}px`, width: `${size}px` });
    }
    bar.y?.classList.toggle("is-on", showY);
    bar.x?.classList.toggle("is-on", showX);
  }
  const dropBar = (bar) => { clearTimeout(bar.timer); bar.y?.remove(); bar.x?.remove(); bars.delete(bar.el); };
  function hideLater(bar) {
    clearTimeout(bar.timer);
    bar.timer = setTimeout(() => {
      bar.y?.classList.remove("is-on");
      bar.x?.classList.remove("is-on");
      bar.timer = setTimeout(() => dropBar(bar), 400);
    }, HIDE_AFTER);
  }
  function showBar(el) {
    if (!(el instanceof Element) && el !== document.scrollingElement) return;
    if (el instanceof Element && el.closest("[data-no-scrollbar]")) return;
    let bar = bars.get(el);
    if (!bar) { bar = { el, y: null, x: null, timer: 0, drag: null }; bars.set(el, bar); }
    clearTimeout(bar.timer);
    placeBar(bar);
    if (!bar.drag) hideLater(bar);
  }
  function startDrag(event, bar, axis) {
    if (event.button !== 0) return;
    event.preventDefault();
    const { el } = bar, thumb = axis === "y" ? bar.y : bar.x, box = boxOf(el);
    const vertical = axis === "y";
    const track = (vertical ? box.height : box.width) - INSET * 2;
    const size = vertical ? thumb.offsetHeight : thumb.offsetWidth;
    const range = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    bar.drag = { start: vertical ? event.clientY : event.clientX, from: vertical ? el.scrollTop : el.scrollLeft, ratio: range / Math.max(1, track - size) };
    thumb.classList.add("is-drag");
    try { thumb.setPointerCapture(event.pointerId); } catch (e) {}
    const move = (ev) => {
      const delta = ((vertical ? ev.clientY : ev.clientX) - bar.drag.start) * bar.drag.ratio;
      if (vertical) el.scrollTop = bar.drag.from + delta;
      else el.scrollLeft = bar.drag.from + delta;
    };
    const end = () => {
      thumb.removeEventListener("pointermove", move);
      thumb.removeEventListener("pointerup", end);
      thumb.removeEventListener("pointercancel", end);
      thumb.classList.remove("is-drag");
      bar.drag = null;
      hideLater(bar);
    };
    thumb.addEventListener("pointermove", move);
    thumb.addEventListener("pointerup", end);
    thumb.addEventListener("pointercancel", end);
  }
  document.addEventListener("scroll", (e) => showBar(e.target === document ? document.scrollingElement : e.target), { capture: true, passive: true });
  window.addEventListener("resize", () => { for (const bar of [...bars.values()]) dropBar(bar); });

  /* ---------- 选中项滑动底块 ----------
   * 只有一块 .nav-marker，换功能时在菜单项之间连续滑过去；收起时缩到图标上。 */
  const marker = document.createElement("div");
  marker.className = "nav-marker";
  marker.setAttribute("aria-hidden", "true");
  nav.prepend(marker);
  let markerShown = false;

  const markerBox = (itemBox, navBox, scrollTop) => ({
    top: itemBox.top - navBox.top + scrollTop,
    left: itemBox.left - navBox.left,
    width: itemBox.width,
    height: itemBox.height,
  });
  const compactBox = (iconBox, itemBox, navBox, scrollTop, size = 44) => {
    const centerX = iconBox.left + iconBox.width / 2;
    const centerY = itemBox.top + itemBox.height / 2;
    return {
      top: centerY - size / 2 - navBox.top + scrollTop,
      left: centerX - size / 2 - navBox.left,
      width: size,
      height: size,
    };
  };
  const activeItem = () => nav.querySelector(".nav-feature.active, .nav-page.active");

  function placeMarker(instant) {
    const item = activeItem();
    // 选中项在折叠的分组里、或没有选中项时，底块藏起来。
    const visible = !!item && !item.closest(".nav-module.collapsed");
    if (!visible) { marker.classList.remove("on"); markerShown = false; return; }
    const box = markerBox(item.getBoundingClientRect(), nav.getBoundingClientRect(), nav.scrollTop);
    const jump = instant || !markerShown;
    if (jump) marker.classList.add("no-anim");
    marker.style.top = `${box.top}px`;
    marker.style.left = `${box.left}px`;
    marker.style.width = `${box.width}px`;
    marker.style.height = `${box.height}px`;
    marker.classList.add("on");
    if (jump) {
      void marker.offsetWidth;
      marker.classList.remove("no-anim");
    }
    markerShown = true;
  }
  function refreshMarker(instant = false) {
    if (marker.parentNode !== nav) nav.prepend(marker);
    placeMarker(instant);
  }
  // 展开/收起模块这类连续布局变化：每帧贴住目标，不等动画停下来才一跳。
  function followMarker(ms = 320) {
    const until = performance.now() + ms;
    const next = (fn) => (!document.hidden && typeof requestAnimationFrame === "function" ? requestAnimationFrame(fn) : setTimeout(fn, 16));
    const step = () => {
      placeMarker(true);
      if (performance.now() < until) next(step);
      else placeMarker(false);
    };
    step();
  }
  // 侧栏收起时跟着裁切缩到图标上（每帧量图标位置并按进度插值）。
  let folding = 0, foldingActive = false;
  const FOLD_MS = 200;
  function foldMarker() {
    const item = activeItem();
    if (!item || !marker.classList.contains("on")) return;
    const icon = item.querySelector(".icon") || item;
    const read = (side, fallback) => { const v = Number.parseFloat(marker.style[side]); return Number.isFinite(v) ? v : fallback; };
    const start = {
      top: read("top", 0), left: read("left", 0),
      width: read("width", marker.offsetWidth), height: read("height", marker.offsetHeight),
    };
    const t0 = performance.now();
    clearTimeout(folding);
    foldingActive = true;
    marker.classList.add("is-folding", "no-anim");
    const step = () => {
      folding = 0;
      if (!foldingActive || !item.isConnected) return;
      const p = Math.min(1, (performance.now() - t0) / FOLD_MS);
      const k = 1 - (1 - p) * (1 - p);
      const end = compactBox(icon.getBoundingClientRect(), item.getBoundingClientRect(), nav.getBoundingClientRect(), nav.scrollTop);
      const height = start.height + (end.height - start.height) * k;
      marker.style.top = `${end.top + end.height / 2 - height / 2}px`;
      marker.style.height = `${height}px`;
      marker.style.left = `${start.left + (end.left - start.left) * k}px`;
      marker.style.width = `${start.width + (end.width - start.width) * k}px`;
      if (p >= 1) return;
      if (!document.hidden && typeof requestAnimationFrame === "function") requestAnimationFrame(step);
      else folding = setTimeout(step, 16);
    };
    step();
  }
  if (typeof MutationObserver === "function") {
    const sidebarState = () => ["sidebar-is-collapsed", "sidebar-is-peek", "sidebar-is-peek-out"].filter((n) => app.classList.contains(n)).join(" ");
    let last = sidebarState();
    new MutationObserver(() => {
      const now = sidebarState();
      if (now === last) return;
      last = now;
      if (app.classList.contains("sidebar-is-peek-out")) { foldMarker(); return; }
      clearTimeout(folding); folding = 0; foldingActive = false;
      marker.classList.remove("is-folding", "no-anim");
      placeMarker(true);
      followMarker(300);
    }).observe(app, { attributes: true, attributeFilter: ["class"] });
  }
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(() => { if (!foldingActive) placeMarker(true); });
    observer.observe(nav);
    observer.observe(sidebar);
  }
  refreshMarker(true);

  /* ---------- 主题切换（圆形扩散） ---------- */
  const THEME_KEY = "gt-theme";
  const systemDark = matchMedia("(prefers-color-scheme: dark)");
  const readTheme = () => { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } };
  const resolveTheme = (saved, dark) => (saved === "night" || saved === "day" ? saved : dark ? "night" : "day");
  const revealRadius = (x, y, width, height) => Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
  function applyTheme(theme) {
    document.documentElement.classList.toggle("night", theme === "night");
    const label = theme === "night" ? "切换到白天模式" : "切换到夜晚模式";
    $$("[data-theme-toggle]").forEach((b) => { b.title = label; b.setAttribute("aria-label", label); b.setAttribute("aria-pressed", String(theme === "night")); });
  }
  function revealTheme(origin, theme) {
    if (typeof document.startViewTransition !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden) { applyTheme(theme); return; }
    let transition;
    try { transition = document.startViewTransition(() => applyTheme(theme)); } catch (e) { applyTheme(theme); return; }
    if (!transition) { applyTheme(theme); return; }
    const radius = revealRadius(origin.x, origin.y, innerWidth, innerHeight);
    transition.ready.then(() => document.documentElement.animate(
      { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
      { duration: 700, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" },
    )).catch(() => {});
  }
  applyTheme(resolveTheme(readTheme(), systemDark.matches));
  systemDark.addEventListener("change", (e) => applyTheme(resolveTheme(readTheme(), e.matches)));
  $$("[data-theme-toggle]").forEach((button) => button.addEventListener("click", (event) => {
    const next = document.documentElement.classList.contains("night") ? "day" : "night";
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    // 键盘回车（detail===0）没有点击坐标：从按钮中心散开。
    const box = button.getBoundingClientRect();
    const typed = event.detail === 0;
    const x = typed || !Number.isFinite(event.clientX) ? box.left + box.width / 2 : event.clientX;
    const y = typed || !Number.isFinite(event.clientY) ? box.top + box.height / 2 : event.clientY;
    revealTheme({ x, y }, next);
  }));

  /* ---------- 搜索 ---------- */
  const searchInput = $("#search"), results = $("#mascot-results");
  const searchField = searchInput.closest(".topbar-search") || searchInput;
  let searchHits = [], searchActive = -1;

  const matchingFeatures = (module, needle) => {
    const features = module.features || [];
    if (!needle) return features.filter((f) => f.menu !== false);
    const text = (...parts) => parts.join(" ").toLowerCase();
    const hits = features.filter((f) => text(f.name, f.id, f.description, ...(f.tags || [])).includes(needle));
    if (hits.length) return hits;
    return text(module.name, module.id, ...(module.tags || [])).includes(needle) ? features : [];
  };
  const listedResults = () => {
    const text = searchInput.value.trim();
    if (MOBILE.matches && !text) return [];
    const needle = text.toLowerCase();
    return registry.modules.flatMap((module) => matchingFeatures(module, needle).map((feature) => ({ module, feature })));
  };

  // 结果面板挂在顶栏下面：宽屏对齐输入框左边，手机撑满（这里只给位置，宽窄由样式写死）。
  const placeResults = () => {
    if (results.hidden) return;
    const top = ($("#topbar")?.getBoundingClientRect().bottom || 0) + 8;
    if (MOBILE.matches) {
      results.style.left = ""; results.style.width = ""; results.style.top = `${top}px`;
      return;
    }
    const box = searchField.getBoundingClientRect();
    const width = results.offsetWidth || 320;
    results.style.left = `${Math.max(8, Math.min(box.left, innerWidth - width - 8))}px`;
    results.style.top = `${Math.max(8, Math.min(top, innerHeight - results.offsetHeight - 8))}px`;
  };
  const markResults = () => {
    results.querySelectorAll(".mascot-hit").forEach((item, index) => {
      item.classList.toggle("is-active", index === searchActive);
      item.setAttribute("aria-selected", String(index === searchActive));
      if (index === searchActive) item.scrollIntoView({ block: "nearest" });
    });
    if (searchActive >= 0) searchInput.setAttribute("aria-activedescendant", `mascot-hit-${searchActive}`);
    else searchInput.removeAttribute("aria-activedescendant");
  };
  function renderResults() {
    const typed = !!searchInput.value.trim();
    searchHits = listedResults();
    searchActive = typed && searchHits.length ? 0 : -1;
    results.innerHTML = searchHits.length
      ? searchHits.map(({ module, feature }, index) => `
        <button type="button" class="mascot-hit" id="mascot-hit-${index}" role="option" tabindex="-1" data-index="${index}" aria-selected="false">
          <span class="icon">${featureIcon(module.id, feature.id)}</span>
          <span class="text"><b>${feature.name}</b><small>${feature.description || module.name}</small></span>
        </button>`).join("")
      : typed ? '<div class="mascot-empty">没有匹配的功能，换个词试试。</div>' : "";
    results.hidden = !typed && !searchHits.length;
    searchInput.setAttribute("aria-expanded", String(!results.hidden));
    markResults();
    placeResults();
  }
  const closeResults = () => {
    results.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
    searchInput.removeAttribute("aria-activedescendant");
  };
  const focusSearch = () => { searchInput.focus(); searchInput.select(); renderResults(); };
  const chooseResult = (index) => {
    const hit = searchHits[index];
    if (!hit) return;
    closeResults();
    searchInput.value = "";
    searchInput.blur();
    openFeature(hit.module.id, hit.feature.id);
  };
  searchInput.addEventListener("focus", renderResults);
  searchInput.addEventListener("input", renderResults);
  searchInput.addEventListener("click", renderResults);
  searchField.addEventListener("click", (e) => { if (e.target === searchField) searchInput.focus(); });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      searchInput.value = "";
      closeResults();
      searchInput.blur();
    } else if (e.key === "Enter") {
      e.preventDefault();
      chooseResult(searchActive);
    } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && searchHits.length) {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      searchActive = searchActive < 0 && step < 0 ? searchHits.length - 1 : (searchActive + step + searchHits.length) % searchHits.length;
      markResults();
    }
  });
  results.addEventListener("click", (e) => {
    const item = e.target instanceof Element && e.target.closest(".mascot-hit");
    if (item) chooseResult(Number(item.dataset.index));
  });
  document.addEventListener("pointerdown", (e) => { if (!results.hidden && !searchField.contains(e.target)) closeResults(); });
  searchField.addEventListener("focusout", (e) => { if (e.relatedTarget && !searchField.contains(e.relatedTarget)) closeResults(); });
  window.addEventListener("resize", placeResults);
  document.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); focusSearch(); } });
  $("#theme-toggle").title = "切换到夜晚模式";

  /* ---------- 首页工具卡：常用网站入口 ---------- */
  const HOME_TOOLS = ["ddzf-mail", "gs-table", "gs-register", "gs-weekly"];
  const HOME_TOOL_ARROW = '<svg class="home-tool-go" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let lastFeature = null;
  try { const saved = JSON.parse(localStorage.getItem("gt-last-feature") || "null"); if (saved && typeof saved.moduleId === "string") lastFeature = saved; } catch (e) {}

  function renderHomeTools() {
    // 页面内容会被 openFeature / openHome 整体替换，必须重新取节点，不能用启动时缓存的引用
    const homeTools = $("#home-tools");
    if (!homeTools) return;
    const list = HOME_TOOLS.map((id) => allFeatures().find((x) => x.feature.id === id)).filter(Boolean).slice(0, 4);
    homeTools.innerHTML = list.map(({ module, feature }) => {
      const last = !!lastFeature && lastFeature.moduleId === module.id && lastFeature.featureId === feature.id;
      return `<button class="home-tool${last ? " is-last" : ""}" type="button" data-module="${module.id}" data-feature="${feature.id}">
        <span class="home-tool-icon" aria-hidden="true">${categoryIcon(module.id)}</span>
        <span class="home-tool-text"><b>${escapeHtml(feature.name)}</b><small>${escapeHtml(module.name)}</small></span>
        <span class="home-tool-tail">${last ? "<em>上次</em>" : ""}${HOME_TOOL_ARROW}</span>
      </button>`;
    }).join("");
    $$(".home-tool", homeTools).forEach((link) => {
      link.addEventListener("click", () => openFeature(link.dataset.module, link.dataset.feature));
    });
  }

  /* ---------- 主视图与欢迎页 ---------- */
  const view = $("#view");
  const welcomeMarkup = $(".welcome", view).outerHTML;
  function setEnterDirection(direction) {
    view.dataset.enter = direction;
  }

  // 先写方向再换内容，动画才按这一页的方向播。
  function setCrumb(text, sub, iconHtml = "", direction = "forward") {
    const crumb = $("#crumb");
    crumb.dataset.enter = direction;
    crumb.innerHTML = `${iconHtml ? `<span class="crumb-icon">${iconHtml}</span>` : ""}${sub ? `<span class="crumb-module">${sub}</span><span class="crumb-sep" aria-hidden="true">›</span>` : ""}<h1 class="crumb-title">${text}</h1>`;
  }

  function openHome() {
    current = { moduleId: null, featureId: null };
    currentUrl = "";
    if (openWindowBtn) { openWindowBtn.disabled = true; openWindowBtn.title = "在新窗口打开当前网站"; }
    setCrumb("选择一个网站开始", "", "", "back");
    setEnterDirection("back");
    view.innerHTML = welcomeMarkup;
    renderHomeTools();
    document.title = "链接聚合站";
    setNavActive();
    mountSky();
    view.scrollTop = 0;
    history.replaceState(null, "", location.pathname);
  }

  let currentUrl = "";
  const openWindowBtn = $("#open-window");
  function openFeature(moduleId, featureId) {
    const { module, feature } = byId(moduleId, featureId);
    if (!feature.url) return;
    current = { moduleId, featureId };
    currentUrl = buildFrameUrl(feature.url);
    setCrumb(feature.name, module.name, featureIcon(module.id, feature.id), "forward");
    setEnterDirection("forward");
    // 主区域整块直接内嵌打开网站；hub_v 参数供被嵌页面识别。
    view.innerHTML = `<div class="gt-feature-root hub-stage">
      <iframe class="hub-frame" src="${escapeHtml(currentUrl)}" title="${escapeHtml(feature.name)}" allow="clipboard-read; clipboard-write" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>`;
    document.title = `${feature.name} · 链接聚合站`;
    if (openWindowBtn) { openWindowBtn.disabled = false; openWindowBtn.title = `在新窗口打开：${feature.name}`; }
    // 打开网站时自动展开所属分类，让选中项可见。
    const moduleBox = nav.querySelector(`[data-module-id="${moduleId}"]`);
    if (moduleBox?.classList.contains("collapsed")) {
      moduleBox.classList.remove("collapsed");
      moduleBox.querySelector(".nav-module-title")?.setAttribute("aria-expanded", "true");
      collapsedModules.delete(moduleId);
    }
    setNavActive();
    closeMore();
    hideTip();
    view.scrollTop = 0;
    history.replaceState(null, "", `${location.pathname}?p=${encodeURIComponent(`${moduleId}/${featureId}`)}`);
    lastFeature = { moduleId, featureId };
    try { localStorage.setItem("gt-last-feature", JSON.stringify(lastFeature)); } catch (e) {}
  }
  function escapeHtml(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  openWindowBtn?.addEventListener("click", () => { if (currentUrl) window.open(currentUrl, "_blank", "noopener"); });

  /* ---------- 首页天空 ---------- */
  let stopSky = null;
  function mountSky() {
    if (stopSky) { stopSky(); stopSky = null; }
    const canvas = $(".home-sky", view);
    if (canvas && typeof mountWelcomeSky === "function") stopSky = mountWelcomeSky(canvas, { window, document });
  }

  /* ---------- 顶部按钮 / 弹窗 ---------- */
  const dialog = $("#info-dialog");
  function showDialog(title, html) {
    $("#info-title").textContent = title;
    $("#info-body").innerHTML = html;
    if (!dialog.open) dialog.showModal();
    $("#info-close")?.focus();
  }
  $("#info-close")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  /* ---------- 首页按钮 ---------- */
  $("#home-button")?.addEventListener("click", openHome);
  $("#home-sheet-button")?.addEventListener("click", openHome);
  /* ---------- 问题反馈（占位，后续再决定内容） ---------- */
  $("#feedback-button")?.addEventListener("click", () => showDialog("问题反馈", '<p style="margin:0;color:var(--muted);line-height:1.7">本来想放个微信的，嫌麻烦就不放了，有什么问题直接喊</p>'));
  /* ---------- 首页占位按钮（节点会随页面切换重建，用事件委托） ---------- */
  const placeholderTip = (title) => showDialog(title, '<p style="margin:0;color:var(--muted);line-height:1.7">你小子这么闲？</p>');
  document.addEventListener("click", (e) => {
    const guideBtn = e.target.closest(".home-quick-btn[data-guide]");
    if (guideBtn) { e.preventDefault(); placeholderTip("别乱点"); return; }
    const newsBtn = e.target.closest(".home-quick-btn[data-whats-new]");
    if (newsBtn) { e.preventDefault(); placeholderTip("别乱点"); return; }
    const legalLink = e.target.closest(".home-legal a");
    if (legalLink) { e.preventDefault(); placeholderTip("别乱点"); }
  });

  /* ---------- 更新横幅：立即更新刷新加载新版本，稍后仅关闭本次提示 ---------- */
  $("#update-now")?.addEventListener("click", () => location.reload());
  $("#update-later")?.addEventListener("click", () => {
    const banner = $("#update-banner");
    if (banner) banner.hidden = true;
  });

  /* ---------- 启动 ---------- */
  renderNav();
  renderHomeTools();
  mountSky();
  setNavActive();

  const params = new URLSearchParams(location.search);
  const deep = params.get("p");
  if (deep && deep.includes("/")) {
    const [m, f] = deep.split("/");
    const { feature } = byId(m, f);
    if (feature.id) openFeature(m, f);
    else { setCrumb("选择一个网站开始", "", "", "back"); setEnterDirection("back"); }
  } else {
    setCrumb("选择一个网站开始", "", "", "back");
    setEnterDirection("back");
  }

  setTimeout(checkVersion, 5000);
  setInterval(checkVersion, VERSION_CHECK_INTERVAL);
})();
