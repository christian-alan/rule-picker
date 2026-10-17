const NUMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// Odometer: each column is a 0–9 strip that springs to its digit.
// While the value is changing the whole readout blurs a touch.
export default function Digits({ value, width = 2, rolling }) {
  const str = String(value).padStart(width, '0')

  return (
    <div className={`digits flex h-7 overflow-hidden ${rolling ? 'blur-[2.4px]' : 'blur-0'}`}>
      {str.split('').map((ch, i) => (
        <div
          key={i}
          className="roll flex w-3.5 flex-col"
          style={{ transform: `translateY(${-Number(ch) * 28}px)` }}
        >
          {NUMS.map((n) => (
            <span key={n} className="digit block h-7 text-center text-[23px] leading-7 font-bold tracking-[-0.01em] tabular-nums">
              {n}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
