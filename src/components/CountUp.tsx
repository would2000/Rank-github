import { useEffect } from 'react'
import { animate, useMotionValue, useTransform, motion } from 'framer-motion'
import { compactNumber } from '../lib/format'

interface Props {
  value: number
  prefix?: string
  /** true 時用精簡格式(12.3k)，false 用千分位 */
  compact?: boolean
  className?: string
  delay?: number
}

/** 數字滾動計數——進場時從 0 緩動到目標值，呼應「狀態回饋」動效原則。 */
export function CountUp({ value, prefix = '', compact = true, className, delay = 0 }: Props) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (latest) => {
    const n = Math.round(latest)
    return prefix + (compact ? compactNumber(n) : n.toLocaleString('en-US'))
  })

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, {
      duration: 1.1,
      delay,
      ease: [0.22, 1, 0.36, 1],
    })
    return controls.stop
  }, [value, delay, mv])

  return <motion.span className={className}>{text}</motion.span>
}
