import type { ButtonHTMLAttributes, SVGProps } from "react";

/**
 * Icons from Lucide (https://lucide.dev) — ISC License
 */
type IconName =
  | "paste"
  | "copy"
  | "file"
  | "remove"
  | "trash"
  | "clear"
  | "clearUnpinned"
  | "pin"
  | "unpin"
  | "note"
  | "eraser"
  | "ban"
  | "chevron"
  | "search"
  | "settings"
  | "history";

export type { IconName };

type IconConfig = {
  children: SVGProps<SVGSVGElement>["children"];
};

const LUCIDE_VIEWBOX = "0 0 24 24";
const LUCIDE_STROKE_WIDTH = 2;

const paths: Record<IconName, IconConfig> = {
  // https://lucide.dev/icons/clipboard-paste
  paste: {
    children: (
      <>
        <path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z" />
        <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M16 4h2a2 2 0 0 1 2 2v2M11 14h10" />
        <path d="m17 10 4 4-4 4" />
      </>
    ),
  },
  // https://lucide.dev/icons/copy
  copy: {
    children: (
      <>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </>
    ),
  },
  // https://lucide.dev/icons/file-text
  file: {
    children: (
      <>
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M10 9H8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
      </>
    ),
  },
  // https://lucide.dev/icons/x
  remove: {
    children: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
  },
  // https://lucide.dev/icons/trash-2
  clear: {
    children: (
      <>
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" x2="10" y1="11" y2="17" />
        <line x1="14" x2="14" y1="11" y2="17" />
      </>
    ),
  },
  // https://lucide.dev/icons/list-minus
  clearUnpinned: {
    children: (
      <>
        <path d="M11 12H3" />
        <path d="M16 6H3" />
        <path d="M16 18H3" />
        <path d="M21 12h-6" />
      </>
    ),
  },
  // https://lucide.dev/icons/pin-off
  unpin: {
    children: (
      <>
        <path d="M12 17v5" />
        <path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89" />
        <path d="m2 2 20 20" />
        <path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11" />
      </>
    ),
  },
  // https://lucide.dev/icons/sticky-note
  note: {
    children: (
      <>
        <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
        <path d="M15 3v4a2 2 0 0 0 2 2h4" />
      </>
    ),
  },
  // https://lucide.dev/icons/eraser
  eraser: {
    children: (
      <>
        <path d="M21 21H8a2 2 0 0 1-1.42-.59l-3.58-3.58a2 2 0 0 1 0-2.82L9.42 5.6a2 2 0 0 1 2.82 0L21 14.36" />
        <path d="m12 13 7 7" />
        <path d="M5 8 9 12" />
      </>
    ),
  },
  // https://lucide.dev/icons/ban
  ban: {
    children: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="m4.9 4.9 14.2 14.2" />
      </>
    ),
  },
  // https://lucide.dev/icons/trash-2
  trash: {
    children: (
      <>
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" x2="10" y1="11" y2="17" />
        <line x1="14" x2="14" y1="11" y2="17" />
      </>
    ),
  },
  // https://lucide.dev/icons/pin
  pin: {
    children: (
      <>
        <path d="M12 17v5" />
        <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
      </>
    ),
  },
  // https://lucide.dev/icons/chevron-down
  chevron: {
    children: <path d="m6 9 6 6 6-6" />,
  },
  // https://lucide.dev/icons/search
  search: {
    children: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
  },
  // https://lucide.dev/icons/settings
  settings: {
    children: (
      <>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  // https://lucide.dev/icons/history
  history: {
    children: (
      <>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
      </>
    ),
  },
};

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const { children } = paths[name];
  return (
    <svg
      className={className}
      viewBox={LUCIDE_VIEWBOX}
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth={LUCIDE_STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconButton({
  icon,
  label,
  primary,
  danger,
  className,
  ...props
}: {
  icon: IconName;
  label: string;
  primary?: boolean;
  danger?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`icon-btn${primary ? " icon-btn-primary" : ""}${danger ? " icon-btn-danger" : ""}${className ? ` ${className}` : ""}`}
      title={label}
      aria-label={label}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}
