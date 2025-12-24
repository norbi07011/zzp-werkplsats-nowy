/**
 * CertificateMaster Types
 * Adapted for ZZP Werkplaats integration
 */

export type Language = "nl" | "pl";

export interface Translation {
  [key: string]: Record<Language, string>;
}

export interface Certificate {
  id: string;
  worker_id?: string; // Link to workers table
  candidateName: string;
  candidateDob: string;
  candidatePlaceOfBirth: string;
  candidatePhoto?: string | null;
  companyName: string;
  companyAddress: string;
  role: string;
  examDate: string;
  description: string;
  instructorName: string;
  issueDate: string;
  certificateNumber: string;
  validityYears?: number;
  // ZZP Werkplaats additions
  status?: "active" | "revoked" | "expired";
  pdf_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CertificateDesign {
  themeMode: "classic" | "modern" | "minimal";
  primaryColor: string;
  accentColor: string;
  fontFamily:
    | "serif"
    | "royal"
    | "classic"
    | "sans"
    | "modern"
    | "standard"
    | "mono"
    | "condensed"
    | "industrial";
  isBilingual: boolean;
  orientation: "portrait" | "landscape";
  scaleTitle: number;
  fontWeightTitle: string;
  letterSpacingTitle: number;
  scaleName: number;
  fontWeightName: string;
  letterSpacingName: number;
  scaleDetails: number;
  fontWeightDetails: string;
  lineHeightDetails: number;
  descriptionAlign: "left" | "center" | "justify";
  sealStyle:
    | "none"
    | "gold-embossed"
    | "silver-embossed"
    | "red-wax"
    | "modern-blue"
    | "holographic";
  showRibbon: boolean;
  ribbonColor: string;
  ribbonPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  stampDataUrl: string | null;
  stampRotation: number;
  stampOpacity: number;
  stampScale: number;
  stampOffsetX: number;
  stampOffsetY: number;
  paperTexture: "none" | "linen" | "parchment" | "fiber" | "grain" | "cotton";
  guillocheComplexity: number;
  guillocheOpacity: number;
  useMicrotextBorder: boolean;
  ghostPhotoOpacity: number;
  securityFibersOpacity: number;
  watermarkText: string;
  watermarkOpacity: number;
  useGradientBackground: boolean;
  gradientType:
    | "linear"
    | "radial"
    | "mesh"
    | "ocean"
    | "sunset"
    | "cosmic"
    | "neon"
    | "vibrant"
    | "holographic-flow";
  gradientColors: [string, string, string];
  overlayShape:
    | "none"
    | "circuit-board"
    | "damask"
    | "hexagon-mesh"
    | "topographic"
    | "stardust"
    | "vertical-pinstripes"
    | "crosshatch"
    | "greek-key"
    | "bauhaus-circles"
    | "radial-sunburst"
    | "polka-dots"
    | "micro-grid"
    | "zigzag"
    | "honeycomb-3d"
    | "abstract-splatter"
    | "safety-lines"
    | "cyber-neon"
    | "waves"
    | "duotone-blobs"
    | "diamond-lattice";
  overlayOpacity: number;
  overlayColor: string;
  borderStyle: "solid" | "double" | "dashed" | "none" | "ornamental";
  borderWidth: number;
  borderColor: string;
  // === CARD-SPECIFIC SETTINGS ===
  cardCornerRadius: number;
  cardHologramIntensity: number;
  cardShowChip: boolean;
  cardChipStyle: "gold" | "silver";
  cardChipPositionX: number;
  cardChipPositionY: number;
  cardShowBarcode: boolean;
  cardBarcodeType: "code128" | "code39" | "ean13";
  cardShowMagStripe: boolean;
  cardMagStripeColor: string;
  cardSecurityPattern: "none" | "holographic" | "guilloche" | "microtext";
  cardBackGradientType: "linear" | "radial" | "solid";
  cardBackGradientColors: [string, string, string];
  // Card photo settings
  cardPhotoShape: "rounded" | "circle" | "square";
  cardPhotoBorderWidth: number;
  cardPhotoBorderColor: string;
  cardPhotoShadow: boolean;
  // Card text settings
  cardNameColor: string;
  cardRoleColor: string;
  cardRoleBgColor: string;
  cardDetailsColor: string;
  // Card front gradient
  cardFrontGradientColors: [string, string, string];
  cardUseCustomFrontGradient: boolean;
  logoDataUrl: string | null;
  signatureDataUrl: string | null;
  stickerDataUrl: string | null;
  logoScale: number;
  logoOpacity: number;
  logoOffsetX: number;
  logoOffsetY: number;
  signatureScale: number;
  signatureOpacity: number;
  signatureOffsetX: number;
  signatureOffsetY: number;
  qrCodeScale: number;
  qrCodeOpacity: number;
  qrCodeOffsetX: number;
  qrCodeOffsetY: number;
  stickerScale: number;
  stickerOpacity: number;
  stickerOffsetX: number;
  stickerOffsetY: number;
  shadowColor: string;
  shadowOpacity: number;
  shadowBlur: number;
}

export type ViewState = "list" | "create" | "preview-cert" | "preview-card";

// Worker data for auto-fill
export interface WorkerData {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  avatar_url?: string;
}
