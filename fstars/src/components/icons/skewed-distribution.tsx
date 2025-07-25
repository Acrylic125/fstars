import * as React from "react";

const SkewedDistributionIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 48"
    fill="none"
    {...props}
  >
    <path fill="#FDC700" stroke="currentColor" d="M.5.5h15v47H.5z" />
    <path fill="#00BCFF" stroke="currentColor" d="M15.5 16.5h15v31h-15z" />
    <path fill="#FF6467" stroke="currentColor" d="M45.5 32.5h15v15h-15z" />
    <path fill="#05DF72" stroke="currentColor" d="M30.5 26.5h15v21h-15z" />
  </svg>
);
export default SkewedDistributionIcon;
