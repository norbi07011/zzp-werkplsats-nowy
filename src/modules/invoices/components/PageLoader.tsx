// --- Page Loader (Scanning Text Animation) ---

const PageLoader = () => {
  return (
    <div className="fixed inset-0 z-50 bg-[#1e1e1e] flex items-center justify-center overflow-hidden">
      <style>{`
          .loader-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 120px;
            width: auto;
            margin: 2rem;
          }

          .loader-text {
            font-family: "Inter", sans-serif;
            font-size: 3.2em;
            font-weight: 600;
            user-select: none;
            color: white;
            z-index: 10;
            position: relative;
            animation: text-pulse 4s infinite linear;
          }

          @keyframes text-pulse {
            0% { filter: blur(0px); opacity: 0; }
            5% { opacity: 1; text-shadow: 0 0 4px #8d8379; filter: blur(0px); transform: scale(1.1) translateY(-2px); }
            20% { opacity: 0.2; filter: blur(0px); }
            100% { filter: blur(5px); opacity: 0; }
          }

          .loader-scanline {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            z-index: 5;
            background-color: transparent;
            pointer-events: none;
            mask-image: repeating-linear-gradient(90deg, transparent 0, transparent 6px, black 6px, black 9px);
            -webkit-mask-image: repeating-linear-gradient(90deg, transparent 0, transparent 6px, black 6px, black 9px);
          }

          .loader-scanline::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: radial-gradient(circle at 50% 50%, #ff0 0%, transparent 50%),
              radial-gradient(circle at 45% 45%, #f00 0%, transparent 45%),
              radial-gradient(circle at 55% 55%, #0ff 0%, transparent 45%),
              radial-gradient(circle at 45% 55%, #0f0 0%, transparent 45%),
              radial-gradient(circle at 55% 45%, #00f 0%, transparent 45%);
            mask-image: radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%);
            -webkit-mask-image: radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%);
            animation: scanline-move 2s infinite alternate, scanline-opacity 4s infinite;
            animation-timing-function: cubic-bezier(0.6, 0.8, 0.5, 1);
          }

          @keyframes scanline-move {
            0% { transform: translate(-55%); }
            100% { transform: translate(55%); }
          }

          @keyframes scanline-opacity {
            0%, 100% { opacity: 0; }
            15% { opacity: 1; }
            65% { opacity: 0; }
          }
       `}</style>

      <div className="loader-wrapper">
        <div className="loader-text">ZZP Werkplaats</div>
        <div className="loader-scanline" />
      </div>
    </div>
  );
};

export default PageLoader;
