import React, { useMemo } from 'react';
import { ShardProps } from '../types';

export const Shard: React.FC<ShardProps> = ({
  row,
  col,
  totalRows,
  totalCols,
  imageSrc,
  isAssembled,
  config
}) => {
  const widthPercent = 100 / totalCols;
  const heightPercent = 100 / totalRows;

  // Memoize random start positions for explosion
  const randomTransform = useMemo(() => {
    // Center bias: pieces in the middle fly closer, pieces on edges fly further
    const centerX = col - totalCols / 2;
    const centerY = row - totalRows / 2;
    const distance = Math.sqrt(centerX * centerX + centerY * centerY);
    
    const force = config.explosionForce * (1 + distance * 0.1);

    const randomX = (Math.random() - 0.5) * force * 10;
    const randomY = (Math.random() - 0.5) * force * 10;
    // Deep 3D Scatter
    const randomZ = Math.random() * 1000 + 200; 
    
    const rotateX = (Math.random() - 0.5) * 360;
    const rotateY = (Math.random() - 0.5) * 360;
    const rotateZ = (Math.random() - 0.5) * 360;

    return `translate3d(${randomX}px, ${randomY}px, ${randomZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
  }, [config.explosionForce, col, row, totalCols, totalRows]);

  const transitionDelay = useMemo(() => {
    return Math.random() * 800; // Varied delay for organic re-assembly
  }, []);

  return (
    <div
      className="absolute backface-hidden"
      style={{
        top: `${row * heightPercent}%`,
        left: `${col * widthPercent}%`,
        // Slightly overlap (0.3%) to prevent hairline gaps in the assembled logo
        width: `${widthPercent + 0.3}%`,
        height: `${heightPercent + 0.3}%`,
        backgroundImage: `url(${imageSrc})`,
        backgroundSize: `${totalCols * 100}% ${totalRows * 100}%`,
        backgroundPosition: `${(col * 100) / (totalCols - 1)}% ${(row * 100) / (totalRows - 1)}%`,
        backgroundRepeat: 'no-repeat',
        transform: isAssembled 
          ? 'translate3d(0,0,0) rotate(0)' 
          : randomTransform,
        opacity: isAssembled ? 1 : 0,
        // Custom bezier for "snapping" effect
        transition: `all ${config.duration}ms cubic-bezier(0.16, 1, 0.3, 1)`, 
        transitionDelay: `${isAssembled ? transitionDelay : 0}ms`,
        // Lighting effect simulation
        filter: isAssembled ? 'brightness(1)' : 'brightness(0.5) sepia(0.5) hue-rotate(180deg)',
        boxShadow: isAssembled ? 'none' : '0 0 5px rgba(6, 182, 212, 0.3)', // Cyan glow on shards
        willChange: 'transform, opacity, filter',
        zIndex: isAssembled ? 10 : 100,
      }}
    />
  );
};