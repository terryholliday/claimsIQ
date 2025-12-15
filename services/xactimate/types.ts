/**
 * Xactimate ESX Export Types
 * 
 * ESX files are ZIP-compressed archives containing XML data.
 * This module defines the TypeScript interfaces for generating
 * Xactimate-compatible export files.
 */

// ============================================================================
// CLAIM & PROJECT INFORMATION
// ============================================================================

export interface ESXProject {
  /** Unique project identifier */
  projectId: string;
  /** Claim number from insurance carrier */
  claimNumber: string;
  /** Date of loss (ISO format) */
  dateOfLoss: string;
  /** Date estimate created */
  dateCreated: string;
  /** Estimator/adjuster name */
  estimatorName: string;
  /** Insurance carrier name */
  carrierName?: string;
  /** Policy number */
  policyNumber?: string;
  /** Type of loss */
  lossType: LossType;
  /** Project status */
  status: ProjectStatus;
}

export type LossType = 
  | 'FIRE'
  | 'WATER'
  | 'WIND'
  | 'HAIL'
  | 'THEFT'
  | 'VANDALISM'
  | 'OTHER';

export type ProjectStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'CLOSED';

// ============================================================================
// PROPERTY INFORMATION
// ============================================================================

export interface ESXProperty {
  /** Property address */
  address: PropertyAddress;
  /** Property type */
  propertyType: PropertyType;
  /** Year built */
  yearBuilt?: number;
  /** Total square footage */
  squareFootage?: number;
  /** Number of stories */
  stories?: number;
  /** Construction type */
  constructionType?: ConstructionType;
  /** Roof type */
  roofType?: RoofType;
}

export interface PropertyAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export type PropertyType =
  | 'SINGLE_FAMILY'
  | 'MULTI_FAMILY'
  | 'CONDO'
  | 'TOWNHOUSE'
  | 'MOBILE_HOME'
  | 'COMMERCIAL'
  | 'OTHER';

export type ConstructionType =
  | 'FRAME'
  | 'MASONRY'
  | 'STEEL'
  | 'CONCRETE'
  | 'MIXED'
  | 'OTHER';

export type RoofType =
  | 'ASPHALT_SHINGLE'
  | 'METAL'
  | 'TILE'
  | 'SLATE'
  | 'FLAT'
  | 'OTHER';

// ============================================================================
// INSURED INFORMATION
// ============================================================================

export interface ESXInsured {
  /** Primary insured name */
  name: string;
  /** Contact phone */
  phone?: string;
  /** Contact email */
  email?: string;
  /** Same as property address if true */
  sameAsProperty?: boolean;
  /** Mailing address if different */
  mailingAddress?: PropertyAddress;
}

// ============================================================================
// ROOM / AREA DEFINITIONS
// ============================================================================

export interface ESXRoom {
  /** Unique room identifier */
  roomId: string;
  /** Room name/label */
  name: string;
  /** Room type */
  roomType: RoomType;
  /** Floor level (1 = ground, 2 = second, 0 = basement) */
  floorLevel: number;
  /** Room dimensions */
  dimensions?: RoomDimensions;
  /** Items in this room */
  items: ESXItem[];
  /** Room notes */
  notes?: string;
}

export interface RoomDimensions {
  /** Length in feet */
  length?: number;
  /** Width in feet */
  width?: number;
  /** Height in feet (ceiling) */
  height?: number;
  /** Square footage (calculated or measured) */
  squareFootage?: number;
  /** Perimeter in linear feet */
  perimeter?: number;
}

export type RoomType =
  | 'LIVING_ROOM'
  | 'FAMILY_ROOM'
  | 'DINING_ROOM'
  | 'KITCHEN'
  | 'BEDROOM'
  | 'MASTER_BEDROOM'
  | 'BATHROOM'
  | 'MASTER_BATHROOM'
  | 'HALF_BATHROOM'
  | 'LAUNDRY'
  | 'GARAGE'
  | 'BASEMENT'
  | 'ATTIC'
  | 'OFFICE'
  | 'CLOSET'
  | 'HALLWAY'
  | 'ENTRY'
  | 'PORCH'
  | 'DECK'
  | 'OTHER';

// ============================================================================
// INVENTORY ITEMS
// ============================================================================

export interface ESXItem {
  /** Unique item identifier */
  itemId: string;
  /** Item description */
  description: string;
  /** Item category */
  category: ItemCategory;
  /** Quantity */
  quantity: number;
  /** Unit of measure */
  unit: UnitOfMeasure;
  /** Replacement cost value */
  replacementCost: number;
  /** Actual cash value (depreciated) */
  actualCashValue?: number;
  /** Age in years */
  ageYears?: number;
  /** Condition at time of loss */
  condition?: ItemCondition;
  /** Brand/manufacturer */
  brand?: string;
  /** Model number */
  model?: string;
  /** Serial number */
  serialNumber?: string;
  /** Purchase date */
  purchaseDate?: string;
  /** Original purchase price */
  purchasePrice?: number;
  /** Photo URLs */
  photos?: string[];
  /** Proveniq Genome hash (for verification) */
  genomeHash?: string;
  /** Item notes */
  notes?: string;
}

export type ItemCategory =
  | 'ELECTRONICS'
  | 'FURNITURE'
  | 'APPLIANCES'
  | 'CLOTHING'
  | 'JEWELRY'
  | 'ART'
  | 'COLLECTIBLES'
  | 'TOOLS'
  | 'SPORTING_GOODS'
  | 'MUSICAL_INSTRUMENTS'
  | 'BOOKS_MEDIA'
  | 'KITCHENWARE'
  | 'LINENS_BEDDING'
  | 'OUTDOOR'
  | 'TOYS_GAMES'
  | 'OFFICE_SUPPLIES'
  | 'PERSONAL_CARE'
  | 'OTHER';

export type UnitOfMeasure =
  | 'EACH'
  | 'SET'
  | 'PAIR'
  | 'LINEAR_FOOT'
  | 'SQUARE_FOOT'
  | 'CUBIC_FOOT'
  | 'POUND'
  | 'OTHER';

export type ItemCondition =
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR';

// ============================================================================
// PHOTOS & ATTACHMENTS
// ============================================================================

export interface ESXPhoto {
  /** Unique photo identifier */
  photoId: string;
  /** Photo filename */
  filename: string;
  /** Photo description/caption */
  description?: string;
  /** Associated room ID */
  roomId?: string;
  /** Associated item ID */
  itemId?: string;
  /** Photo type */
  photoType: PhotoType;
  /** Date taken */
  dateTaken?: string;
  /** Base64 encoded image data (for embedding) */
  base64Data?: string;
  /** External URL (if not embedded) */
  url?: string;
}

export type PhotoType =
  | 'PRE_LOSS'
  | 'POST_LOSS'
  | 'DAMAGE'
  | 'OVERVIEW'
  | 'DETAIL'
  | 'RECEIPT'
  | 'OTHER';

// ============================================================================
// COMPLETE ESX DOCUMENT
// ============================================================================

export interface ESXDocument {
  /** Document version */
  version: string;
  /** Project information */
  project: ESXProject;
  /** Property information */
  property: ESXProperty;
  /** Insured information */
  insured: ESXInsured;
  /** Rooms with items */
  rooms: ESXRoom[];
  /** Standalone photos (not associated with rooms) */
  photos?: ESXPhoto[];
  /** Document metadata */
  metadata: ESXMetadata;
}

export interface ESXMetadata {
  /** Generator application */
  generator: string;
  /** Generator version */
  generatorVersion: string;
  /** Export timestamp */
  exportedAt: string;
  /** Source system */
  sourceSystem: string;
  /** Total item count */
  totalItems: number;
  /** Total replacement cost */
  totalReplacementCost: number;
  /** Total actual cash value */
  totalActualCashValue?: number;
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface ESXExportOptions {
  /** Include photos in export (increases file size) */
  includePhotos?: boolean;
  /** Photo quality (if including photos) */
  photoQuality?: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Include Proveniq metadata (Genome hashes, etc.) */
  includeProveniqMetadata?: boolean;
  /** Compress output (always true for ESX) */
  compress?: boolean;
  /** Output filename */
  filename?: string;
}

// ============================================================================
// XACTIMATE CATEGORY CODES
// ============================================================================

/**
 * Xactimate uses specific category codes for line items.
 * This maps Proveniq categories to Xactimate codes.
 */
export const XACTIMATE_CATEGORY_MAP: Record<ItemCategory, string> = {
  ELECTRONICS: 'CNT',      // Contents
  FURNITURE: 'CNT',        // Contents
  APPLIANCES: 'APL',       // Appliances
  CLOTHING: 'CNT',         // Contents
  JEWELRY: 'CNT',          // Contents (high-value)
  ART: 'CNT',              // Contents (high-value)
  COLLECTIBLES: 'CNT',     // Contents
  TOOLS: 'CNT',            // Contents
  SPORTING_GOODS: 'CNT',   // Contents
  MUSICAL_INSTRUMENTS: 'CNT', // Contents
  BOOKS_MEDIA: 'CNT',      // Contents
  KITCHENWARE: 'CNT',      // Contents
  LINENS_BEDDING: 'CNT',   // Contents
  OUTDOOR: 'CNT',          // Contents
  TOYS_GAMES: 'CNT',       // Contents
  OFFICE_SUPPLIES: 'CNT',  // Contents
  PERSONAL_CARE: 'CNT',    // Contents
  OTHER: 'CNT',            // Contents
};

/**
 * Xactimate room type codes
 */
export const XACTIMATE_ROOM_MAP: Record<RoomType, string> = {
  LIVING_ROOM: 'LR',
  FAMILY_ROOM: 'FR',
  DINING_ROOM: 'DR',
  KITCHEN: 'KIT',
  BEDROOM: 'BR',
  MASTER_BEDROOM: 'MBR',
  BATHROOM: 'BA',
  MASTER_BATHROOM: 'MBA',
  HALF_BATHROOM: 'HBA',
  LAUNDRY: 'LAU',
  GARAGE: 'GAR',
  BASEMENT: 'BSM',
  ATTIC: 'ATT',
  OFFICE: 'OFF',
  CLOSET: 'CLO',
  HALLWAY: 'HAL',
  ENTRY: 'ENT',
  PORCH: 'POR',
  DECK: 'DEC',
  OTHER: 'OTH',
};
