// Font Awesome Free 7 (Classic Solid) icons, imported by name from the official
// @fortawesome/free-solid-svg-icons package (e.g. faDownload). This small renderer
// draws an icon definition as inline SVG, which avoids shipping the Font Awesome
// runtime to the browser. Icons are decorative by default (hidden from assistive
// technology); buttons that show only an icon carry their own aria-label.
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface Props {
  icon: IconDefinition;
  className?: string;
}

export function FontAwesomeIcon({ icon, className = '' }: Props) {
  const [width, height, , , data] = icon.icon;
  const layers = Array.isArray(data) ? data : [data];
  return (
    <svg
      className={`svg-inline--fa fa-${icon.iconName}${className ? ` ${className}` : ''}`}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      {layers.map((d, i) => <path key={i} fill="currentColor" d={d} />)}
    </svg>
  );
}
