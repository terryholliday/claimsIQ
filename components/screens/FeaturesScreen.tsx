
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Screen } from '../../types';
import { SparklesIcon, ShieldCheckIcon, TagIcon, ClockIcon, DocumentMagnifyingGlassIcon, ChartBarIcon, BoltIcon, XCircleIcon, CheckCircleIcon, ServerStackIcon, MobilePhoneIcon, ChatBubbleLeftRightIcon, UserGroupIcon, CloudIcon, DocumentDuplicateIcon, CubeTransparentIcon, ShieldExclamationIcon, CalculatorIcon, FolderIcon, MegaphoneIcon, StarIcon, BanknotesIcon, QueueListIcon, QrCodeIcon, TableCellsIcon, BuildingLibraryIcon, CodeBracketIcon, LockClosedIcon, ArrowRightIcon, DocumentTextIcon, CameraIcon, FingerPrintIcon, CheckBadgeIcon, ExclamationTriangleIcon, ListBulletIcon, VideoCameraIcon, CpuChipIcon, MicrophoneIcon } from '../icons/Icons';

interface FeaturesScreenProps {
  onNavigate: (screen: Screen) => void;
}

const FeatureDeepDive: React.FC<{ title: string; description: React.ReactNode; icon: React.ReactNode; bullets: React.ReactNode[] }> = ({ title, description, icon, bullets }) => (
  <div className="p-6 bg-white rounded-xl border border-neutral-medium shadow-sm hover:shadow-md transition-all h-full flex flex-col">
    <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-brand-primary/5 rounded-lg shrink-0">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-neutral-dark">{title}</h3>
    </div>
    <p className="text-sm text-gray-600 mb-4 leading-relaxed flex-grow">{description}</p>
    <ul className="space-y-2 mt-auto">
        {bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start text-xs text-gray-700">
                <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                {bullet}
            </li>
        ))}
    </ul>
  </div>
);

const ComparisonRow: React.FC<{ feature: string; legacy: string; automated: string }> = ({ feature, legacy, automated }) => (
    <div className="grid grid-cols-3 gap-4 py-4 border-b border-gray-100 last:border-0">
        <div className="font-medium text-gray-700 flex items-center">{feature}</div>
        <div className="flex items-start text-gray-500 text-sm">
            <XCircleIcon className="h-5 w-5 text-red-300 mr-2 flex-shrink-0" />
            {legacy}
        </div>
        <div className="flex items-start text-brand-primary text-sm font-medium bg-brand-primary/5 p-2 rounded">
            <CheckCircleIcon className="h-5 w-5 text-brand-secondary mr-2 flex-shrink-0" />
            {automated}
        </div>
    </div>
);

const ROICalculator: React.FC = () => {
    const [monthlyClaims, setMonthlyClaims] = useState(500);
    const [avgSeverity, setAvgSeverity] = useState(3500);

    // Industry Stats
    const leakageRate = 0.12; // 12% Hard/Soft Leakage
    const efficiencySavingsPerClaim = 45; // Time saved per claim ($)

    const annualVolume = monthlyClaims * 12;
    const annualSpend = annualVolume * avgSeverity;
    const leakageSavings = annualSpend * leakageRate;
    const processSavings = annualVolume * efficiencySavingsPerClaim;
    const totalSavings = leakageSavings + processSavings;

    const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="bg-gray-900 rounded-2xl p-8 text-white shadow-2xl border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg">
                    <CalculatorIcon className="h-6 w-6 text-green-400" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold">ROI Calculator</h3>
                    <p className="text-gray-400 text-sm">Estimate your annual savings with TrueManifest™</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-gray-300">Monthly Claim Volume</label>
                            <span className="text-brand-accent font-mono">{monthlyClaims}</span>
                        </div>
                        <input 
                            type="range" 
                            min="50" 
                            max="5000" 
                            step="50" 
                            value={monthlyClaims} 
                            onChange={(e) => setMonthlyClaims(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-gray-300">Avg. Contents Severity</label>
                            <span className="text-brand-accent font-mono">{formatMoney(avgSeverity)}</span>
                        </div>
                        <input 
                            type="range" 
                            min="500" 
                            max="20000" 
                            step="500" 
                            value={avgSeverity} 
                            onChange={(e) => setAvgSeverity(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                        />
                    </div>
                    
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-xs text-gray-400 leading-relaxed">
                        <strong className="text-white">Assumptions:</strong> Based on industry standard 12% leakage reduction (valuation accuracy + fraud prevention) and $45 admin cost savings per file (elimination of manual data entry).
                    </div>
                </div>

                <div className="flex flex-col justify-center space-y-6">
                    <div className="text-center p-6 bg-gradient-to-b from-green-900/40 to-green-900/10 rounded-xl border border-green-500/30">
                        <div className="text-green-400 text-sm font-bold uppercase tracking-widest mb-2">Projected Annual Savings</div>
                        <div className="text-5xl font-black text-white tracking-tight">{formatMoney(totalSavings)}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-lg text-center">
                            <div className="text-gray-400 text-xs uppercase">Leakage Stopped</div>
                            <div className="text-xl font-bold text-white mt-1">{formatMoney(leakageSavings)}</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg text-center">
                            <div className="text-gray-400 text-xs uppercase">Process Efficiency</div>
                            <div className="text-xl font-bold text-white mt-1">{formatMoney(processSavings)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DefenseModule: React.FC<{ title: string; description: string; icon: React.ReactNode; color: string }> = ({ title, description, icon, color }) => (
    <div className={`p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
      <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg shrink-0 ${color.replace('bg-', 'bg-opacity-10 text-').replace('border-', '')} bg-opacity-10`}>
              {icon}
          </div>
          <div>
              <h3 className="text-lg font-bold text-neutral-dark mb-2 group-hover:text-brand-primary transition-colors">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          </div>
      </div>
    </div>
);

const FraudScenario: React.FC<{ title: string; scenario: string; solution: string }> = ({ title, scenario, solution }) => (
      <div className="border-b border-gray-100 last:border-0 py-4">
          <h4 className="font-bold text-neutral-dark text-sm mb-1">{title}</h4>
          <p className="text-xs text-gray-500 mb-2 italic">"{scenario}"</p>
          <div className="flex items-start gap-2 text-xs text-brand-primary bg-brand-primary/5 p-2 rounded">
              <CheckBadgeIcon className="h-4 w-4 shrink-0" />
              <span className="font-medium">{solution}</span>
          </div>
      </div>
);

const FeaturesScreen: React.FC<FeaturesScreenProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-bold mb-4">
            <SparklesIcon className="h-3 w-3 mr-1" />
            THE OPERATING SYSTEM FOR MODERN CLAIMS
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-neutral-dark mb-6">
          Replacing "Guesstimates" with <span className="text-brand-primary">Asset Intelligence</span>
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          TrueManifest™ isn't just a dashboard—it's an AI-powered middleware that sits between your policyholders and your core claims system, automating the 30% of adjuster time spent on manual validation.
        </p>
      </div>

      {/* Fraud Logic Content */}
      <div className="space-y-10">
        <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-status-red/10 text-status-red text-xs font-bold mb-4">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                MULTI-MODAL THREAT DETECTION
            </div>
            <h2 className="text-3xl font-bold text-neutral-dark">The Fraud Defense Grid</h2>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            TrueManifest™ doesn't rely on simple checklists. We run <strong>six concurrent AI engines</strong> to triangulate truth across pixels, metadata, pricing, and weather history.
            </p>
        </div>

        {/* The 4 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DefenseModule 
                title="Visual Truth™ (Forensics)"
                description="Analyzes images at the pixel level. Detects Generative AI deepfakes, identifies stock photos downloaded from the web, and flags inconsistencies between the item's visual condition (worn/damaged) and the claimed 'New' status."
                icon={<CameraIcon className="h-8 w-8 text-purple-600" />}
                color="bg-purple-500"
            />
            <DefenseModule 
                title="Padding Patrol™ (Soft Fraud)"
                description="Detects claim inflation. Our statistical engine analyzes the density of low-value items (e.g., '50 pairs of socks') to calculate a 'Fluff Score', flagging attempts to artificially reach deductibles."
                icon={<QueueListIcon className="h-8 w-8 text-red-500" />}
                color="bg-red-500"
            />
            <DefenseModule 
                title="SkyWitness (Context)"
                description="Verifies the 'Cause of Loss'. If a user claims 'Lightning Surge' damaged their electronics, SkyWitness checks historical weather data for the exact GPS location and time to confirm if lightning actually occurred."
                icon={<CloudIcon className="h-8 w-8 text-blue-500" />}
                color="bg-blue-500"
            />
            <DefenseModule 
                title="Metadata X-Ray (Provenance)"
                description="Extracts invisible EXIF data. We verify that photos were taken at the insured property (GPS Lat/Long) and that timestamps align with the timeline. We also validate Manufacturer Serial Number logic."
                icon={<QrCodeIcon className="h-8 w-8 text-green-600" />}
                color="bg-green-500"
            />
        </div>

        {/* Deep Dive Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <Card className="lg:col-span-1 bg-gray-900 text-white border-none">
                <div className="mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <FingerPrintIcon className="h-6 w-6 text-brand-accent" />
                        Behavioral Analysis
                    </h3>
                    <p className="text-gray-400 text-sm mt-2">
                        Fraudsters behave differently than victims. We track bio-digital signals during submission.
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="bg-white/10 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold">Submission Velocity</span>
                            <ClockIcon className="h-4 w-4 text-brand-accent" />
                        </div>
                        <p className="text-xs text-gray-300">Flagging users who upload 50 items in 5 minutes (Copy/Paste behavior vs. organic entry).</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold">Rounding Bias</span>
                            <QueueListIcon className="h-4 w-4 text-brand-accent" />
                        </div>
                        <p className="text-xs text-gray-300">Detecting unnatural pricing patterns (e.g., every item ending in .00 or .50).</p>
                    </div>
                </div>
            </Card>

            <Card className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                    <SparklesIcon className="h-6 w-6 text-brand-primary" />
                    <h3 className="text-xl font-bold text-neutral-dark">Scenarios We Catch</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <FraudScenario 
                        title="The 'Lightning' Strike" 
                        scenario="TV won't turn on. User claims lightning surge." 
                        solution="SkyWitness confirms 'Clear Skies' on date of loss. Claim Flagged." 
                    />
                    <FraudScenario 
                        title="The Stock Photo" 
                        scenario="User uploads high-res photo of Rolex as proof of ownership." 
                        solution="Visual Truth finds exact image match on eBay listing from 2019." 
                    />
                    <FraudScenario 
                        title="The Sock Inflator" 
                        scenario="User adds 40 pairs of $25 socks to fire claim." 
                        solution="Padding Patrol identifies statistical anomaly (Fluff Score 95/100)." 
                    />
                    <FraudScenario 
                        title="The Miami Vacation" 
                        scenario="Burglary in Chicago. User uploads photo of broken window." 
                        solution="Metadata X-Ray sees GPS tag is Miami, FL from 2 years ago." 
                    />
                </div>
            </Card>
        </div>
      </div>
      
      {/* Module 1: Intelligent Ingestion */}
      <div>
          <h2 className="text-2xl font-bold text-neutral-dark mb-6 flex items-center">
              <ServerStackIcon className="h-6 w-6 mr-2 text-brand-secondary" />
              Module 1: Intelligent Ingestion
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureDeepDive 
                  icon={<MobilePhoneIcon className="h-6 w-6 text-blue-600" />}
                  title="Omni-Channel Intake"
                  description={<>Seamlessly ingest structured claim data directly from the PROVENIQ Home consumer app, removing data entry bottlenecks. Also supports web portal uploads and API injection from legacy FNOL systems.</>}
                  bullets={[
                      "PROVENIQ Home App Integration",
                      "Legacy System API Bridge",
                      "Structured JSON Payloads"
                  ]}
              />
              <FeatureDeepDive 
                  icon={<DocumentTextIcon className="h-6 w-6 text-gray-700" />}
                  title="Smart OCR & Parsing"
                  description="Turn unstructured PDF receipts, invoices, and police reports into digital assets. Our Document Intelligence engine extracts line items, dates, and prices, automatically linking them to the relevant inventory."
                  bullets={[
                      "Receipt-to-Asset Mapping",
                      "Invoice Line Item Extraction",
                      "Police Report Analysis"
                  ]}
              />
              <FeatureDeepDive 
                  icon={<ClockIcon className="h-6 w-6 text-orange-500" />}
                  title="Timeline Reconstruction"
                  description="Visualizes the entire lifecycle of the claim. Automatically plots purchase dates, policy inception, and loss date on a unified timeline to identify coverage gaps or inconsistencies at a glance."
                  bullets={[
                      "Visual Chronology",
                      "Policy Period Verification",
                      "Gap Analysis"
                  ]}
              />
          </div>
      </div>
      
      {/* NEW: Unified Claims Workstation */}
       <div>
          <h2 className="text-2xl font-bold text-neutral-dark mb-6 flex items-center">
              <CpuChipIcon className="h-6 w-6 mr-2 text-brand-secondary" />
              Module 2: Unified Claims Workstation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureDeepDive 
                  icon={<ListBulletIcon className="h-6 w-6 text-yellow-600" />}
                  title="Claim Activities & Tasks"
                  description="A built-in task manager for adjusters. Create, assign, and track claim-related activities like 'Contact Policyholder' or 'Review for Subrogation' to ensure nothing falls through the cracks."
                  bullets={[
                      "Due Date Tracking",
                      "Assignee Management",
                      "Status Updates (Open/Completed)"
                  ]}
              />
              <FeatureDeepDive 
                  icon={<BanknotesIcon className="h-6 w-6 text-green-700" />}
                  title="Financials Hub"
                  description="The single source of truth for claim financials. Set and adjust reserves, track payments made, and view the total incurred amount against policy limits in real-time."
                  bullets={[
                      "Reserve Setting & Tracking",
                      "Payment Logging",
                      "Total Exposure vs. Coverage Limit"
                  ]}
              />
              <FeatureDeepDive 
                  icon={<ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-500" />}
                  title="Claim Diary & Documents"
                  description="Maintain a complete, chronological record of all communications, decisions, and observations. The Claim Diary serves as the official, immutable log for the entire claim lifecycle."
                  bullets={[
                      "Timestamped Note Entry",
                      "Centralized Document Repository",
                      "Immutable Official Record"
                  ]}
              />
          </div>
      </div>


      {/* Module 2: Precision Valuation */}
      <div>
          <h2 className="text-2xl font-bold text-neutral-dark mb-6 flex items-center">
              <TagIcon className="h-6 w-6 mr-2 text-brand-secondary" />
              Module 3: Precision Valuation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureDeepDive 
                  icon={<TagIcon className="h-6 w-6 text-brand-secondary" />}
                  title="TrueValue Market Calibration"
                  description="Connects to live web data to find real-time replacement costs. We scour major retailers to prevent overpayment on inflated user estimates."
                  bullets={[
                      "Real-time web scraping for pricing",
                      "Source linking (direct URLs to listings)",
                      "Currency normalization & Tax estimation"
                  ]}
              />
               <FeatureDeepDive 
                  icon={<VideoCameraIcon className="h-6 w-6 text-blue-600" />}
                  title="Digital Field Adjuster"
                  description="Turn adjusters into superheroes. Analyze 'before and after' damage photos to get an AI-generated repair vs. replace recommendation, complete with a cost breakdown and repairability score."
                  bullets={[
                      "Pixel-level damage analysis",
                      "Repair vs. Replace recommendation",
                      "Automated cost estimation"
                  ]}
              />
              <FeatureDeepDive 
                  icon={<QueueListIcon className="h-6 w-6 text-red-500" />}
                  title="Padding Patrol™"
                  description="Detect 'Soft Fraud'. We analyze inventory distribution to flag artificial inflation, such as excessive quantities of low-value items (e.g., 50 pairs of socks)."
                  bullets={[
                      "Statistical anomaly detection",
                      "Low-value item density analysis",
                      "Suspicious repetition flagging"
                  ]}
              />
          </div>
      </div>

      {/* ROI Section */}
      <ROICalculator />

      {/* Module 3: Workflow Velocity */}
      <div>
          <h2 className="text-2xl font-bold text-neutral-dark mb-6 flex items-center">
              <BoltIcon className="h-6 w-6 mr-2 text-brand-secondary" />
              Module 4: Workflow Velocity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureDeepDive 
                  icon={<CubeTransparentIcon className="h-6 w-6 text-indigo-500" />}
                  title="Bundle Breakout™"
                  description="Solves the 'Black Box' inventory problem. AI analyzes vague grouped items (e.g., 'Gaming Setup') and breaks them down into probable component line items."
                  bullets={[
                      "Statistical component prediction",
                      "Value distribution logic",
                      "Automatic inventory expansion"
                  ]}
              />
              <FeatureDeepDive 
                  icon={<MobilePhoneIcon className="h-6 w-6 text-blue-600" />}
                  title="Origin Verifier"
                  description={<>Trust scoring based on data source. We distinguish between high-trust items verified Pre-Loss in the PROVENIQ Home app versus items added manually Post-Loss.</>}
                  bullets={[
                      "Pre-Loss vs. Post-Loss tagging",
                      "Provenance tracking",
                      "PROVENIQ Home Sync Integration"
                  ]}
              />
              <FeatureDeepDive 
                  icon={<MegaphoneIcon className="h-6 w-6 text-pink-500" />}
                  title="Negotiation Genius"
                  description="Reduce communication fatigue. The AI generates polite, fact-based scripts for adjusters to explain denials or depreciation to policyholders without the emotional toll."
                  bullets={[
                      "Empathetic denial scripting",
                      "Fact-based policy explanation generation",
                      "Tone calibration (Professional vs. Firm)"
                  ]}
              />
          </div>
      </div>

      {/* New Module 5: Communications & Intake */}
      <div>
          <h2 className="text-2xl font-bold text-neutral-dark mb-6 flex items-center">
              <MicrophoneIcon className="h-6 w-6 mr-2 text-brand-secondary" />
              Module 5: Communications & Intake
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureDeepDive 
                  icon={<MicrophoneIcon className="h-6 w-6 text-teal-500" />}
                  title="Live FNOL Co-Pilot"
                  description="A Gemini-powered voice assistant that interviews policyholders, transcribes the conversation, and extracts key entities in real-time, freeing the adjuster to focus on empathy."
                  bullets={[
                      "Real-time voice transcription",
                      "Automated entity extraction (assets, dates, etc.)",
                      "Voice stress and inconsistency detection"
                  ]}
              />
              <FeatureDeepDive 
                  icon={<ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600" />}
                  title="AI Voice Agent (24/7)"
                  description="An autonomous AI agent that handles routine inbound status calls ('Where's my check?'). It has full claim context and provides instant, accurate answers, reducing adjuster workload."
                  bullets={[
                      "24/7 automated customer service",
                      "Handles routine status inquiries",
                      "Frees up adjusters for high-value tasks"
                  ]}
              />
              <FeatureDeepDive 
                  icon={<DocumentTextIcon className="h-6 w-6 text-orange-500" />}
                  title="Automated Letter Generation"
                  description="Generate legally compliant Denial or Reservation of Rights (ROR) letters in one click. The AI drafts the letter, citing the specific policy language and state statutes for you."
                  bullets={[
                      "Reduces legal and E&O risk",
                      "Ensures compliance and consistency",
                      "Saves hours of complex writing"
                  ]}
              />
          </div>
      </div>

      {/* Integrations & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="h-full">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <CodeBracketIcon className="h-6 w-6" />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-neutral-dark">Enterprise Integration</h3>
                      <p className="text-sm text-gray-500">Plays nice with your existing stack.</p>
                  </div>
              </div>
              <div className="space-y-6">
                  <p className="text-gray-600 text-sm">
                      TrueManifest™ is designed as an API-first middleware. We ingest data from PROVENIQ Home, process it, and push clean, structured JSON payloads directly into your core claims system via REST API.
                  </p>
                  <div className="flex flex-wrap gap-4">
                      <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-bold text-sm border border-gray-200">Guidewire ClaimCenter</div>
                      <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-bold text-sm border border-gray-200">Duck Creek</div>
                      <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-bold text-sm border border-gray-200">Salesforce FS Cloud</div>
                  </div>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-mono text-indigo-900">
                      POST /api/v1/claims/export<br/>
                      Authorization: Bearer &lt;token&gt;<br/>
                      ...
                  </div>
                  <button 
                      onClick={() => onNavigate(Screen.API_DOCS)}
                      className="text-brand-primary font-bold text-sm flex items-center gap-1 hover:underline"
                  >
                      View API Documentation <ArrowRightIcon className="h-4 w-4" />
                  </button>
              </div>
          </Card>

          <Card className="h-full">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600">
                      <LockClosedIcon className="h-6 w-6" />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-neutral-dark">Bank-Grade Security</h3>
                      <p className="text-sm text-gray-500">Trust is our currency.</p>
                  </div>
              </div>
              <div className="space-y-4">
                  <div className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                          <h4 className="font-bold text-neutral-dark text-sm">SOC 2 Type II Certified</h4>
                          <p className="text-xs text-gray-500">Audited controls for Security, Availability, and Confidentiality.</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                          <h4 className="font-bold text-neutral-dark text-sm">ISO 27001 Compliant</h4>
                          <p className="text-xs text-gray-500">International standard for Information Security Management.</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                          <h4 className="font-bold text-neutral-dark text-sm">End-to-End Encryption</h4>
                          <p className="text-xs text-gray-500">AES-256 for data at rest. TLS 1.3 for data in transit.</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                          <h4 className="font-bold text-neutral-dark text-sm">GDPR & CCPA Ready</h4>
                          <p className="text-xs text-gray-500">Built-in "Right to be Forgotten" workflows for PII deletion.</p>
                      </div>
                  </div>
              </div>
          </Card>
      </div>

      {/* Us vs. Them Section */}
      <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-medium mt-12">
          <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-neutral-dark">TrueManifest™ vs. The Status Quo</h2>
              <p className="text-gray-600 mt-2">Why leading carriers are switching from manual processing to Asset Intelligence.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-500 uppercase tracking-wider">
                  <div>Capabilities</div>
                  <div>Legacy Manual Process</div>
                  <div className="text-brand-primary">TrueManifest™ AI</div>
              </div>
              
              <div className="p-4 space-y-1">
                  <ComparisonRow 
                      feature="Valuation Method" 
                      legacy="Manual Google searches, subjective guessing, outdated price lists."
                      automated="Real-time web grounding & automated LKQ spec-matching."
                  />
                  <ComparisonRow 
                      feature="Depreciation (ACV)" 
                      legacy="Looking up life expectancy tables and doing manual math."
                      automated="One-click 'Smart Depreciation' calculation."
                  />
                   <ComparisonRow 
                      feature="Evidence Review" 
                      legacy="Manually reviewing 50 PDF receipts and photos."
                      automated="Metadata forensics (EXIF/Serial) & Receipt OCR mapping."
                  />
                  <ComparisonRow 
                      feature="Compliance" 
                      legacy="Manual checklists and reactive audit scrambling."
                      automated="Automated 50-State engine & Filing Generation."
                  />
                  <ComparisonRow 
                      feature="Recovery (Subro)" 
                      legacy="Missed opportunities due to speed of settlement."
                      automated="Automated 'Subro Spotter™' for liability detection."
                  />
                  <ComparisonRow 
                      feature="Customer Comms" 
                      legacy="Drafting painful denial emails from scratch."
                      automated="AI-generated 'Negotiation Genius' scripts."
                  />
              </div>
          </div>
      </div>
    </div>
  );
};

export default FeaturesScreen;
