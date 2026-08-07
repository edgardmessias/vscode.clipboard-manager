import type { ButtonHTMLAttributes, SVGProps } from "react";

type IconName =
  | "paste"
  | "copy"
  | "file"
  | "remove"
  | "clear"
  | "chevron"
  | "search"
  | "settings"
  | "history";

type IconConfig = {
  viewBox?: string;
  strokeWidth?: number;
  children: SVGProps<SVGSVGElement>["children"];
};

const paths: Record<IconName, IconConfig> = {
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
  settings: {
    viewBox: "0 0 24 24",
    strokeWidth: 2,
    children: (
      <>
        <path d="M10.255 4.18806C9.84269 5.17755 8.68655 5.62456 7.71327 5.17535C6.10289 4.4321 4.4321 6.10289 5.17535 7.71327C5.62456 8.68655 5.17755 9.84269 4.18806 10.255C2.63693 10.9013 2.63693 13.0987 4.18806 13.745C5.17755 14.1573 5.62456 15.3135 5.17535 16.2867C4.4321 17.8971 6.10289 19.5679 7.71327 18.8246C8.68655 18.3754 9.84269 18.8224 10.255 19.8119C10.9013 21.3631 13.0987 21.3631 13.745 19.8119C14.1573 18.8224 15.3135 18.3754 16.2867 18.8246C17.8971 19.5679 19.5679 17.8971 18.8246 16.2867C18.3754 15.3135 18.8224 14.1573 19.8119 13.745C21.3631 13.0987 21.3631 10.9013 19.8119 10.255C18.8224 9.84269 18.3754 8.68655 18.8246 7.71327C19.5679 6.10289 17.8971 4.4321 16.2867 5.17535C15.3135 5.62456 14.1573 5.17755 13.745 4.18806C13.0987 2.63693 10.9013 2.63693 10.255 4.18806Z" />
        <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" />
      </>
    ),
  },
  history: {
    children: (
      <>
        <path d="M6 4.5h7" />
        <path d="M6 8h7" />
        <path d="M6 11.5h5" />
        <circle cx="3.75" cy="4.5" r="0.75" fill="currentColor" stroke="none" />
        <circle cx="3.75" cy="8" r="0.75" fill="currentColor" stroke="none" />
        <circle cx="3.75" cy="11.5" r="0.75" fill="currentColor" stroke="none" />
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
  const { children, viewBox = "0 0 16 16", strokeWidth = 1.2 } = paths[name];
  return (
    <svg
      className={className}
      viewBox={viewBox}
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
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
