// Seller badge: house with SOLD sign
export function SellersBadge() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Circular double-ring border */}
      <circle cx="24" cy="24" r="22" fill="#C9A227" />
      <circle cx="24" cy="24" r="20" fill="none" stroke="#0B1426" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="#0B1426" strokeWidth="1" />

      {/* House silhouette */}
      <g>
        {/* Peaked roof */}
        <path
          d="M 14 26 L 24 14 L 34 26"
          stroke="#0B1426"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Main house body */}
        <rect
          x="14"
          y="26"
          width="20"
          height="12"
          stroke="#0B1426"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Door */}
        <rect
          x="21"
          y="29"
          width="6"
          height="9"
          stroke="#0B1426"
          strokeWidth="1.2"
          fill="none"
        />

        {/* Door handle */}
        <circle cx="26.8" cy="33.5" r="0.7" fill="#0B1426" />

        {/* Left window */}
        <rect
          x="16"
          y="28"
          width="3"
          height="3"
          stroke="#0B1426"
          strokeWidth="0.9"
          fill="none"
        />
        {/* Window pane */}
        <line x1="17.5" y1="28" x2="17.5" y2="31" stroke="#0B1426" strokeWidth="0.8" />
        <line x1="16" y1="29.5" x2="19" y2="29.5" stroke="#0B1426" strokeWidth="0.8" />

        {/* Right window */}
        <rect
          x="29"
          y="28"
          width="3"
          height="3"
          stroke="#0B1426"
          strokeWidth="0.9"
          fill="none"
        />
        {/* Window pane */}
        <line x1="30.5" y1="28" x2="30.5" y2="31" stroke="#0B1426" strokeWidth="0.8" />
        <line x1="29" y1="29.5" x2="32" y2="29.5" stroke="#0B1426" strokeWidth="0.8" />
      </g>

      {/* SOLD sign post and sign */}
      <g>
        {/* Post */}
        <line
          x1="32"
          y1="20"
          x2="32"
          y2="26"
          stroke="#0B1426"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Sign rectangle */}
        <rect
          x="28.5"
          y="16"
          width="7"
          height="4.5"
          stroke="#0B1426"
          strokeWidth="1.1"
          fill="none"
          rx="0.5"
        />

        {/* SOLD text (simplified as visual indicator) */}
        <text
          x="32"
          y="19.5"
          textAnchor="middle"
          fontSize="2.5"
          fontWeight="bold"
          fill="#0B1426"
          fontFamily="system-ui, sans-serif"
        >
          S
        </text>
      </g>
    </svg>
  );
}

// Buyer badge: vintage ornate key
export function BuyersBadge() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Circular double-ring border */}
      <circle cx="24" cy="24" r="22" fill="#C9A227" />
      <circle cx="24" cy="24" r="20" fill="none" stroke="#0B1426" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="#0B1426" strokeWidth="1" />

      {/* Vintage ornate key */}
      <g>
        {/* Key bow (head) - ornate shape */}
        <circle cx="16" cy="24" r="4.5" stroke="#0B1426" strokeWidth="1.3" fill="none" />
        {/* Ornate detail - small circles on bow */}
        <circle cx="14.2" cy="22" r="1" fill="#0B1426" />
        <circle cx="17.8" cy="22" r="1" fill="#0B1426" />
        <circle cx="15" cy="26.5" r="0.8" fill="#0B1426" />
        <circle cx="17" cy="26.5" r="0.8" fill="#0B1426" />

        {/* Key shaft */}
        <rect
          x="20"
          y="22"
          width="12"
          height="4"
          stroke="#0B1426"
          strokeWidth="1.3"
          fill="none"
        />

        {/* Key teeth (bit) - three small rectangular notches */}
        <rect
          x="32"
          y="24"
          width="2"
          height="2"
          stroke="#0B1426"
          strokeWidth="1"
          fill="none"
        />
        <rect
          x="32"
          y="20"
          width="1.5"
          height="1.5"
          stroke="#0B1426"
          strokeWidth="0.8"
          fill="none"
        />

        {/* Key bow details - crossbar for ornate look */}
        <line
          x1="13"
          y1="24"
          x2="19"
          y2="24"
          stroke="#0B1426"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}
