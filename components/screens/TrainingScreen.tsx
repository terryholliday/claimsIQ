import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
// FIX: Add missing ChatBubbleLeftRightIcon to imports
import { AcademicCapIcon, CheckCircleIcon, BookOpenIcon, TrophyIcon, ArrowRightIcon, VideoCameraIcon, LightBulbIcon, ExclamationTriangleIcon, QuestionMarkCircleIcon, XCircleIcon, LockClosedIcon, PrinterIcon, PaperAirplaneIcon, ShieldCheckIcon, ShieldExclamationIcon, CubeTransparentIcon, QueueListIcon, BanknotesIcon, StarIcon, FolderIcon, CloudIcon, DocumentDuplicateIcon, MapPinIcon, QrCodeIcon, TableCellsIcon, MegaphoneIcon, DocumentMagnifyingGlassIcon, ReceiptPercentIcon, ClockIcon, SparklesIcon, ChartBarIcon, UserIcon, CalculatorIcon, MobilePhoneIcon, TagIcon, BuildingLibraryIcon, CpuChipIcon, ArrowLeftIcon, ArrowDownTrayIcon, MicrophoneIcon, BoltIcon, ListBulletIcon, ChatBubbleLeftRightIcon } from '../icons/Icons';

// --- TYPES ---

interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

interface Lesson {
    id: string;
    title: string;
    duration: string;
    content: React.ReactNode;
}

interface Module {
    id: string;
    title: string;
    description: string;
    lessons: Lesson[];
    quiz?: Question[];
}

interface CaseFile {
    id: string;
    title: string;
    type: 'Fraud' | 'Valuation' | 'Policy' | 'Subro' | 'Compliance' | 'Forensic' | 'Intake' | 'NextGen';
    scenario: string;
    resolution: string;
}

// --- CASE LIBRARY (33 REAL WORLD SCENARIOS) ---
const CASE_LIBRARY: Record<string, CaseFile> = {
    '101': { id: '101', title: 'The $2,000 Laptop', type: 'Valuation', scenario: "Insured claims a '5-year-old Gaming Laptop' for $2,500 (original purchase price). Policyholder insists on RCV payout despite obsolescence.", resolution: "ClaimsIQ identifies 2019 specs (Intel i7-9750H). Finds modern equivalent with superior performance for $800 retail. Applies 50% depreciation. Correct ACV Payout: $400. Savings: $2,100." },
    '102': { id: '102', title: 'The "Stock" Rolex', type: 'Forensic', scenario: "Claimant uploads a photo of a Rolex Submariner as proof of ownership. The photo is high-resolution, perfectly lit, and metadata is stripped.", resolution: "Visual Truth detected the image pixel signature matched a listing on eBay from 2021. Reverse image search confirmed it was a stock photo. Claim denied for Material Misrepresentation (Hard Fraud)." },
    '103': { id: '103', title: 'The Plasma Paradox', type: 'Valuation', scenario: "Claimant demands $3,000 for a 60-inch Plasma TV purchased in 2012, citing 'rare technology' value.", resolution: "Check Market tool identifies Plasma as obsolete. Identifies 'Like Kind & Quality' (LKQ) replacement as a 65-inch 4K LED Smart TV retailing for $450. 90% depreciation applied. Final Payout: $45." },
    '104': { id: '104', title: 'The "Consultant\'s" Office', type: 'Policy', scenario: "Insured claims $15,000 for a home office setup including 3 servers and a commercial plotter. Items categorized as 'Electronics' to avoid limits.", resolution: "Taxonomy Auditor flagged items as 'Business Property' based on model numbers (Enterprise Grade). Standard HO-3 policy has a $2,500 limit for on-premises business property. Claim capped at $2,500. Savings: $12,500." },
    '105': { id: '105', title: 'The Phantom Lightning', type: 'Fraud', scenario: "Claimant reports $3,000 TV destroyed by 'Lightning Surge' during a storm on July 15th. No other electrical damage reported in the home.", resolution: "SkyWitness checked historical weather for the exact Lat/Long. Result: 'Clear Skies. 0% Precip.' No lightning strikes recorded within 50 miles on date of loss. Claim flagged for SIU referral." },
    '106': { id: '106', title: 'The "Vintage" Guitar', type: 'Valuation', scenario: "User claims a 1960 Fender Stratocaster worth $25,000. Uploads a photo of a guitar that appears aged.", resolution: "Visual Truth identified the bridge hardware as modern (post-2010). Specialty Triage flagged for expert appraisal. Appraiser confirmed it was a 'Reissue' model worth $1,200, not a vintage original. Savings: $23,800." },
    '107': { id: '107', title: 'The Lithium Fire', type: 'Subro', scenario: "Garage fire destroys contents ($40k). Narrative mentions 'E-Scooter was charging when fire started.'", resolution: "Subro Spotter™ flagged 'E-Scooter' and 'Charging'. Manufacturer identified. Evidence preservation letter generated automatically. Carrier successfully subrogated 100% of costs from the battery manufacturer." },
    '108': { id: '108', title: 'The Gym Bundle', type: 'Valuation', scenario: "Claimant lists 'Home Gym Setup - $8,000' with no further details or breakdown.", resolution: "Bundle Breakout™ predicted components: Treadmill ($1,500), Weights ($500), Bench ($200). Total estimated value only $2,200. Claimant forced to provide receipts for the missing $5,800 or accept the lower valuation." },
    '109': { id: '109', title: 'The E-Bike Epidemic', type: 'Policy', scenario: "User claims a $4,000 'Super73' Electric Bike stolen from garage. Adjuster prepares to pay under 'Bicycles' coverage.", resolution: "Policy Guardian™ flagged: 'Motorized Land Vehicle Exclusion Applies.' Claim denied based on ISO HO-3 policy language excluding vehicles with motors." },
    '110': { id: '110', title: 'The Sock Padder', type: 'Fraud', scenario: "A fire claim includes 500 line items. 300 of them are socks, underwear, and toiletries valued at $10-$15 each.", resolution: "Padding Patrol™ calculated a 'Fluff Score' of 85/100. High density of low-value items indicated 'Soft Fraud' attempting to reach deductible. Audit ordered." },
    '111': { id: '111', title: 'The Miami Geo-Tag', type: 'Forensic', scenario: "Burglary in Chicago. User uploads photo of broken window as proof of loss.", resolution: "Metadata X-Ray extracted GPS coordinates from the photo. Location: Miami, FL. Date: 2 years prior. Proof of fabrication confirmed." },
    '112': { id: '112', title: 'The Poshmark Flipper', type: 'Valuation', scenario: "Insured claims 'Designer Wardrobe - $20,000' based on retail tags. Receipts show items bought second-hand on Poshmark.", resolution: "Ingest Receipt tool scanned Poshmark screenshots. Identified purchase prices were 80% off retail. ACV established at purchase price ($4k), not MSRP ($20k)." },
    '113': { id: '113', title: 'The Bitcoin Cold Wallet', type: 'Policy', scenario: "Fire claim includes 'Ledger Nano S with 2 Bitcoin ($80,000)'.", resolution: "Policy Guardian™ flagged 'Cryptocurrency/Bullion/Cash'. Standard HO-3 policies have a $200 limit for 'Money/Bank Notes'. Claim capped at $200. Denied $79,800." },
    '114': { id: '114', title: 'The Storage Unit Geometry', type: 'Fraud', scenario: "Theft from a 5x5 Storage Unit. User claims 3 King Mattresses, a Sectional Sofa, and 80 boxes of clothes were stolen.", resolution: "Scan Fraud algorithm flagged 'Physical Impossibility'. The volume of claimed items (800 cu ft) exceeds the physical volume of the unit (200 cu ft). Claim flagged." },
    '115': { id: '115', title: 'The Relative\'s Invoice', type: 'Forensic', scenario: "User submits a $15,000 invoice for 'Home Theater Installation' dated 2 days before loss.", resolution: "Visual Truth scanned the PDF logo. Subro Spotter linked the company address to the Policyholder's brother-in-law. Flagged as 'Collusive Fraud'." },
    '116': { id: '116', title: 'The "Water Damage" Upgrade', type: 'Valuation', scenario: "Basement flood destroys an old IKEA couch. User submits a link to a Restoration Hardware couch ($4,000) as 'Replacement'.", resolution: "Visual Truth analyzed the debris photo. Identified fabric and frame as 'IKEA Ektorp'. Check Market priced it at $400. Denied upgrade attempt." },
    '117': { id: '117', title: 'The "Set" Breakage', type: 'Valuation', scenario: "One earring of a pair (valued $5k total) is stolen. User claims full $5k.", resolution: "Check Market identified value of remaining piece. Policy 'Pair and Set Clause' applied: Carrier pays the difference between total value and remaining value, not total value." },
    '118': { id: '118', title: 'The Boat in the Driveway', type: 'Policy', scenario: "Tree falls on a 20ft Pontoon Boat parked in the driveway. Claim: $18,000.", resolution: "Policy Guardian™ flagged 'Watercraft'. HO-3 policies usually only cover watercraft up to $1,500 and only for specific perils. Claim denied (Requires Marine Policy)." },
    '119': { id: '119', title: 'The "Gift" Defense', type: 'Intake', scenario: "User claims $10k in jewelry but has zero receipts. Says 'They were gifts'.", resolution: "Manifest Assistant prompted adjuster to ask for 'Wearing Photos'. Visual Truth analyzed historical social media photos to verify possession and date. Coverage granted based on forensic verification." },
    '120': { id: '120', title: 'The Commercial Drone', type: 'Policy', scenario: "DJI Matrice 300 ($12,000) stolen. User is a wedding photographer.", resolution: "Taxonomy Auditor found user website via email domain. Flagged item as 'Business Property'. Policy sub-limit of $2,500 applied. Savings: $9,500." },
    '121': { id: '121', title: 'The Double-Dip Receipt', type: 'Forensic', scenario: "Receipt for a Diamond Ring submitted for Claim A. Same receipt image found in Claim B (different policyholder).", resolution: "ClaimsIQ Global Hash Database flagged the image file hash as a duplicate across two different accounts. Both claims flagged for Organized Ring Activity." },
    '122': { id: '122', title: 'The Ransomware Claim', type: 'Fraud', scenario: "User claims $50k for 'Data Recovery' services after home network hack. Invoice is from a company registered yesterday.", resolution: "Scan Fraud detected the vendor's domain age is < 24 hours. Subro Spotter linked the vendor address to a known shell company. Policy Guardian noted standard HO-3 excludes Cyber Extortion. Claim Denied." },
    '123': { id: '123', title: 'The "Scheduled" Fine Art', type: 'Policy', scenario: "User claims $50k painting on HO-3 policy. It is already listed on a scheduled Personal Articles Floater (PAF).", resolution: "Policy Guardian detected 'Duplicate Coverage'. HO-3 is excess over specific insurance. Directed adjuster to file against PAF policy to preserve HO-3 loss history." },
    '124': { id: '124', title: 'The Commercial Kitchen', type: 'Policy', scenario: "Residential fire. Kitchen contains 4 Sous Vide machines, a Salamander broiler, and 200lbs of flour.", resolution: "Scan Fraud identified 'Commercial Equipment Density'. Flagged as an undeclared 'Business Pursuit' (Catering Business). Policy excludes business liability and property. Claim denied." },
    '125': { id: '125', title: 'The "Matching" Shingles', type: 'Compliance', scenario: "Hail damages 1 slope of roof. Shingle is discontinued. User demands full roof replacement ($30k).", resolution: "Regulatory Hub flagged 'Florida Matching Statute'. State law requires reasonable matching or full replacement of sightlines. System recommended full replacement to avoid Bad Faith litigation." },
    '126': { id: '126', title: 'The Deepfake Damage', type: 'Forensic', scenario: "User submits photo of a smashed TV screen. The crack pattern looks unnatural and doesn't align with the impact point.", resolution: "Visual Truth detected 'Generative Fill' artifacts in the pixel noise. The crack was AI-generated over an intact TV screen. Fraud confirmed." },
    '127': { id: '127', title: 'The Wine Spoilage', type: 'Policy', scenario: "Power outage. User claims $5k in spoiled vintage wine. Policy covers 'Mechanical Breakdown' but not 'Power Failure off-premises'.", resolution: "SkyWitness confirmed power outage was regional (off-premises). Policy Guardian flagged the exclusion. Claim denied based on cause of loss." },
    '128': { id: '128', title: 'The Contractor\'s Tools', type: 'Policy', scenario: "Theft of tools from a van parked at home. User is a carpenter.", resolution: "Taxonomy Auditor identified 'Business Personal Property'. If the van was not in a fully enclosed garage, coverage might be limited to $500 or excluded entirely depending on specific endorsement." },
    '129': { id: '129', title: 'The 3D Printed Receipt', type: 'Forensic', scenario: "Receipt for a $4,000 engagement ring looks perfect, but the paper grain is identical to another receipt from a different store.", resolution: "Document Forensics detected the exact same paper fiber noise pattern on two different receipts. Indicates digital forgery using the same background template." },
    '130': { id: '130', title: 'The " Mysterious" Disappearance', type: 'Policy', scenario: "User lost a diamond stone from a ring while gardening. Claim filed under Theft.", resolution: "Policy Guardian flagged 'Mysterious Disappearance'. Standard HO-3 covers Theft (requires evidence of taking), but not simple loss, unless a specific 'Scheduled Jewelry' endorsement is present." },
    '131': { id: '131', title: 'The Nervous Narrator', type: 'Intake', scenario: "During Live FNOL, claimant stutters when asked for the Time of Loss and contradicts their written statement.", resolution: "Live Intake Co-Pilot flagged the verbal inconsistency ('Tuesday' vs 'Wednesday') and detected voice stress markers. Recommended assigning to SIU for a recorded statement." },
    '132': { id: '132', title: 'The Floor "Scratch"', type: 'NextGen', scenario: "User submits a 'post-loss' photo of a scratched hardwood floor, demanding a full refinish ($5k).", resolution: "Digital Field Adjuster compared the damage photo to the 'pre-loss' photo from PROVENIQ Home. It analyzed pixel depth and lighting, determined it was a surface-level gouge, and calculated a 95% repairability index. Recommended a $75 repair kit, avoiding $4,925 in unnecessary vendor costs." },
    '133': { id: '133', title: 'The Recalled Hose', type: 'NextGen', scenario: "Proactive scan identifies 1,200 policies with 'Black Rubber' washer hoses.", resolution: "Risk Shield Campaign sent a push notification with a coupon for Steel Braided hoses. 40% of users redeemed it. Estimated 12 water claims prevented ($180k savings)." },
};

// --- UI COMPONENTS ---

const InteractiveCaseStudy: React.FC<{ caseId: string }> = ({ caseId }) => {
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'solved'>('idle');
    const [progress, setProgress] = useState(0);
    const [terminalText, setTerminalText] = useState<string>('');
    const story = CASE_LIBRARY[caseId];

    useEffect(() => {
        // Reset state if caseId changes, for component reuse on same page
        setStatus('idle');
        setProgress(0);
        setTerminalText('');
    }, [caseId]);

    if (!story) return null;

    const handleRunAnalysis = () => {
        setStatus('analyzing');
        const steps = [
            "Initializing Neural Net...",
            "Connecting to GS1 Database...",
            "Scanning EXIF Metadata...",
            "Cross-Referencing Weather API...",
            "Detecting Anomalies...",
            "Finalizing Verdict..."
        ];
        
        let stepIdx = 0;
        const totalTime = 2500;
        const intervalTime = totalTime / 100;

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setStatus('solved');
                    return 100;
                }
                return prev + 1;
            });
        }, intervalTime);

        const textTimer = setInterval(() => {
            if (stepIdx < steps.length) {
                setTerminalText(steps[stepIdx]);
                stepIdx++;
            } else {
                clearInterval(textTimer);
            }
        }, totalTime / steps.length);
    };

    const typeIcons = {
        Fraud: <ShieldExclamationIcon className="h-5 w-5 text-red-400" />,
        Valuation: <TagIcon className="h-5 w-5 text-blue-400" />,
        Policy: <BookOpenIcon className="h-5 w-5 text-orange-400" />,
        Subro: <BanknotesIcon className="h-5 w-5 text-green-400" />,
        Compliance: <BuildingLibraryIcon className="h-5 w-5 text-purple-400" />,
        Forensic: <VideoCameraIcon className="h-5 w-5 text-indigo-400" />,
        Intake: <MicrophoneIcon className="h-5 w-5 text-teal-400" />,
        NextGen: <CpuChipIcon className="h-5 w-5 text-pink-400" />,
    };

    return (
        <div className="my-8 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl">
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {typeIcons[story.type]}
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Case File #{story.id}</span>
                        <h4 className="font-bold text-lg leading-none">"{story.title}"</h4>
                    </div>
                </div>
                <Badge color="gray">{story.type}</Badge>
            </div>
            
            <div className="p-6 relative">
                <div className="mb-6">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-4 w-4" /> The Scenario
                    </p>
                    <p className="text-gray-800 text-lg leading-relaxed font-serif">
                        {story.scenario}
                    </p>
                </div>

                {status === 'solved' ? (
                    <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-r-lg animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-10 pointer-events-none transform rotate-12">
                            <div className="border-4 border-green-900 text-green-900 font-black text-4xl p-2 rounded uppercase">Solved</div>
                        </div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-green-800 uppercase flex items-center gap-1">
                                <SparklesIcon className="h-4 w-4" /> ClaimsIQ Analysis
                            </p>
                            <span className="text-xs font-bold bg-green-200 text-green-800 px-2 py-1 rounded-full animate-pulse">+50 XP</span>
                        </div>
                        <p className="text-gray-800 font-medium leading-relaxed relative z-10">
                            {story.resolution}
                        </p>
                    </div>
                ) : status === 'analyzing' ? (
                    <div className="bg-black rounded-lg p-6 font-mono text-sm relative overflow-hidden border border-gray-800">
                        <div className="flex flex-col items-center justify-center z-10 relative">
                            <div className="w-full bg-gray-800 rounded-full h-2 mb-4 overflow-hidden">
                                <div 
                                    className="bg-brand-accent h-2 rounded-full transition-all duration-100"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-brand-accent animate-pulse">{terminalText}</p>
                        </div>
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://media.giphy.com/media/U3qYN8S0j3bpK/giphy.gif')] bg-cover mix-blend-screen"></div>
                    </div>
                ) : (
                    <div className="flex justify-center py-4">
                        <button 
                            onClick={handleRunAnalysis}
                            className="group relative bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-2xl transition-all flex items-center gap-2 transform hover:-translate-y-1 overflow-hidden"
                        >
                            <span className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -translate-x-full skew-x-12"></span>
                            <CpuChipIcon className="h-5 w-5 animate-pulse" /> 
                            <span>Run AI Analysis</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ConceptFlashcard: React.FC<{ title: string; content: string; icon: React.ReactNode }> = ({ title, content, icon }) => (
    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow my-4">
        <div className="p-3 bg-white rounded-full shadow-sm shrink-0 text-brand-primary">
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-neutral-dark mb-1">{title}</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
        </div>
    </div>
);

const StatCard: React.FC<{ label: string; value: string; subtext: string; color?: 'red' | 'green' | 'blue' }> = ({ label, value, subtext, color = 'blue' }) => {
    const colors = {
        red: 'bg-red-50 text-red-900 border-red-200',
        green: 'bg-green-50 text-green-900 border-green-200',
        blue: 'bg-blue-50 text-blue-900 border-blue-200'
    };
    
    return (
        <div className={`p-6 rounded-xl border ${colors[color]} text-center transform hover:scale-105 transition-transform`}>
            <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{label}</div>
            <div className="text-4xl font-black mb-2 tracking-tight">{value}</div>
            <div className="text-xs opacity-80 leading-tight">{subtext}</div>
        </div>
    );
};

const RolePlayCard: React.FC<{ adjuster: string; customer: string; technique: string }> = ({ adjuster, customer, technique }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm my-6">
        <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold uppercase text-xs tracking-wider">
            <MegaphoneIcon className="h-4 w-4" /> Live Simulation
        </div>
        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 border-2 border-white shadow-sm"><UserIcon className="h-5 w-5 text-gray-500" /></div>
                <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none text-sm text-gray-700 italic w-full relative">
                    "{customer}"
                </div>
            </div>
            <div className="flex gap-4 flex-row-reverse">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 border-2 border-white shadow-sm"><MegaphoneIcon className="h-5 w-5 text-white" /></div>
                <div className="bg-indigo-50 p-4 rounded-2xl rounded-tr-none text-sm text-indigo-900 w-full border border-indigo-100">
                    <span className="block text-[10px] font-bold text-indigo-400 mb-1 uppercase tracking-wide">{technique}</span>
                    "{adjuster}"
                </div>
            </div>
        </div>
    </div>
);

const ComparisonGrid: React.FC<{ oldWay: string; newWay: string }> = ({ oldWay, newWay }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 my-8 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 p-6 border-b md:border-b-0 md:border-r border-gray-200">
            <div className="flex items-center gap-2 mb-3 text-gray-500 font-bold text-xs uppercase tracking-wider">
                <XCircleIcon className="h-4 w-4" /> The Legacy Way
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{oldWay}</p>
        </div>
        <div className="bg-blue-50/50 p-6">
            <div className="flex items-center gap-2 mb-3 text-brand-primary font-bold text-xs uppercase tracking-wider">
                <CheckCircleIcon className="h-4 w-4" /> The ClaimsIQ Way
            </div>
            <p className="text-blue-900 text-sm font-medium leading-relaxed">{newWay}</p>
        </div>
    </div>
);

// --- CONTENT DATA ---
const TRAINING_MODULES: Module[] = [
    {
        id: 'MOD-1',
        title: 'Module 1: The Digital Foundation',
        description: 'The source of truth. Understanding the PROVENIQ Home ecosystem and the Chain of Custody.',
        lessons: [
            {
                id: 'L1-1',
                title: 'The Golden Record',
                duration: '4 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-6 rounded-xl text-white shadow-lg mb-8">
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                <MobilePhoneIcon className="h-6 w-6 text-brand-accent" /> Why PROVENIQ Home Matters
                            </h3>
                            <p className="text-blue-100 text-sm leading-relaxed">
                                ClaimsIQ is powered by <strong>PROVENIQ Home</strong>, a consumer inventory app that allows policyholders to scan and log items <em>before</em> a loss occurs. This creates a "Golden Record" of truth that is virtually impossible to fake.
                            </p>
                        </div>

                        <h3 className="text-lg font-bold text-neutral-dark mb-4">Garbage In, Garbage Out</h3>
                        <p className="text-gray-700 mb-6">
                            Claims handling fails when the input data is bad. Memory bias makes policyholders unreliable narrators. "I think I paid $2,000" is usually wrong. PROVENIQ Home replaces memory with data.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ConceptFlashcard 
                                title="Barcode Scanning"
                                content="Users scan items at purchase. We pull the exact SKU, MSRP, and Specs from the GS1 database instantly via API."
                                icon={<QrCodeIcon className="h-6 w-6" />}
                            />
                            <ConceptFlashcard 
                                title="Receipt Locker"
                                content="Users email receipts to their Ark. Our AI parses them and links them to items before a loss occurs."
                                icon={<ReceiptPercentIcon className="h-6 w-6" />}
                            />
                            <ConceptFlashcard 
                                title="Geo-Verified"
                                content="Photos taken in PROVENIQ Home are stamped with GPS and Time. We know the item existed in the house."
                                icon={<MapPinIcon className="h-6 w-6" />}
                            />
                        </div>
                        <p className="text-gray-700 mt-4">
                            By integrating directly with the GS1 Global Registry, we bypass the user's faulty memory. If they scan a barcode, we know *exactly* what the item is, down to the variant weight and color. This eliminates 90% of "Like Kind & Quality" disputes later.
                        </p>
                    </div>
                )
            },
            {
                id: 'L1-2',
                title: 'The Claims Workstation',
                duration: '5 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Your New Home Base</h3>
                        <p className="text-gray-700">
                           Forget juggling spreadsheets and multiple systems. The Claim Detail screen is a unified workstation designed to feel like a modern version of legacy systems like Guidewire, but with AI superpowers.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                            <h4 className="font-bold text-blue-900 mb-4">The Five Pillars of a Claim File:</h4>
                            <div className="space-y-4">
                               <ConceptFlashcard 
                                    title="Manifest Tab"
                                    content="This is the core inventory of all claimed assets, where you'll run your AI analysis tools."
                                    icon={<QueueListIcon className="h-6 w-6" />}
                                />
                                 <ConceptFlashcard 
                                    title="Activities Tab"
                                    content="Your to-do list for the claim. Set reminders, assign tasks, and track progress to ensure nothing is missed."
                                    icon={<ListBulletIcon className="h-6 w-6" />}
                                />
                                <ConceptFlashcard 
                                    title="Financials Tab"
                                    content="The single source of truth for money. Set reserves, track payments, and monitor exposure against policy limits."
                                    icon={<BanknotesIcon className="h-6 w-6" />}
                                />
                                <ConceptFlashcard 
                                    title="Notes / Diary Tab"
                                    content="The official record. Log every phone call, decision, and observation here to create an immutable claim history."
                                    icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
                                />
                                <ConceptFlashcard 
                                    title="Documents Tab"
                                    content="A central repository for all files related to the claim, such as police reports, receipts, and policy declarations."
                                    icon={<FolderIcon className="h-6 w-6" />}
                                />
                            </div>
                        </div>
                        <p className="text-gray-700 mt-4">
                            By keeping all aspects of the claim in one unified view, you eliminate the need to switch between systems, reducing errors and saving significant time.
                        </p>
                    </div>
                )
            },
            {
                id: 'L1-3',
                title: 'The Chain of Custody',
                duration: '5 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Data Provenance</h3>
                        <p className="text-gray-700">
                            In a court of law, evidence is only as good as its "Chain of Custody". How do we know the photo wasn't Photoshopped? How do we know the receipt is real?
                        </p>
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-6">
                            <strong className="text-green-900 block mb-1">The "Pre-Loss" Badge</strong>
                            <p className="text-sm text-green-800">
                                When you see the <strong>Pre-Loss Verified</strong> badge in the dashboard, it means the item was logged in PROVENIQ Home *before* the date of loss. This is the highest trust level in the system and allows for "Straight-Through Processing" (Instant Payment).
                            </p>
                        </div>
                        <ComparisonGrid 
                            oldWay="A user emails a PDF list of items created 2 weeks after the fire. No proof of ownership exists. Adjuster must trust the user's word."
                            newWay="ClaimsIQ shows an immutable log: Item scanned 3 years ago. Receipt uploaded 2 years ago. Photo geo-tagged at the insured address."
                        />
                        <h3 className="text-lg font-bold text-neutral-dark mt-6">Digital Fingerprinting</h3>
                        <p className="text-gray-700">
                            Every file uploaded to ClaimsIQ is hashed (SHA-256). This creates a unique digital fingerprint. If the user tries to alter the receipt later, the hash will change, and the system will flag the anomaly.
                        </p>
                    </div>
                )
            },
            {
                id: 'L1-4',
                title: 'Zero-Trust Architecture',
                duration: '3 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Protecting PII</h3>
                        <p className="text-gray-700">
                            You are handling sensitive banking and personal data. ClaimsIQ operates on a Zero-Trust model. Every action you take—viewing a file, approving a payment, denying an item—is cryptographically logged.
                        </p>
                        <ConceptFlashcard 
                            title="Immutable Audit Logs"
                            content="The Audit Log cannot be edited or deleted. It serves as the definitive legal record of the claim lifecycle. If a regulator audits this file in 5 years, every click is preserved."
                            icon={<LockClosedIcon className="h-6 w-6" />}
                        />
                    </div>
                )
            },
            {
                id: 'L1-5',
                title: 'The Adjuster\'s New Reality',
                duration: '5 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-xl shadow-sm">
                            <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2 mb-3">
                                <SparklesIcon className="h-6 w-6 text-indigo-600" /> Empathy vs. Administration
                            </h3>
                            <p className="text-indigo-900 font-medium text-lg leading-relaxed mb-4">
                                The biggest headache for adjusters is playing "Data Detective."
                            </p>
                            <p className="text-indigo-800 text-sm leading-relaxed">
                                Chasing receipts, arguing about model numbers, and manually typing lines into Excel kills 40% of your day. It forces you to be a bureaucrat instead of an advocate. PROVENIQ Home is a <strong>Pre-Adjudication Engine</strong> that handles the boring stuff automatically so you can focus on the human side of the loss.
                            </p>
                        </div>

                        <h3 className="text-lg font-bold text-neutral-dark mt-6">Killing the "Back and Forth"</h3>
                        <p className="text-gray-700">
                            Without PROVENIQ Home, an adjuster sends an email asking for "Proof of Ownership." The user replies 3 days later with a blurry photo. The adjuster asks for a serial number. The user gets angry. This cycle repeats for weeks.
                        </p>
                        <ComparisonGrid 
                            oldWay="Adjuster spends 4 hours over 2 weeks emailing the user to get a single receipt for a TV. Customer satisfaction plummets."
                            newWay="PROVENIQ Home exports the 'Verified' JSON payload instantly. The TV model, Serial, Receipt, and Purchase Date are already there. You pay it in 5 seconds."
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <ConceptFlashcard 
                                title="No More Arguments"
                                content="When a user scans a barcode, there is no ambiguity. They can't claim it was the 'Pro' model if the UPC says 'Standard'. The system creates a single source of truth that both parties agreed to pre-loss."
                                icon={<CheckCircleIcon className="h-6 w-6" />}
                            />
                            <ConceptFlashcard 
                                title="Pre-Claim Buffer"
                                content="PROVENIQ Home acts as a shield. It forces users to organize their data *before* it hits your desk. You never receive a messy, unorganized claim again."
                                icon={<ShieldCheckIcon className="h-6 w-6" />}
                            />
                        </div>
                    </div>
                )
            }
        ],
        quiz: [
            { id: 'Q1-1', text: "What is the primary benefit of 'Pre-Loss' verification in PROVENIQ Home?", options: ["It files the claim for you.", "It guarantees full RCV payout.", "It establishes a verifiable 'Golden Record' of ownership.", "It calculates depreciation automatically."], correctAnswerIndex: 2, explanation: "Pre-loss verification provides irrefutable proof that an item existed and was owned before the date of loss." },
            { id: 'Q1-2', text: "How does the system retrieve exact item specifications?", options: ["From the user's manual description.", "By guessing based on the price.", "From the manufacturer's website.", "Via Barcode/SKU scan connected to GS1."], correctAnswerIndex: 3, explanation: "Scanning a UPC/Barcode pulls exact GS1 data, preventing ambiguity about model numbers." },
            { id: 'Q1-3', text: "Why are human memories termed 'Unreliable Narrators'?", options: ["Cognitive bias leads to inflating value and confusing purchase dates.", "They don't keep receipts.", "It's hard to remember colors.", "People usually lie."], correctAnswerIndex: 0, explanation: "Psychological studies show people overestimate the quality and value of lost items." },
            { id: 'Q1-4', text: "Which metadata element verifies the location of an item?", options: ["GPS Coordinates (EXIF)", "File Size", "Shutter Speed", "ISO Level"], correctAnswerIndex: 0, explanation: "GPS coordinates embedded in the photo metadata prove the item was physically at the insured location." },
            { id: 'Q1-5', text: "What role does the Receipt Locker play?", options: ["AI parsing links specific purchases to inventory items.", "It deletes old receipts.", "It sends receipts to the IRS.", "It pays the user immediately."], correctAnswerIndex: 0, explanation: "AI parsing links the specific purchase on a receipt to the inventory item, proving value and date." },
            { id: 'Q1-6', text: "What is a SHA-256 Hash used for?", options: ["Encrypting emails.", "Creating a unique digital fingerprint to detect file tampering.", "Compressing images.", "Calculating depreciation."], correctAnswerIndex: 1, explanation: "A hash ensures that if a file is altered even by one bit, the system detects it." },
            { id: 'Q1-7', text: "What is the 'Golden Record'?", options: ["Data verified Pre-Loss.", "The highest value item.", "The police report.", "The settlement check."], correctAnswerIndex: 0, explanation: "Data verified before a loss occurs is the most trustworthy source of truth." },
            { id: 'Q1-8', text: "Why is manual entry of items discouraged?", options: ["It's too slow.", "It requires internet.", "It lacks the data richness of a barcode scan.", "It costs more."], correctAnswerIndex: 2, explanation: "Manual entry leads to vague descriptions like 'TV' instead of 'Sony X90J 65-inch'." },
            { id: 'Q1-9', text: "How does PROVENIQ Home reduce friction during a claim?", options: ["By automatically denying claims.", "By eliminating the need for the adjuster to ask for proof of ownership repeatedly.", "By hiding the deductible.", "By increasing premiums."], correctAnswerIndex: 1, explanation: "Pre-loaded proof eliminates the painful 'back-and-forth' email chain." },
            { id: 'Q1-10', text: "What is the 'Cycle Time' benefit of PROVENIQ Home data?", options: ["It adds a 30-day waiting period.", "It requires more reviews.", "It allows for Straight-Through Processing, reducing settlement time by days.", "It makes the cycle longer."], correctAnswerIndex: 2, explanation: "Clean data allows for instant, automated decision making (STP)." },
            { id: 'Q1-11', text: "Which tab in the Claims Workstation is used to log a phone call with the policyholder?", options: ["Manifest", "Activities", "Financials", "Notes / Diary"], correctAnswerIndex: 3, explanation: "The Notes/Diary tab is the official record for all communications and observations." },
            { id: 'Q1-12', text: "Why is 'Memory Bias' a headache for adjusters?", options: ["It increases premiums.", "It causes computer errors.", "It leads to disputes when the policyholder honestly believes an item was better/newer than it was.", "Adjusters have bad memories."], correctAnswerIndex: 2, explanation: "Honest but mistaken customers are the hardest to negotiate with. Data removes the emotion." },
            { id: 'Q1-13', text: "What is 'Straight-Through Processing' (STP) mean in this context?", options: ["Automating the claim approval without human intervention based on high-trust data.", "Sending the claim to a human.", "Denying the claim instantly.", "Printing the claim."], correctAnswerIndex: 0, explanation: "STP relies on high-trust data (PROVENIQ Home) to skip manual review." },
            { id: 'Q1-14', text: "How does PROVENIQ Home help with 'Like Kind and Quality' (LKQ) disputes?", options: ["It ignores quality.", "It forces the user to buy a specific brand.", "It provides the original specs, so the LKQ comparison is mathematically accurate.", "It doesn't."], correctAnswerIndex: 2, explanation: "You can't dispute the specs of a barcode scan. The comparison becomes objective." },
            { id: 'Q1-15', text: "What happens if a user tries to edit a receipt after uploading it?", options: ["The file deletes itself.", "The user gets a refund.", "The digital fingerprint (Hash) changes, and the system flags the file as manipulated.", "Nothing."], correctAnswerIndex: 2, explanation: "Hashing ensures data integrity and chain of custody." },
            { id: 'Q1-16', text: "How does PROVENIQ Home act as a 'Pre-Claim Buffer'?", options: ["It forces users to organize data before the claim hits your desk.", "It makes users wait.", "It deletes claims.", "It creates more work."], correctAnswerIndex: 0, explanation: "Adjusters receive a clean package, not a mess of unorganized data." },
            { id: 'Q1-17', text: "PROVENIQ Home integrates with which database for product specs?", options: ["GS1 Global Registry.", "Wikipedia.", "Amazon.", "eBay."], correctAnswerIndex: 0, explanation: "GS1 is the global standard for barcode data." },
            { id: 'Q1-18', text: "What is the purpose of the 'Activities' tab?", options: ["To view asset photos.", "To set financial reserves.", "To manage and track claim-related tasks.", "To write diary entries."], correctAnswerIndex: 2, explanation: "Activities are the to-do list for the claim, ensuring all necessary steps are completed." },
            { id: 'Q1-19', text: "What is the 'Pre-Adjudication Engine' do?", options: ["It pays the claim.", "It denies the claim.", "It prints the claim.", "It validates data before the adjuster sees it."], correctAnswerIndex: 3, explanation: "It handles the verification steps automatically." },
            { id: 'Q1-20', text: "What is the result of shifting workload to the user via PROVENIQ Home?", options: ["Adjusters have less administrative work.", "Users are unhappy.", "Claims take longer.", "Leakage increases."], correctAnswerIndex: 0, explanation: "Empowering the user reduces the administrative burden on the carrier." }
        ]
    },
    {
        id: 'MOD-2',
        title: 'Module 2: The Economics of Claims',
        description: 'Understanding Leakage, Triage, and the cost of "Touching" a file.',
        lessons: [
            {
                id: 'L2-1',
                title: 'The 15% Leakage Tax',
                duration: '5 min',
                content: (
                    <div className="space-y-8 text-gray-800">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-neutral-dark">
                                <ChartBarIcon className="h-5 w-5 text-brand-primary" /> Executive Summary
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Industry studies confirm that for every $1.00 paid in Personal Property claims, <strong>$0.15 is leakage</strong>. For a mid-sized carrier paying $100M in claims, that is <strong>$15 Million wasted annually</strong> on overpayment, soft fraud, and process inefficiency.
                            </p>
                        </div>
                        <p className="text-gray-700">
                            Leakage comes in two forms:
                            <br/><strong>1. Hard Leakage:</strong> Paying for things you shouldn't (Fraud, Exclusions).
                            <br/><strong>2. Soft Leakage:</strong> Paying too much for things you do owe (Overpaying on Valuation, Missing Depreciation).
                        </p>
                        <InteractiveCaseStudy caseId="101" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <StatCard label="Avg. Overpayment" value="12%" subtext="Due to incorrect RCV pricing." color="red" />
                            <StatCard label="Soft Fraud" value="15%" subtext="Claims with artificial padding." color="red" />
                            <StatCard label="ClaimsIQ Goal" value="0%" subtext="Leakage via Asset Intelligence." color="green" />
                        </div>
                    </div>
                )
            },
            {
                id: 'L2-2',
                title: 'Active Triage Workflow',
                duration: '4 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">The Psychology of "Cherry Picking"</h3>
                        <p className="text-gray-700">
                            Human nature leads adjusters to pick the easy claims (small losses, clear liability) and ignore the complex, messy ones. This causes high-risk files to age, leading to regulatory fines and lawsuits.
                        </p>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 text-sm text-yellow-800 rounded-r-lg flex items-center gap-4">
                            <ClockIcon className="h-8 w-8 text-yellow-600" />
                            <div>
                                <strong>💎 Pro Tip: "Touch Time"</strong><br/>
                                ClaimsIQ tracks how long you spend in each file. Do not open a claim unless you intend to move it forward. Opening a file and closing it without action lowers your efficiency score. Every "touch" costs the carrier roughly $15 in administrative time.
                            </div>
                        </div>
                        <p className="text-gray-700">
                            The Manifest Dashboard forces you to work the "Ready to Sync" files (Quick Wins) and "High Risk" files (Loss Mitigation) first. Chronological ordering is a relic of the past.
                        </p>
                    </div>
                )
            }
        ],
        quiz: [
            { id: 'Q2-1', text: "What is the estimated industry average for 'Leakage'?", options: ["25%", "15%", "0%", "5%"], correctAnswerIndex: 1, explanation: "Industry average is $0.15 leakage for every $1.00 paid." },
            { id: 'Q2-2', text: "Active Triage prioritizes claims based on what?", options: ["Alphabetical order.", "Risk level and readiness.", "Date received.", "Policyholder age."], correctAnswerIndex: 1, explanation: "Active Triage focuses attention where it has the most financial impact (Risk Mitigation & Speed)." },
            { id: 'Q2-3', text: "Which of these constitutes 'Soft Fraud'?", options: ["Arson.", "Identity theft.", "Staging a fake burglary.", "Inflating the value or quantity of items (Padding)."], correctAnswerIndex: 3, explanation: "Soft fraud involves legitimate claims that are exaggerated to cover deductibles or gain extra cash." },
            { id: 'Q2-4', text: "Why is 'Touch Time' a critical metric?", options: ["To calculate overtime.", "To limit coffee breaks.", "To measure process efficiency and cost.", "To punish employees."], correctAnswerIndex: 2, explanation: "Touch Time measures the actual effort spent on a file, highlighting efficiency gains from automation." },
            { id: 'Q2-5', text: "How does Asset Intelligence mainly reduce leakage?", options: ["By denying all claims.", "By increasing premiums.", "By delaying payments.", "By using data to remove valuation guesswork."], correctAnswerIndex: 3, explanation: "Using data (pricing, specs, history) removes the guesswork that leads to overpayment." },
            { id: 'Q2-6', text: "What is 'Hard Leakage'?", options: ["Paying for excluded items or fraud.", "Paying too much for a valid item.", "Water damage.", "Administrative costs."], correctAnswerIndex: 0, explanation: "Hard leakage is paying for something that isn't owed at all." },
            { id: 'Q2-7', text: "What happens when adjusters 'cherry pick' claims?", options: ["Customers are happier.", "Leakage decreases.", "Difficult claims age and become problematic.", "Efficiency increases."], correctAnswerIndex: 2, explanation: "Ignoring complex files leads to delays, complaints, and potential lawsuits." }
        ]
    },
    {
        id: 'MOD-3',
        title: 'Module 3: Valuation Science',
        description: 'Master Class: RCV, ACV, Betterment, and the Principle of Indemnity.',
        lessons: [
            {
                id: 'L3-1',
                title: 'The Principle of Indemnity',
                duration: '6 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Restoration, Not Profit</h3>
                        <p className="text-gray-700">
                            The core legal principle of insurance is <strong>Indemnity</strong>: to restore the insured to the financial position they were in <em>moments before the loss</em>. Not better, not worse. If you pay $2,000 for a laptop that was only worth $400 at the time of loss, you have violated the principle of indemnity (and enriched the insured).
                        </p>
                        <InteractiveCaseStudy caseId="103" />
                        <RolePlayCard 
                            customer="My Plasma TV cost $3,000 in 2012. I want $3,000 to buy a new one."
                            adjuster="I understand you paid a premium price back then. However, insurance covers the *function* of the item. A $450 4K LED TV today provides a better picture than the 2012 Plasma. That is the 'Like Kind and Quality' replacement."
                            technique="Pivot to Functionality"
                        />
                        <p className="text-gray-700">
                            This conversation is difficult but necessary. The policy covers "Replacement Cost for Like Kind and Quality", not "Original Purchase Price".
                        </p>
                    </div>
                )
            },
            {
                id: 'L3-2',
                title: 'The Golden Rule of Valuation',
                duration: '5 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <div className="bg-blue-900 text-white p-6 rounded-xl shadow-lg border border-blue-800 mt-6">
                            <h4 className="font-bold text-brand-accent mb-2 flex items-center gap-2">
                                <CalculatorIcon className="h-5 w-5" /> The Golden Rule
                            </h4>
                            <p className="text-sm text-blue-100 leading-relaxed">
                                Always run <strong>Check Market</strong> <em>before</em> <strong>Smart Depreciator™</strong>. <br/><br/>
                                You must establish the accurate <em>Current Replacement Cost</em> base before you apply the depreciation percentage. If you depreciate the user's inflated estimate, you still overpay.
                            </p>
                        </div>
                        <InteractiveCaseStudy caseId="117" />
                        <InteractiveCaseStudy caseId="116" />
                    </div>
                )
            },
            {
                id: 'L3-3',
                title: 'Betterment & Obsolescence',
                duration: '5 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Tech Moves Fast</h3>
                        <p className="text-gray-700">
                            When an item is no longer made, we owe "Like Kind and Quality" (LKQ). 
                            <br/>- <strong>Electronics:</strong> Technology gets cheaper. A $2,000 PC from 2018 is worth $400 today.
                            <br/>- <strong>Furniture:</strong> Wood gets more expensive. A $500 table from 1990 might cost $1,200 to replace today.
                        </p>
                        <InteractiveCaseStudy caseId="101" />
                        <InteractiveCaseStudy caseId="108" />
                    </div>
                )
            }
        ],
        quiz: [
            { id: 'Q3-1', text: "What does LKQ stand for?", options: ["Low Known Quantity", "Like Kind and Quality", "Last Known Quote", "Legal Key Question"], correctAnswerIndex: 1, explanation: "Replacement is based on 'Like Kind and Quality' - a modern item with equivalent specifications." },
            { id: 'Q3-2', text: "How is Actual Cash Value (ACV) calculated?", options: ["RCV minus Depreciation", "RCV minus Deductible", "Original Purchase Price", "Market Value on eBay"], correctAnswerIndex: 0, explanation: "Actual Cash Value (ACV) is the Replacement Cost Value (RCV) minus depreciation for age/use." },
            { id: 'Q3-3', text: "Why shouldn't you depreciate the user's estimated value?", options: ["It is illegal.", "The user's estimate is often inflated; you must establish the correct RCV base first.", "It takes too long.", "Users are always correct."], correctAnswerIndex: 1, explanation: "Depreciating an inflated number still results in overpayment. Always Check Market first." },
            { id: 'Q3-4', text: "What determines the Depreciation Percentage?", options: ["The adjuster's mood.", "The brand of the item.", "The cause of loss.", "The item's age relative to its life expectancy."], correctAnswerIndex: 3, explanation: "Depreciation is a mathematical calculation: Age / Life Expectancy." },
            { id: 'Q3-5', text: "How do you value an obsolete item like a Plasma TV?", options: ["Pay the original price.", "Deny coverage.", "Find a used one on eBay.", "Find a modern equivalent (e.g. LED) with similar screen size."], correctAnswerIndex: 3, explanation: "You owe the functionality (LKQ). A modern LED TV replaces the function of the obsolete Plasma." },
            { id: 'Q3-6', text: "What is 'Betterment'?", options: ["Upgrading an item to a better model at the insurer's expense.", "Improving the claims process.", "Repairing an item.", "Depreciating an item."], correctAnswerIndex: 0, explanation: "Betterment occurs when the replacement puts the insured in a better position than before, which violates indemnity." },
            { id: 'Q3-7', text: "Which category of items typically appreciates in value?", options: ["Clothing.", "Electronics.", "Appliances.", "Antiques/Fine Art."], correctAnswerIndex: 3, explanation: "While most items depreciate, antiques and art can gain value over time." }
        ]
    },
    {
        id: 'MOD-4',
        title: 'Module 4: Digital Forensics',
        description: 'Using metadata, reverse image search, and pixel analysis to validate evidence.',
        lessons: [
            {
                id: 'L4-1',
                title: 'Visual Truth & Deepfakes',
                duration: '6 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Pixels Don't Lie</h3>
                        <p className="text-gray-700">
                            Fraudsters often download high-res photos from eBay or Reddit to prove ownership. Some even use Generative AI to create fake damage (e.g. cracks on a TV screen). Visual Truth uses pixel-level Error Level Analysis (ELA) to detect these forgeries.
                        </p>
                        <InteractiveCaseStudy caseId="102" />
                        <InteractiveCaseStudy caseId="126" />
                        <div className="p-4 bg-gray-100 rounded-lg border border-gray-200 text-sm">
                            <strong>Key Indicator:</strong> Inconsistent lighting. If the shadow of the TV goes left, but the shadow of the chair goes right, the image is composited.
                        </div>
                    </div>
                )
            },
            {
                id: 'L4-2',
                title: 'Metadata X-Ray',
                duration: '5 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">The Invisible Evidence</h3>
                        <p className="text-gray-700">
                            Every photo taken by a smartphone contains EXIF data (Exchangeable Image File Format). This includes:
                            <br/>- GPS Coordinates (Latitude/Longitude)
                            <br/>- Date & Time of Capture
                            <br/>- Device Model (e.g. iPhone 14 Pro)
                            <br/>- Software Version
                        </p>
                        <InteractiveCaseStudy caseId="111" />
                        <p className="text-gray-700">
                            If a user claims a photo was taken yesterday at their home, but the EXIF data says "2021" and "Miami, FL", you have proof of Material Misrepresentation.
                        </p>
                    </div>
                )
            },
            {
                id: 'L4-3',
                title: 'Document Forensics',
                duration: '5 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Paper Trails</h3>
                        <p className="text-gray-700">
                            Receipts and Invoices are often forged using templates found online. Look for:
                            <br/>1. <strong>Identical invoice numbers</strong> across different claims.
                            <br/>2. <strong>Font Mismatch:</strong> If the line items use Arial but the total uses Helvetica, it was edited.
                            <br/>3. <strong>Math errors:</strong> Forgers often fail to calculate tax correctly.
                        </p>
                        <InteractiveCaseStudy caseId="115" />
                        <InteractiveCaseStudy caseId="129" />
                    </div>
                )
            }
        ],
        quiz: [
            { id: 'Q4-1', text: "What is a 'Stock Photo' in this context?", options: ["A blurry photo.", "A photo of soup.", "A photo of inventory.", "A generic image downloaded from the internet to fake ownership."], correctAnswerIndex: 3, explanation: "Claimants use internet images to claim items they do not actually possess." },
            { id: 'Q4-2', text: "If metadata shows a photo was taken in Miami but the loss is in Chicago, what does this imply?", options: ["The weather was different.", "The user traveled.", "The GPS is broken.", "Potential fraud or misrepresentation."], correctAnswerIndex: 3, explanation: "Inconsistent geolocation is a major red flag that the photo does not depict the insured loss." },
            { id: 'Q4-3', text: "What does EXIF stand for?", options: ["Exchangeable Image File Format", "Extra Image File", "External Interface", "Expert Image Filter"], correctAnswerIndex: 0, explanation: "EXIF data stores camera settings, date, time, and GPS location within the image file." },
            { id: 'Q4-4', text: "Can metadata be stripped?", options: ["No, never.", "Yes, often by social media platforms or editing tools.", "Only by the government.", "Only on Android."], correctAnswerIndex: 1, explanation: "Metadata is fragile. Platforms like Facebook strip it. Missing metadata isn't proof of fraud, but its presence is proof of truth." },
            { id: 'Q4-5', text: "What does 'Pixel Signature' analysis detect?", options: ["The price of the item.", "Image color.", "Image size.", "If an image has been manipulated or photoshopped."], correctAnswerIndex: 3, explanation: "It looks for inconsistencies in noise patterns that suggest manipulation (e.g. pasting an item into a room)." },
            { id: 'Q4-6', text: "What is a common sign of a forged receipt?", options: ["Mismatched fonts or mathematical errors.", "It is wrinkled.", "It has a logo.", "It is black and white."], correctAnswerIndex: 0, explanation: "Forgers often edit text layers, resulting in font inconsistencies or bad math." },
            { id: 'Q4-7', text: "What is 'Generative Fill'?", options: ["An AI tool that can add fake damage to a photo.", "A receipt template.", "A type of insulation.", "A policy endorsement."], correctAnswerIndex: 0, explanation: "GenAI tools can realistically add fire or cracks to undamaged items." }
        ]
    },
    {
        id: 'MOD-5',
        title: 'Module 5: Policy & Compliance',
        description: 'Enforcing exclusions, limits, and state regulations without acting in Bad Faith.',
        lessons: [
            {
                id: 'L5-1',
                title: 'The Exclusion Matrix',
                duration: '7 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Words Matter</h3>
                        <p className="text-gray-700">
                            Insurance policies are contracts. Definitions matter.
                            <br/>- A "Drone" is an "Aircraft".
                            <br/>- An "E-Bike" is a "Motor Vehicle".
                            <br/>- A "Server" is "Business Property". 
                            <br/>Miscategorizing these items under general "Electronics" is the most common way carriers overpay.
                        </p>
                        <InteractiveCaseStudy caseId="104" />
                        <InteractiveCaseStudy caseId="109" />
                        <InteractiveCaseStudy caseId="120" />
                    </div>
                )
            },
            {
                id: 'L5-2',
                title: 'Special Limits of Liability',
                duration: '6 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">The Sub-Limit Trap</h3>
                        <p className="text-gray-700">
                            Certain categories of items are theft-prone and have low limits (Sub-Limits) in standard policies to keep premiums down.
                            <br/>- <strong>Jewelry/Watches/Furs:</strong> Usually $1,500 total for Theft.
                            <br/>- <strong>Firearms:</strong> Usually $2,500 for Theft.
                            <br/>- <strong>Cash/Coins:</strong> $200.
                            <br/>- <strong>Business Property (at home):</strong> $2,500.
                        </p>
                        <InteractiveCaseStudy caseId="113" />
                        <InteractiveCaseStudy caseId="118" />
                        <InteractiveCaseStudy caseId="123" />
                        <InteractiveCaseStudy caseId="130" />
                    </div>
                )
            },
            {
                id: 'L5-3',
                title: 'Bad Faith Avoidance',
                duration: '5 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">The Duty to Investigate</h3>
                        <p className="text-gray-700">
                            You cannot deny a claim based on a "hunch". You must conduct a reasonable investigation. The Asset Intelligence Portal provides the data trail (Pricing, Weather, Metadata) to PROVE your decision was reasonable.
                        </p>
                        <InteractiveCaseStudy caseId="125" />
                        <InteractiveCaseStudy caseId="127" />
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                            <strong className="text-red-900 block mb-1">Warning: Bad Faith</strong>
                            <p className="text-sm text-red-800">
                                If you deny a claim without checking the weather data (SkyWitness) or market value, you expose the carrier to Bad Faith litigation, which can cost 3x the original claim value + punitive damages.
                            </p>
                        </div>
                    </div>
                )
            }
        ],
        quiz: [
            { id: 'Q5-1', text: "How are 'Motorized Land Vehicles' (like E-Bikes) typically treated in HO-3 policies?", options: ["Excluded.", "Covered fully.", "Covered up to $500.", "Covered if garaged."], correctAnswerIndex: 0, explanation: "Motor vehicles (e-bikes, scooters) are generally excluded to push liability to auto policies." },
            { id: 'Q5-2', text: "What is the standard Special Limit for Business Property on premises?", options: ["$2,500", "$500", "$5,000", "$1,500"], correctAnswerIndex: 0, explanation: "ISO HO-3 standard is $2,500 for business property kept at the home." },
            { id: 'Q5-3', text: "Is a Drone typically considered an Aircraft?", options: ["Yes, triggering exclusions or limits.", "No, it's a toy.", "Only if it weighs > 55lbs.", "Depends on the color."], correctAnswerIndex: 0, explanation: "Many carriers classify drones as aircraft, triggering exclusions or specific sub-limits." },
            { id: 'Q5-4', text: "Why is Taxonomy (Categorization) important?", options: ["It looks organized.", "It changes the deductible.", "It helps AI run faster.", "It enforces Special Limits (e.g. Jewelry vs Clothing)."], correctAnswerIndex: 3, explanation: "Misclassifying jewelry as 'Clothing' avoids the theft sub-limit ($1,500). Taxonomy enforces the limit." },
            { id: 'Q5-5', text: "What constitutes 'Bad Faith'?", options: ["A claim denied without reasonable investigation.", "A fraudulent claim.", "A claim filed late.", "A small claim."], correctAnswerIndex: 0, explanation: "Carriers must investigate fairly. Denying without proof or ignoring evidence can lead to Bad Faith lawsuits." },
            { id: 'Q5-6', text: "What is the limit for 'Money/Bank Notes'?", options: ["$200", "$500", "$1,000", "$2,500"], correctAnswerIndex: 0, explanation: "Cash limits are very low, typically $200, to prevent fraud." },
            { id: 'Q5-7', text: "Are 'Mysterious Disappearance' claims covered by standard HO-3?", options: ["Only for jewelry.", "Yes.", "Always.", "No, theft requires evidence of taking."], correctAnswerIndex: 3, explanation: "Simply losing an item is not a covered peril under standard policies." }
        ]
    },
    {
        id: 'MOD-6',
        title: 'Module 6: Advanced Fraud Patterns',
        description: 'Detecting Soft Fraud, Padding, Organized Rings, and Behavioral Anomalies.',
        lessons: [
            {
                id: 'L6-1',
                title: 'Padding Patrol',
                duration: '6 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Death by a Thousand Socks</h3>
                        <p className="text-gray-700">
                            Soft Fraud isn't about fake items; it's about inflating the count of real ones. Adding 20 extra pairs of socks or 5 extra phone chargers seems harmless to a claimant, but it adds up to millions in leakage.
                        </p>
                        <InteractiveCaseStudy caseId="110" />
                        <InteractiveCaseStudy caseId="114" />
                    </div>
                )
            },
            {
                id: 'L6-2',
                title: 'The Phantom Event',
                duration: '5 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Weather Verification</h3>
                        <p className="text-gray-700">
                            "Lightning Surge" is a common fake cause of loss for broken electronics. It's hard to disprove—unless you check the weather history. SkyWitness checks historical weather to disprove it.
                        </p>
                        <InteractiveCaseStudy caseId="105" />
                        <InteractiveCaseStudy caseId="122" />
                    </div>
                )
            },
            {
                id: 'L6-3',
                title: 'Behavioral Red Flags',
                duration: '5 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">It's Not Just What, It's How</h3>
                        <p className="text-gray-700">
                            Fraudsters behave differently than victims.
                            <br/>- They submit claims at 3 AM.
                            <br/>- They round numbers ($500.00, not $499.99).
                            <br/>- They have no emotional attachment to items.
                            <br/>- They upload high-velocity batches (50 items in 5 mins).
                        </p>
                        <ConceptFlashcard 
                            title="Velocity Checks"
                            content="A user who adds 50 items in 10 minutes is likely copy-pasting a list, not walking around their burned house."
                            icon={<ClockIcon className="h-6 w-6" />}
                        />
                        <InteractiveCaseStudy caseId="119" />
                        <InteractiveCaseStudy caseId="121" />
                    </div>
                )
            }
        ],
        quiz: [
            { id: 'Q6-1', text: "What is 'Padding'?", options: ["Protective packaging.", "Adding extra items to inflate the claim value.", "Insulation.", "Secure login."], correctAnswerIndex: 1, explanation: "Padding is 'Soft Fraud'—exaggerating quantity to gain financial advantage." },
            { id: 'Q6-2', text: "How does SkyWitness verify 'Lightning' claims?", options: ["It calls the power company.", "It checks the news.", "It looks for scorch marks.", "It checks historical weather data for the specific location."], correctAnswerIndex: 3, explanation: "It uses objective meteorological data to confirm if the peril actually existed." },
            { id: 'Q6-3', text: "What is 'Collusive Fraud'?", options: ["Fraud involving glue.", "Fraud committed alone.", "Accidental fraud.", "Fraud involving multiple parties (e.g. User + Contractor)."], correctAnswerIndex: 3, explanation: "Collusion involves cooperation, often between a policyholder and a vendor (fake invoices)." },
            { id: 'Q6-4', text: "What indicates a 'Paper' loss?", options: ["Paper cuts.", "Loss of books.", "Identical receipts used across different claims.", "Receipts printed on paper."], correctAnswerIndex: 2, explanation: "Organized rings often recycle the same receipts/photos for multiple claims." },
            { id: 'Q6-5', text: "Why is 'Lightning' a popular fake cause of loss?", options: ["It covers everything.", "It's scary.", "It's common.", "It leaves no visible external evidence on electronics."], correctAnswerIndex: 3, explanation: "Lightning damage is invisible to the naked eye, making it a popular lie for broken electronics." },
            { id: 'Q6-6', text: "Which behavioral trait is a red flag?", options: ["Submitting claims during the day.", "Listing exact prices (e.g. $19.99).", "Submitting 50 items in 5 minutes (High Velocity).", "Calling customer support."], correctAnswerIndex: 2, explanation: "High velocity submission suggests copy-pasting a prepared list rather than organic inventory." },
            { id: 'Q6-7', text: "What is 'Rounding Bias'?", options: ["Rounding corners.", "A math error.", "Pricing every item at a round number (e.g. $100, $50).", "Rounding up to the nearest dollar."], correctAnswerIndex: 2, explanation: "Real prices are rarely round numbers. A list of $50, $100, $200 items is suspicious." }
        ]
    },
    {
        id: 'MOD-7',
        title: 'Module 7: Revenue Recovery',
        description: 'Subrogation, Salvage, and Appraisal opportunities.',
        lessons: [
            {
                id: 'L7-1',
                title: 'Subro Spotter',
                duration: '5 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Someone Else is to Blame</h3>
                        <p className="text-gray-700">
                            Subrogation recovers costs from a liable third party (manufacturer, neighbor, contractor). Don't miss these opportunities.
                        </p>
                        <InteractiveCaseStudy caseId="107" />
                        <InteractiveCaseStudy caseId="128" />
                    </div>
                )
            },
            {
                id: 'L7-2',
                title: 'Specialty Triage',
                duration: '4 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Know What You Don't Know</h3>
                        <p className="text-gray-700">
                            Never attempt to value Fine Art, Antiques, or Custom Jewelry yourself. These require a specialist. The Triage tool automatically routes these items to experts.
                        </p>
                        <InteractiveCaseStudy caseId="106" />
                    </div>
                )
            }
        ],
        quiz: [
            { id: 'Q7-1', text: "What is Subrogation?", options: ["Paying a claim twice.", "Denying a claim.", "A type of submarine.", "The right to recover costs from the liable party."], correctAnswerIndex: 3, explanation: "If a third party caused the loss, the carrier pays the insured, then sues the third party to recover funds." },
            { id: 'Q7-2', text: "Which item suggests subrogation potential?", options: ["Storm damaged roof.", "Stolen bike.", "Exploding lithium battery.", "Lost ring."], correctAnswerIndex: 2, explanation: "An exploding battery suggests a manufacturing defect, making the manufacturer liable." },
            { id: 'Q7-3', text: "Why use 'Specialty Triage'?", options: ["To speed up payment.", "To deny coverage.", "To route complex items (Art/Antiques) to experts.", "To make the user feel special."], correctAnswerIndex: 2, explanation: "Adjusters lack the expertise to value rare items. Experts prevent over/underpayment." },
            { id: 'Q7-4', text: "What must you do with a 'defective' item?", options: ["Throw it away.", "Give it to the user.", "Recycle it.", "Preserve it as evidence."], correctAnswerIndex: 3, explanation: "Without the physical evidence, you have no case to prove the defect and win the subrogation case." },
            { id: 'Q7-5', text: "What is 'Salvage'?", options: ["Saving a file.", "Bandage.", "Recovering value by selling damaged property.", "Garbage."], correctAnswerIndex: 2, explanation: "Carriers can sell damaged items (salvage) to offset the claim cost." },
            { id: 'Q7-6', text: "If a contractor causes a fire, who is liable?", options: ["No one.", "The fire department.", "The contractor (and their insurance).", "The homeowner."], correctAnswerIndex: 2, explanation: "The contractor's negligence makes them liable for the damages." },
            { id: 'Q7-7', text: "What items typically require Specialty Appraisal?", options: ["TVs.", "Furniture.", "Fine Art & Antiques.", "Clothing."], correctAnswerIndex: 2, explanation: "Standard market search tools cannot value unique or rare items accurately." }
        ]
    },
    {
        id: 'MOD-8',
        title: 'Module 8: Next-Gen Capabilities',
        description: 'The future of claims: Live FNOL, Video Triage, and Proactive Risk Shields.',
        lessons: [
            {
                id: 'L8-1',
                title: 'Live FNOL Co-Pilot',
                duration: '6 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Empathy + Efficiency</h3>
                        <p className="text-gray-700">
                            The "First Notice of Loss" (FNOL) is the most critical moment in a claim. Using Gemini Live, our AI assistant can now interview policyholders in real-time via voice. It transcribes the call, extracts key entities (Items, Dates, Causes), and flags inconsistencies instantly.
                        </p>
                        <InteractiveCaseStudy caseId="131" />
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm flex gap-3">
                            <MicrophoneIcon className="h-6 w-6 text-brand-primary shrink-0" />
                            <div>
                                <strong>Adjuster Benefit:</strong> You don't need to type. The AI populates the Manifest automatically based on the conversation, letting you focus on comforting the customer.
                            </div>
                        </div>
                    </div>
                )
            },
            {
                id: 'L8-2',
                title: 'Digital Field Adjuster',
                duration: '5 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Eyes on Scene, Without the Van</h3>
                        <p className="text-gray-700">
                            Sending a human adjuster to a house costs ~$400. For minor damage (e.g. "scratched floor"), this kills efficiency. The Digital Field Adjuster analyzes 'before-and-after' photos to assess severity, calculate a repairability index, and generate a repair vs. replace plan in seconds.
                        </p>
                        <InteractiveCaseStudy caseId="132" />
                        <p className="text-gray-700">
                            It distinguishes between <strong>Cosmetic Damage</strong> (Repair) and <strong>Structural Damage</strong> (Replace), allowing you to settle small claims instantly without a site visit, saving immense time and cost.
                        </p>
                    </div>
                )
            },
            {
                id: 'L8-3',
                title: 'Proactive Risk Shield',
                duration: '5 min',
                content: (
                    <div className="space-y-6 text-gray-800">
                        <h3 className="text-xl font-bold text-neutral-dark">Preventing the Claim</h3>
                        <p className="text-gray-700">
                            The best claim is the one that never happens. By aggregating data from millions of PROVENIQ Home inventories, we identify widespread risks—like a specific brand of toaster that catches fire, or recalled rubber washing machine hoses.
                        </p>
                        <InteractiveCaseStudy caseId="133" />
                        <p className="text-gray-700">
                            We then launch <strong>Mitigation Campaigns</strong>, sending push notifications to affected users with coupons for safer replacement parts. This shifts insurance from "Repair" to "Protect".
                        </p>
                    </div>
                )
            }
        ],
        quiz: [
            { id: 'Q8-1', text: "What is the main advantage of Live FNOL intake?", options: ["It replaces all humans.", "It denies claims.", "It makes calls cheaper.", "It transcribes calls and extracts data automatically."], correctAnswerIndex: 3, explanation: "It automates the administrative burden of data entry during the call." },
            { id: 'Q8-2', text: "When should you use the Digital Field Adjuster?", options: ["For total fire loss.", "For assessing minor damage from photos/videos.", "For medical claims.", "For auto accidents."], correctAnswerIndex: 1, explanation: "It is best suited for triaging visible, superficial property damage." },
            { id: 'Q8-3', text: "How does the Proactive Risk Shield save money?", options: ["By denying coverage.", "By increasing deductibles.", "By preventing losses via targeted alerts.", "By cancelling policies."], correctAnswerIndex: 2, explanation: "Preventing a water claim (avg $15k) is cheaper than paying for it." },
            { id: 'Q8-4', text: "What technology powers the Live FNOL Co-Pilot?", options: ["Gemini Live (Real-time Audio).", "Basic Chatbot.", "Email.", "Fax."], correctAnswerIndex: 0, explanation: "It uses low-latency audio streaming models to converse naturally." },
            { id: 'Q8-5', text: "What is the 'repairability index' in the Digital Field Adjuster?", options: ["The cost of repairs.", "A score from 0-100 indicating how likely a repair is to succeed.", "The age of the item.", "The time it takes to repair."], correctAnswerIndex: 1, explanation: "A high repairability index suggests a simple, cost-effective repair is feasible." }
        ]
    },
    {
        id: 'MOD-9',
        title: 'Module 9: CAIS Certification Exam',
        description: 'Certified Asset Intelligence Specialist Final Exam.',
        lessons: [],
        quiz: [
            // Policy & Compliance
            { id: 'FE-1', text: "Which policy exclusion typically applies to E-Bikes?", options: ["Watercraft", "Motorized Land Vehicles", "Aircraft", "Business Property"], correctAnswerIndex: 1, explanation: "Standard HO-3 excludes vehicles subject to motor vehicle registration." },
            { id: 'FE-2', text: "What is the standard limit for Business Property on premises?", options: ["$500", "$5,000", "$1,500", "$2,500"], correctAnswerIndex: 3, explanation: "ISO HO-3 standard is $2,500." },
            { id: 'FE-3', text: "Claim for 'Business interruption' on HO-3. Action?", options: ["Pay.", "Ignore.", "Audit.", "Refer to Policy Guardian (Exclusion)."], correctAnswerIndex: 3, explanation: "Homeowner policies exclude business income." },
            { id: 'FE-4', text: "Is 'Mysterious Disappearance' covered on HO-3?", options: ["Yes.", "No, usually requires theft evidence.", "Always.", "Only for jewelry."], correctAnswerIndex: 1, explanation: "Losing something is not usually a covered peril." },
            { id: 'FE-5', text: "Claiming a Rolex without a serial number. Tool?", options: ["Visual Truth (Stock Photo check).", "SkyWitness.", "Policy Guardian.", "Bundle Breakout."], correctAnswerIndex: 0, explanation: "Verify if the photo is real or internet-sourced." },
            
            // Valuation
            { id: 'FE-6', text: "True or False: You should depreciate the policyholder's estimated replacement cost.", options: ["True", "False"], correctAnswerIndex: 1, explanation: "False. You must establish the accurate market RCV first, then depreciate." },
            { id: 'FE-7', text: "How do you handle an obsolete 2010 Plasma TV?", options: ["Deny.", "Pay for a Plasma.", "Pay original cost.", "Price a modern LED equivalent (LKQ)."], correctAnswerIndex: 3, explanation: "Valuation is based on Like Kind & Quality functionality." },
            { id: 'FE-8', text: "What is 'Betterment'?", options: ["Improving the process.", "Putting the insured in a better position than before the loss (Not allowed).", "Being nice.", "Paying fast."], correctAnswerIndex: 1, explanation: "Indemnity is about restoring to pre-loss state, not upgrading." },
            { id: 'FE-9', text: "Why verify 'Condition'?", options: ["Curiosity.", "It doesn't matter.", "To shame the user.", "It affects ACV (Depreciation)."], correctAnswerIndex: 3, explanation: "Better condition = Less depreciation." },
            { id: 'FE-10', text: "When should you use a Specialty Appraiser?", options: ["For all electronics.", "For Fine Art, Antiques, and Custom Jewelry.", "For clothing.", "For furniture."], correctAnswerIndex: 1, explanation: "Standard web tools fail on unique items." },

            // Fraud
            { id: 'FE-11', text: "What does a 'High Risk' fraud score require?", options: ["Immediate Denial.", "Police Report.", "Automatic Payment.", "Mandatory Adjuster Review."], correctAnswerIndex: 3, explanation: "High risk flags pause automation for human eyes." },
            { id: 'FE-12', text: "Padding Patrol detects what?", options: ["Hard Fraud (Staged).", "Arson.", "Soft Fraud (Inflation).", "Theft."], correctAnswerIndex: 2, explanation: "Padding is inflating the count of low value items." },
            { id: 'FE-13', text: "Visual Truth analyzes what?", options: ["Text descriptions.", "Image pixels for manipulation/stock photos.", "Receipt totals.", "Voice stress."], correctAnswerIndex: 1, explanation: "It looks for image inconsistencies." },
            { id: 'FE-14', text: "Receipt date is *after* the loss date. Suspicious?", options: ["No.", "Yes, implies purchasing replacement to fake ownership.", "Maybe.", "Always Fraud."], correctAnswerIndex: 1, explanation: "Buying an item to photograph it for a claim is common fraud." },
            { id: 'FE-15', text: "50 pairs of socks claimed. Tool to use?", options: ["Subro Spotter.", "Padding Patrol.", "Visual Truth.", "Check Market."], correctAnswerIndex: 1, explanation: "Detects volume anomalies." },

            // Forensics
            { id: 'FE-16', text: "EXIF data includes?", options: ["Price.", "GPS & Time.", "Owner Name.", "Warranty."], correctAnswerIndex: 1, explanation: "Exchangeable Image File format stores location and time." },
            { id: 'FE-17', text: "If metadata is missing, the claim is...", options: ["Fraudulent.", "Verified.", "Denied.", "Inconclusive (Metadata is fragile)."], correctAnswerIndex: 3, explanation: "Missing metadata is not proof of fraud, as social media strips it." },
            { id: 'FE-18', text: "What is the 'Golden Record'?", options: ["The policy limit.", "The police report.", "The check.", "Pre-Loss verified inventory."], correctAnswerIndex: 3, explanation: "Data verified before a loss occurs is the highest trust level." },
            { id: 'FE-19', text: "What validates a receipt?", options: ["The total amount.", "The item name.", "The paper color.", "Reconciling Line Items + Date + Store Name."], correctAnswerIndex: 3, explanation: "Full reconciliation requires matching multiple data points." },
            { id: 'FE-20', text: "User claims 'Gaming Setup' $5k. Tool?", options: ["Bundle Breakout.", "Subro Spotter.", "Padding Patrol.", "Visual Truth."], correctAnswerIndex: 0, explanation: "Break vague bundles into line items." },

            // Workflow
            { id: 'FE-21', text: "What is 'Leakage'?", options: ["Water damage.", "Overpayment/Process Waste.", "Underpayment.", "A pipe burst."], correctAnswerIndex: 1, explanation: "Financial loss due to inefficiency or error." },
            { id: 'FE-22', text: "Active Triage prioritizes...", options: ["First In, First Out.", "Risk & Readiness.", "Last In, First Out.", "Alphabetical."], correctAnswerIndex: 1, explanation: "Focus on what matters most." },
            { id: 'FE-23', text: "Subrogation targets...", options: ["The policyholder.", "A liable third party.", "The insurance agent.", "The government."], correctAnswerIndex: 1, explanation: "Recovering costs from the at-fault party." },
            { id: 'FE-24', text: "Why preserve evidence?", options: ["To hoard it.", "To support subrogation/denial.", "To sell it.", "No reason."], correctAnswerIndex: 1, explanation: "Without evidence, you have no case." },
            { id: 'FE-25', text: "User claims 'Lightning' but SkyWitness says 'Sunny'. Outcome?", options: ["Pay it.", "Ignore weather.", "Deny immediately.", "Flag for investigation."], correctAnswerIndex: 3, explanation: "Inconsistent facts require investigation." },
            
            // Next Gen
            { id: 'FE-26', text: "Live FNOL uses AI to...", options: ["Pay claims instantly.", "Transcribe voice calls and extract key entities.", "Generate photos.", "Create policy documents."], correctAnswerIndex: 1, explanation: "Real-time transcription aids data entry." },
            { id: 'FE-27', text: "The Proactive Risk Shield relies on data from...", options: ["The Weather Channel.", "Social Media.", "PROVENIQ Home user inventories.", "The Police."], correctAnswerIndex: 2, explanation: "Aggregated inventory data reveals widespread product risks." },
            { id: 'FE-28', text: "A video of a scratched floor should be routed to...", options: ["A Structural Engineer.", "The Digital Field Adjuster (Video Triage).", "A Lawyer.", "The CEO."], correctAnswerIndex: 1, explanation: "Video analysis is perfect for surface damage assessment." },
            { id: 'FE-29', text: "What is a 'Mitigation Campaign'?", options: ["Marketing emails.", "Proactive alerts to users to fix risks before they fail.", "Political ads.", "Employee training."], correctAnswerIndex: 1, explanation: "Preventing claims by alerting users to known risks." },
            { id: 'FE-30', text: "Does Digital Field Adjuster require a site visit?", options: ["Yes.", "Only for fires.", "Sometimes.", "No, it uses user-generated video."], correctAnswerIndex: 3, explanation: "It is designed to eliminate the need for physical inspection of minor damage." },
            
            // NEW EXAM QUESTIONS
            { id: 'FE-31', text: "Where in the Claims Workstation would you create a reminder to call a contractor?", options: ["Notes Tab", "Financials Tab", "Documents Tab", "Activities Tab"], correctAnswerIndex: 3, explanation: "The Activities tab is the to-do list for managing and tracking tasks." },
            { id: 'FE-32', text: "What is the primary input for the Digital Field Adjuster's analysis?", options: ["The user's description of the damage.", "A single photo of the damaged item.", "Pre-loss and Post-loss photos of the item.", "The item's original receipt."], correctAnswerIndex: 2, explanation: "The AI compares the 'before' and 'after' state of the asset to accurately assess the extent of the damage." },
            { id: 'FE-33', text: "The 'Claim Diary' is another name for which feature?", options: ["The Manifest.", "The Financials Hub.", "The Notes Tab.", "The Activities List."], correctAnswerIndex: 2, explanation: "The Notes tab serves as the official, chronological diary of the claim." },
            { id: 'FE-34', text: "What does the 'Repairability Index' from the Digital Field Adjuster signify?", options: ["How much the repair will cost.", "A score indicating the likelihood a repair will be successful.", "How long the repair will take.", "The age of the item."], correctAnswerIndex: 1, explanation: "A high repairability index (e.g., 95%) suggests a simple, cost-effective repair is feasible and replacement is likely unnecessary." },
            { id: 'FE-35', text: "Which Workstation tab would you use to set the initial reserve for a claim?", options: ["Financials Tab", "Notes Tab", "Activities Tab", "Manifest Tab"], correctAnswerIndex: 0, explanation: "The Financials tab is the central hub for managing all monetary aspects of the claim, including reserves and payments." },
            
            { id: 'FE-36', text: "What is the key benefit of PROVENIQ Home for the adjuster?", options: ["It reduces administrative friction.", "It increases emails.", "It hides data.", "It costs more."], correctAnswerIndex: 0, explanation: "It removes the need to chase documents." },
            { id: 'FE-37', text: "If a user claims $10k jewelry with no receipts and no photos, what should you do?", options: ["Pay it.", "Deny it.", "Ask for 'wearing photos' from social media history.", "Call the police."], correctAnswerIndex: 2, explanation: "Find alternative forensic evidence of possession." },
            { id: 'FE-38', text: "Can AI detect if a crack on a TV screen is fake?", options: ["No.", "Yes, via pixel noise analysis (Visual Truth).", "Sometimes.", "Only if it's large."], correctAnswerIndex: 1, explanation: "Generative AI leaves pixel artifacts that forensic tools can spot." },
            { id: 'FE-39', text: "What is the best way to handle a vague 'Home Gym' claim?", options: ["Pay the estimated value.", "Use Bundle Breakout to estimate components.", "Deny it.", "Ignore it."], correctAnswerIndex: 1, explanation: "Break it down into line items to check pricing." },
            { id: 'FE-40', text: "Why is 'Rounding Bias' a red flag?", options: ["It looks nice.", "It saves time.", "Calculators are precise.", "Real prices ($19.99) are rarely round numbers ($20.00)."], correctAnswerIndex: 3, explanation: "Humans estimate in round numbers; reality is precise." },
            { id: 'FE-41', text: "What should you do if a claim exceeds the coverage limit?", options: ["Pay the limit.", "Pay the excess.", "Ignore the limit.", "Cancel the policy."], correctAnswerIndex: 0, explanation: "The policy limit is the maximum payable amount." },
            { id: 'FE-42', text: "Is a 'Pre-Loss Verified' item safer to pay?", options: ["No.", "Yes, chain of custody is established.", "Maybe.", "It depends."], correctAnswerIndex: 1, explanation: "Proof of existence pre-date of loss is the gold standard." },
            { id: 'FE-43', text: "Which tool checks for Duplicate Claims?", options: ["Duplicate Detective.", "SkyWitness.", "Visual Truth.", "Padding Patrol."], correctAnswerIndex: 0, explanation: "It scans for repeated images or item descriptions across claims." },
            { id: 'FE-44', text: "Why does 'Touch Time' matter?", options: ["It doesn't.", "It measures efficiency and cost per claim.", "It tracks attendance.", "It's fun."], correctAnswerIndex: 1, explanation: "Every minute spent on a file costs the carrier money." },
            { id: 'FE-45', text: "If a user provides a receipt from a store that doesn't exist, what is it?", options: ["A mistake.", "Hard Fraud.", "Soft Fraud.", "Padding."], correctAnswerIndex: 1, explanation: "Fabricating evidence is a criminal act (Hard Fraud)." },
        ]
    }
];

const CertificateView: React.FC = () => {
    return (
        <div className="w-full h-full p-6 lg:p-8 flex flex-col items-center justify-center bg-gray-50">
            <div className="bg-white shadow-2xl rounded-2xl border-4 border-brand-accent p-8 w-full max-w-4xl aspect-[4/3] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute -inset-4 opacity-10">
                    {/* Decorative background */}
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{stopColor: 'rgba(59, 130, 246, 0.3)'}} />
                                <stop offset="100%" style={{stopColor: 'rgba(37, 99, 235, 0)'}} />
                            </linearGradient>
                        </defs>
                        <rect width="100" height="100" fill="url(#grad1)" />
                    </svg>
                </div>
                <div className="text-center z-10">
                    <div className="flex justify-center mb-6">
                        <TrophyIcon className="h-24 w-24 text-yellow-500" />
                    </div>
                    <p className="text-xl font-semibold text-gray-500 uppercase tracking-widest">Certificate of Completion</p>
                    <h2 className="text-5xl font-black text-neutral-dark my-4 tracking-tight">Alex Johnson</h2>
                    <p className="text-lg text-gray-600">has successfully completed the training and is hereby designated a</p>
                    <h3 className="text-3xl font-bold text-brand-primary my-6">Certified Asset Intelligence Specialist (CAIS)</h3>
                    <div className="flex items-center justify-center gap-12 mt-12">
                        <div>
                            <p className="text-sm font-bold border-b-2 border-gray-300 pb-1">Jane Doe</p>
                            <p className="text-xs text-gray-400 mt-1">Head of Training</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold border-b-2 border-gray-300 pb-1">{new Date().toLocaleDateString()}</p>
                            <p className="text-xs text-gray-400 mt-1">Date of Completion</p>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs text-gray-400">
                    ClaimsIQ Academy
                </div>
            </div>
             <div className="mt-8 flex gap-4">
                <button
                    onClick={() => window.print()} // A simple print function
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-dark hover:bg-black text-white rounded-lg font-medium text-sm transition-colors"
                >
                    <PrinterIcon className="h-4 w-4" /> Print Certificate
                </button>
                 <button
                    onClick={() => alert('Downloading PDF...')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors border border-gray-300"
                >
                    <ArrowDownTrayIcon className="h-4 w-4" /> Download PDF
                </button>
            </div>
        </div>
    );
};

const TrainingScreen: React.FC = () => {
    const [activeModuleId, setActiveModuleId] = useState<string>(TRAINING_MODULES[0].id);
    const [activeLessonId, setActiveLessonId] = useState<string>(TRAINING_MODULES[0].lessons[0]?.id || '');
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
    const [showCertificate, setShowCertificate] = useState(false); 
    
    // Quiz State
    const [viewMode, setViewMode] = useState<'LESSON' | 'QUIZ'>('LESSON');
    const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
    const [quizState, setQuizState] = useState<{
        questionIndex: number;
        answers: Record<string, number>;
        score: number;
        isFinished: boolean;
        showFeedback: boolean;
    }>({
        questionIndex: 0,
        answers: {},
        score: 0,
        isFinished: false,
        showFeedback: false
    });

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToTop = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const activeModule = TRAINING_MODULES.find(m => m.id === activeModuleId) || TRAINING_MODULES[0];
    const activeLesson = activeModule.lessons.find(l => l.id === activeLessonId) || activeModule.lessons[0];

    // Quiz Initialization Logic (Shuffling and Subsetting)
    const initializeQuiz = (module: Module) => {
        if (!module.quiz || module.quiz.length === 0) {
            setActiveQuizQuestions([]);
            return;
        }
        
        // 1. Create a copy of the pool
        const pool = [...module.quiz];
        
        // 2. Fisher-Yates Shuffle
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        // 3. Select Subset
        // Exam (Mod 9) gets 20 questions, Standard Modules get 5 (or all if < 5)
        const count = module.id === 'MOD-9' ? 20 : 5;
        const selected = pool.slice(0, Math.min(count, pool.length));
        
        setActiveQuizQuestions(selected);
        setQuizState({
            questionIndex: 0,
            answers: {},
            score: 0,
            isFinished: false,
            showFeedback: false
        });
    };

    useEffect(() => {
        if (activeModule.lessons.length === 0 && activeModule.quiz) {
            setViewMode('QUIZ');
            // If entering a Quiz-only module (like Exam), init immediately
            // Only init if we haven't already (or if we switched modules)
            // We check if the current questions belong to the active module by checking the ID prefix roughly
            // Or simpler: just always init on module switch.
            initializeQuiz(activeModule);
        } else {
            setViewMode('LESSON');
        }
        scrollToTop();
    }, [activeModuleId]);

    const handleStartQuiz = () => {
        initializeQuiz(activeModule);
        setViewMode('QUIZ');
        scrollToTop();
    };

    const handleMarkComplete = () => {
        const newSet = new Set(completedLessons);
        if (activeLesson) newSet.add(activeLesson.id);
        setCompletedLessons(newSet);

        const currentLessonIndex = activeModule.lessons.findIndex(l => l.id === activeLessonId);
        
        if (currentLessonIndex < activeModule.lessons.length - 1) {
            setActiveLessonId(activeModule.lessons[currentLessonIndex + 1].id);
            scrollToTop();
        } 
        else if (activeModule.quiz && activeModule.quiz.length > 0) {
            handleStartQuiz();
        }
        else {
            advanceToNextModule();
        }
    };

    const handlePrevious = () => {
        const currentLessonIndex = activeModule.lessons.findIndex(l => l.id === activeLessonId);
        
        if (currentLessonIndex > 0) {
            setActiveLessonId(activeModule.lessons[currentLessonIndex - 1].id);
            setViewMode('LESSON');
            scrollToTop();
        } else {
            const currentModuleIndex = TRAINING_MODULES.findIndex(m => m.id === activeModuleId);
            if (currentModuleIndex > 0) {
                const prevModule = TRAINING_MODULES[currentModuleIndex - 1];
                setActiveModuleId(prevModule.id);
                if (prevModule.quiz && prevModule.lessons.length > 0) {
                     // Go to quiz of previous module? Or last lesson?
                     // Let's go to last lesson for simplicity
                     setActiveLessonId(prevModule.lessons[prevModule.lessons.length - 1].id);
                     setViewMode('LESSON');
                } else if (prevModule.lessons.length > 0) {
                     setActiveLessonId(prevModule.lessons[prevModule.lessons.length - 1].id);
                }
                scrollToTop();
            }
        }
    };

    const advanceToNextModule = () => {
        const currentModuleIndex = TRAINING_MODULES.findIndex(m => m.id === activeModuleId);
        
        const newModSet = new Set(completedModules);
        newModSet.add(activeModuleId);
        setCompletedModules(newModSet);

        if (currentModuleIndex < TRAINING_MODULES.length - 1) {
            const nextModule = TRAINING_MODULES[currentModuleIndex + 1];
            setActiveModuleId(nextModule.id);
            if (nextModule.lessons.length > 0) {
                setActiveLessonId(nextModule.lessons[0].id);
                setViewMode('LESSON');
            } else if (nextModule.quiz) {
                // initializeQuiz(nextModule); // Handled by useEffect
                setViewMode('QUIZ');
            }
        } else {
            setShowCertificate(true);
            scrollToTop();
        }
    };

    const handleQuizAnswer = (answerIndex: number) => {
        if (activeQuizQuestions.length === 0) return;
        
        const currentQuestion = activeQuizQuestions[quizState.questionIndex];
        const isCorrect = answerIndex === currentQuestion.correctAnswerIndex;

        const newAnswers = { ...quizState.answers, [currentQuestion.id]: answerIndex };
        
        setQuizState(prev => ({
            ...prev,
            answers: newAnswers,
            showFeedback: true,
            score: isCorrect ? prev.score + 1 : prev.score
        }));
    };

    const handleNextQuestion = () => {
        if (quizState.questionIndex < activeQuizQuestions.length - 1) {
            setQuizState(prev => ({
                ...prev,
                questionIndex: prev.questionIndex + 1,
                showFeedback: false
            }));
            scrollToTop();
        } else {
            setQuizState(prev => ({ ...prev, isFinished: true, showFeedback: false }));
            const newModSet = new Set(completedModules);
            newModSet.add(activeModuleId);
            setCompletedModules(newModSet);
            scrollToTop();
        }
    };

    const totalLessons = TRAINING_MODULES.reduce((acc, m) => acc + m.lessons.length, 0);
    const progressPercentage = Math.round(((completedLessons.size + completedModules.size) / (totalLessons + TRAINING_MODULES.length)) * 100);

    if (showCertificate) {
        return <CertificateView />;
    }

    return (
        <div className="w-full h-full p-6 lg:p-8 flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header / Hero - Fixed Height */}
            <div className="shrink-0 relative bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl p-8 text-white shadow-xl overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <AcademicCapIcon className="h-8 w-8 text-brand-accent" />
                            <h1 className="text-3xl font-bold tracking-tight">ClaimsIQ Academy</h1>
                        </div>
                        <p className="text-blue-100 max-w-xl text-lg">
                            Master the Asset Intelligence Portal. Complete all modules to earn your Certified Specialist credentials.
                        </p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 w-full md:w-64 border border-white/20">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold uppercase tracking-wider">Your Progress</span>
                            <span className="text-xl font-bold text-brand-accent">{Math.min(100, progressPercentage)}%</span>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2">
                            <div 
                                className="bg-brand-accent h-2 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${Math.min(100, progressPercentage)}%` }}
                            ></div>
                        </div>
                        <div className="mt-2 text-xs text-blue-200">
                            {completedLessons.size} Lessons • {completedModules.size} Modules Completed
                        </div>
                    </div>
                </div>
                
                <AcademicCapIcon className="absolute -bottom-12 -right-12 h-64 w-64 text-white opacity-5 pointer-events-none" />
            </div>

            {/* Main Content Grid - Takes remaining space */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar: Curriculum - Internally Scrollable */}
                <div className="lg:col-span-4 xl:col-span-3 h-full overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4">
                    <div className="sticky top-0 bg-neutral-light z-10 py-2">
                        <h2 className="text-xl font-bold text-neutral-dark flex items-center gap-2">
                            <BookOpenIcon className="h-5 w-5 text-gray-500" />
                            Curriculum
                        </h2>
                    </div>
                    
                    <div className="space-y-4 pb-4">
                        {TRAINING_MODULES.map((module, moduleIndex) => {
                            const isModuleLocked = moduleIndex > 0 && !completedModules.has(TRAINING_MODULES[moduleIndex - 1].id);
                            
                            return (
                            <div key={module.id} className={`bg-white rounded-lg shadow-sm border overflow-hidden ${activeModuleId === module.id ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-gray-200'} ${isModuleLocked ? 'opacity-60' : ''}`}>
                                <button 
                                    disabled={isModuleLocked}
                                    onClick={() => {
                                        setActiveModuleId(module.id);
                                        if (module.lessons.length > 0) {
                                            setActiveLessonId(module.lessons[0].id);
                                            setViewMode('LESSON');
                                        } else if (module.quiz) {
                                            // initializeQuiz(module); // Handled by useEffect
                                            setViewMode('QUIZ');
                                        }
                                    }}
                                    className={`w-full text-left p-4 border-l-4 transition-colors ${
                                        activeModuleId === module.id 
                                        ? 'border-l-brand-primary bg-blue-50/50' 
                                        : 'border-l-transparent hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-bold ${activeModuleId === module.id ? 'text-brand-primary' : 'text-neutral-dark'} flex items-center gap-2`}>
                                            {isModuleLocked && <LockClosedIcon className="h-4 w-4 text-gray-400" />}
                                            {module.title}
                                        </h3>
                                        {completedModules.has(module.id) && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{module.description}</p>
                                </button>
                                
                                {activeModuleId === module.id && module.lessons.length > 0 && (
                                    <div className="border-t border-gray-100 bg-gray-50/50">
                                        {module.lessons.map((lesson, lessonIndex) => {
                                            const isCompleted = completedLessons.has(lesson.id);
                                            const isActive = activeLessonId === lesson.id && viewMode === 'LESSON';
                                            const isLessonLocked = lessonIndex > 0 && !completedLessons.has(module.lessons[lessonIndex - 1].id);

                                            return (
                                                <button
                                                    key={lesson.id}
                                                    disabled={isLessonLocked}
                                                    onClick={() => {
                                                        setActiveLessonId(lesson.id);
                                                        setViewMode('LESSON');
                                                    }}
                                                    className={`w-full flex items-center justify-between p-3 text-sm transition-colors ${
                                                        isActive ? 'bg-white shadow-inner font-medium text-brand-primary border-l-2 border-l-brand-primary' : 'text-gray-600 hover:text-gray-900 pl-3.5'
                                                    } ${isLessonLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {isCompleted ? (
                                                            <CheckCircleIcon className="h-4 w-4 text-status-green shrink-0" />
                                                        ) : isLessonLocked ? (
                                                            <LockClosedIcon className="h-3 w-3 text-gray-400 shrink-0" />
                                                        ) : (
                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isActive ? 'border-brand-primary' : 'border-gray-300'}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-brand-primary' : 'bg-transparent'}`}></div>
                                                            </div>
                                                        )}
                                                        <span className="truncate">{lesson.title}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 shrink-0">{lesson.duration}</span>
                                                </button>
                                            );
                                        })}
                                        
                                        {module.quiz && (
                                            <button
                                                disabled={module.lessons.length > 0 && !completedLessons.has(module.lessons[module.lessons.length - 1].id)}
                                                onClick={handleStartQuiz}
                                                className={`w-full flex items-center justify-between p-3 text-sm transition-colors border-t border-gray-100 ${
                                                    viewMode === 'QUIZ' ? 'bg-white shadow-inner font-medium text-brand-accent border-l-2 border-l-brand-accent' : 'text-gray-600 hover:text-gray-900 pl-3.5'
                                                } ${module.lessons.length > 0 && !completedLessons.has(module.lessons[module.lessons.length - 1].id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {(module.lessons.length > 0 && !completedLessons.has(module.lessons[module.lessons.length - 1].id)) ? (
                                                        <LockClosedIcon className="h-3 w-3 text-gray-400" />
                                                    ) : (
                                                        <QuestionMarkCircleIcon className="h-4 w-4" />
                                                    )}
                                                    <span>Knowledge Check</span>
                                                </div>
                                                <span className="text-xs bg-gray-200 px-1.5 rounded text-gray-600">
                                                    {module.id === 'MOD-9' ? '20 Qs' : '5 Qs'}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Content: Lesson or Quiz View - Takes Remaining Height */}
                <div ref={scrollContainerRef} className="lg:col-span-8 xl:col-span-9 h-full overflow-y-auto custom-scrollbar bg-white rounded-lg shadow-md border border-gray-200">
                    <div className="p-6">
                        {/* --- QUIZ MODE --- */}
                        {viewMode === 'QUIZ' && activeQuizQuestions.length > 0 ? (
                            <div className="flex flex-col">
                                <div className="shrink-0 flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                                    <div>
                                        <Badge color="blue">KNOWLEDGE CHECK</Badge>
                                        <h2 className="text-2xl font-bold text-neutral-dark mt-2">{activeModule.id === 'MOD-9' ? 'Certification Exam' : 'Module Quiz'}</h2>
                                    </div>
                                    <div className="text-sm font-medium text-gray-500">
                                        Question {quizState.questionIndex + 1} of {activeQuizQuestions.length}
                                    </div>
                                </div>

                                {!quizState.isFinished ? (
                                    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full pt-4">
                                        {/* Question */}
                                        <h3 className="text-xl font-medium text-neutral-dark mb-6 leading-relaxed">
                                            {activeQuizQuestions[quizState.questionIndex].text}
                                        </h3>

                                        {/* Options */}
                                        <div className="space-y-3 mb-8">
                                            {activeQuizQuestions[quizState.questionIndex].options.map((option, idx) => {
                                                const currentQ = activeQuizQuestions[quizState.questionIndex];
                                                const isSelected = quizState.answers[currentQ.id] === idx;
                                                const isCorrect = currentQ.correctAnswerIndex === idx;
                                                const showResult = quizState.showFeedback;
                                                
                                                let btnClass = "border-gray-200 hover:bg-gray-50";
                                                if (showResult) {
                                                    if (isCorrect) btnClass = "bg-green-50 border-green-500 text-green-800";
                                                    else if (isSelected && !isCorrect) btnClass = "bg-red-50 border-red-300 text-red-800";
                                                    else if (!isSelected && !isCorrect) btnClass = "opacity-50 border-gray-100";
                                                } else if (isSelected) {
                                                    btnClass = "border-brand-primary bg-blue-50 ring-1 ring-brand-primary";
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        disabled={quizState.showFeedback}
                                                        onClick={() => handleQuizAnswer(idx)}
                                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${btnClass}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                                showResult && isCorrect ? 'border-green-600 bg-green-600 text-white' :
                                                                showResult && isSelected && !isCorrect ? 'border-red-500 text-red-500' :
                                                                isSelected ? 'border-brand-primary bg-brand-primary text-white' : 'border-gray-300 group-hover:border-gray-400'
                                                            }`}>
                                                                {showResult && isCorrect ? <CheckCircleIcon className="h-4 w-4" /> :
                                                                 showResult && isSelected && !isCorrect ? <XCircleIcon className="h-4 w-4" /> :
                                                                 <span className="text-xs font-bold">{String.fromCharCode(65 + idx)}</span>}
                                                            </div>
                                                            <span>{option}</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Feedback & Next */}
                                        {quizState.showFeedback && (
                                            <div className="animate-in fade-in slide-in-from-bottom-4 pb-4">
                                                <div className={`p-4 rounded-lg mb-6 ${
                                                    quizState.answers[activeQuizQuestions[quizState.questionIndex].id] === activeQuizQuestions[quizState.questionIndex].correctAnswerIndex
                                                    ? 'bg-green-50 border border-green-100'
                                                    : 'bg-red-50 border border-red-100'
                                                }`}>
                                                    <p className="font-bold mb-1 flex items-center gap-2">
                                                        {quizState.answers[activeQuizQuestions[quizState.questionIndex].id] === activeQuizQuestions[quizState.questionIndex].correctAnswerIndex 
                                                            ? <span className="text-green-700">Correct!</span> 
                                                            : <span className="text-red-700">Incorrect</span>}
                                                    </p>
                                                    <p className="text-sm text-gray-700">{activeQuizQuestions[quizState.questionIndex].explanation}</p>
                                                </div>
                                                
                                                <div className="flex justify-end">
                                                    <button 
                                                        onClick={handleNextQuestion}
                                                        className="bg-brand-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-secondary transition-colors flex items-center gap-2"
                                                    >
                                                        {quizState.questionIndex < activeQuizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'} <ArrowRightIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-in zoom-in-95 duration-300 p-6">
                                        <div className="p-6 bg-yellow-100 rounded-full text-yellow-600 mb-6">
                                            <TrophyIcon className="h-16 w-16" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-neutral-dark mb-2">Quiz Complete!</h3>
                                        <p className="text-xl text-gray-600 mb-8">
                                            You scored <span className="font-bold text-brand-primary">{quizState.score} / {activeQuizQuestions.length}</span>
                                        </p>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={handleStartQuiz}
                                                className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                            >
                                                Retake Quiz
                                            </button>
                                            <button 
                                                onClick={advanceToNextModule}
                                                className="bg-neutral-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-lg flex items-center gap-2"
                                            >
                                                {activeModule.id === 'MOD-9' ? 'View Certificate' : 'Continue to Next Module'} <ArrowRightIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                        
                        /* --- LESSON MODE --- */
                        activeLesson ? (
                            <div>
                                <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                                    <div>
                                        <Badge color="blue">TRAINING MODULE</Badge>
                                        <h2 className="text-2xl font-bold text-neutral-dark mt-2">{activeLesson.title}</h2>
                                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                                            <VideoCameraIcon className="h-4 w-4" /> Estimated Time: {activeLesson.duration}
                                        </p>
                                    </div>
                                </div>

                                <div className="prose prose-blue max-w-none text-gray-800 leading-relaxed mb-8">
                                    {activeLesson.content}
                                </div>

                                <div className="mt-auto pt-6 border-t border-gray-100 flex flex-col items-center space-y-4">
                                    <div className="flex items-center justify-between w-full max-w-md gap-4">
                                         <button 
                                            onClick={handlePrevious}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-sm"
                                        >
                                            <ArrowLeftIcon className="h-5 w-5" /> Previous
                                        </button>

                                        <button 
                                            onClick={handleMarkComplete}
                                            className={`flex-[2] px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                                                completedLessons.has(activeLesson.id)
                                                ? 'bg-green-100 text-green-800 hover:bg-green-200 ring-1 ring-green-200'
                                                : 'bg-brand-primary text-white hover:bg-brand-secondary hover:shadow-xl transform hover:-translate-y-1'
                                            }`}
                                        >
                                            {completedLessons.has(activeLesson.id) ? (
                                                <>
                                                    <CheckCircleIcon className="h-6 w-6" /> Lesson Completed
                                                </>
                                            ) : (
                                                <>
                                                    Mark Complete & Continue <ArrowRightIcon className="h-5 w-5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex justify-between w-full text-xs text-gray-400 mt-2">
                                        <span>ClaimsIQ Academy v3.0</span>
                                        <span>{activeModule.title}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full min-h-[50vh]">
                                <div className="text-gray-400 flex flex-col items-center">
                                    <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-primary rounded-full animate-spin mb-2"></div>
                                    Loading lesson...
                                </div>
                            </div>
                        )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainingScreen;