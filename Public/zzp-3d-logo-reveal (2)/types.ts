export interface AnimationConfig {
  duration: number;
  delayStagger: number;
  explosionForce: number;
}

export interface ShardProps {
  id: number;
  row: number;
  col: number;
  totalRows: number;
  totalCols: number;
  imageSrc: string;
  isAssembled: boolean;
  config: AnimationConfig;
}

export interface LogoAssemblerProps {
  imageSrc: string;
  onComplete?: () => void;
}
