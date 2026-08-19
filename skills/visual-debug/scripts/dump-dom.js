/** 在已打开的页面里 eval。不要改字段名。把返回的 JSON 写入文件后交给 `tkt vision assert --dom`。 */
(function dumpVisionDom() {
  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  const pct = (n, b) => Math.round((n / b) * 1000) / 10
  const nodes = [...document.querySelectorAll('[data-vision]')].map((el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      id: el.getAttribute('data-vision'),
      bbox: [pct(r.x, vw), pct(r.y, vh), pct(r.width, vw), pct(r.height, vh)],
      color: cs.color,
      bg: cs.backgroundColor,
      fontPx: parseFloat(cs.fontSize),
    }
  })
  return JSON.stringify({
    viewport: { w: vw, h: vh },
    baseFontPx: parseFloat(getComputedStyle(document.body).fontSize),
    nodes,
  })
})()
