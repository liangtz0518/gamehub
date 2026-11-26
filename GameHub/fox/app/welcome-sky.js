/* 首页的天空：一块 canvas 只画飘落的樱花瓣，分远近三层，翻着飘、被阵风吹偏。
 * 分隔线是另一块小 canvas（.home-blade）的尺刀，和花瓣吹的是同一阵风。
 *
 * 只在首页跑：canvas 离开页面就自己停；窗口切到后台时 requestAnimationFrame 本来就会停。
 * 系统开了「减少动态效果」时只画一帧静止的花瓣。
 * 颜色都从 .welcome 上的 CSS 变量读（--sky-*），夜晚主题切换时重新读。 */

/** 固定种子的伪随机：每次打开花瓣的样子一样，不会闪成另一片。 */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** 花瓣数量跟着面积走：小屏少一点，大屏多一点。 */
function petalCount(width, height) {
  return Math.round(clamp((width * height) / 36000, 14, 40));
}

/** 生成一片花瓣。depth 0～1：越大越近，越大、越快、越不透明。 */
function makePetal(random, width, height, scatter = true) {
  const depth = random();
  return {
    x: random() * width,
    y: scatter ? random() * height : -20 - random() * 60,
    depth,
    size: 5 + depth * 7,
    fall: 18 + depth * 34 + random() * 10,
    drift: 6 + random() * 14,
    sway: random() * Math.PI * 2,
    swaySpeed: 0.6 + random() * 0.8,
    spin: random() * Math.PI * 2,
    spinSpeed: (random() < 0.5 ? -1 : 1) * (0.8 + random() * 1.6),
    alpha: 0.35 + depth * 0.5,
  };
}

/** 花瓣走 dt 秒。wind 是阵风（像素/秒，正数往右）。飘出底边或左右边就从上面重新落。 */
function stepPetal(petal, dt, wind, width, height, random) {
  petal.sway += petal.swaySpeed * dt;
  petal.spin += petal.spinSpeed * dt;
  petal.y += petal.fall * dt;
  petal.x += (petal.drift + wind * (0.4 + petal.depth) + Math.sin(petal.sway) * 18) * dt;
  if (petal.y > height + 30 || petal.x > width + 40 || petal.x < -60) Object.assign(petal, makePetal(random, width, height, false), { x: random() * width * 1.1 - width * 0.1 });
  return petal;
}

/** 阵风（像素/秒，正数往右）：几秒一阵，花瓣和尺刀上的丝带吹的是同一阵。 */
function gust(t) {
  return Math.max(0, Math.sin(t * 0.35)) ** 3 * 46;
}

// 尺刀（分隔线那块小 canvas，CSS 尺寸 BLADE_W×BLADE_H）：
// 左边缠绳刀柄（白底粉色菱形绳纹）、红色柄头带银扣和一小段挂饰；护手处系粉色大蝴蝶结，结上一朵白色樱花，垂两条飘带；
// 右边是一把平直的长尺当刀身：白色尺身、下沿一条粉色带上刻着白色刻度、根部刻一朵小樱花、刀尖斜切。
const BLADE_W = 260;
const BLADE_H = 44;
const BOW = { x: 60, y: 20 };
const POMMEL = { x: 6, y: 23 };

/** 一条飘带的中线和宽度：从 anchor 往右下垂、往尾巴越摆越大，起风时摆得更大。点都在小 canvas 里。 */
function ribbonPoints(anchor, t, wind, length, phase, drop = 8) {
  const points = [];
  const gustFactor = 1 + Math.min(1, wind / 46) * 0.8;
  for (let i = 0; i <= 24; i++) {
    const s = i / 24;
    const swing = Math.sin(s * 5.5 - t * 2.6 + phase) * (1.2 + s * 3.4) * gustFactor;
    points.push({
      x: anchor.x + s * length,
      y: Math.min(BLADE_H - 1.5, anchor.y + s * drop + swing * s),
      w: (1 - s) * 3.2 + 1.1,
    });
  }
  return points;
}

/** #rrggbb 加透明度；读不懂的颜色原样返回。 */
function withAlpha(color, alpha) {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!hex) return color;
  return `#${hex[1]}${Math.round(clamp(alpha, 0, 1) * 255).toString(16).padStart(2, "0")}`;
}

// —— 图形（以花瓣中心为原点） ——
const PETAL = "M0 -8L-2 -10.5C-8 -8.5-8.5 1 0 10C8.5 1 8-8.5 2-10.5Z";

function readColors(el, win) {
  const style = win.getComputedStyle(el);
  const get = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  return {
    petal: get("--sky-petal", "#f4a7c3"),
    blade: get("--sky-blade", "#d5336c"),
    ribbon: get("--sky-ribbon", "#e0457d"),
    ribbonLight: get("--sky-ribbon-2", "#f3a5c2"),
    shine: get("--sky-shine", "#ffffff"),
    metal: get("--sky-metal", "#cfc6d6"),
  };
}

/** 在 canvas 上挂好天空并开始动；返回停止函数。canvas 不在了也会自己停。 */
function mountWelcomeSky(canvas, { window: win, document: doc }) {
  const ctx = canvas?.getContext?.("2d");
  if (!ctx || typeof win.Path2D !== "function") return () => {};
  const welcome = canvas.parentElement;
  // 说明下面那把尺刀是另一块小 canvas，跟天空用同一个时钟和同一阵风
  const blade = welcome.querySelector(".home-blade");
  const bladeCtx = blade?.getContext?.("2d") ?? null;
  const reduce = win.matchMedia?.("(prefers-reduced-motion: reduce)");
  const random = seeded(20261118);
  const paths = { petal: new win.Path2D(PETAL) };
  let width = 0;
  let height = 0;
  let petals = [];
  let colors = readColors(welcome, win);
  let frame = 0;
  let last = 0;
  let stopped = false;

  const resize = () => {
    const box = welcome.getBoundingClientRect();
    const ratio = Math.min(win.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(box.width));
    height = Math.max(1, Math.round(box.height));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const want = petalCount(width, height);
    while (petals.length < want) petals.push(makePetal(random, width, height));
    petals.length = want;
  };

  const resizeBlade = () => {
    if (!bladeCtx) return;
    const ratio = Math.min(win.devicePixelRatio || 1, 2);
    blade.width = Math.round(BLADE_W * ratio);
    blade.height = Math.round(BLADE_H * ratio);
    bladeCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const ribbon = (c, points, color, alpha = 0.92) => {
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(p.x, p.y - p.w / 2) : c.moveTo(p.x, p.y - p.w / 2)));
    for (let i = points.length - 1; i >= 0; i--) c.lineTo(points[i].x, points[i].y + points[i].w / 2);
    c.closePath();
    c.fillStyle = withAlpha(color, alpha);
    c.fill();
  };
  const blossom = (c, x, y, r, fill, stroke) => {
    for (let k = 0; k < 5; k++) {
      const angle = (k / 5) * Math.PI * 2 - Math.PI / 2;
      c.beginPath();
      c.ellipse(x + Math.cos(angle) * r * 0.62, y + Math.sin(angle) * r * 0.62, r * 0.55, r * 0.4, angle, 0, Math.PI * 2);
      c.fillStyle = fill;
      c.fill();
      if (stroke) {
        c.strokeStyle = stroke;
        c.lineWidth = 0.6;
        c.stroke();
      }
    }
  };
  // 刀身轮廓：尺身 + 斜切的刀尖（上沿比下沿长）
  const bladeOutline = (c) => {
    c.beginPath();
    c.moveTo(62, 16.5);
    c.lineTo(254, 16.5);
    c.lineTo(246, 23.5);
    c.lineTo(62, 23.5);
    c.closePath();
  };

  const drawBlade = (t, wind, moving) => {
    if (!bladeCtx) return;
    const c = bladeCtx;
    c.clearRect(0, 0, BLADE_W, BLADE_H);
    // 柄头挂饰和蝴蝶结的两条飘带，先画在下面
    ribbon(c, ribbonPoints(POMMEL, t, wind, 16, 0.6, 15), colors.ribbon);
    ribbon(c, ribbonPoints({ x: BOW.x, y: BOW.y + 3 }, t, wind, 34, 1.4, 17), colors.ribbonLight);
    ribbon(c, ribbonPoints({ x: BOW.x + 1, y: BOW.y + 3 }, t, wind, 46, 0, 13), colors.ribbon);
    // 刀柄：太刀缠法——粉色缠绳打底，绳交叉之间露出一个个白色菱形窗
    c.fillStyle = colors.blade;
    c.fillRect(10, 16.5, 48, 7);
    c.fillStyle = colors.shine;
    for (let x = 13; x < 58; x += 6) {
      c.beginPath();
      c.moveTo(x, 17.6);
      c.lineTo(x + 2.2, 20);
      c.lineTo(x, 22.4);
      c.lineTo(x - 2.2, 20);
      c.closePath();
      c.fill();
    }
    c.strokeStyle = withAlpha(colors.ribbon, 0.5);
    c.lineWidth = 0.8;
    c.strokeRect(10, 16.5, 48, 7);
    // 柄头：红色，左头一道银扣
    c.fillStyle = colors.ribbon;
    c.beginPath();
    if (typeof c.roundRect === "function") c.roundRect(3, 15.5, 8, 9, 2);
    else c.rect(3, 15.5, 8, 9);
    c.fill();
    c.fillStyle = colors.metal;
    c.fillRect(2, 17.5, 2.6, 5);
    // 刀身：白色尺身，下沿粉色带和白色刻度，根部一朵小樱花
    bladeOutline(c);
    c.fillStyle = colors.shine;
    c.fill();
    c.beginPath();
    c.moveTo(62, 20.2);
    c.lineTo(249.8, 20.2);
    c.lineTo(246, 23.5);
    c.lineTo(62, 23.5);
    c.closePath();
    c.fillStyle = colors.blade;
    c.fill();
    c.fillStyle = withAlpha(colors.shine, 0.95);
    for (let x = 70, n = 0; x < 240; x += 4, n++) c.fillRect(x, 20.2, 0.8, n % 5 === 0 ? 2.4 : 1.3);
    blossom(c, 74, 18.3, 2.6, withAlpha(colors.blade, 0.75));
    bladeOutline(c);
    c.strokeStyle = withAlpha(colors.blade, 0.6);
    c.lineWidth = 0.8;
    c.stroke();
    // 每 6 秒一道反光从刀根扫到刀尖
    const sweep = moving ? (t % 6) / 0.8 : 2;
    if (sweep < 1) {
      c.save();
      bladeOutline(c);
      c.clip();
      const sx = 62 + sweep * 200;
      c.fillStyle = withAlpha(colors.shine, 0.85);
      c.beginPath();
      c.moveTo(sx, 15);
      c.lineTo(sx + 7, 15);
      c.lineTo(sx + 1, 25);
      c.lineTo(sx - 6, 25);
      c.closePath();
      c.fill();
      c.restore();
    }
    // 护手：粉色大蝴蝶结，两只耳一上一下，结上一朵白樱花
    c.fillStyle = withAlpha(colors.ribbonLight, 0.96);
    c.strokeStyle = withAlpha(colors.ribbon, 0.9);
    c.lineWidth = 1;
    for (const [x, y] of [[56.5, 10.5], [63.5, 29.5]]) {
      c.beginPath();
      c.ellipse(x, y, 4.6, 8, -0.45, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
    blossom(c, BOW.x, BOW.y, 5.2, colors.shine, withAlpha(colors.ribbon, 0.6));
    c.fillStyle = colors.blade;
    c.beginPath();
    c.arc(BOW.x, BOW.y, 1.4, 0, Math.PI * 2);
    c.fill();
  };

  const draw = (t, dt, moving) => {
    ctx.clearRect(0, 0, width, height);
    const wind = moving ? gust(t) : 0;
    drawBlade(moving ? t : 0, wind, moving);
    ctx.fillStyle = colors.petal;
    for (const petal of petals) {
      if (moving) stepPetal(petal, dt, wind, width, height, random);
      ctx.save();
      ctx.globalAlpha = petal.alpha;
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.spin * 0.5);
      // 翻转：横向缩放跟着转，看着像在风里打转
      ctx.scale((petal.size / 10) * (0.35 + 0.65 * Math.abs(Math.cos(petal.spin))), petal.size / 10);
      ctx.fill(paths.petal);
      ctx.restore();
    }
  };

  const tick = (now) => {
    if (stopped) return;
    if (!canvas.isConnected) return stop();
    const t = now / 1000;
    const dt = last ? Math.min(0.05, t - last) : 0;
    last = t;
    draw(t, dt, true);
    frame = win.requestAnimationFrame(tick);
  };

  const drawStill = () => draw(0, 0, false);
  const start = () => {
    win.cancelAnimationFrame(frame);
    last = 0;
    if (reduce?.matches) drawStill();
    else frame = win.requestAnimationFrame(tick);
  };

  // 夜晚主题切换（html 的 class 变了）时重新读颜色
  const themeWatch = new win.MutationObserver(() => {
    colors = readColors(welcome, win);
    if (reduce?.matches) drawStill();
  });
  const sizeWatch = new win.ResizeObserver(() => {
    resize();
    if (reduce?.matches) drawStill();
  });
  const onMotionChange = () => start();

  function stop() {
    if (stopped) return;
    stopped = true;
    win.cancelAnimationFrame(frame);
    themeWatch.disconnect();
    sizeWatch.disconnect();
    reduce?.removeEventListener?.("change", onMotionChange);
  }

  resize();
  resizeBlade();
  themeWatch.observe(doc.documentElement, { attributes: true, attributeFilter: ["class"] });
  sizeWatch.observe(welcome);
  reduce?.addEventListener?.("change", onMotionChange);
  start();
  return stop;
}
