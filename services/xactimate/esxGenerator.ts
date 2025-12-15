/**
 * Xactimate ESX File Generator
 * 
 * Generates Xactimate-compatible ESX files from Proveniq inventory data.
 * ESX files are ZIP-compressed archives containing XML data.
 */

import {
  ESXDocument,
  ESXProject,
  ESXProperty,
  ESXInsured,
  ESXRoom,
  ESXItem,
  ESXPhoto,
  ESXMetadata,
  ESXExportOptions,
  XACTIMATE_CATEGORY_MAP,
  XACTIMATE_ROOM_MAP,
  ItemCategory,
  RoomType,
} from './types';

// ============================================================================
// XML GENERATION UTILITIES
// ============================================================================

/**
 * Escapes special XML characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Creates an XML element with optional attributes and content
 */
function xmlElement(
  tag: string,
  content?: string | null,
  attributes?: Record<string, string | number | undefined>
): string {
  const attrs = attributes
    ? Object.entries(attributes)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => ` ${k}="${escapeXml(String(v))}"`)
        .join('')
    : '';

  if (content === null || content === undefined || content === '') {
    return `<${tag}${attrs}/>`;
  }

  return `<${tag}${attrs}>${escapeXml(content)}</${tag}>`;
}

/**
 * Creates an XML element with child elements (no escaping for children)
 */
function xmlContainer(
  tag: string,
  children: string,
  attributes?: Record<string, string | number | undefined>
): string {
  const attrs = attributes
    ? Object.entries(attributes)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => ` ${k}="${escapeXml(String(v))}"`)
        .join('')
    : '';

  return `<${tag}${attrs}>${children}</${tag}>`;
}

// ============================================================================
// ESX DOCUMENT GENERATOR
// ============================================================================

export class ESXGenerator {
  private document: ESXDocument;
  private options: ESXExportOptions;

  constructor(document: ESXDocument, options: ESXExportOptions = {}) {
    this.document = document;
    this.options = {
      includePhotos: false,
      photoQuality: 'MEDIUM',
      includeProveniqMetadata: true,
      compress: true,
      ...options,
    };
  }

  /**
   * Generates the complete ESX XML content
   */
  generateXML(): string {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      this.generateRootElement(),
    ].join('\n');

    return xml;
  }

  /**
   * Generates the root ESX element
   */
  private generateRootElement(): string {
    const children = [
      this.generateProjectSection(),
      this.generatePropertySection(),
      this.generateInsuredSection(),
      this.generateRoomsSection(),
      this.generatePhotosSection(),
      this.generateMetadataSection(),
    ].join('\n');

    return xmlContainer('ESXDocument', children, {
      version: this.document.version,
      xmlns: 'http://www.xactware.com/esx',
    });
  }

  /**
   * Generates the Project section
   */
  private generateProjectSection(): string {
    const p = this.document.project;
    const children = [
      xmlElement('ProjectId', p.projectId),
      xmlElement('ClaimNumber', p.claimNumber),
      xmlElement('DateOfLoss', p.dateOfLoss),
      xmlElement('DateCreated', p.dateCreated),
      xmlElement('EstimatorName', p.estimatorName),
      xmlElement('CarrierName', p.carrierName),
      xmlElement('PolicyNumber', p.policyNumber),
      xmlElement('LossType', p.lossType),
      xmlElement('Status', p.status),
    ].join('\n');

    return xmlContainer('Project', children);
  }

  /**
   * Generates the Property section
   */
  private generatePropertySection(): string {
    const p = this.document.property;
    const addressChildren = [
      xmlElement('Street1', p.address.street1),
      xmlElement('Street2', p.address.street2),
      xmlElement('City', p.address.city),
      xmlElement('State', p.address.state),
      xmlElement('ZipCode', p.address.zipCode),
      xmlElement('Country', p.address.country || 'USA'),
    ].join('\n');

    const children = [
      xmlContainer('Address', addressChildren),
      xmlElement('PropertyType', p.propertyType),
      xmlElement('YearBuilt', p.yearBuilt?.toString()),
      xmlElement('SquareFootage', p.squareFootage?.toString()),
      xmlElement('Stories', p.stories?.toString()),
      xmlElement('ConstructionType', p.constructionType),
      xmlElement('RoofType', p.roofType),
    ].join('\n');

    return xmlContainer('Property', children);
  }

  /**
   * Generates the Insured section
   */
  private generateInsuredSection(): string {
    const i = this.document.insured;
    const children = [
      xmlElement('Name', i.name),
      xmlElement('Phone', i.phone),
      xmlElement('Email', i.email),
    ].join('\n');

    return xmlContainer('Insured', children);
  }

  /**
   * Generates the Rooms section with all items
   */
  private generateRoomsSection(): string {
    const roomsXml = this.document.rooms.map((room) => this.generateRoom(room)).join('\n');
    return xmlContainer('Rooms', roomsXml);
  }

  /**
   * Generates a single Room element
   */
  private generateRoom(room: ESXRoom): string {
    const roomCode = XACTIMATE_ROOM_MAP[room.roomType as RoomType] || 'OTH';
    
    const dimensionsXml = room.dimensions
      ? xmlContainer('Dimensions', [
          xmlElement('Length', room.dimensions.length?.toString()),
          xmlElement('Width', room.dimensions.width?.toString()),
          xmlElement('Height', room.dimensions.height?.toString()),
          xmlElement('SquareFootage', room.dimensions.squareFootage?.toString()),
          xmlElement('Perimeter', room.dimensions.perimeter?.toString()),
        ].join('\n'))
      : '';

    const itemsXml = room.items.map((item) => this.generateItem(item)).join('\n');

    const children = [
      xmlElement('RoomId', room.roomId),
      xmlElement('Name', room.name),
      xmlElement('RoomType', room.roomType),
      xmlElement('RoomCode', roomCode),
      xmlElement('FloorLevel', room.floorLevel.toString()),
      dimensionsXml,
      xmlContainer('Items', itemsXml),
      xmlElement('Notes', room.notes),
    ].join('\n');

    return xmlContainer('Room', children, { id: room.roomId });
  }

  /**
   * Generates a single Item element
   */
  private generateItem(item: ESXItem): string {
    const categoryCode = XACTIMATE_CATEGORY_MAP[item.category as ItemCategory] || 'CNT';

    const photosXml = item.photos && item.photos.length > 0
      ? xmlContainer('Photos', item.photos.map((url, i) => 
          xmlElement('PhotoUrl', url, { index: i })
        ).join('\n'))
      : '';

    const children = [
      xmlElement('ItemId', item.itemId),
      xmlElement('Description', item.description),
      xmlElement('Category', item.category),
      xmlElement('CategoryCode', categoryCode),
      xmlElement('Quantity', item.quantity.toString()),
      xmlElement('Unit', item.unit),
      xmlElement('ReplacementCost', item.replacementCost.toFixed(2)),
      xmlElement('ActualCashValue', item.actualCashValue?.toFixed(2)),
      xmlElement('AgeYears', item.ageYears?.toString()),
      xmlElement('Condition', item.condition),
      xmlElement('Brand', item.brand),
      xmlElement('Model', item.model),
      xmlElement('SerialNumber', item.serialNumber),
      xmlElement('PurchaseDate', item.purchaseDate),
      xmlElement('PurchasePrice', item.purchasePrice?.toFixed(2)),
      photosXml,
      this.options.includeProveniqMetadata && item.genomeHash
        ? xmlElement('ProveniqGenomeHash', item.genomeHash)
        : '',
      xmlElement('Notes', item.notes),
    ].filter(Boolean).join('\n');

    return xmlContainer('Item', children, { id: item.itemId });
  }

  /**
   * Generates the Photos section
   */
  private generatePhotosSection(): string {
    if (!this.document.photos || this.document.photos.length === 0) {
      return '<Photos/>';
    }

    const photosXml = this.document.photos.map((photo) => {
      const children = [
        xmlElement('PhotoId', photo.photoId),
        xmlElement('Filename', photo.filename),
        xmlElement('Description', photo.description),
        xmlElement('RoomId', photo.roomId),
        xmlElement('ItemId', photo.itemId),
        xmlElement('PhotoType', photo.photoType),
        xmlElement('DateTaken', photo.dateTaken),
        this.options.includePhotos && photo.base64Data
          ? xmlElement('Base64Data', photo.base64Data)
          : xmlElement('Url', photo.url),
      ].filter(Boolean).join('\n');

      return xmlContainer('Photo', children, { id: photo.photoId });
    }).join('\n');

    return xmlContainer('Photos', photosXml);
  }

  /**
   * Generates the Metadata section
   */
  private generateMetadataSection(): string {
    const m = this.document.metadata;
    const children = [
      xmlElement('Generator', m.generator),
      xmlElement('GeneratorVersion', m.generatorVersion),
      xmlElement('ExportedAt', m.exportedAt),
      xmlElement('SourceSystem', m.sourceSystem),
      xmlElement('TotalItems', m.totalItems.toString()),
      xmlElement('TotalReplacementCost', m.totalReplacementCost.toFixed(2)),
      xmlElement('TotalActualCashValue', m.totalActualCashValue?.toFixed(2)),
    ].join('\n');

    return xmlContainer('Metadata', children);
  }

  /**
   * Calculates totals from the document
   */
  static calculateTotals(rooms: ESXRoom[]): { totalItems: number; totalRCV: number; totalACV: number } {
    let totalItems = 0;
    let totalRCV = 0;
    let totalACV = 0;

    for (const room of rooms) {
      for (const item of room.items) {
        totalItems += item.quantity;
        totalRCV += item.replacementCost * item.quantity;
        totalACV += (item.actualCashValue || item.replacementCost) * item.quantity;
      }
    }

    return { totalItems, totalRCV, totalACV };
  }
}

// ============================================================================
// ESX FILE CREATOR (ZIP COMPRESSION)
// ============================================================================

/**
 * Creates a ZIP file in the browser using the Compression Streams API
 * Falls back to uncompressed if not supported
 */
async function createZipBlob(xmlContent: string, xmlFilename: string): Promise<Blob> {
  // Create the ZIP file structure manually
  // ZIP format: Local file header + file data + central directory + end of central directory
  
  const encoder = new TextEncoder();
  const xmlBytes = encoder.encode(xmlContent);
  const filenameBytes = encoder.encode(xmlFilename);
  
  // Calculate CRC32
  const crc32 = calculateCRC32(xmlBytes);
  
  // Current date/time in DOS format
  const now = new Date();
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
  const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
  
  // Local file header (30 bytes + filename)
  const localHeader = new Uint8Array(30 + filenameBytes.length);
  const localView = new DataView(localHeader.buffer);
  
  localView.setUint32(0, 0x04034b50, true);  // Local file header signature
  localView.setUint16(4, 20, true);           // Version needed to extract
  localView.setUint16(6, 0, true);            // General purpose bit flag
  localView.setUint16(8, 0, true);            // Compression method (0 = stored)
  localView.setUint16(10, dosTime, true);     // Last mod file time
  localView.setUint16(12, dosDate, true);     // Last mod file date
  localView.setUint32(14, crc32, true);       // CRC-32
  localView.setUint32(18, xmlBytes.length, true);  // Compressed size
  localView.setUint32(22, xmlBytes.length, true);  // Uncompressed size
  localView.setUint16(26, filenameBytes.length, true);  // File name length
  localView.setUint16(28, 0, true);           // Extra field length
  localHeader.set(filenameBytes, 30);
  
  // Central directory file header (46 bytes + filename)
  const centralHeader = new Uint8Array(46 + filenameBytes.length);
  const centralView = new DataView(centralHeader.buffer);
  
  centralView.setUint32(0, 0x02014b50, true);  // Central file header signature
  centralView.setUint16(4, 20, true);          // Version made by
  centralView.setUint16(6, 20, true);          // Version needed to extract
  centralView.setUint16(8, 0, true);           // General purpose bit flag
  centralView.setUint16(10, 0, true);          // Compression method
  centralView.setUint16(12, dosTime, true);    // Last mod file time
  centralView.setUint16(14, dosDate, true);    // Last mod file date
  centralView.setUint32(16, crc32, true);      // CRC-32
  centralView.setUint32(20, xmlBytes.length, true);  // Compressed size
  centralView.setUint32(24, xmlBytes.length, true);  // Uncompressed size
  centralView.setUint16(28, filenameBytes.length, true);  // File name length
  centralView.setUint16(30, 0, true);          // Extra field length
  centralView.setUint16(32, 0, true);          // File comment length
  centralView.setUint16(34, 0, true);          // Disk number start
  centralView.setUint16(36, 0, true);          // Internal file attributes
  centralView.setUint32(38, 0, true);          // External file attributes
  centralView.setUint32(42, 0, true);          // Relative offset of local header
  centralHeader.set(filenameBytes, 46);
  
  // End of central directory record (22 bytes)
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  const centralDirOffset = localHeader.length + xmlBytes.length;
  
  endView.setUint32(0, 0x06054b50, true);      // End of central dir signature
  endView.setUint16(4, 0, true);               // Number of this disk
  endView.setUint16(6, 0, true);               // Disk where central directory starts
  endView.setUint16(8, 1, true);               // Number of central directory records on this disk
  endView.setUint16(10, 1, true);              // Total number of central directory records
  endView.setUint32(12, centralHeader.length, true);  // Size of central directory
  endView.setUint32(16, centralDirOffset, true);      // Offset of start of central directory
  endView.setUint16(20, 0, true);              // Comment length
  
  // Combine all parts
  const zipData = new Uint8Array(
    localHeader.length + xmlBytes.length + centralHeader.length + endRecord.length
  );
  
  let offset = 0;
  zipData.set(localHeader, offset); offset += localHeader.length;
  zipData.set(xmlBytes, offset); offset += xmlBytes.length;
  zipData.set(centralHeader, offset); offset += centralHeader.length;
  zipData.set(endRecord, offset);
  
  return new Blob([zipData], { type: 'application/zip' });
}

/**
 * Calculate CRC32 checksum
 */
function calculateCRC32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  
  // CRC32 lookup table
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Creates an ESX file (ZIP archive) from the XML content.
 * ESX files are ZIP archives containing XML data.
 */
export async function createESXFile(
  document: ESXDocument,
  options: ESXExportOptions = {}
): Promise<{ blob: Blob; xml: string; filename: string }> {
  const generator = new ESXGenerator(document, options);
  const xml = generator.generateXML();
  
  const baseFilename = options.filename || 
    `${document.project.claimNumber}_${new Date().toISOString().split('T')[0]}`;
  
  const filename = baseFilename.endsWith('.esx') ? baseFilename : `${baseFilename}.esx`;
  const xmlFilename = filename.replace('.esx', '.xml');
  
  // Create ZIP blob containing the XML
  const blob = await createZipBlob(xml, xmlFilename);
  
  return { blob, xml, filename };
}

// ============================================================================
// HELPER: CONVERT PROVENIQ CLAIM TO ESX DOCUMENT
// ============================================================================

export interface ProveniqClaimData {
  claimId: string;
  claimNumber: string;
  dateOfLoss: string;
  lossType: string;
  status: string;
  insured: {
    name: string;
    phone?: string;
    email?: string;
  };
  property: {
    address: {
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zipCode: string;
    };
    propertyType?: string;
    yearBuilt?: number;
    squareFootage?: number;
  };
  rooms: Array<{
    roomId: string;
    name: string;
    roomType: string;
    floorLevel?: number;
    items: Array<{
      itemId: string;
      description: string;
      category: string;
      quantity: number;
      replacementCost: number;
      actualCashValue?: number;
      ageYears?: number;
      condition?: string;
      brand?: string;
      model?: string;
      serialNumber?: string;
      photos?: string[];
      genomeHash?: string;
    }>;
  }>;
  photos?: Array<{
    photoId: string;
    filename: string;
    description?: string;
    roomId?: string;
    itemId?: string;
    photoType: string;
    url?: string;
  }>;
}

/**
 * Converts Proveniq claim data to ESX document format
 */
export function convertToESXDocument(
  claim: ProveniqClaimData,
  estimatorName: string = 'Proveniq ClaimsIQ'
): ESXDocument {
  const totals = ESXGenerator.calculateTotals(
    claim.rooms.map((r) => ({
      ...r,
      roomType: r.roomType as RoomType,
      floorLevel: r.floorLevel || 1,
      items: r.items.map((i) => ({
        ...i,
        category: i.category as ItemCategory,
        unit: 'EACH' as const,
        condition: i.condition as any,
      })),
    }))
  );

  return {
    version: '1.0',
    project: {
      projectId: claim.claimId,
      claimNumber: claim.claimNumber,
      dateOfLoss: claim.dateOfLoss,
      dateCreated: new Date().toISOString(),
      estimatorName,
      lossType: (claim.lossType || 'OTHER') as any,
      status: (claim.status || 'IN_PROGRESS') as any,
    },
    property: {
      address: claim.property.address,
      propertyType: (claim.property.propertyType || 'SINGLE_FAMILY') as any,
      yearBuilt: claim.property.yearBuilt,
      squareFootage: claim.property.squareFootage,
    },
    insured: {
      name: claim.insured.name,
      phone: claim.insured.phone,
      email: claim.insured.email,
    },
    rooms: claim.rooms.map((room) => ({
      roomId: room.roomId,
      name: room.name,
      roomType: (room.roomType || 'OTHER') as RoomType,
      floorLevel: room.floorLevel || 1,
      items: room.items.map((item) => ({
        itemId: item.itemId,
        description: item.description,
        category: (item.category || 'OTHER') as ItemCategory,
        quantity: item.quantity || 1,
        unit: 'EACH' as const,
        replacementCost: item.replacementCost || 0,
        actualCashValue: item.actualCashValue,
        ageYears: item.ageYears,
        condition: item.condition as any,
        brand: item.brand,
        model: item.model,
        serialNumber: item.serialNumber,
        photos: item.photos,
        genomeHash: item.genomeHash,
      })),
    })),
    photos: claim.photos?.map((photo) => ({
      photoId: photo.photoId,
      filename: photo.filename,
      description: photo.description,
      roomId: photo.roomId,
      itemId: photo.itemId,
      photoType: (photo.photoType || 'OTHER') as any,
      url: photo.url,
    })),
    metadata: {
      generator: 'Proveniq ClaimsIQ',
      generatorVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      sourceSystem: 'Proveniq',
      totalItems: totals.totalItems,
      totalReplacementCost: totals.totalRCV,
      totalActualCashValue: totals.totalACV,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ESXGenerator;
