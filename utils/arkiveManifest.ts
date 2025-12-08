import { Asset, ArkiveManifest, Claim } from '../types';

export const generateArkiveManifest = (claim: Claim): ArkiveManifest | null => {
    // Filter for assets marked as 'Sold' (meaning sent to auction)
    const auctionAssets = claim.assets.filter(a => a.salvageDisposition === 'Sold');

    if (auctionAssets.length === 0) {
        return null;
    }

    const totalRecovery = auctionAssets.reduce((sum, asset) => sum + (asset.salvageEstimatedRecovery || 0), 0);

    return {
        id: `ARK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdDate: new Date().toISOString(),
        assets: auctionAssets,
        totalEstimatedRecovery: totalRecovery,
        pickupLocation: claim.location || 'Unknown Location',
        status: 'Draft'
    };
};
