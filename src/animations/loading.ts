// Small first-party Lottie loop: three breathing dots, used only during preparation.
export default {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 60,
  w: 160,
  h: 80,
  nm: 'Preparing with care',
  ddd: 0,
  assets: [],
  layers: [0, 1, 2].map((i) => ({
    ddd: 0,
    ind: i + 1,
    ty: 4,
    nm: `dot-${i}`,
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          { t: 0, s: [25], e: [100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
          { t: 30, s: [100], e: [25], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
          { t: 60, s: [25] },
        ],
      },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [40 + i * 40, 40, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] },
    },
    ao: 0,
    shapes: [
      { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [14, 14] }, nm: 'dot' },
      { ty: 'fl', c: { a: 0, k: [0.53, 0.35, 0.3, 1] }, o: { a: 0, k: 100 }, r: 1 },
    ],
    ip: i * -12,
    op: 60,
    st: i * -12,
    bm: 0,
  })),
}
