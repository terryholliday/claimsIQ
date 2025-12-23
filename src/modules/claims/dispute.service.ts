
import { getLedgerClient } from '../../infrastructure/ledger-client';

interface DisputePacket {
    sealEventId: string;
    sealId: string;
    anchorId: string;
    timestamp: string;
    geo?: { lat: number; lng: number };
    transitShipmentId?: string; // If known
}

export class DisputeService {
    /**
     * Trigger a dispute based on an Anchor Seal Break.
     * Generates an Attribution Packet and writes to Ledger.
     */
    async openDisputeFromSealBreak(packet: DisputePacket): Promise<string> {
        const ledger = getLedgerClient();

        console.log(`[DISPUTE] Opening dispute for Broken Seal ${packet.sealId} on Anchor ${packet.anchorId}`);

        // 1. Construct Attribution Packet (The "Proof")
        // In a real system, we'd query Transit Service to get shipment details if not provided.
        // Here we assume it's passed or lookup is mocked.
        const attribution = {
            reason: 'ANCHOR_SEAL_BROKEN_IN_TRANSIT',
            evidence: {
                seal_id: packet.sealId,
                anchor_id: packet.anchorId,
                break_timestamp: packet.timestamp,
                geo_location: packet.geo,
            },
            transit_context: {
                shipment_id: packet.transitShipmentId || 'UNKNOWN_SHIPMENT',
                // We would query Transit Custody Chain here
            }
        };

        // 2. Write Canonical Ledger Event: TRANSIT_DISPUTE_OPENED
        // Note: Using canonical event name from Remediation Protocol
        const eventId = await ledger.writeEvent(
            'TRANSIT_DISPUTE_OPENED',
            'claimsiq', // Producer
            packet.transitShipmentId || packet.anchorId, // Subject
            attribution,
            // correlationId? Generate one if not passed
            `disp-${Date.now()}`
        );

        console.log(`[DISPUTE] Dispute Opened. Ledger Event: ${eventId}`);
        return eventId;
    }
}
