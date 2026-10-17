import { useCallback, useEffect, useRef, useState } from 'react'
import Digits from './Digits'
import Mascot from './Mascot'
import { FUZZIES } from '../lib/fuzzies'

/*
 * Geometry (px) inside a 560×320 box:
 *   mascot 84×105 at (238, 5), feet on the pill's top edge
 *   pill   96×58  at (232, 90), stem 6px down to y=308
 *   ticks  4px wide, 17px apart, bottoms on y=253, 22–56px tall by distance from the pin
 */
const W = 560
const SP = 17
const CX = W / 2
const BASE = 253
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const clampTo = (v, min, max) => Math.min(max, Math.max(min, v))
const rubber = (x) => 2.2 * (1 - 1 / (x * 0.3 + 1))

export default function RulerPicker({ variant, min = 1, max = 30, start = 1, initialFuzzy = 0 }) {
  const glass = variant === 'glass'
  const clamp = useCallback((v) => clampTo(v, min, max), [min, max])

  const [pos, setPosState] = useState(start)
  const [val, setVal] = useState(start)
  const [vel, setVel] = useState(0)
  const [rolling, setRolling] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [happy, setHappy] = useState(false)
  const [blink, setBlink] = useState(false)
  const [focus, setFocus] = useState(false)
  const [fi, setFi] = useState(initialFuzzy)
  const [spin, setSpin] = useState(0)

  const posRef = useRef(start)
  const valRef = useRef(start)
  const raf = useRef(0)
  const drag = useRef(null)
  const timers = useRef({})
  const swapping = useRef(false)
  const surface = useRef(null)

  const later = useCallback((key, ms, fn) => {
    clearTimeout(timers.current[key])
    timers.current[key] = setTimeout(fn, ms)
  }, [])

  const setPos = useCallback(
    (p, v = 0) => {
      posRef.current = p
      setPosState(p)
      setVel(v)
      const next = clamp(Math.round(p))
      if (next !== valRef.current) {
        valRef.current = next
        setVal(next)
        setRolling(true)
        later('roll', 190, () => setRolling(false))
      }
    },
    [clamp, later],
  )

  const cheer = useCallback(
    (ms) => {
      setHappy(true)
      later('happy', ms, () => setHappy(false))
    },
    [later],
  )

  // Under-damped spring: carries a fling a little past and settles on a whole tick.
  const springTo = useCallback(
    (target, v0 = 0, withCheer = false) => {
      cancelAnimationFrame(raf.current)
      if (reduced()) {
        setPos(target)
        return
      }
      let x = posRef.current
      let v = v0
      let last = performance.now()
      const step = (now) => {
        const dt = Math.min(0.032, (now - last) / 1000)
        last = now
        v += (-230 * (x - target) - 26 * v) * dt
        x += v * dt
        if (Math.abs(x - target) < 0.002 && Math.abs(v) < 0.02) {
          setPos(target)
          if (withCheer) cheer(650)
          return
        }
        setPos(x, v)
        raf.current = requestAnimationFrame(step)
      }
      raf.current = requestAnimationFrame(step)
    },
    [setPos, cheer],
  )

  // Blink every few seconds while resting.
  useEffect(() => {
    const t = setInterval(() => {
      if (drag.current) return
      setBlink(true)
      setTimeout(() => setBlink(false), 140)
    }, 3400)
    const all = timers.current
    return () => {
      clearInterval(t)
      cancelAnimationFrame(raf.current)
      Object.values(all).forEach(clearTimeout)
    }
  }, [])

  // Trackpad or wheel scrolls the ruler, then it snaps.
  useEffect(() => {
    const el = surface.current
    const onWheel = (e) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (!d) return
      e.preventDefault()
      cancelAnimationFrame(raf.current)
      const p = posRef.current + d / SP / 2
      setPos(p < min ? min - rubber(min - p) : p > max ? max + rubber(p - max) : p, d * 2)
      later('wheel', 120, () => springTo(clamp(Math.round(posRef.current)), 0, true))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [clamp, later, max, min, setPos, springTo])

  const onPointerDown = (e) => {
    cancelAnimationFrame(raf.current)
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    drag.current = {
      x0: e.clientX,
      p0: posRef.current,
      lx: e.clientX,
      lt: performance.now(),
      v: 0,
      moved: false,
      s: rect.width / W || 1,
      left: rect.left,
    }
    clearTimeout(timers.current.happy)
    setHappy(false)
    setDragging(true)
  }

  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.x0) / d.s
    if (Math.abs(dx) > 3) d.moved = true
    let raw = d.p0 - dx / SP
    if (raw < min) raw = min - rubber(min - raw)
    if (raw > max) raw = max + rubber(raw - max)
    const now = performance.now()
    const inst = (-(e.clientX - d.lx) / d.s / SP / Math.max(1, now - d.lt)) * 1000
    d.v = d.v * 0.6 + inst * 0.4
    d.lx = e.clientX
    d.lt = now
    setPos(raw, d.v)
  }

  const onPointerUp = (e) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    setDragging(false)
    if (!d.moved) {
      // A tap jumps to the tick under the finger.
      const off = ((e.clientX - d.left) / d.s - CX) / SP
      springTo(clamp(Math.round(posRef.current + off)), 0, true)
      return
    }
    const v = performance.now() - d.lt > 80 ? 0 : d.v
    springTo(clamp(Math.round(posRef.current + v * 0.12)), v, true)
  }

  const swap = () => {
    if (swapping.current) return
    swapping.current = true
    setSpin((s) => s + 1)
    setTimeout(() => setFi((i) => (i + 1) % FUZZIES.length), 160)
    setTimeout(() => {
      swapping.current = false
      cheer(700)
    }, 560)
  }

  // Ticks within reach of the pin.
  const ticks = []
  for (let v = min; v <= max; v++) {
    const ad = Math.abs(v - pos)
    if (ad > 16) continue
    const h = 22 + 34 * Math.max(0, 1 - ad / 13)
    ticks.push(
      <span
        key={v}
        className="tick absolute w-1 rounded-full"
        style={{
          left: CX + (v - pos) * SP - 2,
          top: BASE - h,
          height: h,
          opacity: clampTo((15.5 - ad) / 6, 0, 1),
        }}
      />,
    )
  }

  const fuzzy = FUZZIES[fi]
  const overEdge = pos < min - 0.08 || pos > max + 0.08
  const mood = overEdge ? 'needs' : happy ? 'ready' : dragging && Math.abs(vel) > 10 ? 'working' : 'idle'
  const lean = dragging ? clampTo(-vel * 0.45, -14, 14) : 0
  const sq = glass ? Math.min(1, Math.abs(vel) / 35) : 0
  const squish = `scale(${1 + 0.09 * sq}, ${1 - 0.07 * sq})`

  return (
    <div className="ruler relative h-[320px] w-[560px] select-none" style={{ '--fz': fuzzy.color }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {ticks}
      </div>

      {glass ? (
        <>
          <span aria-hidden="true" className="rod pointer-events-none absolute left-[277px] top-[140px] h-[168px] w-1.5 rounded-full" />
          <span
            aria-hidden="true"
            className="capsule pointer-events-none absolute left-[232px] top-[90px] h-[58px] w-24 origin-bottom rounded-full"
            style={{ transform: squish }}
          >
            <span className="spec" />
          </span>
        </>
      ) : (
        <svg
          aria-hidden="true"
          width="96"
          height="218"
          viewBox="0 0 96 218"
          className="pin pointer-events-none absolute left-[232px] top-[90px] overflow-visible"
        >
          <path d="M26 0H70A26 26 0 0 1 96 26V32A26 26 0 0 1 70 58H58Q51 58 51 65V215A3 3 0 0 1 45 215V65Q45 58 38 58H26A26 26 0 0 1 0 32V26A26 26 0 0 1 26 0Z" />
          <path d="M26 1.2H70A24.8 24.8 0 0 1 94.8 26" className="pin-hi" />
        </svg>
      )}

      {focus && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[227px] top-[85px] h-[68px] w-[106px] rounded-full ring-2 ring-[var(--ring)]"
        />
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[232px] top-[90px] flex h-[58px] w-24 origin-bottom items-center justify-center"
        style={{ transform: squish }}
      >
        <Digits value={val} width={Math.max(2, String(max).length)} rolling={rolling} />
      </div>

      {/* Drag the ruler, or tap a tick */}
      <div
        ref={surface}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`absolute inset-0 touch-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      />

      {/* The fuzzy riding the pin: tap to swap */}
      <button
        type="button"
        onClick={swap}
        aria-label={`${fuzzy.name}. Change mascot`}
        className="mascot absolute left-[238px] top-[5px] h-[86px] w-[84px] cursor-pointer rounded-3xl [perspective:400px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]"
      >
        <span className="lean block h-[105px] w-[84px]" style={{ transform: `translateY(${rolling ? -5 : 0}px) rotate(${lean}deg)` }}>
          <span className="spin block h-[105px] w-[84px]" style={{ transform: `rotateY(${spin * 360}deg)` }}>
            <span className="press block h-[105px] w-[84px]">
              <Mascot fuzzy={fuzzy} mood={mood} blink={blink && mood !== 'ready'} look={clampTo(-vel / 7, -3, 3)} />
            </span>
          </span>
        </span>
      </button>

      <label htmlFor="ruler-value" className="sr-only">
        Value
      </label>
      <input
        id="ruler-value"
        type="range"
        className="sr-only"
        min={min}
        max={max}
        step={1}
        value={val}
        onChange={(e) => springTo(Number(e.target.value))}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
    </div>
  )
}
