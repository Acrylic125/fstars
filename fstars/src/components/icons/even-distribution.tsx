import * as React from "react";

const EvenDistributionIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    fill="none"
    {...props}
  >
    <path fill="#FDC700" stroke="currentColor" d="M.5 20.5h15v27H.5z" />
    <path fill="#00BCFF" stroke="currentColor" d="M15.5 20.5h15v27h-15z" />
    <path fill="#FF6467" stroke="currentColor" d="M45.5 20.5h15v27h-15z" />
    <path fill="#05DF72" stroke="currentColor" d="M30.5 20.5h15v27h-15z" />
  </svg>
);
export default EvenDistributionIcon;
