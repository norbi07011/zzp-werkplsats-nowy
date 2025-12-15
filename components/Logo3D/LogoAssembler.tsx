import React, { useState, useEffect, useRef } from 'react';
import { LogoAssemblerProps } from './types';
import { Shard } from './Shard';

const ROWS = 10; 
const COLS = 10;

export const LogoAssembler: React.FC<LogoAssemblerProps> = ({ imageSrc }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [assembled, setAssembled] = useState(false);
  
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const config = {
    duration: 2000,
    delayStagger: 40,
    explosionForce: 200, 
  };

  useEffect(() => {
    // Phase 1: Loader duration
    const loadTimer = setTimeout(() => {
      setIsLoading(false); 
    }, 3000);

    // Phase 2: Assembly duration
    const assembleTimer = setTimeout(() => {
      setShowLoader(false);
      setAssembled(true);
    }, 3800); 

    return () => {
      clearTimeout(loadTimer);
      clearTimeout(assembleTimer);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    // Subtle parallax effect
    setTilt({ x: y * 15, y: -x * 15 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const toggleAssembly = () => {
    if (isLoading) return;
    setAssembled(!assembled);
  };

  const shards = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      shards.push({ r, c, id: `${r}-${c}` });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen perspective-container relative overflow-hidden bg-transparent">
      
      {/* Ambient Lighting */}
      <div className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-cyan-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
      <div className="absolute -bottom-[20%] -right-[10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '10s', animationDelay: '2s' }} />

      {/* Initial Loader (Star Tunnel) */}
      {showLoader && (
        <div className={`loader-container ${!isLoading ? 'fade-out' : ''}`}>
          <div className="container-loader">
             {/* 15 Layers */}
             {[...Array(15)].map((_, i) => (
                <div key={i} className="aro" style={{ '--s': i } as React.CSSProperties} />
             ))}
          </div>
          <div className="loader-content">
              <div className="loader-title">ZZP</div>
              <div className="loader-subtitle">WERKPLAATS</div>
          </div>
        </div>
      )}

      {/* Center Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[100px] transition-all duration-[2000ms] ${assembled ? 'opacity-60 scale-100' : 'opacity-0 scale-50'}`} />

      {/* 3D Shards Container */}
      <div 
        className={`relative z-20 w-[320px] h-[320px] md:w-[500px] md:h-[500px] cursor-pointer group transition-opacity duration-1000 ${showLoader ? 'opacity-0' : 'opacity-100'}`}
        style={{ perspective: '1500px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={toggleAssembly}
      >
        <div 
          ref={containerRef}
          className="w-full h-full relative transform-style-3d transition-transform duration-500 ease-out"
          style={{ 
            transform: assembled 
              ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` 
              : 'rotateX(20deg) rotateY(-20deg)' 
          }}
        >
          {shards.map((shard) => (
            <Shard
              key={shard.id}
              id={parseInt(shard.id)}
              row={shard.r}
              col={shard.c}
              totalRows={ROWS}
              totalCols={COLS}
              imageSrc={imageSrc}
              isAssembled={assembled}
              config={config}
            />
          ))}
          
          {/* Energy Particles */}
          {assembled && [...Array(20)].map((_, i) => (
             <div 
                key={`p-${i}`}
                className="tech-particle"
                style={{
                    top: `${50 + (Math.random() - 0.5) * 40}%`,
                    left: `${50 + (Math.random() - 0.5) * 40}%`,
                    width: `${Math.random() * 4 + 1}px`,
                    height: `${Math.random() * 4 + 1}px`,
                    animationDuration: `${Math.random() * 2 + 1}s`,
                    animationDelay: `${Math.random()}s`
                }}
             />
          ))}
        </div>
      </div>

      {/* Typography Section */}
      <div className={`relative z-30 mt-4 text-center flex flex-col items-center justify-center transition-opacity duration-1000 ${showLoader ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Background Energy Ring */}
        <div 
            className={`transition-all duration-[2000ms] ease-out ${assembled ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
            style={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '500px',
                height: '500px',
                zIndex: -1
            }}
        >
             <div className="energy-ring-container">
                <div className="loader-circle" />
             </div>
        </div>

        {/* Titles */}
        <div className="relative z-10 flex flex-col items-center">
            <div className="relative overflow-visible p-2">
            <h1 
                className={`
                text-7xl md:text-8xl font-black tracking-[-0.02em] text-transparent bg-clip-text 
                bg-gradient-to-b from-white via-gray-200 to-gray-500
                transition-all duration-[1500ms] cubic-bezier(0.19, 1, 0.22, 1)
                font-['Orbitron']
                ${assembled ? 'translate-y-0 opacity-100' : 'translate-y-[50%] opacity-0'}
                `}
                style={{ 
                    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.8))',
                    WebkitTextStroke: '1px rgba(255,255,255,0.2)'
                }}
            >
                ZZP
            </h1>
            
            {assembled && (
                <span className="absolute top-0 left-0 w-full h-full text-7xl md:text-8xl font-black tracking-[-0.02em] text-cyan-400 opacity-20 animate-pulse translate-x-[1px] mix-blend-screen pointer-events-none">
                ZZP
                </span>
            )}
            </div>

            <div 
            className={`
                mt-2 transition-all duration-1000 delay-300 relative
                ${assembled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            >
                <h2 className="text-slate-400 font-bold text-2xl md:text-3xl uppercase font-['Orbitron'] tracking-[0.2em] drop-shadow-lg">
                    WERKPLAATS
                </h2>
                <div className={`absolute top-1/2 -left-8 w-4 h-[1px] bg-cyan-800 ${assembled ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`absolute top-1/2 -right-8 w-4 h-[1px] bg-cyan-800 ${assembled ? 'opacity-100' : 'opacity-0'}`}></div>
                
                <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent transition-all duration-1000 delay-500 ${assembled ? 'w-full opacity-50' : 'w-0 opacity-0'}`} />
            </div>

            <button
            onClick={toggleAssembly}
            className={`
                mt-12 relative group px-8 py-3 overflow-hidden rounded-sm transition-all duration-500
                ${assembled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
            `}
            >
            <div className="absolute inset-0 w-full h-full bg-[#1a202c] border border-slate-700 skew-x-[-12deg] group-hover:bg-cyan-900/20 group-hover:border-cyan-500/50 transition-all duration-300" />
            <span className="relative font-['Orbitron'] text-xs font-bold text-slate-300 tracking-widest uppercase group-hover:text-cyan-400">
                {assembled ? 'RESET SYSTEM' : 'INITIALIZE'}
            </span>
            </button>
        </div>
      </div>
    </div>
  );
};