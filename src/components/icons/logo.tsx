import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5.2c2.4 0 4.7.9 6.5 2.5" />
      <path d="M12 5.2C9.6 5.2 7.3 6.1 5.5 7.7" />
      <path d="M18.5 10.2C20.1 12 21 14.4 21 17" />
      <path d="M5.5 10.2C3.9 12 3 14.4 3 17" />
      <path d="M12 10.2c-2.4 0-4.7.9-6.5 2.5" />
      <path d="M12 10.2c2.4 0 4.7.9 6.5 2.5" />
      <path d="M12 15.2c-2.4 0-4.7.9-6.5 2.5" />
      <path d="M12 15.2c2.4 0 4.7.9 6.5 2.5" />
      <path d="M12 21a.2.2 0 0 0 .2-.2v-2.6a.2.2 0 0 0-.2-.2.2.2 0 0 0-.2.2v2.6a.2.2 0 0 0 .2.2z" />
    </svg>
  );
}
