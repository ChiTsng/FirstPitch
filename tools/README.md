# tools/

视觉迭代用的截图工具。不参与构建，也不打进产物。

## 为什么是无头 Chrome

浏览器扩展截图依赖窗口可见：Chrome 窗口一旦最小化或被别的窗口盖住，
`document.visibilityState` 变成 `hidden`、`requestAnimationFrame` 停摆，
截图请求就会一直等到超时。无头实例没有这个问题，而且能模拟
`prefers-color-scheme`、`prefers-reduced-motion` 和手机视口 —— 正好是这个项目要反复验的三件事。

## 起一个调试实例

```sh
"C:/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless=new --remote-debugging-port=9333 \
  --user-data-dir="$TMP/bm-cdp" --hide-scrollbars about:blank
```

端口可以用环境变量 `BM_CDP_PORT` 改。

## 用法

```sh
npm run dev                                  # 另开一个 shell，默认 5175

node tools/shots.mjs shots/b1                # 整套基线图
node tools/shots.mjs shots/b1 --only=04,17   # 只补拍其中几张

node tools/shot.mjs http://127.0.0.1:5175/#/quiz out.png --scheme=light
node tools/shot.mjs http://127.0.0.1:5175/#/ out.png --to=#layer-3 --full

node tools/probe.mjs http://127.0.0.1:5175/#/ \
  'JSON.stringify(document.querySelector(".field").getBoundingClientRect())'

node tools/motion-check.mjs                  # 球、镜头、离屏暂停、减少动态效果的回归检查
node tools/hit-check.mjs                     # 标题击球：棒球接触、碰撞停顿、速度、键盘与单击重打
```

`--to` 传的是 **CSS 选择器**，不是 URL 锚点 —— 本站用 hash 路由，锚点位置被路由占了。
