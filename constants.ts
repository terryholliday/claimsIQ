import { Claim, ClaimStatus, AssetStatus, FraudRiskLevel, PlaybookStep } from './types';

export const DEFAULT_PLAYBOOK_STEPS: PlaybookStep[] = [
    { id: 'step-1', label: 'FNOL Verification', description: 'Confirm Date of Loss, Policy limits, and deductible.', required: true, completed: false },
    { id: 'step-2', label: 'Contact Customer', description: 'Establish initial contact and set expectations.', required: true, completed: false },
    { id: 'step-3', label: 'PROVENIQ Home Sync / Inventory', description: 'Ingest list from PROVENIQ Home or create manually.', required: true, completed: false },
    { id: 'step-4', label: 'Field Inspection', description: 'Digital or onsite inspection of claimed assets.', required: false, completed: false },
    { id: 'step-5', label: 'Pricing & Depreciation', description: 'Apply age, condition, and depreciation.', required: true, completed: false },
    { id: 'step-6', label: 'Coverage Review', description: 'Check limits, exclusions, and sub-limits.', required: true, completed: false },
    { id: 'step-7', label: 'Settlement Proposal', description: 'Generate settlement report and review with insured.', required: true, completed: false },
    { id: 'step-8', label: 'Payment & Close', description: 'Issue payment and close file.', required: true, completed: false }
];

export const MOCK_CLAIMS: Claim[] = [
    {
        id: 'MF-2024-001',
        policyholderName: 'Eleanor Vance',
        policyNumber: 'POL-987654',
        policyStartDate: '2022-01-01',
        coverageLimit: 10000,
        deductible: 500,
        claimDate: '2024-07-15',
        location: 'Boston, MA',
        status: ClaimStatus.READY_TO_SYNC,
        preLossMetadata: {
            preLossItemCount: 147,
            preLossTotalValue: 42000,
            documentedPhotosCount: 140,
            vaultId: 'V-001-EV',
            lastUpdated: '2024-07-01'
        },
        totalClaimedValue: 8450,
        touchTime: 2700000, // 45 minutes
        auditTrail: [
            { id: 'log_1', timestamp: '2024-07-15T10:00:00Z', user: 'System', action: 'CLAIM_CREATED', details: 'Ingested from PROVENIQ Home', hash: 'a1b2c3d4' },
            { id: 'log_2', timestamp: '2024-07-15T10:05:22Z', user: 'Alex Johnson', action: 'VIEWED_MANIFEST', details: 'Adjuster opened file', hash: 'e5f6g7h8' },
            { id: 'log_3', timestamp: '2024-07-15T10:12:45Z', user: 'TrueManifest AI', action: 'FRAUD_SCAN', details: 'Routine Scan: No anomalies detected', hash: 'i9j0k1l2' },
            { id: 'log_4', timestamp: '2024-07-15T10:20:00Z', user: 'Alex Johnson', action: 'STATUS_CHANGE', details: 'Changed from NEW to IN_REVIEW', hash: 'm3n4o5p6' }
        ],
        financials: {
            reserves: 8450,
            paymentsMade: 1200,
            totalIncurred: 8450,
        },
        payments: [
            { id: 'pay-1', amount: 1200, payee: 'Eleanor Vance', method: 'ACH', date: '2024-07-20', status: 'Sent' }
        ],
        activities: [
            { id: 'act-1-1', title: 'Make initial contact with policyholder', dueDate: '2024-07-16', assignee: 'Alex Johnson', status: 'Completed' },
            { id: 'act-1-2', title: 'Verify policy coverage', dueDate: '2024-07-16', assignee: 'Alex Johnson', status: 'Completed' },
            { id: 'act-1-3', title: 'Request photos of damaged items', dueDate: '2024-07-17', assignee: 'Alex Johnson', status: 'Open' },
            { id: 'act-1-4', title: 'Review for subrogation potential', dueDate: '2024-07-18', assignee: 'Alex Johnson', status: 'Open' },
        ],
        notes: [
            { id: 'note-1-1', timestamp: '2024-07-15T10:05:22Z', author: 'Alex Johnson', content: 'Initial review of the manifest. High value electronics. Will need to verify purchase dates.', type: 'log' },
            { id: 'note-1-2', timestamp: '2024-07-15T14:30:00Z', author: 'Alex Johnson', content: 'Left voicemail for policyholder, Eleanor Vance. Awaiting callback.', type: 'log' },
        ],
        documents: [
            { id: 'doc-1-1', name: 'Initial Loss Report.pdf', type: 'PDF', uploadedDate: '2024-07-15', size: '1.2 MB' },
            { id: 'doc-1-2', name: 'Policy_Declarations_POL-987654.pdf', type: 'PDF', uploadedDate: '2024-07-15', size: '450 KB' },
            { id: 'doc-1-3', name: 'MacBook_Receipt.jpg', type: 'Image', uploadedDate: '2024-07-16', size: '2.1 MB' },
        ],
        assets: [
            {
                id: 'A001',
                name: 'MacBook Pro 16"',
                category: 'Electronics',
                claimedValue: 2500,
                purchaseDate: '2023-01-20',
                status: AssetStatus.VERIFIED,
                imageUrl: 'https://picsum.photos/seed/macbook/400/400',
                origin: 'PRE_LOSS',
                serialNumber: 'C02XG2L9JGH7',
                exifData: { dateTaken: '2023-01-20 14:30', gpsLocation: 'Boston, MA', deviceModel: 'iPhone 13 Pro', isMetadataConsistent: true }
            },
            {
                id: 'A005',
                name: 'Hardwood Floor Scratch',
                category: 'Property Damage',
                claimedValue: 800,
                purchaseDate: '2022-01-01',
                status: AssetStatus.PENDING,
                imageUrl: 'https://picsum.photos/seed/floor/400/400', // "Before" photo
                damageImageUrl: 'https://storage.googleapis.com/aistudio-hosting/generative-ai-hackathon/floor_damage.png', // "After" photo
                origin: 'POST_LOSS'
            },
            {
                id: 'A002',
                name: 'Sony A7 IV Camera',
                category: 'Electronics',
                claimedValue: 2800,
                purchaseDate: '2023-05-10',
                status: AssetStatus.VERIFIED,
                imageUrl: 'https://picsum.photos/seed/camera/400/400',
                origin: 'PRE_LOSS'
            },
            {
                id: 'A003',
                name: 'Designer Leather Handbag',
                category: 'Apparel',
                claimedValue: 1200,
                purchaseDate: '2024-07-10',
                status: AssetStatus.PENDING,
                imageUrl: 'https://picsum.photos/seed/handbag/400/400',
                origin: 'POST_LOSS' // Added after the fact
            },
            {
                id: 'A004',
                name: 'Antique Gold Watch',
                category: 'Jewelry',
                claimedValue: 1950,
                purchaseDate: '2020-03-01',
                status: AssetStatus.PENDING,
                imageUrl: 'https://picsum.photos/seed/watch/400/400',
                origin: 'PRE_LOSS'
            },
        ],
    },
    {
        id: 'MF-2024-002',
        policyholderName: 'Marcus Holloway',
        policyNumber: 'POL-123456',
        policyStartDate: '2020-06-15',
        coverageLimit: 15000,
        deductible: 1000,
        claimDate: '2024-07-12',
        location: 'San Francisco, CA',
        status: ClaimStatus.NEW_FROM_HOME,
        preLossMetadata: {
            preLossItemCount: 52,
            preLossTotalValue: 18500,
            documentedPhotosCount: 48,
            vaultId: 'V-002-MH',
            lastUpdated: '2024-06-30'
        },
        totalClaimedValue: 4800,
        touchTime: 300000, // 5 minutes
        liveFNOLAnalysis: { // For Live FNOL Intake
            status: 'idle',
            transcript: [],
        },
        auditTrail: [
            { id: 'log_1', timestamp: '2024-07-12T09:15:00Z', user: 'System', action: 'CLAIM_CREATED', details: 'Ingested from PROVENIQ Home', hash: 'x9y8z7' }
        ],
        financials: {
            reserves: 4800,
            paymentsMade: 0,
            totalIncurred: 4800,
        },
        activities: [
            { id: 'act-2-1', title: 'Perform Live FNOL Intake Call', dueDate: '2024-07-13', assignee: 'Alex Johnson', status: 'Open' }
        ],
        notes: [],
        documents: [
            { id: 'doc-2-1', name: 'Initial Loss Report.pdf', type: 'PDF', uploadedDate: '2024-07-12', size: '1.1 MB' }
        ],
        assets: [
            { id: 'B001', name: 'Custom Gaming PC', category: 'Electronics', claimedValue: 3500, purchaseDate: '2022-11-15', status: AssetStatus.VERIFIED, imageUrl: 'https://picsum.photos/seed/pc/400/400', origin: 'PRE_LOSS' },
            { id: 'B002', name: 'Limited Edition Sneakers', category: 'Apparel', claimedValue: 800, purchaseDate: '2024-06-25', status: AssetStatus.PENDING, imageUrl: 'https://picsum.photos/seed/sneakers/400/400', origin: 'PRE_LOSS' },
            { id: 'B003', name: 'DJI Mavic Drone', category: 'Electronics', claimedValue: 500, purchaseDate: '2023-08-01', status: AssetStatus.UNVERIFIED, imageUrl: 'https://picsum.photos/seed/drone/400/400', origin: 'POST_LOSS' },
        ],
    },
    {
        id: 'MF-2024-003',
        policyholderName: 'Jasmine Kaur',
        policyNumber: 'POL-654321',
        policyStartDate: '2019-11-01',
        coverageLimit: 5000,
        deductible: 500,
        claimDate: '2024-06-28',
        location: 'Austin, TX',
        status: ClaimStatus.SYNCED_TO_CMS,
        totalClaimedValue: 2200,
        touchTime: 1200000, // 20 minutes
        auditTrail: [
            { id: 'log_1', timestamp: '2024-06-28T14:00:00Z', user: 'System', action: 'CLAIM_CREATED', details: 'Ingested', hash: 'q1w2e3' },
            { id: 'log_2', timestamp: '2024-06-28T15:30:00Z', user: 'Alex Johnson', action: 'EXPORT_CMS', details: 'Pushed to Guidewire', hash: 'r4t5y6' }
        ],
        financials: {
            reserves: 1700,
            paymentsMade: 1700,
            totalIncurred: 1700,
        },
        activities: [
            { id: 'act-3-1', title: 'Finalize and issue payment', dueDate: '2024-06-28', assignee: 'Alex Johnson', status: 'Completed' }
        ],
        notes: [
            { id: 'note-3-1', timestamp: '2024-06-28T15:25:00Z', author: 'Alex Johnson', content: 'Claim verified, all assets pre-loss. Payout calculated at $1700 after deductible. Queuing payment.', type: 'log' },
        ],
        documents: [],
        assets: [
            { id: 'C001', name: 'Electric Guitar', category: 'Musical Instruments', claimedValue: 1500, purchaseDate: '2021-02-18', status: AssetStatus.VERIFIED, imageUrl: 'https://picsum.photos/seed/guitar/400/400', origin: 'PRE_LOSS' },
            { id: 'C002', name: 'Professional Art Set', category: 'Hobbies', claimedValue: 700, purchaseDate: '2022-09-30', status: AssetStatus.VERIFIED, imageUrl: 'https://picsum.photos/seed/artset/400/400', origin: 'PRE_LOSS' },
        ],
    },
    {
        id: 'MF-2024-004',
        policyholderName: 'Robert Chen',
        policyNumber: 'POL-778899',
        policyStartDate: '2024-01-01', // Suspicious: Policy started this year
        coverageLimit: 10000,
        deductible: 1000,
        claimDate: '2024-07-16',
        location: 'Miami, FL',
        status: ClaimStatus.FLAGGED_FOR_REVIEW,
        totalClaimedValue: 12500,
        touchTime: 7200000, // 2 hours
        auditTrail: [
            { id: 'log_1', timestamp: '2024-07-16T08:00:00Z', user: 'System', action: 'CLAIM_CREATED', details: 'Ingested', hash: 'u8i9o0' },
            { id: 'log_2', timestamp: '2024-07-16T08:01:00Z', user: 'TrueManifest AI', action: 'AUTO_FLAG', details: 'Timeline Anomaly Detected', hash: 'p1a2s3' }
        ],
        financials: {
            reserves: 10000, // Capped at coverage limit
            paymentsMade: 0,
            totalIncurred: 10000,
        },
        activities: [
            { id: 'act-4-1', title: 'Refer to SIU for investigation', dueDate: '2024-07-17', assignee: 'Alex Johnson', status: 'Open' },
            { id: 'act-4-2', title: 'Request Examination Under Oath (EUO)', dueDate: '2024-07-25', assignee: 'Alex Johnson', status: 'Open' },
        ],
        notes: [
            { id: 'note-4-1', timestamp: '2024-07-16T08:15:00Z', author: 'Alex Johnson', content: 'Significant red flags on this claim. Policy inception is recent, claimed value exceeds limits, purchase date of high-value jewelry is 2 days before loss. This requires a full SIU workup.', type: 'log' },
        ],
        documents: [
            { id: 'doc-4-1', name: 'SIU_Referral_Form.pdf', type: 'PDF', uploadedDate: '2024-07-17', size: '800 KB' },
        ],
        assets: [
            // Suspicious: Bought 2 days before claim
            { id: 'D001', name: 'Diamond Necklace', category: 'Jewelry', claimedValue: 8000, purchaseDate: '2024-07-14', status: AssetStatus.FLAGGED, imageUrl: 'https://picsum.photos/seed/necklace/400/400', origin: 'POST_LOSS' },
            // Bought before policy
            { id: 'D002', name: 'Vintage Wine Collection', category: 'Misc', claimedValue: 4500, purchaseDate: '2020-01-01', status: AssetStatus.PENDING, imageUrl: 'https://picsum.photos/seed/wine/400/400', origin: 'PRE_LOSS' },
            // Duplicate item for testing
            { id: 'D003', name: '18k Gold Diamond Necklace', category: 'Jewelry', claimedValue: 8000, purchaseDate: '2024-07-14', status: AssetStatus.FLAGGED, imageUrl: 'https://picsum.photos/seed/necklace/400/400', origin: 'POST_LOSS' },
        ],
    },
];

export const generateIncomingClaims = (startId: number): Claim[] => {
    const names = ['Sarah Connor', 'James Kirk', 'Ellen Ripley', 'Marty McFly', 'Tony Stark', 'Bruce Wayne'];
    const categories = ['Electronics', 'Jewelry', 'Apparel', 'Misc', 'Tools'];
    const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'];

    const randomClaim = (id: number) => {
        const name = names[Math.floor(Math.random() * names.length)];
        const claimedValue = Math.floor(Math.random() * 5000) + 1000;
        const location = locations[Math.floor(Math.random() * locations.length)];

        return {
            id: `MF-2024-00${id}`,
            policyholderName: name,
            policyNumber: `POL-${Math.floor(Math.random() * 1000000)}`,
            policyStartDate: '2023-01-01',
            coverageLimit: 20000,
            deductible: 500,
            claimDate: new Date().toISOString().split('T')[0],
            location: location,
            status: ClaimStatus.NEW_FROM_HOME,
            preLossMetadata: {
                preLossItemCount: Math.floor(Math.random() * 100) + 20,
                preLossTotalValue: claimedValue * 10,
                documentedPhotosCount: Math.floor(Math.random() * 100) + 10,
                vaultId: `V-${id}-GEN`,
                lastUpdated: '2024-08-01'
            },
            totalClaimedValue: claimedValue,
            touchTime: 0,
            auditTrail: [
                { id: `log_new_${id}`, timestamp: new Date().toISOString(), user: 'System', action: 'CLAIM_CREATED', details: 'Sync from PROVENIQ Home', hash: `hash_${id}` }
            ],
            financials: {
                reserves: claimedValue,
                paymentsMade: 0,
                totalIncurred: claimedValue,
            },
            activities: [],
            notes: [],
            documents: [],
            liveFNOLAnalysis: { status: 'idle', transcript: [] },
            assets: [
                {
                    id: `NEW-${id}-1`,
                    name: `New Uploaded Item #${id}`,
                    category: categories[Math.floor(Math.random() * categories.length)],
                    claimedValue: claimedValue,
                    purchaseDate: '2024-06-15',
                    status: AssetStatus.UNVERIFIED,
                    imageUrl: `https://picsum.photos/seed/new${id}/200/200`,
                    origin: 'PRE_LOSS'
                }
            ]
        } as Claim;
    }

    return [randomClaim(startId)];
};
