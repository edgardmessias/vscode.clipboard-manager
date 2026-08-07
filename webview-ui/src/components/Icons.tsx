import type { ButtonHTMLAttributes, SVGProps } from "react";

type IconName =
  | "paste"
  | "copy"
  | "file"
  | "remove"
  | "clear"
  | "chevron"
  | "search";

const paths: Record<IconName, SVGProps<SVGSVGElement>> = {
  paste: {
    children: (
      <>
        <path d="M4 2.5h6l1.5 1.5V11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" />
        <path d="M7 2.5V1.8A.8.8 0 0 1 7.8 1h3.4a.8.8 0 0 1 .8.8v.7" />
        <path d="M5.5 6.5h4M5.5 8.5h4" />
      </>
    ),
  },
  copy: {
    children: (
      <>
        <rect x="4.5" y="4.5" width="7" height="7" rx="1" />
        <path d="M3.5 9.5V4.8a1.3 1.3 0 0 1 1.3-1.3H9" />
      </>
    ),
  },
  file: {
    children: (
      <>
        <path d="M5 2.5h4l2 2V12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" />
        <path d="M9 2.5V5h2.5" />
      </>
    ),
  },
  remove: {
    children: <path d="M4.5 4.5l6 6m0-6-6 6" />,
  },
  clear: {
    children: (
      <>
        <path d="M4.5 5.5h8" />
        <path d="M6 5.5V4.2a.7.7 0 0 1 .7-.7h3.6a.7.7 0 0 1 .7.7V5.5" />
        <path d="M6.2 8v3.3M9.8 8v3.3" />
        <path d="M5.2 12h6.6a.8.8 0 0 0 .8-.8V6H4.4v5.2a.8.8 0 0 0 .8.8Z" />
      </>
    ),
  },
  chevron: {
    children: <path d="M5 7.5 8 10.5 11 7.5" />,
  },
  search: {
    children: (
      <>
        <circle cx="7" cy="7" r="3.5" />
        <path d="m10 10 2.5 2.5" />
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
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
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
  className,
  ...props
}: {
  icon: IconName;
  label: string;
  primary?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`icon-btn${primary ? " icon-btn-primary" : ""}${className ? ` ${className}` : ""}`}
      title={label}
      aria-label={label}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}
