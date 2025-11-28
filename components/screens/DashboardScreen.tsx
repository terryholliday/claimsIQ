
import React, { useState, useMemo } from 'react';
import { Claim, ClaimStatus, AssetStatus } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ChartBarIcon, ClockIcon, CheckCircleIcon, MagnifyingGlassIcon, FunnelIcon, CloudArrowUpIcon, MobilePhoneIcon, CloudArrowDownIcon, ArrowPathIcon, ExclamationTriangleIcon, ShieldCheckIcon, XMarkIcon, MegaphoneIcon, UserGroupIcon, PaperAirplaneIcon, CalculatorIcon, CpuChipIcon } from '../icons/Icons';

interface DashboardScreenProps {
  claims?: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onSyncClaims: () => number;
}

const SceneReconstructionModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 bg-brand-primary text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <CpuChipIcon className="h-6 w-6 text-brand-accent" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">AI Scene Reconstruction</h3>
                            <p className="text-blue-100 text-sm">For Catastrophic (CAT) Events</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-8 text-center space-y-6">
                    <p className="text-gray-600">
                        This powerful tool is designed for large-scale losses like fires or hurricanes where hundreds of photos are taken of a chaotic scene.
                    </p>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="font-bold text-neutral-dark">How it Works:</p>
                        <ol className="text-sm text-gray-600 list-decimal list-inside text-left mt-2 space-y-1">
                            <li>Upload all photos (200+) from the loss scene.</li>
                            <li>Gemini's computer vision analyzes the entire scene.</li>
                            <li>The AI identifies every single item, estimates its pre-loss state, and calculates its value.</li>
                            <li>A complete, itemized manifest is automatically generated in minutes.</li>
                        </ol>
                    </div>
                    <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200">
                        <strong>Note:</strong> This feature is for demonstration purposes. The "Start Intake" button is not functional in this demo.
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 bg-neutral-dark hover:bg-black text-white font-bold rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const CampaignModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<'preview' | 'sending' | 'sent'>('preview');

    if (!isOpen) return null;

    const handleLaunch = () => {
        setStep('sending');
        setTimeout(() => {
            setStep('sent');
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 bg-brand-primary text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <MegaphoneIcon className="h-6 w-6 text-brand-accent" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Risk Mitigation Campaign</h3>
                            <p className="text-blue-100 text-sm">Target Segment: 'High-Risk Plumbing'</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex-1 overflow-y-auto">
                    {step === 'preview' && (
                        <div className="space-y-8">
                            {/* The Insight */}
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                                <h4 className="text-red-900 font-bold flex items-center gap-2 mb-2">
                                    <ExclamationTriangleIcon className="h-5 w-5" />
                                    The Detected Risk
                                </h4>
                                <p className="text-red-800 text-sm leading-relaxed">
                                    Analysis of MyARK inventory photos has identified <strong>1,240 active policies</strong> with verified <strong>"Black Rubber Washing Machine Hoses"</strong> older than 5 years. These hoses have a 40% failure rate, leading to catastrophic water damage.
                                </p>
                            </div>

                            {/* The Economics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Target Audience</div>
                                    <div className="text-2xl font-black text-neutral-dark flex items-center justify-center gap-2">
                                        <UserGroupIcon className="h-5 w-5 text-brand-primary" /> 1,240
                                    </div>
                                    <div className="text-xs text-gray-400">Households</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Avg. Claim Cost</div>
                                    <div className="text-2xl font-black text-neutral-dark">$15,000</div>
                                    <div className="text-xs text-gray-400">Water Damage</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                                    <div className="text-green-800 text-xs font-bold uppercase tracking-wider mb-1">Potential ROI</div>
                                    <div className="text-2xl font-black text-green-700">$18.6M</div>
                                    <div className="text-xs text-green-600">Loss Avoidance</div>
                                </div>
                            </div>

                            {/* The Action */}
                            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Proposed MyARK<sup className="text-[0.6em]">&trade;</sup> Push Notification</h4>
                                <div className="flex gap-4">
                                    <div className="shrink-0 w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center text-white text-xl font-bold">
                                        <ShieldCheckIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">⚠️ Safety Alert: Your Washing Machine</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            We detected rubber hoses on your washing machine that are at risk of bursting. 
                                            Prevent a flood! Use this code <span className="font-mono font-bold bg-gray-100 px-1 rounded">SAFEHOME20</span> for 20% off steel-braided hoses at Home Depot.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'sending' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                <MegaphoneIcon className="absolute inset-0 m-auto h-8 w-8 text-brand-primary animate-pulse" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-neutral-dark">Broadcasting Campaign...</h3>
                                <p className="text-gray-500 mt-2">Sending push notifications to 1,240 devices.</p>
                            </div>
                        </div>
                    )}

                    {step === 'sent' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                                <CheckCircleIcon className="h-10 w-10" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-neutral-dark">Campaign Active!</h3>
                                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                    Success. Alerts have been delivered. We will track coupon redemption and update the Risk Score for these policies automatically.
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 w-full max-w-sm">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500">Delivery Rate</span>
                                    <span className="font-bold text-gray-900">99.8%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full w-[99.8%]"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    {step === 'preview' && (
                        <>
                            <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button 
                                onClick={handleLaunch}
                                className="px-6 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-lg shadow-md flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                            >
                                <PaperAirplaneIcon className="h-4 w-4 transform -rotate-45 mb-1" />
                                Launch Campaign
                            </button>
                        </>
                    )}
                    {step === 'sent' && (
                        <button onClick={onClose} className="px-6 py-2 bg-neutral-dark hover:bg-black text-white font-bold rounded-lg transition-colors">
                            Return to Dashboard
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ claims = [], onSelectClaim, onSyncClaims }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [assetStatusFilter, setAssetStatusFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());
  const [isSyncingMyARK, setIsSyncingMyARK] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showSceneReconModal, setShowSceneReconModal] = useState(false);

  const safeClaims = claims || [];

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.NEW_FROM_MYARK: return 'blue';
      case ClaimStatus.READY_TO_SYNC: return 'green';
      case ClaimStatus.SYNCED_TO_CMS: return 'gray';
      case ClaimStatus.FLAGGED_FOR_REVIEW: return 'red';
      default: return 'gray';
    }
  };
  
  const calculateAvgTouchTime = () => {
      const processedClaims = safeClaims.filter(c => (c.touchTime || 0) > 0);
      if (processedClaims.length === 0) return "0m";
      
      const totalMs = processedClaims.reduce((acc, curr) => acc + (curr.touchTime || 0), 0);
      const avgMs = totalMs / processedClaims.length;
      const minutes = Math.round(avgMs / 1000 / 60);
      
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.round(minutes / 60 * 10) / 10;
      return `${hours}h`;
  };
  
  const filteredClaims = useMemo(() => {
    if (!safeClaims) return [];
    return safeClaims.filter(claim => {
      const matchesSearch = 
        claim.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        claim.policyholderName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || claim.status === statusFilter;
      const matchesAssetStatus = assetStatusFilter === 'All' || claim.assets.some(asset => asset.status === assetStatusFilter);
      
      let matchesDate = true;
      if (startDate || endDate) {
        const claimDate = new Date(claim.claimDate);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start && claimDate < start) matchesDate = false;
        if (end && claimDate > end) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesAssetStatus && matchesDate;
    });
  }, [safeClaims, searchTerm, statusFilter, assetStatusFilter, startDate, endDate]);

  const handleQuickSync = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setSyncedIds(prev => new Set(prev).add(id));
      setTimeout(() => {
        alert(`Manifest ${id} successfully queued for export to CMS.`);
      }, 500);
  };

  const handleMyARKSync = () => {
      setIsSyncingMyARK(true);
      setTimeout(() => {
          const count = onSyncClaims();
          setIsSyncingMyARK(false);
          setLastSynced(new Date());
          alert(`Successfully fetched ${count} new manifests from MyARK™.`);
      }, 1500);
  };

  return (
    <div className="space-y-8 relative">
      <CampaignModal isOpen={showCampaignModal} onClose={() => setShowCampaignModal(false)} />
      <SceneReconstructionModal isOpen={showSceneReconModal} onClose={() => setShowSceneReconModal(false)} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-dark">Manifest Inbox</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                System Status: <span className="text-green-600 font-medium flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Online</span>
                {lastSynced && <span className="text-gray-400">| Last Synced: {lastSynced.toLocaleTimeString()}</span>}
            </p>
          </div>
          <div>
            <button 
                onClick={handleMyARKSync}
                disabled={isSyncingMyARK}
                className="bg-brand-secondary hover:bg-brand-primary text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center space-x-2 transition-all"
            >
                {isSyncingMyARK ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                    <CloudArrowDownIcon className="h-5 w-5" />
                )}
                <span>Sync from MyARK<sup className="text-[0.6em] ml-0.5">&trade;</sup></span>
            </button>
          </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter(prev => prev === ClaimStatus.NEW_FROM_MYARK ? 'All' : ClaimStatus.NEW_FROM_MYARK)}
          className="text-left w-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded-lg"
        >
          <Card className={`p-4 h-full ${statusFilter === ClaimStatus.NEW_FROM_MYARK ? 'border-brand-primary ring-1 ring-brand-primary' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">New Inbound</p>
                <p className="text-2xl font-bold text-brand-primary">{safeClaims.filter(c => c.status === ClaimStatus.NEW_FROM_MYARK).length}</p>
                <p className="text-xs text-gray-400 mt-1">From MyARK<sup className="text-[0.6em]">&trade;</sup> App</p>
              </div>
              <div className="p-2 bg-brand-primary/10 rounded-lg">
                <MobilePhoneIcon className="h-5 w-5 text-brand-primary" />
              </div>
            </div>
          </Card>
        </button>

        <button
          onClick={() => setStatusFilter(prev => prev === ClaimStatus.READY_TO_SYNC ? 'All' : ClaimStatus.READY_TO_SYNC)}
          className="text-left w-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded-lg"
        >
          <Card className={`p-4 h-full ${statusFilter === ClaimStatus.READY_TO_SYNC ? 'border-green-500 ring-1 ring-green-500' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ready for Export</p>
                <p className="text-2xl font-bold text-status-green">{safeClaims.filter(c => c.status === ClaimStatus.READY_TO_SYNC).length}</p>
                <p className="text-xs text-gray-400 mt-1">Verified & Clean</p>
              </div>
               <div className="p-2 bg-status-green/20 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-status-green" />
              </div>
            </div>
          </Card>
        </button>

        <div className="h-full">
            <Card className="p-4 h-full">
            <div className="flex items-start justify-between">
                <div>
                <p className="text-sm font-medium text-gray-500">Avg. Touch Time</p>
                <p className="text-2xl font-bold text-neutral-dark">{calculateAvgTouchTime()}</p>
                <p className="text-xs text-gray-400 mt-1">Efficiency Metric</p>
                </div>
                <div className="p-2 bg-neutral-dark/10 rounded-lg">
                <ClockIcon className="h-5 w-5 text-neutral-dark" />
                </div>
            </div>
            </Card>
        </div>

        <button
          onClick={() => setStatusFilter(prev => prev === ClaimStatus.FLAGGED_FOR_REVIEW ? 'All' : ClaimStatus.FLAGGED_FOR_REVIEW)}
          className="text-left w-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded-lg"
        >
          <Card className={`p-4 h-full bg-orange-50 border-orange-200 ${statusFilter === ClaimStatus.FLAGGED_FOR_REVIEW ? 'border-orange-500 ring-1 ring-orange-500' : ''}`}>
            <div className="flex items-start justify-between">
                <div>
                <p className="text-sm font-medium text-orange-600">Flagged for Review</p>
                <p className="text-2xl font-bold text-orange-800">{safeClaims.filter(c => c.status === ClaimStatus.FLAGGED_FOR_REVIEW).length}</p>
                <p className="text-xs text-orange-500 mt-1">High-Risk Indicators</p>
                </div>
                <div className="p-2 bg-orange-500/10 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
                </div>
            </div>
          </Card>
        </button>
      </div>

      {/* New Feature Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Proactive Risk Shield */}
          <Card className="lg:col-span-1">
            <div className="flex flex-col h-full">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 border border-blue-200 rounded-lg">
                        <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-dark">Proactive Risk Shield</h2>
                        <p className="text-sm text-gray-500">Prevent future claims with network data.</p>
                    </div>
                 </div>
                 <p className="text-xs text-gray-600 leading-relaxed flex-grow">Anonymized risk signals from the MyARK<sup className="text-[0.6em]">&trade;</sup> user base to prevent future claims. Identify widespread risks (e.g. recalled hoses) and launch mitigation campaigns.</p>
                 <button 
                    onClick={() => setShowCampaignModal(true)}
                    className="mt-4 text-sm bg-blue-50 text-blue-700 font-bold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm flex items-center gap-2 w-full justify-center"
                 >
                    <MegaphoneIcon className="h-4 w-4" />
                    Launch Mitigation Campaign
                 </button>
            </div>
          </Card>
          
          {/* AI Scene Reconstruction */}
          <Card className="lg:col-span-1">
             <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 border border-purple-200 rounded-lg">
                        <CpuChipIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-dark">AI Scene Reconstruction</h2>
                        <p className="text-sm text-gray-500">Automated intake for CAT events.</p>
                    </div>
                </div>
                 <p className="text-xs text-gray-600 leading-relaxed flex-grow">For large-scale losses (fires, floods), upload hundreds of photos at once. Gemini's computer vision will analyze the entire scene, identify every item, and generate a complete manifest automatically.</p>
                 <button 
                    onClick={() => setShowSceneReconModal(true)}
                    className="mt-4 text-sm bg-purple-50 text-purple-700 font-bold px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200 shadow-sm flex items-center gap-2 w-full justify-center"
                 >
                    <CpuChipIcon className="h-4 w-4" />
                    Start CAT Intake
                 </button>
            </div>
          </Card>
      </div>


      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-medium">
        <div className="flex flex-col lg:flex-row gap-4">
           {/* Search */}
           <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                 type="text" 
                 placeholder="Search Manifest ID or Policyholder..." 
                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white text-neutral-black"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           {/* Filters */}
           <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
              {/* Claim Status Filter */}
              <div className="relative">
                 <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <select 
                    className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-300 rounded-md bg-white text-neutral-black focus:outline-none focus:ring-2 focus:ring-brand-primary appearance-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                 >
                    <option value="All">All Manifest Statuses</option>
                    <option value={ClaimStatus.NEW_FROM_MYARK}>{ClaimStatus.NEW_FROM_MYARK}</option>
                    <option value={ClaimStatus.READY_TO_SYNC}>{ClaimStatus.READY_TO_SYNC}</option>
                    <option value={ClaimStatus.FLAGGED_FOR_REVIEW}>{ClaimStatus.FLAGGED_FOR_REVIEW}</option>
                    <option value={ClaimStatus.SYNCED_TO_CMS}>{ClaimStatus.SYNCED_TO_CMS}</option>
                 </select>
              </div>

              {/* Asset Status Filter */}
              <div className="relative">
                 <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <select 
                    className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-300 rounded-md bg-white text-neutral-black focus:outline-none focus:ring-2 focus:ring-brand-primary appearance-none"
                    value={assetStatusFilter}
                    onChange={(e) => setAssetStatusFilter(e.target.value)}
                 >
                    <option value="All">All Asset Statuses</option>
                    <option value={AssetStatus.VERIFIED}>Contains {AssetStatus.VERIFIED}</option>
                    <option value={AssetStatus.PENDING}>Contains {AssetStatus.PENDING}</option>
                    <option value={AssetStatus.FLAGGED}>Contains {AssetStatus.FLAGGED}</option>
                    <option value={AssetStatus.UNVERIFIED}>Contains {AssetStatus.UNVERIFIED}</option>
                 </select>
              </div>

              <div className="flex items-center space-x-2">
                <input 
                   type="date" 
                   className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 bg-white text-neutral-black focus:outline-none focus:ring-2 focus:ring-brand-primary"
                   value={startDate}
                   onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-gray-500 hidden sm:inline">-</span>
                <input 
                   type="date" 
                   className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 bg-white text-neutral-black focus:outline-none focus:ring-2 focus:ring-brand-primary"
                   value={endDate}
                   onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {(searchTerm || statusFilter !== 'All' || assetStatusFilter !== 'All' || startDate || endDate) && (
                  <button 
                     onClick={() => {
                       setSearchTerm('');
                       setStatusFilter('All');
                       setAssetStatusFilter('All');
                       setStartDate('');
                       setEndDate('');
                     }}
                     className="text-status-red hover:text-red-700 text-sm font-medium px-2 self-center whitespace-nowrap"
                  >
                     Clear Filters
                  </button>
              )}
           </div>
        </div>
      </div>

      {/* Claims Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-light text-gray-600">
              <tr>
                <th className="p-4 font-semibold">Source</th>
                <th className="p-4 font-semibold">Manifest ID</th>
                <th className="p-4 font-semibold">Policyholder</th>
                <th className="p-4 font-semibold">Received</th>
                <th className="p-4 font-semibold">Total Value</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.length > 0 ? (
                filteredClaims.map((claim) => {
                  const currentStatus = syncedIds.has(claim.id) ? ClaimStatus.SYNCED_TO_CMS : claim.status;
                  return (
                    <tr 
                      key={claim.id} 
                      onClick={() => onSelectClaim(claim)}
                      className="border-b border-neutral-medium last:border-b-0 hover:bg-neutral-light/50 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                          <div className="flex items-center text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-1 w-fit">
                              <MobilePhoneIcon className="h-3 w-3 mr-1" />
                              MyARK<sup className="text-[0.6em]">&trade;</sup>
                          </div>
                      </td>
                      <td className="p-4 font-medium text-brand-primary">{claim.id}</td>
                      <td className="p-4">{claim.policyholderName}</td>
                      <td className="p-4 text-gray-600">{claim.claimDate}</td>
                      <td className="p-4 font-medium">{formatCurrency(claim.totalClaimedValue)}</td>
                      <td className="p-4">
                        <Badge color={getStatusColor(currentStatus)}>
                          {currentStatus === ClaimStatus.NEW_FROM_MYARK ? <>New from MyARK<sup className="text-[0.6em]">&trade;</sup></> : currentStatus}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                            <button 
                              className="text-gray-500 hover:text-brand-primary font-medium text-sm"
                            >
                              Review
                            </button>
                            {(claim.status === ClaimStatus.READY_TO_SYNC || claim.status === ClaimStatus.SYNCED_TO_CMS || syncedIds.has(claim.id)) && (
                                <button 
                                  onClick={(e) => handleQuickSync(e, claim.id)}
                                  disabled={claim.status === ClaimStatus.SYNCED_TO_CMS || syncedIds.has(claim.id)}
                                  className="text-brand-secondary hover:text-brand-primary border border-brand-secondary/30 hover:border-brand-primary rounded p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Push to CMS"
                                >
                                  <CloudArrowUpIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    No manifests match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DashboardScreen;
