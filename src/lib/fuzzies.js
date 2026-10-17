// The fuzzies, from the Agent Manager cast: one body recipe, varied by
// colour and by how fluffy or spiky the outline is.

export const FUZZIES = [
  { id: 'sprout', name: 'Sprout', color: '#9fc8f3', n: 13, amp: 0.13, rx: 38, ry: 35, seed: 3 },
  { id: 'bloom', name: 'Bloom', color: '#c3b2f8', n: 8, amp: 0.2, rx: 38, ry: 36, seed: 7 },
  { id: 'pop', name: 'Pop', color: '#ffadc9', n: 22, amp: 0.16, rx: 37, ry: 35, seed: 11, spiky: true },
  { id: 'dash', name: 'Dash', color: '#8fdace', n: 16, amp: 0.07, rx: 36, ry: 36, seed: 5 },
  { id: 'clover', name: 'Clover', color: '#b3df8f', n: 10, amp: 0.17, rx: 39, ry: 34, seed: 2 },
  { id: 'tile', name: 'Tile', color: '#ffbf94', n: 12, amp: 0.12, rx: 33, ry: 39, seed: 9 },
  { id: 'keys', name: 'Keys', color: '#f8d77a', n: 14, amp: 0.1, rx: 41, ry: 32, seed: 4 },
  { id: 'rover', name: 'Rover', color: '#ffa597', n: 18, amp: 0.12, rx: 37, ry: 34, seed: 8, spiky: true },
]

function rand(seed) {
  let x = seed * 9301 + 49297
  return () => {
    x = (x * 9301 + 49297) % 233280
    return x / 233280
  }
}

function body(o) {
  const rnd = rand(o.seed)
  const cx = 60
  const cy = 62
  const pt = (a, k) => [cx + Math.cos(a) * o.rx * k, cy + Math.sin(a) * o.ry * k]
  const inner = []
  const outer = []
  for (let i = 0; i < o.n; i++) {
    const a0 = (i / o.n) * Math.PI * 2 - Math.PI / 2
    const a1 = ((i + 0.5) / o.n) * Math.PI * 2 - Math.PI / 2
    outer.push(pt(a0, 1 + o.amp * (0.6 + rnd() * 0.8)))
    inner.push(pt(a1, 1 - o.amp * 0.35))
  }
  const f = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`
  let d = `M${f(inner[o.n - 1])}`
  for (let i = 0; i < o.n; i++) d += o.spiky ? ` L${f(outer[i])} L${f(inner[i])}` : ` Q${f(outer[i])} ${f(inner[i])}`
  return `${d}Z`
}

for (const f of FUZZIES) f.d = body(f)

// Arms and mouth per mood, in the 120×150 mascot viewBox.
export const ARMS = {
  idle: 'M25 70 Q15 78 17 90 M95 70 Q105 78 103 90',
  working: 'M27 74 Q24 88 38 90 M93 74 Q96 88 82 90',
  ready: 'M25 62 Q13 50 17 34 M17 34 l-4 -5 M17 34 l1 -6 M17 34 l5 -4 M95 62 Q107 50 103 34 M103 34 l4 -5 M103 34 l-1 -6 M103 34 l-5 -4',
  needs: 'M25 66 Q11 60 9 46 M95 66 Q109 60 111 46',
}

export const MOUTH = {
  idle: ['M55 70 Q60 75 65 70', 'none'],
  working: ['M56 72 H64', 'none'],
  needs: ['M60 68.5 a3 3.6 0 1 0 0.01 0', 'currentColor'],
  ready: ['M54 69 Q60 77 66 69 Z', 'currentColor'],
}
