
import React from 'react';
import { Card } from '../ui/Card';
import { MobilePhoneIcon, CheckBadgeIcon, SparklesIcon, UserGroupIcon, ArrowRightIcon, CameraIcon, CloudIcon, QueueListIcon, QrCodeIcon, ExclamationTriangleIcon, ClockIcon, FingerPrintIcon } from '../icons/Icons';

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

const FraudLogicScreen: React.FC = () => {
  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12">
       <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-status-red/10 text-status-red text-xs font-bold mb-4">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            MULTI-MODAL THREAT DETECTION
        </div>
        <h1 className="text-4xl font-bold text-neutral-dark">The Fraud Defense Grid</h1>
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
          
          {/* Behavioral Analysis */}
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

          {/* Real World Scenarios */}
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
  );
};

export default FraudLogicScreen;
