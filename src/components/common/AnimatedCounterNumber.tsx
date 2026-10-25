import React, { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'motion/react';

export interface AnimatedCounterNumberProps {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  useLocale?: boolean;
  className?: string;
}

export const AnimatedCounterNumber: React.FC<AnimatedCounterNumberProps> = ({
  from = 0,
  to,
  duration = 2,
  decimals = 0,
  prefix = '',
  suffix = '',
  useLocale = false,
  className = '',
}) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: '-50px' });

  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => {
    const val = Number(latest).toFixed(decimals);
    const formatted = useLocale
      ? Number(val).toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : val;
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, to, {
        duration,
        ease: [0.16, 1, 0.3, 1],
      });
      return controls.stop;
    }
  }, [isInView, count, to, duration]);

  return (
    <motion.span ref={nodeRef} className={className}>
      {rounded}
    </motion.span>
  );
};
