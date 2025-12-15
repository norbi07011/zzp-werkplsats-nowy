
import React from 'react';
import { LogoAssembler } from './components/LogoAssembler';

// --- INSTRUCTION ---
// This SVG is generated via code to simulate your logo immediately.
// To use your actual file:
// 1. Place 'logo.png' in the 'public' folder.
// 2. Change the line below to: const LOGO_URL = "/logo.png";

const LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <!-- Gradient for Dark Frame (Complex Gunmetal) -->
    <linearGradient id="dark-metal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#64748b" />
      <stop offset="20%" stop-color="#334155" />
      <stop offset="45%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#475569" />
      <stop offset="80%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    
    <!-- Gradient for Silver V (Rich Chrome) -->
    <linearGradient id="silver-v" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="15%" stop-color="#cbd5e1" />
      <stop offset="40%" stop-color="#64748b" />
      <stop offset="50%" stop-color="#334155" />
      <stop offset="55%" stop-color="#94a3b8" />
      <stop offset="85%" stop-color="#e2e8f0" />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>

    <!-- Gradient for Text Chrome (With Shimmer Animation) -->
    <linearGradient id="text-chrome" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="45%" stop-color="#94a3b8" />
      <stop offset="50%" stop-color="#475569">
         <!-- SHIMMER: Animates the horizon line of the chrome -->
         <animate attributeName="stop-color" values="#475569; #64748b; #cbd5e1; #64748b; #475569" dur="5s" repeatCount="indefinite" />
      </stop>
      <stop offset="55%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
    
    <!-- Gradient for Cyan Text (With Pulse Animation) -->
    <linearGradient id="text-cyan-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0891b2" />
        <stop offset="50%" stop-color="#22d3ee">
            <!-- PULSE: Brightens the center of the gradient -->
            <animate attributeName="stop-color" values="#22d3ee; #a5f3fc; #22d3ee" dur="3s" repeatCount="indefinite" />
        </stop>
        <stop offset="100%" stop-color="#0891b2" />
    </linearGradient>

    <!-- Glow effect for circuits -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    
    <!-- Drop Shadow -->
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.8"/>
    </filter>

    <style>
        @keyframes circuit-flow {
            0% { stroke-dashoffset: 24; }
            100% { stroke-dashoffset: 0; }
        }
        @keyframes pulse-v {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
        .circuit-anim {
            stroke-dasharray: 4 4;
            animation: circuit-flow 1s linear infinite;
        }
        .v-reflection {
           animation: pulse-v 3s ease-in-out infinite;
        }
    </style>
  </defs>

  <!-- GROUP: GRAPHICAL ICON (Scaled and positioned) -->
  <g transform="translate(0, -30) scale(0.9)" transform-origin="center">
      <!-- --- HEXAGON FRAME PARTS --- -->
      
      <!-- Left Bracket (C shape) -->
      <path d="M 138 128 L 78 256 L 138 384 L 240 440 L 260 410 L 170 360 L 120 256 L 170 152 Z" 
            fill="url(#dark-metal)" stroke="#334155" stroke-width="2" filter="url(#shadow)" />

      <!-- Bottom Right Bracket Fragment -->
      <path d="M 290 440 L 410 380 L 410 330 L 380 330 L 380 360 L 300 400 Z" 
            fill="url(#dark-metal)" stroke="#334155" stroke-width="2" filter="url(#shadow)" />

      <!-- Top Right Bracket Fragment -->
      <path d="M 410 180 L 380 110 L 280 60 L 280 90 L 350 125 L 380 180 Z" 
            fill="url(#dark-metal)" stroke="#334155" stroke-width="2" filter="url(#shadow)" />


      <!-- --- THE V (Checkmark) --- -->
      <!-- Silver, sharp, extending out -->
      <path d="M 150 230 L 190 230 L 260 350 L 440 70 L 480 90 L 260 410 L 150 230 Z" 
            fill="url(#silver-v)" 
            filter="url(#shadow)"
            stroke="#fff" stroke-width="1" stroke-opacity="0.5"
      />
      
      <!-- Subtle highlight on V -->
      <path d="M 150 230 L 190 230 L 260 350 L 440 70" fill="none" stroke="white" stroke-width="2" opacity="0.3" class="v-reflection" />

      <!-- --- CIRCUITS (Inside the V) --- -->
      <g filter="url(#glow)">
        <!-- Main trace with animation -->
        <polyline points="200 260, 240 300, 280 260, 340 190" 
                  fill="none" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" 
                  class="circuit-anim" />
        
        <!-- Branches -->
        <line x1="280" y1="260" x2="300" y2="230" stroke="#06b6d4" stroke-width="2" opacity="0.7" />
        <line x1="240" y1="300" x2="220" y2="320" stroke="#06b6d4" stroke-width="2" opacity="0.7" />
        
        <!-- Nodes/Dots -->
        <circle cx="200" cy="260" r="4" fill="#22d3ee" />
        <circle cx="240" cy="300" r="3" fill="#22d3ee" />
        <circle cx="280" cy="260" r="3" fill="#22d3ee" />
        <circle cx="340" cy="190" r="4" fill="#22d3ee" />
        <circle cx="300" cy="230" r="2.5" fill="#22d3ee" />
      </g>

      <!-- --- GREEN TIP --- -->
      <circle cx="480" cy="90" r="8" fill="#4ade80" stroke="#fff" stroke-width="2" filter="url(#glow)">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
      </circle>
  </g>

  <!-- --- EMBEDDED TEXT LAYERS --- -->
  <!-- ZZP Title: Metallic Chrome with hard bevel feel -->
  <text x="256" y="420" text-anchor="middle" 
        font-family="'Arial Black', 'Orbitron', sans-serif" 
        font-weight="900" 
        font-size="100" 
        fill="url(#text-chrome)"
        stroke="#1e293b" stroke-width="4"
        filter="url(#shadow)"
        style="text-transform: uppercase; letter-spacing: -4px;">
    ZZP
  </text>
  
  <!-- Inner stroke for sharpness -->
  <text x="256" y="420" text-anchor="middle" 
        font-family="'Arial Black', 'Orbitron', sans-serif" 
        font-weight="900" 
        font-size="100" 
        fill="none"
        stroke="#ffffff" stroke-width="1" stroke-opacity="0.5"
        style="text-transform: uppercase; letter-spacing: -4px; pointer-events: none;">
    ZZP
  </text>

  <!-- WERKPLAATS Subtitle: Neon Cyan with animation -->
  <text x="256" y="470" text-anchor="middle" 
        font-family="'Orbitron', sans-serif" 
        font-weight="bold" 
        font-size="26" 
        fill="url(#text-cyan-grad)"
        style="text-transform: uppercase; letter-spacing: 12px;">
    WERKPLAATS
    <!-- FLICKER: Subtle opacity change -->
    <animate attributeName="opacity" values="0.85; 1; 0.85" dur="3s" repeatCount="indefinite" />
  </text>
  
  <!-- Tech decorative lines under text -->
  <line x1="160" y1="485" x2="352" y2="485" stroke="#06b6d4" stroke-width="2" opacity="0.5">
     <animate attributeName="x1" values="160;180;160" dur="4s" repeatCount="indefinite" />
     <animate attributeName="x2" values="352;332;352" dur="4s" repeatCount="indefinite" />
  </line>

</svg>
`;

// Safe Base64 encoding (Standard ASCII only in SVG string above)
const LOGO_URL = `data:image/svg+xml;base64,${btoa(LOGO_SVG)}`;

const App: React.FC = () => {
  return (
    <main className="relative w-full h-screen bg-[#020617] overflow-hidden selection:bg-cyan-500 selection:text-black">
      
      {/* --- NEW ANIMATED BACKGROUND PATTERN (Aurora) --- */}
      <div className="bg-aurora"></div>

      <div className="relative z-10 w-full h-full">
        <LogoAssembler imageSrc={LOGO_URL} />
      </div>
      
    </main>
  );
};

export default App;
