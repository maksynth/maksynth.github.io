// Project wrapper around React Bits Warm Tooltip with the site's monochrome colors.
// Used to name icon-only buttons: the tooltip text matches the button's aria-label,
// so it does not add aria-describedby (describe={false}).
import type { ReactElement } from 'react';
import WarmTooltip, { type WarmTooltipSide } from './reactbits/WarmTooltip';

interface TipProps {
  text: string;
  side?: WarmTooltipSide;
  children: ReactElement<Record<string, unknown>>;
}

export default function Tip({ text, side = 'top', children }: TipProps) {
  return (
    <WarmTooltip
      content={text}
      side={side}
      describe={false}
      surfaceColor="var(--ink)"
      inkColor="var(--on-ink)"
      size="sm"
      radius={8}
      arrow={false}
      popBlur={0}
    >
      {children}
    </WarmTooltip>
  );
}
