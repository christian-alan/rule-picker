import { useId } from 'react'
import { ARMS, MOUTH } from '../lib/fuzzies'

/*
 * One fuzzy, drawn in a 120×150 box. Its mood carries the status:
 *   idle    — resting, blinks now and then
 *   working — dragged fast: focused mouth, hands in
 *   needs   — pulled past either end: wide eyes, arms out
 *   ready   — landed on a value: happy eyes, arms up
 */
export default function Mascot({ fuzzy, mood, look = 0, blink = false }) {
  const fid = useId().replace(/:/g, '')
  const open = mood !== 'ready' && !blink
  const arc =
    mood === 'ready'
      ? 'M44 59 Q49 52 54 59 M66 59 Q71 52 76 59'
      : blink
        ? 'M44 57 Q49 61.5 54 57 M66 57 Q71 61.5 76 57'
        : ''
  const [mouth, mouthFill] = MOUTH[mood]
  const r = mood === 'needs' ? 9.8 : 8.6
  const py = mood === 'needs' ? 55.6 : 57

  return (
    <svg width="84" height="105" viewBox="0 0 120 150" aria-hidden="true" className="block overflow-visible text-[#2f2a3a]">
      <defs>
        <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={fuzzy.seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g className="limb" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M52 94 V117 M68 94 V117" />
      </g>
      <ellipse cx="49" cy="120" rx="8" ry="4.6" fill="#fff" stroke="#3a3346" strokeWidth="2.4" />
      <ellipse cx="71" cy="120" rx="8" ry="4.6" fill="#fff" stroke="#3a3346" strokeWidth="2.4" />
      <path className="limb" d={ARMS[mood]} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      <path className="fz-body" d={fuzzy.d} filter={`url(#${fid})`} />

      <g opacity={open ? 1 : 0}>
        <circle cx="49" cy="57" r={r} fill="#fff" />
        <circle cx="71" cy="57" r={r} fill="#fff" />
        <circle cx={49 + look} cy={py} r="4.4" fill="currentColor" />
        <circle cx={71 + look} cy={py} r="4.4" fill="currentColor" />
      </g>
      <path d={arc} stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d={mouth} stroke="currentColor" strokeWidth="2.4" fill={mouthFill} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
