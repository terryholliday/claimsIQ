import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Claim, Asset, FraudRiskLevel, AssetStatus, ClaimStatus, WeatherAnalysis, DuplicateAnalysis, RegulatoryCheck, SettlementReport, AuditLogEntry, LiveFNOLAnalysis, ClaimActivity, ClaimNote, ClaimDocument, DigitalFieldAdjusterAnalysis, ClaimHealthCheckResult, PlaybookStep } from '../../types';
import { analyzeAssetForFraud, analyzeMarketValue, analyzeAssetImage, reconcileReceipt, findLKQReplacement, mapEvidenceToAssets, verifyWeather, detectDuplicates, analyzeBundles, checkPolicyExclusions, calculateDepreciation, auditCategories, generateNegotiationScript, identifySpecialtyItems, analyzeSubrogation, analyzeClaimPadding, performRegulatoryCheck, generateSettlementReport, urlToBase64, fileToBase64, runLiveFNOL, analyzeDamagePhoto, generateClaimSummary, runMyArkFastTrackCheck, runClaimHealthCheck } from '../../services/geminiService';
import { convertToESXDocument, createESXFile, type ProveniqClaimData } from '../../services/xactimate';
import { DEFAULT_PLAYBOOK_STEPS } from '../../constants';

import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import ManifestAssistant from '../ManifestAssistant';
import { ArkiveManifest } from '../../types';
import { generateArkiveManifest } from '../../utils/arkiveManifest';
import { UserIcon, DocumentTextIcon, CalendarIcon, CurrencyDollarIcon, SparklesIcon, TagIcon, CloudArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon, ChatBubbleLeftRightIcon, CameraIcon, ReceiptPercentIcon, PaperClipIcon, InformationCircleIcon, ArrowRightIcon, ScaleIcon, ArrowTrendingDownIcon, DocumentMagnifyingGlassIcon, FlagIcon, PaperAirplaneIcon, CloudIcon, DocumentDuplicateIcon, CpuChipIcon, PlayIcon, CubeTransparentIcon, ShieldExclamationIcon, CalculatorIcon, FolderIcon, MegaphoneIcon, StarIcon, XMarkIcon, CheckBadgeIcon, QuestionMarkCircleIcon, BanknotesIcon, QueueListIcon, ShieldCheckIcon, ArrowPathIcon, BuildingLibraryIcon, QrCodeIcon, MapPinIcon, TableCellsIcon, PrinterIcon, ClockIcon, FingerPrintIcon, LockClosedIcon, MicrophoneIcon, VideoCameraIcon, BoltIcon, XCircleIcon, ListBulletIcon, PlusIcon, CheckIcon, PencilSquareIcon, ChatBubbleBottomCenterTextIcon, ShoppingBagIcon, TruckIcon, MobilePhoneIcon } from '../icons/Icons';

interface ClaimDetailScreenProps {
    claim: Claim;
    onUpdateClaim: (claim: Claim) => void;
}

interface ActionResult {
    title: string;
    summary: string;
    details?: string[];
    type: 'success' | 'warning' | 'info';
}

// Types for the Analysis Engine
interface HealthCheckResult {
    flags: { level: 'critical' | 'warning' | 'info'; text: string }[];
    steps: { id: string; title: string; desc: string }[];
    blockers: string[]; // List of strings describing why export is blocked
    isExportable: boolean;
}

const TOOL_DESCRIPTIONS = {
    MARKET: "Finds real-time retail replacement costs from the web to prevent overpayment.",
    FRAUD: "Analyzes assets for price anomalies, suspicious timing, and behavioral red flags.",
    ACV: "Determines life expectancy and calculates Actual Cash Value based on depreciation.",
    BUNDLE: "Breaks down vague grouped items (e.g., 'Gaming Setup') into specific component line items.",
    POLICY: "Scans for exclusions (e.g., Motor Vehicles) or Special Limits based on standard ISO policies.",
    PADDING: "Detects 'Soft Fraud' by analyzing the ratio of low-value fluff items using Padding Patrol™.",
    SUBRO: "Identifies potential Third-Party Liability (e.g. defective product) via Subro Spotter™.",
    TAXON: "Identifies miscategorized items (e.g., Jewelry listed as Misc) to enforce sub-limits.",
    TRIAGE: "Flags high-value antiques/art that require external professional appraisal.",
    EVIDENCE: "Scans uploaded PDFs (Police Reports, etc.) and links them to specific assets they mention.",
    RECEIPT: "Process receipt images sent via email to match line items."
};

// --- COMPONENTS ---

const DamageAnalysisModal: React.FC<{
    asset: Asset;
    onClose: () => void;
    onRunAnalysis: (asset: Asset) => void;
    isAnalyzing: boolean;
}> = ({ asset, onClose, onRunAnalysis, isAnalyzing }) => {
    const [analysisState, setAnalysisState] = useState<'idle' | 'analyzing' | 'complete'>(
        asset.digitalFieldAdjusterAnalysis ? 'complete' : 'idle'
    );

    useEffect(() => {
        if (isAnalyzing) {
            setAnalysisState('analyzing');
        } else if (asset.digitalFieldAdjusterAnalysis) {
            setAnalysisState('complete');
        }
    }, [isAnalyzing, asset.digitalFieldAdjusterAnalysis]);

    const handleRun = () => {
        onRunAnalysis(asset);
    };

    const analysis = asset.digitalFieldAdjusterAnalysis;

    const renderAnalysisContent = () => {
        if (analysisState === 'analyzing') {
            return (
                <div className="flex flex-col items-center justify-center text-center py-8">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        <CpuChipIcon className="absolute inset-0 m-auto h-8 w-8 text-brand-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-dark mt-4">Analyzing Damage...</h3>
                    <p className="text-gray-500 mt-1">Scanning pixel integrity and cross-referencing material database.</p>
                </div>
            );
        }

        if (analysisState === 'complete' && analysis) {
            return (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 font-bold uppercase">Recommendation</p>
                            <p className={`text-2xl font-bold ${analysis.recommendation === 'Repair' ? 'text-green-600' : 'text-red-600'}`}>{analysis.recommendation}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 font-bold uppercase">Estimated Cost</p>
                            <p className="text-2xl font-bold text-neutral-dark">${analysis.costEstimate.min} - ${analysis.costEstimate.max}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase mb-2">Metrics</p>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <p className="text-sm font-semibold">Severity</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1"><div className="bg-red-500 h-2 rounded-full" style={{ width: `${analysis.severityScore * 10}%` }}></div></div>
                                <p className="text-xs text-gray-500">{analysis.severityScore}/10 - {analysis.damageType}</p>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold">Repairability</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${analysis.repairabilityIndex}%` }}></div></div>
                                <p className="text-xs text-gray-500">{analysis.repairabilityIndex}%</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase mb-2">AI Justification</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200 italic">"{analysis.reasoning}"</p>
                    </div>

                    {analysis.recommendation === 'Repair' && (
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-2">Suggested Repair Plan</p>
                            <div className="border border-gray-200 rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr><th className="p-2 text-left font-medium">Item/Action</th><th className="p-2 text-right font-medium">Est. Cost</th></tr>
                                    </thead>
                                    <tbody>
                                        {analysis.suggestedActionPlan.map((item, i) => (
                                            <tr key={i} className="border-t"><td className="p-2">{item.item}</td><td className="p-2 text-right font-mono">${item.cost}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="text-center py-10">
                <h3 className="text-xl font-bold text-neutral-dark">Digital Field Adjuster</h3>
                <p className="text-gray-500 mt-2 mb-6">Run a Gemini-powered visual analysis to assess the damage and generate a repair/replace plan.</p>
                <button
                    onClick={handleRun}
                    className="bg-brand-primary hover:bg-brand-secondary text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 mx-auto"
                >
                    <CpuChipIcon className="h-5 w-5" /> Run Pixel Analysis
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h2 className="text-lg font-bold text-neutral-dark flex items-center gap-2">
                        <VideoCameraIcon className="h-5 w-5 text-brand-primary" />
                        AI Damage Assessment: <span className="font-medium text-gray-600">{asset.name}</span>
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                    <div className="flex flex-col p-4 border-b lg:border-b-0 lg:border-r border-gray-200">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Pre-Loss Condition <span className="text-blue-600">(from MyARK™)</span></h4>
                                <img src={asset.imageUrl} alt="Pre-loss" className="w-full h-full object-cover rounded-lg border border-gray-200 bg-gray-100" />
                            </div>
                            <div className="relative">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Reported Damage</h4>
                                <img src={asset.damageImageUrl} alt="Damaged" className="w-full h-full object-cover rounded-lg border border-gray-200 bg-gray-100" />
                                {analysisState === 'analyzing' && (
                                    <div className="absolute inset-0 bg-brand-primary/20 rounded-lg overflow-hidden">
                                        <div className="w-full h-1 bg-brand-accent absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {renderAnalysisContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

const LiveFNOLIntake: React.FC<{ claim: Claim; onUpdateClaim: (updatedClaim: Claim) => void }> = ({ claim, onUpdateClaim }) => {
    const { liveFNOLAnalysis } = claim;
    const [isStarting, setIsStarting] = useState(false);

    const handleStartIntake = async () => {
        setIsStarting(true);
        try {
            await runLiveFNOL(claim, (update) => {
                const updatedAnalysis = { ...claim.liveFNOLAnalysis, ...update } as LiveFNOLAnalysis;
                onUpdateClaim({ ...claim, liveFNOLAnalysis: updatedAnalysis });
            });
        } finally {
            setIsStarting(false);
        }
    };

    if (!liveFNOLAnalysis || liveFNOLAnalysis.status === 'idle') {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <MicrophoneIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-neutral-dark">Live FNOL Intake</h3>
                <p className="text-gray-500 max-w-md mx-auto mt-2">
                    Initiate a Gemini-powered voice call with the policyholder to automatically transcribe, summarize, and analyze the First Notice of Loss.
                </p>
                <button
                    onClick={handleStartIntake}
                    disabled={isStarting}
                    className="mt-6 bg-brand-primary hover:bg-brand-secondary text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 mx-auto disabled:opacity-70 transition-all"
                >
                    {isStarting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Initializing Session...
                        </>
                    ) : (
                        <>
                            <PlayIcon className="h-5 w-5" /> Start Live Intake
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {/* Left Column: Transcript */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Live Transcript</h3>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    {liveFNOLAnalysis.transcript.map((entry, i) => (
                        <div key={i} className={`flex items-start gap-3 ${entry.speaker === 'AI' ? '' : 'flex-row-reverse'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 font-bold text-xs ${entry.speaker === 'AI' ? 'bg-indigo-500' : 'bg-blue-500'}`}>
                                {entry.speaker.charAt(0)}
                            </div>
                            <div className={`p-3 rounded-xl max-w-lg ${entry.speaker === 'AI' ? 'bg-gray-100 text-gray-800 rounded-bl-none' : 'bg-brand-primary text-white rounded-br-none'}`}>
                                {entry.text}
                            </div>
                        </div>
                    ))}
                    {liveFNOLAnalysis.status === 'active' && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 font-bold text-xs bg-indigo-500">
                                AI
                            </div>
                            <div className="p-3 rounded-xl bg-gray-100 text-gray-800 rounded-bl-none flex gap-1.5 items-center">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Intelligence */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">AI Intelligence Cards</h3>
                    <div className="space-y-3">
                        {(liveFNOLAnalysis.intelligenceCards || []).map((card, i) => (
                            <div key={i} className={`p-3 rounded-md border text-sm flex items-start gap-2 animate-in fade-in slide-in-from-right-4 duration-500`} style={{ animationDelay: `${i * 100}ms` }}>
                                {card.type === 'alert' && <ExclamationTriangleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                                {card.type === 'info' && <InformationCircleIcon className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />}
                                {card.type === 'action' && <BoltIcon className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />}
                                <span className="text-gray-700">{card.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {liveFNOLAnalysis.status === 'complete' && (
                    <div className="bg-white p-6 rounded-lg border-2 border-green-400 shadow-lg animate-in fade-in zoom-in-95 duration-300">
                        <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-3">FNOL Summary</h3>
                        <p className="text-sm text-gray-700 mb-4 italic">"{liveFNOLAnalysis.summary}"</p>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Extracted Entities</h4>
                        <div className="flex flex-wrap gap-2">
                            {(liveFNOLAnalysis.extractedEntities || []).map((entity, i) => (
                                <Badge key={i} color="gray">{entity.type}: {entity.value}</Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AIClaimBriefing: React.FC<{
    claim: Claim;
    setClaim: React.Dispatch<React.SetStateAction<Claim>>;
    logAction: (action: string, details: string) => void;
}> = ({ claim, setClaim, logAction }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateBriefing = async () => {
        setIsGenerating(true);
        logAction('AI_BRIEFING_REQUEST', 'Requesting AI-generated claim summary.');
        const summary = await generateClaimSummary(claim);
        if (summary) {
            setClaim(prev => ({
                ...prev,
                claimSummary: summary,
            }));
            logAction('AI_BRIEFING_SUCCESS', 'Successfully generated and applied claim summary.');
        } else {
            logAction('AI_BRIEFING_FAILURE', 'Failed to generate claim summary.');
            alert("There was an error generating the AI briefing. Please try again.");
        }
        setIsGenerating(false);
    };

    const handleAddTask = (action: { title: string; reasoning: string }) => {
        const newActivity: ClaimActivity = {
            id: `act-ai-${Date.now()}`,
            title: action.title,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
            assignee: 'Alex Johnson',
            status: 'Open',
        };

        // Also add the reasoning as a note for context
        const newNote: ClaimNote = {
            id: `note-ai-${Date.now()}`,
            timestamp: new Date().toISOString(),
            author: 'TrueManifest AI',
            content: `Suggested task added from AI Action Plan.\n\nReasoning: "${action.reasoning}"`,
            type: 'log',
        };

        setClaim(prev => ({
            ...prev,
            activities: [...(prev.activities || []), newActivity],
            notes: [newNote, ...(prev.notes || [])]
        }));
        logAction('AI_TASK_ADDED', `Added suggested task: "${action.title}"`);
    };

    const handleAddAllTasks = () => {
        if (!claim.claimSummary?.suggestedActions) return;

        const existingActivityTitles = new Set((claim.activities || []).map(a => a.title));
        const newActions = claim.claimSummary.suggestedActions.filter(
            action => !existingActivityTitles.has(action.title)
        );

        if (newActions.length === 0) return;

        const newActivities: ClaimActivity[] = [];
        const newNotes: ClaimNote[] = [];

        newActions.forEach((action, index) => {
            const timestamp = Date.now() + index; // to avoid duplicate keys if added quickly
            newActivities.push({
                id: `act-ai-${timestamp}`,
                title: action.title,
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                assignee: 'Alex Johnson',
                status: 'Open',
            });
            newNotes.push({
                id: `note-ai-${timestamp}`,
                timestamp: new Date().toISOString(),
                author: 'TrueManifest AI',
                content: `Suggested task added from AI Action Plan.\n\nReasoning: "${action.reasoning}"`,
                type: 'log',
            });
        });

        setClaim(prev => ({
            ...prev,
            activities: [...(prev.activities || []), ...newActivities],
            notes: [...newNotes, ...(prev.notes || [])]
        }));
        logAction('AI_BULK_TASK_ADD', `Added ${newActions.length} suggested tasks.`);
    };

    // If loading
    if (isGenerating) {
        return (
            <Card className="text-center py-12">
                <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    <SparklesIcon className="absolute inset-0 m-auto h-8 w-8 text-brand-primary" />
                </div>
                <h3 className="text-xl font-bold text-neutral-dark">Generating AI Briefing...</h3>
                <p className="text-gray-500 mt-1">Analyzing claim file and identifying key insights.</p>
            </Card>
        );
    }

    // If summary exists
    if (claim.claimSummary) {
        const existingActivityTitles = new Set((claim.activities || []).map(a => a.title));
        const allTasksAdded = claim.claimSummary.suggestedActions.every(action => existingActivityTitles.has(action.title));

        return (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-0 overflow-hidden animate-in fade-in duration-500">
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-brand-accent/20 rounded-md border border-brand-accent/30">
                            <SparklesIcon className="h-6 w-6 text-brand-accent" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold leading-none">AI Claim Briefing</h2>
                            <p className="text-gray-400 text-xs mt-1">Generated by Gemini just now.</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <blockquote className="border-l-4 border-brand-primary bg-blue-50 p-4 text-brand-primary-dark font-medium italic">
                        "{claim.claimSummary.summary}"
                    </blockquote>

                    <div>
                        <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-4 w-4" /> Key Red Flags
                        </h3>
                        <ul className="space-y-2">
                            {claim.claimSummary.redFlags.map((flag, i) => (
                                <li key={i} className="text-sm text-red-900 bg-red-50 border border-red-100 p-2 rounded-md flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0"></div>
                                    {flag}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider flex items-center gap-2">
                                <ListBulletIcon className="h-4 w-4" /> AI Action Plan
                            </h3>
                            {!allTasksAdded && (
                                <button
                                    onClick={handleAddAllTasks}
                                    className="text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 bg-green-100 text-green-800 hover:bg-green-200 border border-green-200 transition-colors"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Add All Tasks
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {claim.claimSummary.suggestedActions.map((action, i) => {
                                const isAdded = existingActivityTitles.has(action.title);
                                return (
                                    <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center gap-4 hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-gray-800">{action.title}</p>
                                            <p className="text-xs text-gray-500 mt-1 italic">AI Reasoning: "{action.reasoning}"</p>
                                        </div>
                                        <button
                                            onClick={() => handleAddTask(action)}
                                            disabled={isAdded}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 shrink-0 transition-colors ${isAdded
                                                ? 'bg-green-100 text-green-800 cursor-default'
                                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                                                }`}
                                        >
                                            {isAdded ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                                            {isAdded ? 'Added' : 'Add Task'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Initial State: Button to generate
    return (
        <div className="bg-white border-l-4 border-brand-primary rounded-r-lg shadow-sm flex items-center justify-between p-6 animate-in fade-in slide-in-from-top-2 border-y border-r border-gray-200">
            <div>
                <h3 className="text-lg font-bold text-neutral-dark flex items-center gap-2"><SparklesIcon className="h-5 w-5 text-brand-accent" /> AI Claim Briefing</h3>
                <p className="text-sm text-gray-600 mt-1">Get an instant summary, red flags, and a recommended action plan from Gemini.</p>
            </div>
            <button
                onClick={handleGenerateBriefing}
                className="bg-brand-primary hover:bg-brand-secondary text-white font-bold px-6 py-3 rounded-lg shadow-md flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
                <SparklesIcon className="h-5 w-5" /> Generate Briefing
            </button>
        </div>
    );
};


const AuditLogModal: React.FC<{ claim: Claim; onClose: () => void }> = ({ claim, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-[80] animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <FingerPrintIcon className="h-6 w-6 text-green-400" />
                        <div>
                            <h3 className="font-bold text-lg">Immutable Audit Log</h3>
                            <p className="text-xs text-gray-400 font-mono">{claim.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div className="space-y-6 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-200">
                        {(claim.auditTrail || []).slice().reverse().map((log) => (
                            <div key={log.id} className="relative pl-10">
                                <div className="absolute left-[11px] top-1.5 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                                        <span className="text-[10px] font-mono text-gray-300 truncate max-w-[80px]" title={log.hash}>#{log.hash}</span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800">{log.action.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-gray-600 mt-1">{log.details}</p>
                                    <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-2">
                                        <UserIcon className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs text-gray-400">{log.user}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!claim.auditTrail || claim.auditTrail.length === 0) && (
                            <div className="pl-10 text-gray-400 text-sm italic">No actions recorded yet.</div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-gray-200">
                    <button className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2">
                        <PrinterIcon className="h-4 w-4" /> Export Legal Log (PDF)
                    </button>
                </div>
            </div>
        </div>
    );
};

const ActionSummaryModal: React.FC<{ result: ActionResult | null; onClose: () => void }> = ({ result, onClose }) => {
    if (!result) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all scale-100">
                <div className={`p-6 ${result.type === 'success' ? 'bg-green-50' : result.type === 'warning' ? 'bg-orange-50' : 'bg-blue-100 text-blue-600'}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${result.type === 'success' ? 'bg-green-100 text-green-600' : result.type === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                {result.type === 'success' ? <CheckBadgeIcon className="h-6 w-6" /> : result.type === 'warning' ? <ShieldExclamationIcon className="h-6 w-6" /> : <SparklesIcon className="h-6 w-6" />}
                            </div>
                            <h3 className="text-xl font-bold text-neutral-dark">{result.title}</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <p className="mt-3 text-gray-700 font-medium">{result.summary}</p>
                </div>

                {result.details && result.details.length > 0 && (
                    <div className="p-6 max-h-60 overflow-y-auto bg-white">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detailed Findings</h4>
                        <ul className="space-y-2">
                            {result.details.map((detail, idx) => (
                                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0"></div>
                                    {detail}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-neutral-dark hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const CommandCenterHelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const tools = [
        { icon: <TagIcon className="h-5 w-5 text-brand-secondary" />, title: "Check Market", desc: TOOL_DESCRIPTIONS.MARKET },
        { icon: <SparklesIcon className="h-5 w-5 text-brand-accent" />, title: "Scan Fraud", desc: TOOL_DESCRIPTIONS.FRAUD },
        { icon: <CubeTransparentIcon className="h-5 w-5 text-indigo-500" />, title: "Bundle Breakout™", desc: TOOL_DESCRIPTIONS.BUNDLE },
        { icon: <ShieldExclamationIcon className="h-5 w-5 text-orange-500" />, title: "Policy Guardian™", desc: TOOL_DESCRIPTIONS.POLICY },
        { icon: <CalculatorIcon className="h-5 w-5 text-teal-500" />, title: "Smart Depreciator™", desc: TOOL_DESCRIPTIONS.ACV },
        { icon: <FolderIcon className="h-5 w-5 text-purple-500" />, title: "Taxonomy Auditor", desc: TOOL_DESCRIPTIONS.TAXON },
        { icon: <StarIcon className="h-5 w-5 text-yellow-500" />, title: "Specialty Triage", desc: TOOL_DESCRIPTIONS.TRIAGE },
        { icon: <BanknotesIcon className="h-5 w-5 text-green-600" />, title: "Subro Spotter™", desc: TOOL_DESCRIPTIONS.SUBRO },
        { icon: <QueueListIcon className="h-5 w-5 text-red-500" />, title: "Padding Patrol™", desc: TOOL_DESCRIPTIONS.PADDING },
        { icon: <DocumentMagnifyingGlassIcon className="h-5 w-5 text-gray-600" />, title: "Evidence Mapper", desc: TOOL_DESCRIPTIONS.EVIDENCE },
        { icon: <ReceiptPercentIcon className="h-5 w-5 text-gray-600" />, title: "Ingest Receipt", desc: TOOL_DESCRIPTIONS.RECEIPT },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
                <div className="p-6 bg-brand-primary text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <CpuChipIcon className="h-6 w-6" /> AI Command Center Guide
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                    {tools.map((tool, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                            <div className="p-2 bg-white shadow-sm border border-gray-100 rounded-lg shrink-0">
                                {tool.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-neutral-dark text-sm">{tool.title}</h4>
                                <p className="text-xs text-gray-600 leading-relaxed mt-1">{tool.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
                    <button onClick={onClose} className="bg-neutral-dark text-white px-4 py-2 rounded-lg text-sm font-medium">Got it</button>
                </div>
            </div>
        </div>
    );
};

const AssetPhotoViewer: React.FC<{
    asset: Asset;
    onClose: () => void;
    onRunVisualTruth: (asset: Asset) => void;
    isAnalyzing: boolean;
}> = ({ asset, onClose, onRunVisualTruth, isAnalyzing }) => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
            >
                <XMarkIcon className="h-8 w-8" />
            </button>

            <div className="flex flex-col md:flex-row w-full max-w-6xl h-full max-h-[85vh] bg-neutral-900 rounded-xl overflow-hidden shadow-2xl">
                {/* Image Area */}
                <div className="flex-1 bg-black flex items-center justify-center relative p-4">
                    <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="max-w-full max-h-full object-contain"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/800x600/333/FFF?text=Image+Not+Available";
                            e.currentTarget.onerror = null;
                        }}
                    />
                </div>

                {/* Details & Analysis Sidebar */}
                <div className="w-full md:w-96 bg-white flex flex-col border-l border-gray-200">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-xl font-bold text-neutral-dark">{asset.name}</h3>
                        <div className="flex justify-between items-center mt-2">
                            <Badge>{asset.category}</Badge>
                            <span className="font-bold text-lg">{formatCurrency(asset.claimedValue)}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" /> Purchased: {asset.purchaseDate}
                        </p>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        {/* Metadata Section (New) */}
                        <div className="mb-6">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">Digital Evidence Metadata</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <QrCodeIcon className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-gray-500 text-xs">Serial Number Logic</p>
                                        <p className={`font-mono font-medium ${asset.serialNumber ? 'text-green-600' : 'text-gray-400'}`}>
                                            {asset.serialNumber ? `${asset.serialNumber} (Verified Format)` : 'Not Detected'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-gray-500 text-xs">EXIF Location</p>
                                        <p className="font-medium text-gray-800">{asset.exifData?.gpsLocation || 'Metadata Stripped'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-gray-500 text-xs">Date Taken</p>
                                        <p className="font-medium text-gray-800">{asset.exifData?.dateTaken || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                            <CameraIcon className="h-4 w-4" /> Visual Truth AI
                        </h4>

                        {!asset.imageAnalysis ? (
                            <div className="text-center py-4">
                                <p className="text-gray-500 text-sm mb-4">Run a visual forensic analysis to detect discrepancies between the photo and the claim description.</p>
                                <button
                                    onClick={() => onRunVisualTruth(asset)}
                                    disabled={isAnalyzing}
                                    className="bg-brand-primary hover:bg-brand-secondary text-white px-6 py-3 rounded-lg font-bold shadow-lg w-full flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Analyzing Pixels...
                                        </>
                                    ) : (
                                        <>
                                            <SparklesIcon className="h-5 w-5 text-brand-accent" />
                                            Run Visual Check
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
                                <div className={`p-4 rounded-lg border ${asset.imageAnalysis.isConsistent ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {asset.imageAnalysis.isConsistent ? (
                                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                                        ) : (
                                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                                        )}
                                        <span className={`font-bold text-lg ${asset.imageAnalysis.isConsistent ? 'text-green-800' : 'text-red-800'}`}>
                                            {asset.imageAnalysis.isConsistent ? 'Consistent' : 'Discrepancy Found'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        <span className="font-semibold">Visual Condition:</span> {asset.imageAnalysis.visualCondition}
                                    </p>
                                </div>

                                {!asset.imageAnalysis.isConsistent && (
                                    <div>
                                        <h5 className="text-sm font-bold text-red-800 mb-2">Detailed Flags:</h5>
                                        <ul className="space-y-2">
                                            {asset.imageAnalysis.discrepancies.map((d, i) => (
                                                <li key={i} className="text-sm text-gray-600 bg-red-50 p-2 rounded border border-red-100 flex items-start gap-2">
                                                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0"></div>
                                                    {d}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <button
                                    onClick={() => onRunVisualTruth(asset)}
                                    disabled={isAnalyzing}
                                    className="text-brand-primary text-sm hover:underline flex items-center justify-center w-full mt-4"
                                >
                                    <ArrowPathIcon className="h-4 w-4 mr-1" /> Re-run Analysis
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for Secondary Tool Buttons
const ToolRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    description: string;
    onClick: () => void;
    disabled?: boolean;
    colorClass: string;
}> = ({ icon, label, description, onClick, disabled, colorClass }) => (
    <div className="relative group w-full">
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-all border border-transparent hover:bg-gray-50 hover:border-gray-200 text-left ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className={`p-1.5 rounded-md bg-opacity-10 ${colorClass} group-hover:bg-opacity-20`}>
                {disabled ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div> : React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-4 w-4" })}
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-neutral-dark">{label}</span>
        </button>
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-56 z-[80] text-center leading-tight">
            {description}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

const ClaimDetailScreen: React.FC<ClaimDetailScreenProps> = ({ claim: initialClaim, onUpdateClaim }) => {
    const [claim, setClaim] = useState<Claim>(initialClaim);
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const startTimeRef = useRef<number>(Date.now());
    const aiHubRef = useRef<HTMLDivElement>(null);

    const [activeTab, setActiveTab] = useState<'manifest' | 'activities' | 'financials' | 'notes' | 'documents' | 'liveFNOL'>('manifest');

    const [viewingAssetId, setViewingAssetId] = useState<string | null>(null);
    const [assessingDamageAssetId, setAssessingDamageAssetId] = useState<string | null>(null);
    const viewingAsset = claim.assets.find(a => a.id === viewingAssetId);
    const assessingDamageAsset = claim.assets.find(a => a.id === assessingDamageAssetId);

    const [loadingAssetId, setLoadingAssetId] = useState<string | null>(null);
    const [analyzingMarketId, setAnalyzingMarketId] = useState<string | null>(null);
    const [visualAnalyzingId, setVisualAnalyzingId] = useState<string | null>(null);
    const [lkqAnalyzingId, setLkqAnalyzingId] = useState<string | null>(null);
    const [negotiatingAssetId, setNegotiatingAssetId] = useState<string | null>(null);
    const [analyzingDamageId, setAnalyzingDamageId] = useState<string | null>(null);

    const [isSyncing, setIsSyncing] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [isReconciling, setIsReconciling] = useState(false);
    const [isMappingEvidence, setIsMappingEvidence] = useState(false);
    const [isBatchAnalyzingFraud, setIsBatchAnalyzingFraud] = useState(false);
    const [isBatchCheckingMarket, setIsBatchCheckingMarket] = useState(false);
    const [isBreakingBundles, setIsBreakingBundles] = useState(false);
    const [isCheckingPolicy, setIsCheckingPolicy] = useState(false);
    const [isDepreciating, setIsDepreciating] = useState(false);
    const [isAuditingCategories, setIsAuditingCategories] = useState(false);
    const [isTriagingSpecialty, setIsTriagingSpecialty] = useState(false);
    const [isSubroSpotting, setIsSubroSpotting] = useState(false);
    const [isPaddingPatrol, setIsPaddingPatrol] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
    const [isGeneratingSettlement, setIsGeneratingSettlement] = useState(false);
    const [isRunAllLoading, setIsRunAllLoading] = useState(false);
    const [isCheckingFastTrack, setIsCheckingFastTrack] = useState(false);

    // Playbook & Health Check State
    const [currentStep, setCurrentStep] = useState<string>(claim.currentPlaybookStepId || 'step-1');
    const [playbookSteps, setPlaybookSteps] = useState<PlaybookStep[]>(DEFAULT_PLAYBOOK_STEPS);
    const [healthCheckResult, setHealthCheckResult] = useState<ClaimHealthCheckResult | null>(null);

    // Sync current step from prop if it changes
    useEffect(() => {
        if (claim.currentPlaybookStepId) {
            setCurrentStep(claim.currentPlaybookStepId);
        }
    }, [claim.currentPlaybookStepId]);

    const handleStepClick = (stepId: string) => {
        setCurrentStep(stepId);
        onUpdateClaim({ ...claim, currentPlaybookStepId: stepId });
        // Update local completed status (simple logic: all steps before current are done)
        setPlaybookSteps(prev => prev.map(step => {
            const steps = DEFAULT_PLAYBOOK_STEPS; // use constant for order
            const currentIdx = steps.findIndex(s => s.id === stepId);
            const stepIdx = steps.findIndex(s => s.id === step.id);
            return { ...step, completed: stepIdx < currentIdx };
        }));
    };

    const runHealthCheck = useCallback(() => {
        const result = runClaimHealthCheck(claim);
        setHealthCheckResult(result);
        if (result.readyForExport) {
            setActionResult({
                title: "Ready for Export",
                summary: "This claim passed all health checks.",
                type: 'success'
            });
        } else {
            setActionResult({
                title: "Health Check Issues",
                summary: `Found ${result.criticalMissingFields.length} critical errors and ${result.warnings.length} warnings.`,
                details: [...result.criticalMissingFields, ...result.warnings],
                type: 'warning'
            });
        }
    }, [claim]);

    const handleRunFastTrack = async () => {
        setIsCheckingFastTrack(true);
        logAction('MYARK_FAST_TRACK_INIT', 'Initiated MyARK Fast-Track Check');
        const result = await runMyArkFastTrackCheck(claim);
        if (result) {
            setClaim(prev => ({ ...prev, myArkFastTrackResult: result }));
            logAction('MYARK_FAST_TRACK_COMPLETE', `Completed Fast-Track check. Verdict: ${result.verdict}`);
        }
        setIsCheckingFastTrack(false);
    };

    const [weatherAnalysis, setWeatherAnalysis] = useState<WeatherAnalysis | null>(null);
    const [duplicateAnalysis, setDuplicateAnalysis] = useState<DuplicateAnalysis | null>(null);
    const [regulatoryHealth, setRegulatoryHealth] = useState<RegulatoryCheck | null>(null);
    const [isCheckingContext, setIsCheckingContext] = useState(false);
    const [settlementReport, setSettlementReport] = useState<SettlementReport | null>(null);

    const [actionResult, setActionResult] = useState<ActionResult | null>(null);

    const receiptInputRef = useRef<HTMLInputElement>(null);
    const evidenceInputRef = useRef<HTMLInputElement>(null);

    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    const claimHealth = useMemo((): HealthCheckResult => {
        const flags: { level: 'critical' | 'warning' | 'info'; text: string }[] = [];
        const steps: { id: string; title: string; desc: string }[] = [];
        const blockers: string[] = [];

        // This logic is now superseded by the AI Claim Briefing, 
        // but kept for the export validation.
        const flaggedAssets = claim.assets.filter(a => a.status === AssetStatus.FLAGGED);
        if (flaggedAssets.length > 0) {
            blockers.push(`${flaggedAssets.length} items are flagged as High Risk.`);
        }

        const unScannedCount = claim.assets.filter(a => !a.fraudAnalysis).length;
        if (unScannedCount > 0) {
            blockers.push("Fraud analysis incomplete.");
        }

        const unPricedHighValue = claim.assets.filter(a => a.claimedValue > 500 && !a.marketValueAnalysis).length;
        if (unPricedHighValue > 0) {
            blockers.push("Market valuation incomplete for high-value items.");
        }

        return { flags, steps, blockers, isExportable: blockers.length === 0 };
    }, [claim]);

    const logAction = (action: string, details: string) => {
        const newEntry: AuditLogEntry = {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: 'Alex Johnson',
            action,
            details,
            hash: Math.random().toString(36).substring(2, 15)
        };

        setClaim(prev => ({
            ...prev,
            auditTrail: [...(prev.auditTrail || []), newEntry]
        }));
    };

    useEffect(() => {
        startTimeRef.current = Date.now();
        const interval = setInterval(() => {
            setSessionSeconds(prev => prev + 1);
        }, 1000);

        return () => {
            clearInterval(interval);
            const duration = Date.now() - startTimeRef.current;
            onUpdateClaim({
                ...claim,
                touchTime: (initialClaim.touchTime || 0) + duration
            });
        };
    }, [initialClaim.id]);

    useEffect(() => {
        // This effect will run every time the `claim` state changes, ensuring that
        // the parent component's state is updated with the latest version from this screen.
        onUpdateClaim(claim);
    }, [claim, onUpdateClaim]);

    const formatSessionTimer = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getTargetAssets = () => {
        if (selectedAssetIds.size > 0) {
            return claim.assets.filter(a => selectedAssetIds.has(a.id));
        }
        return claim.assets;
    };

    const getBatchLabel = (baseLabel: string) => {
        if (selectedAssetIds.size > 0) {
            return `${baseLabel} (${selectedAssetIds.size})`;
        }
        return baseLabel;
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedAssetIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedAssetIds(newSet);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedAssetIds(new Set(claim.assets.map(a => a.id)));
        } else {
            setSelectedAssetIds(new Set());
        }
    };

    const updateAssetStatus = (assetId: string, newStatus: AssetStatus) => {
        setClaim(prev => ({
            ...prev,
            assets: prev.assets.map(a => a.id === assetId ? { ...a, status: newStatus } : a)
        }));
        logAction('STATUS_CHANGE', `Asset ${assetId} status changed to ${newStatus}`);
    };

    const runContextChecks = useCallback(async () => {
        setIsCheckingContext(true);
        if (claim.location && claim.claimDate) {
            const weather = await verifyWeather(claim.location, claim.claimDate);
            setWeatherAnalysis(weather);
        }
        const dupeResult = await detectDuplicates(claim.assets);
        setDuplicateAnalysis(dupeResult);
        const regResult = await performRegulatoryCheck(claim);
        setRegulatoryHealth(regResult);
        setIsCheckingContext(false);
    }, [claim.location, claim.claimDate, claim.assets]);

    useEffect(() => {
        runContextChecks();
    }, [runContextChecks]);

    const handleAnalyze = useCallback(async (assetToAnalyze: Asset) => {
        setLoadingAssetId(assetToAnalyze.id);
        const analysisResult = await analyzeAssetForFraud(assetToAnalyze);

        logAction('AI_FRAUD_SCAN', `Analyzed ${assetToAnalyze.name}. Result: ${analysisResult.riskLevel}`);

        setClaim(prevClaim => ({
            ...prevClaim,
            assets: prevClaim.assets.map(asset =>
                asset.id === assetToAnalyze.id
                    ? {
                        ...asset,
                        fraudAnalysis: analysisResult,
                        status: analysisResult.riskLevel === FraudRiskLevel.HIGH ? AssetStatus.FLAGGED : asset.status
                    }
                    : asset
            )
        }));
        setLoadingAssetId(null);
    }, []);

    const handleCheckMarketValue = useCallback(async (assetToAnalyze: Asset) => {
        setAnalyzingMarketId(assetToAnalyze.id);
        const marketResult = await analyzeMarketValue(assetToAnalyze);
        if (marketResult) {
            logAction('MARKET_CHECK', `Found value $${marketResult.estimatedValue} for ${assetToAnalyze.name}`);
            setClaim(prevClaim => ({
                ...prevClaim,
                assets: prevClaim.assets.map(asset =>
                    asset.id === assetToAnalyze.id
                        ? {
                            ...asset,
                            marketValueAnalysis: marketResult
                        }
                        : asset
                )
            }));
        }
        setAnalyzingMarketId(null);
    }, []);

    const handleLKQAnalysis = async (asset: Asset) => {
        setLkqAnalyzingId(asset.id);
        const result = await findLKQReplacement(asset);
        if (result) {
            logAction('LKQ_ANALYSIS', `Found modern equivalent: ${result.modernModel}`);
            setClaim(prev => ({
                ...prev,
                assets: prev.assets.map(a => a.id === asset.id ? { ...a, lkqAnalysis: result } : a)
            }));
        }
        setLkqAnalyzingId(null);
    };

    const handleAnalyzeDamage = async (asset: Asset) => {
        setAnalyzingDamageId(asset.id);
        const result = await analyzeDamagePhoto(asset);
        logAction('DIGITAL_FIELD_ADJUSTER', `Analyzed damage for ${asset.name}. Recommendation: ${result.recommendation}`);
        setClaim(prev => ({
            ...prev,
            assets: prev.assets.map(a => a.id === asset.id ? { ...a, digitalFieldAdjusterAnalysis: result } : a)
        }));
        setAnalyzingDamageId(null);
    };

    const handleVisualTruth = async (asset: Asset) => {
        setVisualAnalyzingId(asset.id);
        try {
            const base64 = await urlToBase64(asset.imageUrl);
            const result = await analyzeAssetImage(asset, base64);

            if (result) {
                logAction('VISUAL_FORENSICS', `Scanned photo for ${asset.name}. Consistent: ${result.isConsistent}`);
                setClaim(prev => ({
                    ...prev,
                    assets: prev.assets.map(a => a.id === asset.id ? { ...a, imageAnalysis: result } : a)
                }));
            }
        } catch (e) {
            alert("Demo limitation: Could not fetch cross-origin image for analysis. Try uploading a receipt instead!");
        }
        setVisualAnalyzingId(null);
    };

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsReconciling(true);
            const file = e.target.files[0];
            const base64 = await fileToBase64(file);
            const matches = await reconcileReceipt(base64, claim.assets);

            if (matches.length > 0) {
                logAction('RECEIPT_INGEST', `Processed receipt. Matched ${matches.length} items.`);
                setClaim(prev => ({
                    ...prev,
                    assets: prev.assets.map(asset => {
                        const match = matches.find(m => m.assetId === asset.id);
                        return match ? { ...asset, receiptMatch: match, status: AssetStatus.VERIFIED } : asset;
                    })
                }));
                setActionResult({
                    title: "Receipt Ingested",
                    summary: `Successfully matched ${matches.length} items from the uploaded receipt.`,
                    details: matches.map(m => `Matched "${m.receiptItemName}" ($${m.receiptPrice}) to asset.`),
                    type: 'success'
                });
            } else {
                setActionResult({
                    title: "Receipt Ingested",
                    summary: "No high-confidence matches found in the uploaded receipt.",
                    type: 'info'
                });
            }
            setIsReconciling(false);
        }
    };

    const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsMappingEvidence(true);
            const mockDocText = "Police Report #9982. Victim reported theft of a Diamond Necklace and a MacBook Pro 16 from residence on July 15th. Officer noted broken window.";
            const matches = await mapEvidenceToAssets(mockDocText, claim.assets);

            if (matches.length > 0) {
                logAction('EVIDENCE_MAPPED', `Linked Police Report to ${matches.length} assets.`);
                setClaim(prev => ({
                    ...prev,
                    assets: prev.assets.map(asset => {
                        const match = matches.find(m => m.assetId === asset.id);
                        if (match) {
                            const existingDocs = asset.linkedDocuments || [];
                            return { ...asset, linkedDocuments: [...existingDocs, match.documentName] };
                        }
                        return asset;
                    })
                }));
                setActionResult({
                    title: "Evidence Mapper",
                    summary: `Document mapped to ${matches.length} assets.`,
                    details: matches.map(m => `Linked ${m.documentName} to asset ID ${m.assetId}`),
                    type: 'success'
                });
            } else {
                setActionResult({
                    title: "Evidence Mapper",
                    summary: "No assets were explicitly mentioned in the uploaded document.",
                    type: 'info'
                });
            }
            setIsMappingEvidence(false);
        }
    };

    const handleBundleBreakout = async (suppressModal = false) => {
        setIsBreakingBundles(true);
        try {
            const targetAssets = getTargetAssets();
            const results = await analyzeBundles(targetAssets);
            if (results.length > 0) {
                logAction('BUNDLE_BREAKOUT', `Unpacked ${results.length} bundles.`);
                setClaim(prev => ({
                    ...prev,
                    assets: prev.assets.map(asset => {
                        const match = results.find(r => r.assetId === asset.id);
                        return match ? { ...asset, bundleAnalysis: match.analysis } : asset;
                    })
                }));
                if (!suppressModal) {
                    setActionResult({
                        title: "Bundle Breakout™ Results",
                        summary: `Successfully unpacked ${results.length} bundled items from ${targetAssets.length} checked.`,
                        details: results.map(r => {
                            const asset = claim.assets.find(a => a.id === r.assetId);
                            return `Unpacked "${asset?.name}" into ${r.analysis.components.length} components.`;
                        }),
                        type: 'success'
                    });
                }
            } else if (!suppressModal) {
                setActionResult({
                    title: "Bundle Breakout™ Results",
                    summary: "No vague bundles detected in the selected assets.",
                    type: 'info'
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsBreakingBundles(false);
        }
    };

    const handlePolicyCheck = async (suppressModal = false) => {
        setIsCheckingPolicy(true);
        try {
            const targetAssets = getTargetAssets();
            const results = await checkPolicyExclusions(targetAssets);
            if (results.length > 0) {
                logAction('POLICY_CHECK', `Flagged ${results.length} exclusions.`);
                setClaim(prev => ({
                    ...prev,
                    assets: prev.assets.map(asset => {
                        const match = results.find(r => r.assetId === asset.id);
                        return match ? { ...asset, policyCheck: match.check } : asset;
                    })
                }));
                if (!suppressModal) {
                    setActionResult({
                        title: "Policy Guardian™ Report",
                        summary: `Flagged ${results.length} items with potential policy issues.`,
                        details: results.map(r => {
                            const asset = claim.assets.find(a => a.id === r.assetId);
                            return `${asset?.name}: ${r.check.warningMessage} (${r.check.exclusionCategory})`;
                        }),
                        type: 'warning'
                    });
                }
            } else if (!suppressModal) {
                setActionResult({
                    title: "Policy Guardian™ Report",
                    summary: "No policy exclusions detected in selected assets.",
                    type: 'success'
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCheckingPolicy(false);
        }
    };

    const handleDepreciation = async (suppressModal = false) => {
        setIsDepreciating(true);
        try {
            const targetAssets = getTargetAssets();
            const results = await calculateDepreciation(targetAssets);
            logAction('CALC_DEPRECIATION', `Applied depreciation rules to ${results.length} assets.`);
            setClaim(prev => ({
                ...prev,
                assets: prev.assets.map(asset => {
                    const match = results.find(r => r.assetId === asset.id);
                    return match ? { ...asset, depreciationAnalysis: match.analysis } : asset;
                })
            }));
            if (!suppressModal) {
                setActionResult({
                    title: "Smart Depreciator™ Results",
                    summary: `Calculated Actual Cash Value (ACV) for ${results.length} assets.`,
                    details: results.map(r => {
                        const asset = claim.assets.find(a => a.id === r.assetId);
                        return `${asset?.name}: ACV $${r.analysis.actualCashValue} (${Math.round(r.analysis.depreciationPct * 100)}% depreciation)`;
                    }),
                    type: 'success'
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsDepreciating(false);
        }
    };

    const handleCategoryAudit = async (suppressModal = false) => {
        setIsAuditingCategories(true);
        try {
            const targetAssets = getTargetAssets();
            const results = await auditCategories(targetAssets);
            const incorrectCount = results.filter(r => !r.analysis.isCorrect).length;

            logAction('TAXONOMY_AUDIT', `Checked categories. Found ${incorrectCount} errors.`);

            setClaim(prev => ({
                ...prev,
                assets: prev.assets.map(asset => {
                    const match = results.find(r => r.assetId === asset.id);
                    return match ? { ...asset, categoryAnalysis: match.analysis } : asset;
                })
            }));
            if (!suppressModal) {
                if (incorrectCount > 0) {
                    setActionResult({
                        title: "Taxonomy Audit Results",
                        summary: `Found ${incorrectCount} miscategorized items among ${results.length} checked.`,
                        details: results.filter(r => !r.analysis.isCorrect).map(r => {
                            const asset = claim.assets.find(a => a.id === r.assetId);
                            return `${asset?.name}: Move from '${asset?.category}' to '${r.analysis.suggestedCategory}'`;
                        }),
                        type: 'warning'
                    });
                } else {
                    setActionResult({
                        title: "Taxonomy Audit Results",
                        summary: "All selected asset categories appear to be accurate.",
                        type: 'success'
                    });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAuditingCategories(false);
        }
    };

    const handleSpecialtyTriage = async (suppressModal = false) => {
        setIsTriagingSpecialty(true);
        try {
            const targetAssets = getTargetAssets();
            const results = await identifySpecialtyItems(targetAssets);
            const specialtyCount = results.length;

            if (specialtyCount > 0) logAction('SPECIALTY_TRIAGE', `Flagged ${specialtyCount} items for external appraisal.`);

            setClaim(prev => ({
                ...prev,
                assets: prev.assets.map(asset => {
                    const match = results.find(r => r.assetId === asset.id);
                    return match ? { ...asset, specialtyAnalysis: match.analysis } : asset;
                })
            }));
            if (!suppressModal) {
                if (specialtyCount > 0) {
                    setActionResult({
                        title: "Specialty Triage Results",
                        summary: `Identified ${specialtyCount} items requiring external appraisal.`,
                        details: results.map(r => {
                            const asset = claim.assets.find(a => a.id === r.assetId);
                            return `${asset?.name}: ${r.analysis.recommendation}`;
                        }),
                        type: 'info'
                    });
                } else {
                    setActionResult({
                        title: "Specialty Triage Results",
                        summary: "No specialty items found in selection.",
                        type: 'success'
                    });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsTriagingSpecialty(false);
        }
    };

    const handleSubroSpotter = async (suppressModal = false) => {
        setIsSubroSpotting(true);
        try {
            const targetAssets = getTargetAssets();
            const results = await analyzeSubrogation(targetAssets);
            if (results.length > 0) {
                logAction('SUBRO_SPOTTER', `Identified ${results.length} potential subrogation targets.`);
                setClaim(prev => ({
                    ...prev,
                    assets: prev.assets.map(asset => {
                        const match = results.find(r => r.assetId === asset.id);
                        return match ? { ...asset, subrogationAnalysis: match.analysis } : asset;
                    })
                }));
                if (!suppressModal) {
                    setActionResult({
                        title: "Subro Spotter™ Results",
                        summary: `Found ${results.length} potential liability recovery opportunities.`,
                        details: results.map(r => {
                            const asset = claim.assets.find(a => a.id === r.assetId);
                            return `${asset?.name}: Potential Liability -> ${r.analysis.liableParty}`;
                        }),
                        type: 'success'
                    });
                }
            } else if (!suppressModal) {
                setActionResult({
                    title: "Subro Spotter™ Results",
                    summary: "No obvious subrogation potential found in selected assets.",
                    type: 'info'
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubroSpotting(false);
        }
    };

    const handlePaddingPatrol = async (suppressModal = false) => {
        setIsPaddingPatrol(true);
        try {
            const result = await analyzeClaimPadding(claim.assets);
            if (result) {
                logAction('PADDING_PATROL', `Analysis complete. Fluff Score: ${result.fluffScore}`);
                setClaim(prev => ({ ...prev, paddingAnalysis: result }));
                if (!suppressModal) {
                    if (result.isPadded) {
                        setActionResult({
                            title: "Padding Patrol™ Alert",
                            summary: `High Fluff Score detected: ${result.fluffScore}/100.`,
                            details: [
                                `Found ${result.lowValueCount} low-value items.`,
                                `Suspicious Categories: ${result.suspiciousCategories.join(', ')}`,
                                `Reasoning: ${result.reasoning}`
                            ],
                            type: 'warning'
                        });
                    } else {
                        setActionResult({
                            title: "Padding Patrol™ Results",
                            summary: "Claim inventory appears balanced. No signs of artificial padding or stuffing.",
                            type: 'success'
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Padding Analysis Error", e);
        } finally {
            setIsPaddingPatrol(false);
        }
    };

    const handleDraftNegotiation = async (asset: Asset) => {
        setNegotiatingAssetId(asset.id);
        try {
            const script = await generateNegotiationScript(asset);
            if (script) {
                setClaim(prev => ({
                    ...prev,
                    assets: prev.assets.map(a => a.id === asset.id ? { ...a, negotiationScript: script } : a)
                }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setNegotiatingAssetId(null);
        }
    };

    const handleSyncToCMS = () => {
        if (!claimHealth.isExportable) {
            alert("Cannot export: Please resolve blocking issues identified in the investigation guide.");
            return;
        }
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            logAction('EXPORT_CMS', 'Manifest exported to Guidewire ClaimCenter');
            setClaim(prev => ({ ...prev, status: ClaimStatus.SYNCED_TO_CMS }));
            alert("Manifest successfully exported to Guidewire ClaimCenter.");
        }, 1500);
    };

    const handleExportToXactimate = async () => {
        if (!claimHealth.isExportable) {
            alert("Cannot export: Please resolve blocking issues identified in the investigation guide.");
            return;
        }
        
        try {
            // Convert claim to Proveniq format for ESX export using actual Claim/Asset properties
            const claimData: ProveniqClaimData = {
                claimId: claim.id,
                claimNumber: claim.id,
                dateOfLoss: claim.claimDate,
                lossType: 'OTHER',
                status: claim.status,
                insured: {
                    name: claim.policyholderName,
                },
                property: {
                    address: {
                        street1: claim.location,
                        city: '',
                        state: '',
                        zipCode: '',
                    },
                    propertyType: 'SINGLE_FAMILY',
                },
                rooms: [{
                    roomId: 'main',
                    name: 'Contents',
                    roomType: 'OTHER',
                    floorLevel: 1,
                    items: claim.assets.map((asset) => ({
                        itemId: asset.id,
                        description: asset.name,
                        category: asset.category || 'OTHER',
                        quantity: 1,
                        replacementCost: asset.claimedValue || 0,
                        actualCashValue: asset.depreciationAnalysis?.actualCashValue,
                        serialNumber: asset.serialNumber,
                        photos: asset.imageUrl ? [asset.imageUrl] : [],
                    })),
                }],
            };

            const esxDocument = convertToESXDocument(claimData);
            const { blob, filename } = await createESXFile(esxDocument);

            // Create downloadable ESX file (ZIP format)
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            logAction('EXPORT_XACTIMATE', `Exported ${claim.assets.length} items to Xactimate ESX format`);
            alert(`Successfully exported to ${filename}\n\nThis ESX file can be imported into Xactimate via Tools > Import > Data Transfer.`);
        } catch (error) {
            console.error('ESX export error:', error);
            alert('Failed to export to Xactimate format. Please try again.');
        }
    };

    const handleBatchFraudAnalysis = async (suppressModal = false) => {
        setIsBatchAnalyzingFraud(true);
        try {
            const targetAssets = getTargetAssets();
            const updatedAssets = await Promise.all(targetAssets.map(async (asset) => {
                const analysis = await analyzeAssetForFraud(asset);
                return {
                    ...asset,
                    fraudAnalysis: analysis,
                    status: analysis.riskLevel === FraudRiskLevel.HIGH ? AssetStatus.FLAGGED : asset.status
                };
            }));

            setClaim(prev => ({
                ...prev,
                assets: prev.assets.map(prevAsset => {
                    const updated = updatedAssets.find(a => a.id === prevAsset.id);
                    return updated || prevAsset;
                })
            }));

            const flaggedCount = updatedAssets.filter(a => a.fraudAnalysis?.riskLevel === FraudRiskLevel.HIGH).length;

            logAction('BATCH_FRAUD_SCAN', `Scanned ${targetAssets.length} items. Flagged ${flaggedCount} as High Risk.`);

            if (!suppressModal) {
                setActionResult({
                    title: "Batch Fraud Analysis Complete",
                    summary: `Scanned ${updatedAssets.length} assets.`,
                    details: flaggedCount > 0 ? [`${flaggedCount} items flagged as High Risk.`] : ["No High Risk items detected."],
                    type: flaggedCount > 0 ? 'warning' : 'success'
                });
            }
        } catch (e) {
            console.error("Batch fraud analysis failed", e);
            if (!suppressModal) alert("An error occurred while processing batch fraud analysis.");
        } finally {
            setIsBatchAnalyzingFraud(false);
        }
    };

    const handleBatchMarketCheck = async (suppressModal = false) => {
        setIsBatchCheckingMarket(true);
        try {
            const targetAssets = getTargetAssets();
            const updatedAssets = await Promise.all(targetAssets.map(async (asset) => {
                const marketResult = await analyzeMarketValue(asset);
                if (marketResult) {
                    return { ...asset, marketValueAnalysis: marketResult };
                }
                return asset;
            }));

            logAction('BATCH_MARKET_CHECK', `Updated pricing for ${updatedAssets.length} items.`);

            setClaim(prev => ({
                ...prev,
                assets: prev.assets.map(prevAsset => {
                    const updated = updatedAssets.find(a => a.id === prevAsset.id);
                    return updated || prevAsset;
                })
            }));

            if (!suppressModal) {
                setActionResult({
                    title: "Batch Market Check Complete",
                    summary: `Updated market values for ${updatedAssets.length} assets.`,
                    type: 'success'
                });
            }
        } catch (e) {
            console.error("Batch market check failed", e);
            if (!suppressModal) alert("An error occurred while processing batch market values.");
        } finally {
            setIsBatchCheckingMarket(false);
        }
    };

    const handleGenerateSettlement = async () => {
        setIsGeneratingSettlement(true);
        const targetAssets = getTargetAssets();
        try {
            // Important: This function now handles filtering of denied items internally
            const report = await generateSettlementReport(claim, targetAssets);
            setSettlementReport(report);
            logAction('GENERATE_SETTLEMENT', `Calculated Net Payout: $${report?.netPayment}`);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingSettlement(false);
        }
    };

    const handleRunAllScans = async () => {
        aiHubRef.current?.scrollIntoView({ behavior: 'smooth' });
        setIsRunAllLoading(true);
        setActionResult(null);

        try {
            await handleBatchFraudAnalysis(true);
            await handleBatchMarketCheck(true);
            await handleDepreciation(true);
            await handleBundleBreakout(true);
            await handlePolicyCheck(true);
            await handlePaddingPatrol(true);
            await handleSubroSpotter(true);
            await handleCategoryAudit(true);
            await handleSpecialtyTriage(true);

            setActionResult({
                title: "All AI Scans Complete",
                summary: "The manifest has been fully processed by all automated AI engines.",
                type: 'success'
            });

        } catch (error) {
            console.error("Error during 'Run All Scans':", error);
            setActionResult({
                title: "An Error Occurred",
                summary: "One of the AI scans failed to complete. Please check the console for details.",
                type: 'warning'
            });
        } finally {
            setIsRunAllLoading(false);
        }
    };

    const getAssetStatusColor = (status: AssetStatus) => {
        switch (status) {
            case AssetStatus.VERIFIED: return 'green';
            case AssetStatus.APPROVED: return 'green';
            case AssetStatus.PENDING: return 'yellow';
            case AssetStatus.FLAGGED: return 'red';
            case AssetStatus.DENIED: return 'red';
            case AssetStatus.UNVERIFIED: return 'gray';
            default: return 'gray';
        }
    };

    const getRiskColor = (risk: FraudRiskLevel) => {
        switch (risk) {
            case FraudRiskLevel.LOW: return 'green';
            case FraudRiskLevel.MEDIUM: return 'yellow';
            case FraudRiskLevel.HIGH: return 'red';
            default: return 'gray';
        }
    };

    const calculateLeftPosition = (dateStr: string, minDate: Date, totalDuration: number) => {
        const date = new Date(dateStr).getTime();
        const position = ((date - minDate.getTime()) / totalDuration) * 100;
        return Math.max(0, Math.min(100, position));
    };

    const automatedFindings = useMemo(() => {
        const findings = [];
        if (claim.assets.some(a => a.fraudAnalysis?.riskLevel === FraudRiskLevel.HIGH)) {
            findings.push({ type: 'fraud', text: 'High Fraud Risk Detected on one or more items.' });
        }
        if (claim.assets.some(a => a.policyCheck?.isExcluded)) {
            findings.push({ type: 'policy', text: 'Potential Policy Exclusions Found. Review required.' });
        }
        if (claim.assets.some(a => a.subrogationAnalysis?.potentialLiability)) {
            findings.push({ type: 'subro', text: 'Subrogation Opportunity Identified.' });
        }
        if (claim.paddingAnalysis?.isPadded && claim.paddingAnalysis.fluffScore > 70) {
            findings.push({ type: 'padding', text: `Claim Padding Suspected (Fluff Score: ${claim.paddingAnalysis.fluffScore}).` });
        }
        return findings;
    }, [claim]);

    const getFindingInfo = (type: string) => {
        const colors = {
            red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
            orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
            green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
            yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
            gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800' }
        };

        switch (type) {
            case 'fraud': return { icon: <ShieldExclamationIcon className="h-5 w-5" />, ...colors.red };
            case 'policy': return { icon: <ExclamationTriangleIcon className="h-5 w-5" />, ...colors.orange };
            case 'subro': return { icon: <BanknotesIcon className="h-5 w-5" />, ...colors.green };
            case 'padding': return { icon: <QueueListIcon className="h-5 w-5" />, ...colors.yellow };
            default: return { icon: <InformationCircleIcon className="h-5 w-5" />, ...colors.gray };
        }
    };

    const coveragePercentage = Math.min((claim.totalClaimedValue / claim.coverageLimit) * 100, 100);
    const isUnderinsured = claim.totalClaimedValue > claim.coverageLimit;
    const isNearLimit = !isUnderinsured && coveragePercentage > 75;

    const claimDateObj = new Date(claim.claimDate);
    const policyStartObj = new Date(claim.policyStartDate);
    const minTimelineDate = new Date(policyStartObj.getTime() - (1000 * 60 * 60 * 24 * 30));
    const totalTimelineDuration = claimDateObj.getTime() - minTimelineDate.getTime();

    return (
        <div className="space-y-6 relative pb-20">
            <style>{`
          @keyframes scan {
              0% { top: 0; }
              100% { top: 100%; }
          }
      `}</style>
            <input type="file" ref={receiptInputRef} className="hidden" accept="image/*" onChange={handleReceiptUpload} />
            <input type="file" ref={evidenceInputRef} className="hidden" accept=".pdf,image/*" onChange={handleEvidenceUpload} />

            {viewingAsset && (
                <AssetPhotoViewer
                    asset={viewingAsset}
                    onClose={() => setViewingAssetId(null)}
                    onRunVisualTruth={handleVisualTruth}
                    isAnalyzing={visualAnalyzingId === viewingAsset.id}
                />
            )}
            {assessingDamageAsset && (
                <DamageAnalysisModal
                    asset={assessingDamageAsset}
                    onClose={() => setAssessingDamageAssetId(null)}
                    onRunAnalysis={handleAnalyzeDamage}
                    isAnalyzing={analyzingDamageId === assessingDamageAsset.id}
                />
            )}
            <ActionSummaryModal result={actionResult} onClose={() => setActionResult(null)} />
            <CommandCenterHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
            {isAuditLogOpen && <AuditLogModal claim={claim} onClose={() => setIsAuditLogOpen(false)} />}

            <ManifestAssistant
                claim={claim}
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
            />

            {!isAssistantOpen && (
                <button
                    onClick={() => setIsAssistantOpen(true)}
                    className="fixed bottom-8 right-8 bg-brand-primary text-white p-4 rounded-full shadow-lg hover:bg-brand-secondary transition-all z-40 flex items-center gap-2"
                >
                    <ChatBubbleLeftRightIcon className="h-6 w-6" />
                    <span className="font-semibold">Assistant</span>
                </button>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center space-x-3 mb-1">
                        <h1 className="text-3xl font-bold text-neutral-dark">Manifest: {claim.id}</h1>
                        <Badge color="blue">Source: MyARK<sup className="text-[0.6em]">&trade;</sup></Badge>
                        {claim.status === ClaimStatus.SYNCED_TO_CMS && <Badge color="green">Synced</Badge>}
                    </div>
                    <p className="text-gray-500 text-sm">Asset Intelligence Dashboard</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsAuditLogOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 text-xs font-medium transition-colors"
                    >
                        <FingerPrintIcon className="h-4 w-4" />
                        View Log
                    </button>

                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold uppercase text-gray-400 leading-none">Active Session</span>
                            <span className="font-mono font-bold text-gray-800 text-sm leading-none">{formatSessionTimer(sessionSeconds)}</span>
                        </div>
                    </div>

                    {claim.status === ClaimStatus.SYNCED_TO_CMS ? (
                        <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                            <CheckCircleIcon className="h-5 w-5 text-status-green" />
                            <span className="font-semibold text-gray-700">Synced to CMS (GW-9982)</span>
                        </div>
                    ) : (
                        <div className="relative group">
                            <button
                                onClick={handleSyncToCMS}
                                disabled={isSyncing || !claimHealth.isExportable}
                                className={`px-6 py-3 rounded-lg font-semibold shadow-md flex items-center space-x-2 transition-all ${!claimHealth.isExportable ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-secondary text-white'}`}
                            >
                                {isSyncing ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : !claimHealth.isExportable ? (
                                    <LockClosedIcon className="h-5 w-5" />
                                ) : (
                                    <CloudArrowUpIcon className="h-5 w-5" />
                                )}
                                <span>Export to CMS</span>
                            </button>
                            {!claimHealth.isExportable && (
                                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    <div className="font-bold mb-1 text-red-300 uppercase tracking-wider flex items-center gap-1"><ExclamationTriangleIcon className="h-3 w-3" /> Export Blocked</div>
                                    <ul className="list-disc pl-4 space-y-1">
                                        {claimHealth.blockers.map((b, i) => <li key={i}>{b}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Playbook Stepper */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <ListBulletIcon className="h-5 w-5 text-brand-primary" />
                        Claim Playbook
                    </h3>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        Step {playbookSteps.findIndex(s => s.id === currentStep) + 1} of {playbookSteps.length}
                    </span>
                </div>
                <div className="relative pb-2">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
                    <div className="relative z-10 flex justify-between px-2">
                        {playbookSteps.map((step, idx) => {
                            const isCurrent = step.id === currentStep;
                            const isCompleted = step.completed;
                            const isFuture = !isCurrent && !isCompleted;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => handleStepClick(step.id)}
                                    className={`flex flex-col items-center gap-2 group relative focus:outline-none`}
                                    title={step.description}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-300 z-20 ${isCurrent ? 'bg-brand-primary border-brand-primary text-white scale-125 shadow-lg ring-4 ring-blue-50' : isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                                        {isCompleted ? <CheckIcon className="h-5 w-5" /> : idx + 1}
                                    </div>
                                    <span className={`absolute top-10 text-[10px] font-bold uppercase tracking-wider w-24 text-center transition-colors duration-200 ${isCurrent ? 'text-brand-primary opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}>
                                        {step.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-sm text-neutral-dark">{playbookSteps.find(s => s.id === currentStep)?.label}</h4>
                        <p className="text-xs text-gray-500">{playbookSteps.find(s => s.id === currentStep)?.description}</p>
                    </div>
                    <button
                        onClick={() => {
                            const idx = playbookSteps.findIndex(s => s.id === currentStep);
                            if (idx < playbookSteps.length - 1) {
                                handleStepClick(playbookSteps[idx + 1].id);
                            }
                        }}
                        disabled={playbookSteps.findIndex(s => s.id === currentStep) === playbookSteps.length - 1}
                        className="text-xs font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1 disabled:opacity-50"
                    >
                        Next Step <ArrowRightIcon className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {claim.status === ClaimStatus.NEW_FROM_MYARK && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm mb-6 animate-in slide-in-from-top-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-blue-100">
                                <MobilePhoneIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-neutral-dark flex items-center gap-2">
                                    MyARK<sup className="text-xs">&trade;</sup> Fast-Track Queue
                                    <Badge color="blue">New Arrival</Badge>
                                </h2>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                    <span className="flex items-center gap-1"><CubeTransparentIcon className="h-4 w-4 text-gray-400" /> {claim.preLossMetadata?.preLossItemCount || 0} Vault Items</span>
                                    <span className="flex items-center gap-1"><CameraIcon className="h-4 w-4 text-gray-400" /> {claim.preLossMetadata?.documentedPhotosCount || 0} Photos</span>
                                    <span className="flex items-center gap-1"><ShieldCheckIcon className="h-4 w-4 text-green-500" /> Verified Owner</span>
                                </div>
                            </div>
                        </div>

                        {!claim.myArkFastTrackResult ? (
                            <button
                                onClick={handleRunFastTrack}
                                disabled={isCheckingFastTrack}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-70"
                            >
                                {isCheckingFastTrack ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Analyzing Risk...
                                    </>
                                ) : (
                                    <>
                                        <BoltIcon className="h-5 w-5 text-yellow-300" />
                                        Run Fast-Track Check
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-xs font-bold uppercase text-gray-500">Fast-Track Verdict</p>
                                    <p className={`font-bold text-lg ${claim.myArkFastTrackResult.verdict === 'FAST_TRACK_APPROVED' ? 'text-green-600' : 'text-orange-600'}`}>
                                        {claim.myArkFastTrackResult.verdict === 'FAST_TRACK_APPROVED' ? 'APPROVED' : 'REVIEW REQ'}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${claim.myArkFastTrackResult.verdict === 'FAST_TRACK_APPROVED' ? 'border-green-100 bg-green-50 text-green-600' : 'border-orange-100 bg-orange-50 text-orange-600'}`}>
                                    {claim.myArkFastTrackResult.verdict === 'FAST_TRACK_APPROVED' ? <CheckBadgeIcon className="h-6 w-6" /> : <ExclamationTriangleIcon className="h-6 w-6" />}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Result Details */}
                    {claim.myArkFastTrackResult && (
                        <div className="mt-6 pt-6 border-t border-blue-200 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-1">AI Summary</h4>
                                    <p className="text-sm text-gray-800 italic bg-white/50 p-2 rounded border border-blue-100">"{claim.myArkFastTrackResult.summary}"</p>
                                </div>
                                {claim.myArkFastTrackResult.verdict === 'FAST_TRACK_APPROVED' && (
                                    <div className="bg-green-100 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-green-800">Straight-Through Processing Available</p>
                                            <p className="text-xs text-green-700">All logic checks passed. No human review required.</p>
                                        </div>
                                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2">
                                            <CurrencyDollarIcon className="h-4 w-4" /> Approve & Pay (Auto)
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold uppercase text-gray-500">Risk Score</h4>
                                    <span className={`font-mono font-bold ${claim.myArkFastTrackResult.riskScore < 20 ? 'text-green-600' : 'text-red-600'}`}>{claim.myArkFastTrackResult.riskScore}/100</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                    <div className={`h-2 rounded-full ${claim.myArkFastTrackResult.riskScore < 20 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${100 - claim.myArkFastTrackResult.riskScore}%` }}></div>
                                </div>
                                <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Discrepancies</h4>
                                {claim.myArkFastTrackResult.discrepancies.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">None detected.</p>
                                ) : (
                                    <ul className="space-y-1">
                                        {claim.myArkFastTrackResult.discrepancies.map((d, i) => (
                                            <li key={i} className="text-xs text-red-600 flex items-start gap-1">
                                                <span className="mt-0.5">•</span> {typeof d === 'string' ? d : d.issue}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <AIClaimBriefing claim={claim} setClaim={setClaim} logAction={logAction} />

            {/* --- NEW AI INTELLIGENCE HUB --- */}
            <div ref={aiHubRef} className="bg-white rounded-xl shadow-md border border-gray-200 p-0 overflow-hidden">
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-brand-accent/20 rounded-md border border-brand-accent/30">
                            <CpuChipIcon className="h-6 w-6 text-brand-accent" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold leading-none">AI Intelligence Hub</h2>
                            <p className="text-gray-400 text-xs mt-1">Proactive Findings & On-Demand Analysis</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleRunAllScans}
                            disabled={isRunAllLoading}
                            className="bg-brand-accent hover:bg-yellow-400 text-neutral-dark font-bold px-3 py-1.5 rounded-full text-xs flex items-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-wait"
                        >
                            {isRunAllLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-neutral-dark border-t-transparent rounded-full animate-spin"></div>
                                    Running All Scans...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="h-4 w-4" />
                                    Run All AI Scans
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setIsHelpOpen(true)}
                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-medium bg-gray-800 px-3 py-1.5 rounded-full"
                        >
                            <QuestionMarkCircleIcon className="h-4 w-4" />
                            Help
                        </button>
                    </div>
                </div>

                <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <SparklesIcon className="h-4 w-4 text-brand-accent" />
                        Automated Findings
                    </h3>
                    {automatedFindings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                            {automatedFindings.map((finding, i) => {
                                const { icon, ...colors } = getFindingInfo(finding.type);
                                return (
                                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
                                        <div className={`shrink-0 ${colors.text}`}>{icon}</div>
                                        <p className={`text-sm font-medium ${colors.text}`}>{finding.text}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-500 text-sm">
                            <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 text-green-400" />
                            <p className="font-medium">No critical AI-driven alerts at this time.</p>
                            <p className="text-xs text-gray-400 mt-1">Run on-demand scans below to analyze the manifest.</p>
                        </div>
                    )}

                    {/* CLAIM HEALTH CHECK */}
                    <div className="mt-6 border-t border-gray-200 pt-6 animate-in slide-in-from-top-2">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full shadow-sm ${healthCheckResult?.score === 100 ? 'bg-green-100' : 'bg-white'}`}>
                                    <ScaleIcon className="h-6 w-6 text-gray-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-neutral-dark text-lg flex items-center gap-2">
                                        Claim Health Check
                                        {healthCheckResult && (
                                            <Badge color={healthCheckResult.score > 80 ? 'green' : 'red'}>
                                                Score: {healthCheckResult.score}/100
                                            </Badge>
                                        )}
                                    </h4>
                                    <p className="text-gray-500 text-sm">Validate claim completeness before export.</p>
                                </div>
                            </div>
                            <button
                                onClick={runHealthCheck}
                                className="bg-neutral-dark hover:bg-black text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition-all"
                            >
                                <ShieldCheckIcon className="h-4 w-4" />
                                Run Health Check
                            </button>
                        </div>

                        {/* Render Health Details if result exists */}
                        {healthCheckResult && healthCheckResult.score < 100 && (
                            <div className="mt-4 grid grid-cols-1 gap-2 bg-red-50 border border-red-100 rounded-lg p-4">
                                {healthCheckResult.criticalMissingFields.map((field, i) => (
                                    <div key={`crit-${i}`} className="flex items-center gap-2 text-red-700 font-medium text-sm">
                                        <XCircleIcon className="h-4 w-4 shrink-0" /> <span className="font-bold">CRITICAL:</span> {field}
                                    </div>
                                ))}
                                {healthCheckResult.warnings.map((warn, i) => (
                                    <div key={`warn-${i}`} className="flex items-center gap-2 text-orange-700 text-sm">
                                        <ExclamationTriangleIcon className="h-4 w-4 shrink-0" /> {warn}
                                    </div>
                                ))}
                            </div>
                        )}
                        {healthCheckResult && healthCheckResult.score === 100 && (
                            <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4 flex items-center gap-2 text-green-700 font-medium text-sm">
                                <CheckBadgeIcon className="h-5 w-5" /> Claim is healthy and ready for export!
                            </div>
                        )}
                    </div>

                    {/* ARKIVE AUCTION SUMMARY */}
                    {claim.assets.some(a => a.salvageDisposition === 'Sold') && (
                        <div className="mt-6 border-t border-gray-200 pt-6 animate-in slide-in-from-top-2">
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-full shadow-sm">
                                        <TruckIcon className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-emerald-900 text-lg flex items-center gap-2">
                                            Arkive Auction Manifest
                                            <Badge color="green">Ready</Badge>
                                        </h4>
                                        <p className="text-emerald-700 text-sm">
                                            {claim.assets.filter(a => a.salvageDisposition === 'Sold').length} assets marked for salvage resale.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden md:block">
                                        <p className="text-xs font-bold uppercase text-emerald-600">Est. Recovery</p>
                                        <p className="text-xl font-bold text-emerald-800">
                                            {formatCurrency(claim.assets.filter(a => a.salvageDisposition === 'Sold').reduce((sum, a) => sum + (a.salvageEstimatedRecovery || 0), 0))}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const manifest = generateArkiveManifest(claim);
                                            if (manifest) {
                                                console.log("Generating Manifest", manifest);
                                                logAction('GENERATE_ARKIVE_MANIFEST', `Created Manifest ${manifest.id} with ${manifest.assets.length} items`);
                                                setActionResult({
                                                    title: "Arkive Manifest Generated",
                                                    summary: `Successfully created Auction Manifest ${manifest.id}.`,
                                                    details: [
                                                        `Total Items: ${manifest.assets.length}`,
                                                        `Est. Recovery: ${formatCurrency(manifest.totalEstimatedRecovery)}`,
                                                        `Pickup Location: ${manifest.pickupLocation}`,
                                                        `Status: ${manifest.status}`
                                                    ],
                                                    type: 'success'
                                                });
                                            }
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition-all"
                                    >
                                        <ShoppingBagIcon className="h-4 w-4" />
                                        Generate Manifest
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    <div className="p-5 bg-slate-50/50">
                        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-700 uppercase tracking-wider">
                            <TagIcon className="h-4 w-4 text-brand-secondary" /> Valuation & Scope
                        </div>

                        <div className="relative group">
                            <button
                                onClick={() => handleBatchMarketCheck()}
                                disabled={isBatchAnalyzingFraud || isBatchCheckingMarket || isRunAllLoading}
                                className="w-full bg-white border border-brand-secondary/30 shadow-sm rounded-lg p-4 mb-4 flex items-center justify-between hover:shadow-md hover:border-brand-secondary transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-secondary/10 rounded-lg group-hover:bg-brand-secondary group-hover:text-white transition-colors text-brand-secondary">
                                        {isBatchCheckingMarket ? <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin"></div> : <TagIcon className="h-6 w-6" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-800 group-hover:text-brand-primary">{getBatchLabel("Check Market")}</div>
                                        <div className="text-xs text-gray-500">Batch Pricing Analysis</div>
                                    </div>
                                </div>
                                <ArrowRightIcon className="h-5 w-5 text-gray-300 group-hover:text-brand-secondary" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-56 z-[80] text-center leading-tight">
                                {TOOL_DESCRIPTIONS.MARKET}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <ToolRow
                                icon={<CalculatorIcon />}
                                label={getBatchLabel("Smart Depreciator™")}
                                description={TOOL_DESCRIPTIONS.ACV}
                                onClick={() => handleDepreciation()}
                                disabled={isDepreciating || isRunAllLoading}
                                colorClass="bg-teal-500 text-teal-600"
                            />
                            <ToolRow
                                icon={<CubeTransparentIcon />}
                                label={getBatchLabel("Bundle Breakout™")}
                                description={TOOL_DESCRIPTIONS.BUNDLE}
                                onClick={() => handleBundleBreakout()}
                                disabled={isBreakingBundles || isRunAllLoading}
                                colorClass="bg-indigo-500 text-indigo-600"
                            />
                        </div>
                    </div>

                    <div className="p-5 bg-orange-50/30">
                        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-orange-800 uppercase tracking-wider">
                            <ShieldCheckIcon className="h-4 w-4 text-orange-600" /> Risk & Compliance
                        </div>

                        <div className="relative group">
                            <button
                                onClick={() => handleBatchFraudAnalysis()}
                                disabled={isBatchAnalyzingFraud || isRunAllLoading}
                                className="w-full bg-white border border-orange-200 shadow-sm rounded-lg p-4 mb-4 flex items-center justify-between hover:shadow-md hover:border-orange-400 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors text-orange-600">
                                        {isBatchAnalyzingFraud ? <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin"></div> : <SparklesIcon className="h-6 w-6" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-800 group-hover:text-orange-700">{getBatchLabel("Scan Fraud")}</div>
                                        <div className="text-xs text-gray-500">AI Anomaly Detection</div>
                                    </div>
                                </div>
                                <ArrowRightIcon className="h-5 w-5 text-gray-300 group-hover:text-orange-500" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-56 z-[80] text-center leading-tight">
                                {TOOL_DESCRIPTIONS.FRAUD}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <ToolRow
                                icon={<ShieldExclamationIcon />}
                                label={getBatchLabel("Policy Guardian™")}
                                description={TOOL_DESCRIPTIONS.POLICY}
                                onClick={() => handlePolicyCheck()}
                                disabled={isCheckingPolicy || isRunAllLoading}
                                colorClass="bg-orange-500 text-orange-600"
                            />
                            <ToolRow
                                icon={<QueueListIcon />}
                                label="Padding Patrol™"
                                description={TOOL_DESCRIPTIONS.PADDING}
                                onClick={() => handlePaddingPatrol()}
                                disabled={isPaddingPatrol || isRunAllLoading}
                                colorClass="bg-red-500 text-red-600"
                            />
                            <ToolRow
                                icon={<BanknotesIcon />}
                                label={getBatchLabel("Subro Spotter™")}
                                description={TOOL_DESCRIPTIONS.SUBRO}
                                onClick={() => handleSubroSpotter()}
                                disabled={isSubroSpotting || isRunAllLoading}
                                colorClass="bg-green-600 text-green-700"
                            />
                        </div>
                    </div>

                    <div className="p-5 bg-purple-50/30">
                        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-purple-800 uppercase tracking-wider">
                            <FolderIcon className="h-4 w-4 text-purple-600" /> Triage & Intake
                        </div>

                        <div className="space-y-3">
                            <ToolRow
                                icon={<FolderIcon />}
                                label={getBatchLabel("Audit Taxonomy")}
                                description={TOOL_DESCRIPTIONS.TAXON}
                                onClick={() => handleCategoryAudit()}
                                disabled={isAuditingCategories || isRunAllLoading}
                                colorClass="bg-purple-500 text-purple-600"
                            />
                            <ToolRow
                                icon={<StarIcon />}
                                label={getBatchLabel("Triage Specialty")}
                                description={TOOL_DESCRIPTIONS.TRIAGE}
                                onClick={() => handleSpecialtyTriage()}
                                disabled={isTriagingSpecialty || isRunAllLoading}
                                colorClass="bg-yellow-500 text-yellow-600"
                            />
                            <div className="h-px bg-purple-200 my-2"></div>
                            <ToolRow
                                icon={<DocumentMagnifyingGlassIcon />}
                                label="Map Evidence (PDF)"
                                description={TOOL_DESCRIPTIONS.EVIDENCE}
                                onClick={() => evidenceInputRef.current?.click()}
                                disabled={isMappingEvidence || isRunAllLoading}
                                colorClass="bg-gray-600 text-gray-700"
                            />
                            <ToolRow
                                icon={<ReceiptPercentIcon />}
                                label="Ingest Receipt (Img)"
                                description={TOOL_DESCRIPTIONS.RECEIPT}
                                onClick={() => receiptInputRef.current?.click()}
                                disabled={isReconciling || isRunAllLoading}
                                colorClass="bg-gray-600 text-gray-700"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex flex-col justify-between">
                    <div className="flex items-center space-x-3 mb-4 border-b border-gray-100 pb-2">
                        <UserIcon className="h-6 w-6 text-brand-primary" />
                        <h2 className="text-lg font-semibold text-neutral-dark">Policy Context</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Policyholder</span>
                            <span className="font-medium">{claim.policyholderName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Policy #</span>
                            <span className="font-mono text-sm">{claim.policyNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Deductible</span>
                            <span className="font-medium text-red-800 font-mono">-${claim.deductible}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Loss Date</span>
                            <span className="font-medium text-red-600">{claim.claimDate}</span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase">Regulatory Monitor</span>
                                {regulatoryHealth && (
                                    <Badge color={regulatoryHealth.status === 'Compliant' ? 'green' : 'red'}>
                                        {regulatoryHealth.status}
                                    </Badge>
                                )}
                            </div>
                            {regulatoryHealth ? (
                                <div className="mt-1 text-xs text-gray-600">
                                    <p className="leading-tight">{regulatoryHealth.message}</p>
                                    <p className="mt-1 font-mono text-[10px] text-gray-400">Deadline: {regulatoryHealth.deadline}</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-3 h-3 border-2 border-gray-300 border-t-brand-primary rounded-full animate-spin"></div>
                                    <span className="text-xs text-gray-400">Checking Statutes...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between relative overflow-hidden border-l-4 border-l-brand-accent">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                        <div className="flex items-center space-x-2">
                            <CurrencyDollarIcon className="h-6 w-6 text-brand-accent" />
                            <h2 className="text-lg font-semibold text-neutral-dark">Coverage Health</h2>
                        </div>
                        {isUnderinsured ? <Badge color="red">UNDERINSURED</Badge> : isNearLimit ? <Badge color="yellow">NEAR LIMIT</Badge> : <Badge color="green">HEALTHY</Badge>}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-500">Current Exposure</span>
                                <span className="font-bold text-lg">{formatCurrency(claim.totalClaimedValue)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${isUnderinsured ? 'bg-status-red' : isNearLimit ? 'bg-status-yellow' : 'bg-status-green'}`}
                                    style={{ width: `${coveragePercentage}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>$0</span>
                                <span>Limit: {formatCurrency(claim.coverageLimit)}</span>
                            </div>
                        </div>

                        {isUnderinsured && (
                            <div className="bg-red-50 p-2 rounded flex items-start gap-2 text-xs text-red-800">
                                <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                                <span>Upsell: Assets exceed limit by {formatCurrency(claim.totalClaimedValue - claim.coverageLimit)}.</span>
                            </div>
                        )}
                        {isNearLimit && (
                            <div className="bg-yellow-50 p-2 rounded flex items-start gap-2 text-xs text-yellow-800">
                                <PaperAirplaneIcon className="h-4 w-4 shrink-0" />
                                <span>Sales Notified: Customer crossed 75% utilization.</span>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="flex flex-col relative">
                    <div className="flex items-center space-x-3 mb-4 border-b border-gray-100 pb-2">
                        <CheckCircleIcon className="h-6 w-6 text-status-green" />
                        <h2 className="text-lg font-semibold text-neutral-dark">Risk Intelligence</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Purchase Timeline</h3>
                            <div className="relative w-full h-6">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 rounded-full transform -translate-y-1/2"></div>
                                <div className="absolute top-1/2 left-0 w-2 h-2 bg-green-500 rounded-full transform -translate-y-1/2 border border-white z-10" title="Policy Start"></div>
                                <div className="absolute top-1/2 right-0 w-2 h-2 bg-red-500 rounded-full transform -translate-y-1/2 border border-white z-10" title="Loss Date"></div>

                                {claim.assets.map((asset) => {
                                    const purchaseTime = new Date(asset.purchaseDate).getTime();
                                    const claimTime = new Date(claim.claimDate).getTime();
                                    const diffDays = (claimTime - purchaseTime) / (1000 * 3600 * 24);
                                    const isRisky = diffDays < 30 && diffDays >= 0;
                                    const leftPos = calculateLeftPosition(asset.purchaseDate, minTimelineDate, totalTimelineDuration);

                                    return (
                                        <div
                                            key={asset.id}
                                            className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20 ${isRisky ? 'w-2.5 h-2.5 bg-red-500 animate-pulse' : 'w-1.5 h-1.5 bg-brand-secondary'}`}
                                            style={{ left: `${leftPos}%` }}
                                            title={`${asset.name} (${asset.purchaseDate})`}
                                        ></div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400">
                                <span>Policy Start</span>
                                <span>Loss Date</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-gray-50 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1"><CloudIcon className="h-3 w-3" /> SkyWitness</span>
                                {weatherAnalysis ? (
                                    <Badge color={weatherAnalysis.isEventVerified ? 'green' : 'yellow'}>
                                        {weatherAnalysis.isEventVerified ? 'Verified' : 'No Event'}
                                    </Badge>
                                ) : <span className="text-xs text-gray-400">...</span>}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1"><DocumentDuplicateIcon className="h-3 w-3" /> Duplicate Detective</span>
                                {duplicateAnalysis ? (
                                    <Badge color={duplicateAnalysis.hasDuplicates ? 'red' : 'green'}>
                                        {duplicateAnalysis.hasDuplicates ? 'Found' : 'Clean'}
                                    </Badge>
                                ) : <span className="text-xs text-gray-400">...</span>}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        <TabButton name="manifest" label="Manifest" icon={<QueueListIcon className="h-5 w-5" />} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabButton name="activities" label="Activities" icon={<ListBulletIcon className="h-5 w-5" />} activeTab={activeTab} setActiveTab={setActiveTab} count={(claim.activities || []).filter(a => a.status === 'Open').length} />
                        <TabButton name="financials" label="Financials" icon={<BanknotesIcon className="h-5 w-5" />} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabButton name="notes" label="Notes" icon={<ChatBubbleBottomCenterTextIcon className="h-5 w-5" />} activeTab={activeTab} setActiveTab={setActiveTab} count={(claim.notes || []).length} />
                        <TabButton name="documents" label="Documents" icon={<FolderIcon className="h-5 w-5" />} activeTab={activeTab} setActiveTab={setActiveTab} count={(claim.documents || []).length} />
                        {claim.liveFNOLAnalysis && <TabButton name="liveFNOL" label="Live FNOL" icon={<MicrophoneIcon className="h-5 w-5" />} activeTab={activeTab} setActiveTab={setActiveTab} />}
                    </nav>
                </div>

                <div className="pt-6">
                    {activeTab === 'manifest' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-light border-b border-gray-200">
                                    <tr>
                                        <th className="p-4 w-12">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                onChange={handleSelectAll}
                                                checked={claim.assets.length > 0 && selectedAssetIds.size === claim.assets.length}
                                            />
                                        </th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm">Asset Detail</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm">Origin</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm">Category</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm">Value (RCV / ACV)</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm">Market Check</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                                        <th className="p-4 font-semibold text-center text-gray-600 text-sm">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {claim.assets.map((asset) => {
                                        const isDuplicate = duplicateAnalysis?.duplicateGroups.some(g => g.itemIds.includes(asset.id));
                                        const isPolicyFlagged = asset.policyCheck?.isExcluded;
                                        const isCategoryIncorrect = asset.categoryAnalysis && !asset.categoryAnalysis.isCorrect;
                                        const isSpecialty = asset.specialtyAnalysis?.isSpecialty;
                                        const isSubro = asset.subrogationAnalysis?.potentialLiability;
                                        const isSelected = selectedAssetIds.has(asset.id);
                                        const isPreLoss = asset.origin === 'PRE_LOSS';
                                        const isDenied = asset.status === AssetStatus.DENIED;

                                        return (
                                            <tr key={asset.id} className={`border-b border-neutral-medium last:border-b-0 align-top hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''} ${isDenied ? 'bg-red-50 opacity-60' : ''} ${isDuplicate ? 'bg-red-50/50' : ''} ${isPolicyFlagged ? 'bg-orange-50/50' : ''} ${isCategoryIncorrect ? 'bg-purple-50/50' : ''} ${isSpecialty ? 'bg-yellow-50/50' : ''}`}>
                                                <td className="p-4 pt-6">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelection(asset.id)}
                                                    />
                                                </td>
                                                <td className="p-4 w-1/4">
                                                    <div className="flex items-start space-x-3">
                                                        <div
                                                            className="relative group shrink-0 cursor-pointer"
                                                            onClick={() => setViewingAssetId(asset.id)}
                                                            title="Click to inspect full photo"
                                                        >
                                                            <img
                                                                src={asset.imageUrl}
                                                                alt={asset.name}
                                                                className={`h-16 w-16 rounded-lg object-cover border border-gray-200 shadow-sm group-hover:ring-2 ring-brand-primary transition-all bg-gray-100 ${isDenied ? 'grayscale' : ''}`}
                                                                crossOrigin="anonymous"
                                                                referrerPolicy="no-referrer"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = "https://placehold.co/200x200?text=N/A";
                                                                    e.currentTarget.onerror = null;
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all rounded-lg">
                                                                <CameraIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className={`font-bold text-sm ${isDenied ? 'text-red-700 line-through' : 'text-neutral-black'}`}>{asset.name}</p>
                                                                    {isDuplicate && (<span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold flex items-center border border-red-200"><DocumentDuplicateIcon className="h-3 w-3 mr-1" /> Duplicate</span>)}
                                                                    {isPolicyFlagged && (<span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-bold flex items-center border border-orange-200" title={asset.policyCheck?.warningMessage}><ShieldExclamationIcon className="h-3 w-3 mr-1" /> Policy Limit</span>)}
                                                                    {isCategoryIncorrect && (<span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold flex items-center border border-purple-200" title={asset.categoryAnalysis?.reasoning}><FolderIcon className="h-3 w-3 mr-1" /> Move to: {asset.categoryAnalysis?.suggestedCategory}</span>)}
                                                                    {isSpecialty && (<span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold flex items-center border border-yellow-200" title={asset.specialtyAnalysis?.reasoning}><StarIcon className="h-3 w-3 mr-1" /> {asset.specialtyAnalysis?.recommendation}</span>)}
                                                                    {isSubro && (<span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-bold flex items-center border border-green-200" title={`Potential Liability: ${asset.subrogationAnalysis?.liableParty}`}><BanknotesIcon className="h-3 w-3 mr-1" /> Subrogation</span>)}
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {asset.receiptMatch && (<span className="text-[10px] bg-green-100 text-green-800 border border-green-200 px-1.5 py-0.5 rounded-full flex items-center w-fit font-medium" title={`Matched receipt item: ${asset.receiptMatch.receiptItemName}`}><ReceiptPercentIcon className="h-3 w-3 mr-1" /> Receipt Match</span>)}
                                                                    {asset.linkedDocuments && asset.linkedDocuments.map((doc, i) => (<span key={i} className="text-[10px] bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded-full flex items-center w-fit font-medium" title={`Mentioned in ${doc}`}><PaperClipIcon className="h-3 w-3 mr-1" /> {doc}</span>))}
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> Purchased: {asset.purchaseDate}</p>

                                                            {asset.damageImageUrl && (
                                                                <button onClick={() => setAssessingDamageAssetId(asset.id)} disabled={analyzingDamageId === asset.id} className="text-xs mt-2 bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-md hover:bg-blue-100 disabled:opacity-60 transition-colors flex items-center gap-1.5">
                                                                    {analyzingDamageId === asset.id ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <VideoCameraIcon className="h-4 w-4" />}
                                                                    Assess Damage
                                                                </button>
                                                            )}

                                                            {asset.digitalFieldAdjusterAnalysis && (
                                                                <div className="mt-2 text-xs p-2 rounded border bg-blue-50 border-blue-100">
                                                                    <p className="font-bold text-blue-700 flex items-center gap-1 mb-1"><VideoCameraIcon className="h-3 w-3" /> Digital Triage Complete</p>
                                                                    <p className="text-blue-900">{asset.digitalFieldAdjusterAnalysis.recommendation}: Est. ${asset.digitalFieldAdjusterAnalysis.costEstimate.min} - ${asset.digitalFieldAdjusterAnalysis.costEstimate.max}</p>
                                                                </div>
                                                            )}

                                                            {/* Arkive Salvage Control */}
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <label className="text-xs font-bold text-gray-500 uppercase">Salvage:</label>
                                                                <select
                                                                    value={asset.salvageDisposition || ''}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value as any;
                                                                        setClaim(prev => ({
                                                                            ...prev,
                                                                            assets: prev.assets.map(a => a.id === asset.id ? {
                                                                                ...a,
                                                                                salvageDisposition: val || null,
                                                                                salvageEstimatedRecovery: val === 'Sold' ? (a.marketValueAnalysis?.estimatedValue || a.claimedValue) * 0.15 : 0
                                                                            } : a)
                                                                        }));
                                                                    }}
                                                                    className="text-xs border-gray-300 rounded focus:ring-brand-primary focus:border-brand-primary py-0.5"
                                                                >
                                                                    <option value="">-- None --</option>
                                                                    <option value="Sold">Sold (Arkive)</option>
                                                                    <option value="Scrap">Scrap</option>
                                                                    <option value="Hold">Hold</option>
                                                                    <option value="Donate">Donate</option>
                                                                </select>
                                                                {asset.salvageDisposition === 'Sold' && (
                                                                    <span className="text-xs text-green-600 font-bold">
                                                                        Est. +{formatCurrency(asset.salvageEstimatedRecovery || 0)}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {asset.imageAnalysis && (<div className={`mt-2 text-xs p-2 rounded border ${asset.imageAnalysis.isConsistent ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}><p className={`font-semibold ${asset.imageAnalysis.isConsistent ? 'text-green-700' : 'text-red-700'}`}>Visual Truth: {asset.imageAnalysis.isConsistent ? 'Consistent' : 'Discrepancy'}</p>{!asset.imageAnalysis.isConsistent && (<ul className="list-disc pl-3 mt-1 text-gray-600">{asset.imageAnalysis.discrepancies.map((d, i) => <li key={i}>{d}</li>)}</ul>)}</div>)}
                                                            {asset.bundleAnalysis && (<div className="mt-2 text-xs p-2 rounded border bg-indigo-50 border-indigo-100"><p className="font-bold text-indigo-700 flex items-center mb-1"><CubeTransparentIcon className="h-3 w-3 mr-1" /> Bundle Unpacked</p><ul className="list-disc pl-3 text-indigo-900 space-y-0.5">{asset.bundleAnalysis.components.map((comp, i) => (<li key={i} className="flex justify-between"><span>{comp.name}</span><span className="font-mono opacity-70">{formatCurrency(comp.estimatedValue)}</span></li>))}</ul></div>)}
                                                            {asset.negotiationScript && (<div className="mt-2 p-2 bg-gray-100 rounded border border-gray-200 text-xs"><p className="font-bold text-gray-700 flex items-center mb-1"><MegaphoneIcon className="h-3 w-3 mr-1" /> Adjuster Script ({asset.negotiationScript.tone})</p><p className="italic text-gray-600">"{asset.negotiationScript.script}"</p></div>)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm pt-6">{isPreLoss ? (<span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200" title="Verified in MyARK™ before date of loss"><ShieldCheckIcon className="h-3 w-3 mr-1" /> Pre-Loss</span>) : (<span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200" title="Added manually after date of loss"><UserIcon className="h-3 w-3 mr-1" /> Post-Loss</span>)}</td>
                                                <td className="p-4 text-gray-600 pt-6 text-sm"><span className="bg-gray-100 px-2 py-1 rounded-md text-gray-700">{asset.category}</span></td>
                                                <td className="p-4 pt-6 text-sm"><div className={`font-bold ${isDenied ? 'text-red-800 line-through decoration-2 decoration-red-800' : 'text-neutral-dark'}`}>{formatCurrency(asset.claimedValue)} <span className="text-[10px] font-normal text-gray-400 no-underline">RCV</span></div>{asset.depreciationAnalysis && !isDenied && (<div className="mt-1 text-xs"><div className="font-medium text-teal-600">{formatCurrency(asset.depreciationAnalysis.actualCashValue)} <span className="text-[10px] font-normal">ACV</span></div><div className="text-[10px] text-gray-400">-{Math.round(asset.depreciationAnalysis.depreciationPct * 100)}% ({asset.depreciationAnalysis.ageYears} yrs)</div></div>)}</td>
                                                <td className="p-4 pt-5 w-1/4">{asset.lkqAnalysis && (<div className="mb-3 p-2 bg-blue-50 border border-blue-100 rounded-md shadow-sm"><div className="flex items-center justify-between mb-1"><p className="text-xs font-bold text-brand-primary flex items-center gap-1"><ScaleIcon className="h-3 w-3" /> Modern Equivalent</p></div><p className="text-sm font-semibold text-neutral-black">{asset.lkqAnalysis.modernModel}</p><div className="flex justify-between items-end mt-1"><p className="text-xs text-gray-500">{formatCurrency(asset.lkqAnalysis.modernPrice)}</p>{asset.lkqAnalysis.savings > 0 && (<span className="text-[10px] text-green-700 bg-green-100 px-1 rounded border border-green-200 flex items-center font-medium"><ArrowTrendingDownIcon className="h-3 w-3 mr-0.5" />Save {formatCurrency(asset.lkqAnalysis.savings)}</span>)}</div><p className="text-[10px] text-gray-500 mt-1 italic border-t border-blue-100 pt-1 leading-tight">{asset.lkqAnalysis.reasoning}</p></div>)}{asset.marketValueAnalysis ? (<div className="text-sm relative group"><div className="font-bold flex items-center gap-1 cursor-help bg-gray-50 px-2 py-1 rounded border border-gray-200 w-fit">{formatCurrency(asset.marketValueAnalysis.estimatedValue)}<InformationCircleIcon className="h-4 w-4 text-brand-primary" /></div><div className="absolute z-50 invisible group-hover:visible bg-white border border-gray-200 shadow-2xl rounded-lg p-4 w-80 text-xs text-gray-700 left-0 mt-2 ring-1 ring-black ring-opacity-5"><p className="font-bold text-neutral-dark mb-1">AI Reasoning:</p><p className="mb-3 text-gray-600 italic leading-relaxed">"{asset.marketValueAnalysis.reasoning}"</p><div className="border-t border-gray-100 pt-2"><p className="font-bold text-neutral-dark mb-1">Sources ({asset.marketValueAnalysis.sources.length}):</p><ul className="space-y-1 max-h-32 overflow-y-auto">{asset.marketValueAnalysis.sources.map((source, idx) => (<li key={idx}><a href={source.uri} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline truncate block flex items-center"><ArrowRightIcon className="h-3 w-3 mr-1 inline" />{source.title || 'Web Result'}</a></li>))}</ul></div></div></div>) : (<div className="flex flex-col space-y-2"><button onClick={() => handleCheckMarketValue(asset)} disabled={analyzingMarketId === asset.id || isBatchCheckingMarket || isDenied} className="text-brand-secondary hover:text-brand-primary text-xs font-medium border border-brand-secondary/30 hover:border-brand-primary rounded px-2 py-1.5 flex items-center space-x-1 bg-brand-secondary/5 transition-colors disabled:opacity-50 justify-center">{analyzingMarketId === asset.id ? (<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand-primary"></div>) : (<TagIcon className="h-3 w-3" />)}<span>Check Value</span></button><button onClick={() => handleLKQAnalysis(asset)} disabled={lkqAnalyzingId === asset.id || isDenied} className="text-gray-600 hover:text-neutral-dark text-xs font-medium border border-gray-300 hover:border-gray-400 rounded px-2 py-1.5 flex items-center space-x-1 bg-white transition-colors disabled:opacity-50 justify-center">{lkqAnalyzingId === asset.id ? (<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>) : (<ScaleIcon className="h-3 w-3" />)}<span>Find Modern Equiv.</span></button></div>)}</td>
                                                <td className="p-4 pt-6"><Badge color={getAssetStatusColor(asset.status)}>{asset.status}</Badge></td>
                                                <td className="p-4 text-center pt-5">
                                                    <div className="flex flex-col items-center gap-2">
                                                        {asset.fraudAnalysis ? (
                                                            <div className="flex flex-col items-center bg-gray-50 p-2 rounded-lg border border-gray-100 w-full">
                                                                <Badge color={getRiskColor(asset.fraudAnalysis.riskLevel)}>Risk: {asset.fraudAnalysis.riskLevel}</Badge>
                                                                <p className="text-xs text-gray-500 mt-1 max-w-xs text-left leading-snug">{asset.fraudAnalysis.reason}</p>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => handleAnalyze(asset)} disabled={loadingAssetId === asset.id || isBatchAnalyzingFraud || isDenied} className="bg-white border border-gray-200 text-neutral-dark px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center space-x-2 mx-auto transition-colors shadow-sm w-full">
                                                                {loadingAssetId === asset.id ? (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-dark"></div>) : (<SparklesIcon className="h-4 w-4 text-brand-accent" />)}
                                                                <span>AI Audit</span>
                                                            </button>
                                                        )}

                                                        {/* Approval Controls */}
                                                        {!isDenied && asset.status !== AssetStatus.APPROVED && (
                                                            <div className="flex gap-2 w-full">
                                                                <button
                                                                    onClick={() => updateAssetStatus(asset.id, AssetStatus.DENIED)}
                                                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-bold hover:bg-red-100 transition-colors"
                                                                    title="Deny Item"
                                                                >
                                                                    <XCircleIcon className="h-3 w-3" /> Deny
                                                                </button>
                                                                <button
                                                                    onClick={() => updateAssetStatus(asset.id, AssetStatus.APPROVED)}
                                                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold hover:bg-green-100 transition-colors"
                                                                    title="Approve Item"
                                                                >
                                                                    <CheckCircleIcon className="h-3 w-3" /> Approve
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Revert Denied Status */}
                                                        {isDenied && (
                                                            <button
                                                                onClick={() => updateAssetStatus(asset.id, AssetStatus.PENDING)}
                                                                className="text-xs text-gray-400 hover:text-gray-600 underline mt-1"
                                                            >
                                                                Undo Denial
                                                            </button>
                                                        )}

                                                        {(asset.fraudAnalysis?.riskLevel === FraudRiskLevel.HIGH || asset.policyCheck?.isExcluded || asset.depreciationAnalysis) && !isDenied && (
                                                            <button onClick={() => handleDraftNegotiation(asset)} disabled={negotiatingAssetId === asset.id} className="text-xs text-gray-500 hover:text-brand-primary flex items-center gap-1 underline mt-1">
                                                                {negotiatingAssetId === asset.id ? 'Drafting...' : 'Draft Denial Script'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'liveFNOL' && (
                        <LiveFNOLIntake claim={claim} onUpdateClaim={setClaim} />
                    )}
                    {activeTab === 'activities' && <ActivitiesTab claim={claim} setClaim={setClaim} />}
                    {activeTab === 'notes' && <NotesTab claim={claim} setClaim={setClaim} />}
                    {activeTab === 'financials' && <FinancialsTab claim={claim} settlementReport={settlementReport} />}
                    {activeTab === 'documents' && <DocumentsTab claim={claim} setClaim={setClaim} />}
                </div>
            </Card >

            <Card className="bg-gray-50 border border-gray-200">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <TableCellsIcon className="h-6 w-6 text-gray-700" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-dark">Settlement Calculator</h2>
                            <p className="text-sm text-gray-500">Final Payout Breakdown (Excludes Denied Items)</p>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateSettlement}
                        disabled={isGeneratingSettlement}
                        className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {isGeneratingSettlement ? <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div> : <PrinterIcon className="h-4 w-4" />}
                        Generate Consumer Statement (PDF)
                    </button>
                </div>

                {settlementReport ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Explanation</h3>
                            <p className="text-gray-700 italic leading-relaxed whitespace-pre-line">"{settlementReport.summary}"</p>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <button className="text-brand-primary text-sm font-medium hover:underline">Edit Explanation</button>
                            </div>
                        </div>
                        <div className="space-y-3 font-mono text-sm">
                            <div className="flex justify-between py-2 border-b border-gray-200">
                                <span className="text-gray-600">Gross Replacement Cost (RCV)</span>
                                <span className="font-bold">{formatCurrency(settlementReport.grossRCV)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200 text-red-600">
                                <span>Less: Recoverable Depreciation</span>
                                <span>({formatCurrency(settlementReport.totalDepreciation)})</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200 text-red-800">
                                <span>Less: Policy Deductible</span>
                                <span>({formatCurrency(settlementReport.deductible)})</span>
                            </div>
                            <div className="flex justify-between py-4 text-xl bg-green-50 px-4 rounded-lg border border-green-100">
                                <span className="font-bold text-green-900">Net Claim Payment</span>
                                <span className="font-bold text-green-700">{formatCurrency(settlementReport.netPayment)}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <p>Run 'Generate Consumer Statement' to calculate final payout totals.</p>
                    </div>
                )}
            </Card>
        </div >
    );
};

// --- SUB-COMPONENTS FOR TABS ---

type TabName = 'manifest' | 'activities' | 'financials' | 'notes' | 'documents' | 'liveFNOL';

const TabButton: React.FC<{
    name: TabName;
    label: string;
    icon: React.ReactNode;
    activeTab: TabName;
    setActiveTab: (tab: TabName) => void;
    count?: number;
}> = ({ name, label, icon, activeTab, setActiveTab, count }) => (
    <button
        onClick={() => setActiveTab(name)}
        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === name
            ? 'border-brand-primary text-brand-primary'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
    >
        {icon} {label}
        {count !== undefined && count > 0 && <span className="ml-1 bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>}
    </button>
);

const ActivitiesTab: React.FC<{ claim: Claim; setClaim: React.Dispatch<React.SetStateAction<Claim>> }> = ({ claim, setClaim }) => {
    const handleCompleteActivity = (activityId: string) => {
        setClaim(prev => ({
            ...prev,
            activities: (prev.activities || []).map(act =>
                act.id === activityId ? { ...act, status: 'Completed' } : act
            )
        }));
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-neutral-dark">Claim Activities</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                {(claim.activities || []).map(act => (
                    <div key={act.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={act.status === 'Completed'}
                                onChange={() => handleCompleteActivity(act.id)}
                                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                disabled={act.status === 'Completed'}
                            />
                            <div>
                                <p className={`font-medium ${act.status === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{act.title}</p>
                                <p className="text-xs text-gray-500">Due: {act.dueDate} • Assignee: {act.assignee}</p>
                            </div>
                        </div>
                        {act.status === 'Open' ? (
                            <Badge color="yellow">Open</Badge>
                        ) : (
                            <Badge color="green">Completed</Badge>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const NotesTab: React.FC<{ claim: Claim; setClaim: React.Dispatch<React.SetStateAction<Claim>> }> = ({ claim, setClaim }) => {
    const [newNote, setNewNote] = useState('');

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const note: ClaimNote = {
            id: `note-${Date.now()}`,
            timestamp: new Date().toISOString(),
            author: 'Alex Johnson',
            content: newNote,
            type: 'log',
        };
        setClaim(prev => ({
            ...prev,
            notes: [note, ...(prev.notes || [])]
        }));
        setNewNote('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new claim note or diary entry..."
                    className="w-full border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm bg-white text-neutral-black"
                    rows={3}
                />
                <div className="flex justify-end mt-2">
                    <button onClick={handleAddNote} className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Add Note</button>
                </div>
            </div>
            <div className="space-y-4">
                {(claim.notes || []).map(note => (
                    <div key={note.id} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-bold text-gray-800">{note.author}</p>
                            <p className="text-xs text-gray-400">{new Date(note.timestamp).toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FinancialsTab: React.FC<{ claim: Claim; settlementReport: SettlementReport | null }> = ({ claim, settlementReport }) => {
    const financials = claim.financials || { reserves: 0, paymentsMade: 0, totalIncurred: 0 };
    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card>
                    <h3 className="text-lg font-bold text-neutral-dark mb-4">Financial Summary</h3>
                    <div className="space-y-3 font-mono text-sm">
                        <div className="flex justify-between py-2 border-b"><span>Reserves</span> <span>{formatCurrency(financials.reserves)}</span></div>
                        <div className="flex justify-between py-2 border-b"><span>Payments Made</span> <span>{formatCurrency(financials.paymentsMade)}</span></div>
                        <div className="flex justify-between py-2 font-bold text-base"><span>Total Incurred</span> <span>{formatCurrency(financials.totalIncurred)}</span></div>
                    </div>
                </Card>
                <Card>
                    <h3 className="text-lg font-bold text-neutral-dark mb-4">Coverage Limit</h3>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                            className="h-4 rounded-full bg-brand-primary"
                            style={{ width: `${Math.min((financials.totalIncurred / claim.coverageLimit) * 100, 100)}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-sm mt-2 font-mono">
                        <span>{formatCurrency(financials.totalIncurred)}</span>
                        <span>{formatCurrency(claim.coverageLimit)}</span>
                    </div>
                </Card>
            </div>
            <div>
                <Card>
                    <h3 className="text-lg font-bold text-neutral-dark mb-4">Settlement Breakdown</h3>
                    {settlementReport ? (
                        <div className="space-y-3 font-mono text-sm animate-in fade-in">
                            <div className="flex justify-between py-2 border-b"><span>Gross RCV</span> <span>{formatCurrency(settlementReport.grossRCV)}</span></div>
                            <div className="flex justify-between py-2 border-b text-red-600"><span>Less: Depreciation</span> <span>({formatCurrency(settlementReport.totalDepreciation)})</span></div>
                            <div className="flex justify-between py-2 border-b text-red-800"><span>Less: Deductible</span> <span>({formatCurrency(settlementReport.deductible)})</span></div>
                            <div className="flex justify-between py-4 text-lg bg-green-50 px-3 rounded-md font-bold text-green-700"><span>Net Payment</span> <span>{formatCurrency(settlementReport.netPayment)}</span></div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-8">Generate a settlement report to see the final payout.</p>
                    )}
                </Card>
            </div>
        </div>
    );
};

const DocumentsTab: React.FC<{ claim: Claim; setClaim: React.Dispatch<React.SetStateAction<Claim>> }> = ({ claim, setClaim }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getIcon = (type: ClaimDocument['type']) => {
        if (type === 'PDF') return <DocumentTextIcon className="h-6 w-6 text-red-500" />;
        if (type === 'Image') return <CameraIcon className="h-6 w-6 text-blue-500" />;
        if (type === 'Word') return <DocumentTextIcon className="h-6 w-6 text-blue-700" />;
        return <PaperClipIcon className="h-6 w-6 text-gray-500" />;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const getFileType = (fileName: string): ClaimDocument['type'] => {
            const extension = fileName.split('.').pop()?.toLowerCase() || '';
            if (extension === 'pdf') return 'PDF';
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'Image';
            if (['doc', 'docx'].includes(extension)) return 'Word';
            return 'Other';
        };

        const formatFileSize = (bytes: number): string => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
        };

        const newDoc: ClaimDocument = {
            id: `doc-${Date.now()}`,
            name: file.name,
            type: getFileType(file.name),
            uploadedDate: new Date().toISOString().split('T')[0],
            size: formatFileSize(file.size),
        };

        setClaim(prev => ({
            ...prev,
            documents: [...(prev.documents || []), newDoc],
        }));

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-neutral-dark">Claim Documents</h3>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-brand-primary hover:bg-brand-secondary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                >
                    <CloudArrowUpIcon className="h-4 w-4" />
                    Upload Document
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                />
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                {(claim.documents && claim.documents.length > 0) ? (
                    claim.documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-gray-50">
                            <div className="flex items-center gap-4">
                                {getIcon(doc.type)}
                                <div>
                                    <p className="font-medium text-gray-800">{doc.name}</p>
                                    <p className="text-xs text-gray-500">Uploaded: {doc.uploadedDate} • Size: {doc.size}</p>
                                </div>
                            </div>
                            <button className="text-brand-primary hover:underline text-sm font-medium">Download</button>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-400">
                        No documents have been uploaded for this claim.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClaimDetailScreen;