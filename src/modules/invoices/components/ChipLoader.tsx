// =====================================================
// CHIP LOADER ANIMATION - COPIED FROM ZZP-WERKPLAATS-FAKTURY
// =====================================================
// Circuit board chip style loading animation
// =====================================================

const ChipLoader = () => {
  return (
    <div className="flex justify-center items-center min-h-[60vh] w-full">
      <style>{`
        .loader-container {
            width: 100%;
            max-width: 600px;
        }
        .trace-bg {
            stroke: #e2e8f0;
            stroke-width: 2;
            fill: none;
            opacity: 0.5;
        }
        .trace-flow {
            stroke-width: 2;
            fill: none;
            stroke-dasharray: 40 400;
            stroke-dashoffset: 438;
            filter: drop-shadow(0 0 4px currentColor);
            animation: chipFlow 2s cubic-bezier(0.5, 0, 0.9, 1) infinite;
        }
        .yellow { stroke: #f59e0b; color: #f59e0b; }
        .blue { stroke: #0ea5e9; color: #0ea5e9; }
        .green { stroke: #10b981; color: #10b981; }
        .purple { stroke: #8b5cf6; color: #8b5cf6; }
        .red { stroke: #f43f5e; color: #f43f5e; }

        @keyframes chipFlow {
            to { stroke-dashoffset: 0; }
        }
      `}</style>
      <div className="loader-container">
        <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="chipGradient" x1={0} y1={0} x2={0} y2={1}>
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="textGradient" x1={0} y1={0} x2={0} y2={1}>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="pinGradient" x1={1} y1={0} x2={0} y2={0}>
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          <g id="traces">
            <path d="M100 100 H200 V210 H326" className="trace-bg" />
            <path d="M100 100 H200 V210 H326" className="trace-flow purple" />
            <path d="M80 180 H180 V230 H326" className="trace-bg" />
            <path d="M80 180 H180 V230 H326" className="trace-flow blue" />
            <path d="M60 260 H150 V250 H326" className="trace-bg" />
            <path d="M60 260 H150 V250 H326" className="trace-flow yellow" />
            <path d="M100 350 H200 V270 H326" className="trace-bg" />
            <path d="M100 350 H200 V270 H326" className="trace-flow green" />
            <path d="M700 90 H560 V210 H474" className="trace-bg" />
            <path d="M700 90 H560 V210 H474" className="trace-flow blue" />
            <path d="M740 160 H580 V230 H474" className="trace-bg" />
            <path d="M740 160 H580 V230 H474" className="trace-flow green" />
            <path d="M720 250 H590 V250 H474" className="trace-bg" />
            <path d="M720 250 H590 V250 H474" className="trace-flow red" />
            <path d="M680 340 H570 V270 H474" className="trace-bg" />
            <path d="M680 340 H570 V270 H474" className="trace-flow yellow" />
          </g>

          {/* Chip Body */}
          <rect
            x={330}
            y={190}
            width={140}
            height={100}
            rx={15}
            ry={15}
            fill="url(#chipGradient)"
            stroke="#1a1a1a"
            strokeWidth={2}
            filter="drop-shadow(0 10px 20px rgba(0,0,0,0.2))"
          />

          {/* Pins Left */}
          <g>
            <rect
              x={322}
              y={205}
              width={8}
              height={10}
              fill="url(#pinGradient)"
              rx={1}
            />
            <rect
              x={322}
              y={225}
              width={8}
              height={10}
              fill="url(#pinGradient)"
              rx={1}
            />
            <rect
              x={322}
              y={245}
              width={8}
              height={10}
              fill="url(#pinGradient)"
              rx={1}
            />
            <rect
              x={322}
              y={265}
              width={8}
              height={10}
              fill="url(#pinGradient)"
              rx={1}
            />
          </g>

          {/* Pins Right */}
          <g>
            <rect
              x={470}
              y={205}
              width={8}
              height={10}
              fill="url(#pinGradient)"
              rx={1}
            />
            <rect
              x={470}
              y={225}
              width={8}
              height={10}
              fill="url(#pinGradient)"
              rx={1}
            />
            <rect
              x={470}
              y={245}
              width={8}
              height={10}
              fill="url(#pinGradient)"
              rx={1}
            />
            <rect
              x={470}
              y={265}
              width={8}
              height={10}
              fill="url(#pinGradient)"
              rx={1}
            />
          </g>

          {/* Text */}
          <text
            x={400}
            y={235}
            fontFamily="Inter, sans-serif"
            fontSize={13}
            fill="url(#textGradient)"
            textAnchor="middle"
            alignmentBaseline="middle"
            fontWeight="800"
            letterSpacing="0.5px"
          >
            ZZP WERKPLAATS
          </text>
          <text
            x={400}
            y={255}
            fontFamily="Inter, sans-serif"
            fontSize={10}
            fill="#64748b"
            textAnchor="middle"
            alignmentBaseline="middle"
            fontWeight="600"
            letterSpacing="2px"
          >
            LOADING...
          </text>

          {/* Circuit Dots */}
          <circle cx={100} cy={100} r={3} fill="#cbd5e1" />
          <circle cx={80} cy={180} r={3} fill="#cbd5e1" />
          <circle cx={60} cy={260} r={3} fill="#cbd5e1" />
          <circle cx={100} cy={350} r={3} fill="#cbd5e1" />
          <circle cx={700} cy={90} r={3} fill="#cbd5e1" />
          <circle cx={740} cy={160} r={3} fill="#cbd5e1" />
          <circle cx={720} cy={250} r={3} fill="#cbd5e1" />
          <circle cx={680} cy={340} r={3} fill="#cbd5e1" />
        </svg>
      </div>
    </div>
  );
};

export default ChipLoader;
