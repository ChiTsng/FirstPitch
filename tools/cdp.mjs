// 无头 Chrome 的 CDP 连接封装，tools/shot.mjs 与 tools/shots.mjs 共用。
//
// 为什么不用浏览器扩展截图：用户的 Chrome 窗口一旦最小化或被遮挡，
// visibilityState 变成 hidden、rAF 停摆，扩展就永远等不到一帧。
// 无头实例没有这个问题，而且能模拟 prefers-color-scheme / prefers-reduced-motion。
//
// 需要先起一个带调试端口的实例，见 tools/README.md。

export const DEFAULT_PORT = Number(process.env.BM_CDP_PORT || 9333);

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function connect(port = DEFAULT_PORT) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error(`端口 ${port} 上没有可用的 page target`);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = () => rej(new Error(`CDP WebSocket 连不上（端口 ${port}）`));
  });

  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    }
  };

  const send = (method, params = {}) => {
    const msgId = ++id;
    ws.send(JSON.stringify({ id: msgId, method, params }));
    return new Promise((res, rej) => pending.set(msgId, { res, rej }));
  };

  await send('Page.enable');
  return { send, close: () => ws.close() };
}

// 在页面里求值并取回结果。
export async function evaluate(send, expression) {
  const { result, exceptionDetails } = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(JSON.stringify(exceptionDetails));
  return result.value;
}

// 截一张图，返回 PNG buffer。每次都重设视口，所以整页长截图不会污染下一张。
export async function capture(send, opt) {
  const {
    url,
    w = 1440,
    h = 900,
    scheme = 'dark',
    motion = 'no-preference',
    mobile = false,
    to = '',
    click = '',
    wait = 1400,
    settle = 2600,
    full = false,
  } = opt;

  await send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: scheme },
      { name: 'prefers-reduced-motion', value: motion },
    ],
  });
  await send('Emulation.setDeviceMetricsOverride', {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile,
  });

  // 本站是 hash 路由：导航到同一个 URL 或只改 hash 都不会重新加载文档，
  // 于是上一张图的滚动位置和点开的状态会带到下一张图里。
  // 加一个一次性的 query 参数强制整页重载。
  const [base, hash = ''] = url.split('#');
  const sep = base.includes('?') ? '&' : '?';
  await send('Page.navigate', { url: `${base}${sep}_=${Date.now()}${hash ? '#' + hash : ''}` });
  await sleep(wait);

  if (click) {
    await evaluate(send, `document.querySelector(${JSON.stringify(click)})?.click()`);
    // 首页开场是全站最长的一段动效，等它跑完
    await sleep(settle);
  }

  // to 是 CSS 选择器，不是 URL hash —— 本站用 hash 路由，锚点只能这样滚。
  if (to) {
    await evaluate(
      send,
      `document.querySelector(${JSON.stringify(to)})?.scrollIntoView({block:'start',behavior:'instant'});` +
        `window.scrollBy(0,-90);`,
    );
    await sleep(700);
  }

  let clip;
  if (full) {
    const height = Math.min(await evaluate(send, 'document.documentElement.scrollHeight'), 12000);
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
    await sleep(500);
    clip = { x: 0, y: 0, width: w, height, scale: 1 };
  }

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    ...(clip ? { clip, captureBeyondViewport: true } : {}),
  });
  return Buffer.from(shot.data, 'base64');
}
