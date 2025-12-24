import React, { useState, useEffect } from 'react';

import { 
  SparklesIcon, 
  ShieldCheckIcon, 
  TagIcon, 
  BuildingLibraryIcon, 
  ArrowRightIcon, 
//   ArrowLeftIcon, // Commented out as it wasn't used in this specific file based on previous versions, un-comment if needed.
  CheckCircleIcon, 
  CpuChipIcon, 
  ChartBarIcon, 
  ClockIcon, 
  BanknotesIcon, 
//   LockClosedIcon, // Commented out unused
  XMarkIcon, 
//   DocumentTextIcon, // Commented out unused
//   MobilePhoneIcon, // Commented out unused
//   QueueListIcon, // Commented out unused
//   TableCellsIcon, // Commented out unused
//   ArrowDownTrayIcon, // Commented out unused
//   PrinterIcon, // Commented out unused
  MenuIcon, 
  VideoCameraIcon, 
  MicrophoneIcon, 
//   WrenchScrewdriverIcon // Commented out unused
} from '../icons/Icons';

interface LandingScreenProps {
  onGetStarted: () => void;
  onNavigateHomeInventory: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 group">
    <div className="p-3 bg-brand-primary/20 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

const StatCard: React.FC<{ value: string; label: string; icon: React.ReactNode }> = ({ value, label, icon }) => (
    <div className="text-center p-6 border border-white/5 rounded-2xl bg-white/5 backdrop-blur-sm">
        <div className="flex justify-center mb-4 opacity-80">
            {icon}
        </div>
        <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">{value}</div>
        <div className="text-sm font-bold text-brand-accent uppercase tracking-widest">{label}</div>
    </div>
);

const DashboardShowcase = () => (
  <div className="space-y-2 text-neutral-dark">
    <div className="p-3 bg-white rounded-lg shadow-sm flex justify-between items-center text-sm">
      <span>MF-2024-001</span><span>Eleanor Vance</span><span className="font-bold text-green-600">Ready to Sync</span>
    </div>
    <div className="p-3 bg-white rounded-lg shadow-sm flex justify-between items-center text-sm font-bold text-red-600 border border-red-200">
      <span>MF-2024-004</span><span>Robert Chen</span><span>Flagged for Review</span>
    </div>
    <div className="p-3 bg-white rounded-lg shadow-sm flex justify-between items-center text-sm">
      <span>MF-2024-002</span><span>Marcus Holloway</span><span className="font-bold text-blue-600">New from PROVENIQ Home</span>
    </div>
     <div className="p-3 bg-white rounded-lg shadow-sm flex justify-between items-center text-sm opacity-50">
      <span>MF-2024-003</span><span>Jasmine Kaur</span><span className="font-bold text-gray-500">Synced to CMS</span>
    </div>
  </div>
);

const LiveFNOLShowcase = () => (
    <div className="p-4 bg-white rounded-lg shadow-lg text-neutral-dark flex gap-4 h-full">
        <div className="flex-1 space-y-3">
            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider">Live Transcript</h4>
            <div className="p-2 bg-gray-100 rounded text-sm"><strong>AI:</strong> "In your own words, what happened?"</div>
            <div className="p-2 bg-brand-primary text-white rounded text-sm text-right"><strong>User:</strong> "The fire started after I plugged in my new e-scooter."</div>
        </div>
        <div className="flex-1 space-y-3">
            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider">Intelligence Cards</h4>
            <div className="p-2 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-sm"><strong>ACTION:</strong> Subrogation alert for 'E-Scooter'.</div>
            <div className="p-2 bg-blue-50 text-blue-800 border border-blue-200 rounded text-sm"><strong>ENTITY:</strong> Extracted 'E-Scooter' as potential cause.</div>
        </div>
    </div>
);

const DigitalAdjusterShowcase = () => (
    <div className="p-4 bg-white rounded-lg shadow-lg text-neutral-dark">
      <h4 className="font-bold">Hardwood Floor Damage</h4>
      <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <h5 className="font-bold text-green-800 text-sm">AI Recommendation</h5>
            <p className="text-xl font-black text-green-600">REPAIR</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-bold text-blue-800 text-sm">Estimated Cost</h5>
            <p className="text-xl font-black text-blue-700">$75 - $125</p>
          </div>
      </div>
       <p className="text-xs text-gray-500 mt-2 italic">Pixel analysis indicates a surface-level scratch with high repairability, avoiding an $800 plank replacement.</p>
    </div>
);

const RiskShieldShowcase = () => (
    <div className="p-4 bg-white rounded-lg shadow-lg text-neutral-dark h-full flex flex-col">
      <h4 className="font-bold text-red-700">Proactive Risk Detected</h4>
      <p className="text-sm text-gray-600 mt-1">Analysis of PROVENIQ Home inventory photos has identified <strong>1,240 policies</strong> with verified "Black Rubber Washing Machine Hoses" older than 5 years, which have a 40% failure rate.</p>
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex-1">
          <h5 className="font-bold text-blue-800 text-sm">Proposed PROVENIQ Home Push Notification</h5>
          <p className="text-xs text-blue-700 mt-1"><strong>⚠️ Safety Alert:</strong> We detected rubber hoses on your washer at risk of bursting. Prevent a flood! Use code SAFEHOME20 for 20% off steel-braided hoses.</p>
      </div>
    </div>
);

const LandingScreen: React.FC<LandingScreenProps> = ({ onGetStarted, onNavigateHomeInventory }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const heroStatements = [
      "Replace 'Guesstimates' with Asset Intelligence.",
      "Automate 30% of Adjuster Time.",
      "Stop 12% of Claim Leakage Before It Happens."
    ];
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

    const showcases = [
        {
            url: 'app.proveniqclaimsiq.com/dashboard',
            component: <DashboardShowcase />,
        },
        {
            url: 'app.proveniqclaimsiq.com/live-fnol',
            component: <LiveFNOLShowcase />,
        },
        {
            url: 'app.proveniqclaimsiq.com/digital-adjuster',
            component: <DigitalAdjusterShowcase />,
        },
        {
            url: 'app.proveniqclaimsiq.com/risk-shield',
            component: <RiskShieldShowcase />,
        },
    ];
    const [showcaseIndex, setShowcaseIndex] = useState(0);

    useEffect(() => {
        const heroTimer = setInterval(() => {
            setCurrentHeroIndex(prevIndex => (prevIndex + 1) % heroStatements.length);
        }, 4000);
        
        const showcaseTimer = setInterval(() => {
            setShowcaseIndex(prev => (prev + 1) % showcases.length);
        }, 5000);

        return () => {
            clearInterval(heroTimer);
            clearInterval(showcaseTimer);
        };
    }, []);

    return (
        <div className="bg-neutral-900 text-white min-h-screen font-sans">
            {/* Header */}
            <header className="py-6 px-4 md:px-8 max-w-7xl mx-auto flex justify-between items-center relative z-20">
                <div className="flex items-center gap-2">
                    <div className="font-black text-xl tracking-tighter">
                        <span className="text-brand-accent">PROVENIQ</span>
                        <span className="text-white"> ClaimsIQ</span>
                    </div>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#roi" className="hover:text-white transition-colors">ROI</a>
                    <button onClick={onNavigateHomeInventory} className="hover:text-white transition-colors">PROVENIQ Home</button>
                </nav>

                <div className="hidden md:block">
                    <button
                        onClick={onGetStarted}
                        className="bg-brand-primary hover:bg-brand-secondary text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all"
                    >
                        Get Started
                    </button>
                </div>
                
                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 -mr-2">
                        {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-neutral-900/90 backdrop-blur-lg z-10 p-4 md:hidden animate-in fade-in duration-300">
                    <div className="mt-20 text-center space-y-8">
                        <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-2xl font-bold">Features</a>
                        <a href="#roi" onClick={() => setIsMenuOpen(false)} className="block text-2xl font-bold">ROI</a>
                        <button onClick={() => { onNavigateHomeInventory(); setIsMenuOpen(false); }} className="block text-2xl font-bold w-full">PROVENIQ Home</button>
                        <button
                            onClick={() => { onGetStarted(); setIsMenuOpen(false); }}
                            className="bg-brand-primary text-white w-full max-w-xs mx-auto py-4 rounded-full font-bold text-lg mt-8"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            )}
            
            <main>
                {/* Hero */}
                <section className="relative pt-24 pb-32 text-center overflow-hidden">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 -top-1/2 bg-gradient-to-b from-brand-primary/20 via-transparent to-transparent pointer-events-none"></div>

                    <div className="max-w-4xl mx-auto px-4 relative z-10">
                        <div className="h-20 flex items-center justify-center">
                            <h1 key={currentHeroIndex} className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-tight animate-in fade-in slide-in-from-bottom-2 duration-700">
                                {heroStatements[currentHeroIndex]}
                            </h1>
                        </div>
                        <p className="max-w-2xl mx-auto text-lg text-gray-400 mt-8 leading-relaxed">
                            PROVENIQ ClaimsIQ sits between your policyholders and your core system, automating 30% of adjuster time and stopping 12% of claim leakage before it happens.
                        </p>
                        <div className="mt-12 flex justify-center">
                            <button
                                onClick={onGetStarted}
                                className="group relative bg-white text-neutral-dark px-8 py-4 rounded-full font-bold shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20 transition-all flex items-center gap-2"
                            >
                                Launch Live Demo <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </section>
                
                {/* Product Showcase */}
                <section className="px-4 -mt-16 relative z-10">
                    <div className="relative w-full max-w-5xl mx-auto animate-zoom-in-from-distance">
                        {/* Browser chrome */}
                        <div className="h-10 bg-gray-800 rounded-t-xl flex items-center px-4 shadow-2xl">
                            <div className="flex space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            </div>
                            <div className="flex-1 text-center text-sm text-gray-400 bg-gray-900/80 mx-4 rounded-md py-1 font-mono">
                                {showcases[showcaseIndex].url}
                            </div>
                        </div>
                        {/* Content */}
                        <div className="bg-neutral-light rounded-b-xl shadow-2xl p-6 min-h-[300px] relative overflow-hidden">
                            {showcases.map((item, index) => (
                                <div
                                    key={index}
                                    className={`absolute inset-0 p-6 transition-opacity duration-700 ease-in-out ${
                                        index === showcaseIndex ? 'opacity-100' : 'opacity-0'
                                    }`}
                                >
                                    {item.component}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                
                {/* Stats */}
                <section className="py-24 max-w-5xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <StatCard value="12%" label="Leakage Stopped" icon={<BanknotesIcon className="h-10 w-10" />} />
                        <StatCard value="4.5x" label="Faster Cycle Time" icon={<ClockIcon className="h-10 w-10" />} />
                        <StatCard value="30%" label="Adjuster Time Saved" icon={<ChartBarIcon className="h-10 w-10" />} />
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-24 bg-white/5">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-4xl font-bold text-white">An AI Co-Pilot for Every Adjuster</h2>
                            <p className="text-lg text-gray-400 mt-4">We automate the tedious, so your team can focus on the human side of claims.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard 
                                icon={<CpuChipIcon className="h-8 w-8" />}
                                title="AI-Powered Triage"
                                desc="Our system analyzes every incoming claim, flagging high-risk manifests for immediate review and fast-tracking low-risk ones for straight-through processing."
                            />
                            <FeatureCard 
                                icon={<TagIcon className="h-8 w-8" />}
                                title="Automated Valuation"
                                desc="ClaimsIQ connects to live web data to find real-time replacement costs, preventing overpayment on inflated or outdated user estimates."
                            />
                             <FeatureCard 
                                icon={<VideoCameraIcon className="h-8 w-8" />}
                                title="Digital Field Adjuster"
                                desc="Analyze 'before and after' damage photos to get an AI-generated repair vs. replace recommendation with cost breakdowns, reducing unnecessary vendor costs."
                            />
                            <FeatureCard 
                                icon={<ShieldCheckIcon className="h-8 w-8" />}
                                title="Multi-Modal Fraud Defense"
                                desc="We go beyond checklists, using six concurrent AI engines to triangulate truth across pixels, metadata, pricing, and even historical weather data."
                            />
                            <FeatureCard 
                                icon={<BuildingLibraryIcon className="h-8 w-8" />}
                                title="50-State Compliance Engine"
                                desc="Stay ahead of regulatory changes. Our AI researches and applies state-specific statutes for claim handling, depreciation, and consumer protection."
                            />
                            <FeatureCard 
                                icon={<MicrophoneIcon className="h-8 w-8" />}
                                title="Live FNOL Co-Pilot"
                                desc="A Gemini-powered voice assistant that interviews policyholders, transcribes the call, and extracts key entities in real-time."
                            />
                        </div>
                    </div>
                </section>

                {/* ROI */}
                <section id="roi" className="py-32">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-4xl font-bold text-white mb-4">The Business Case for Intelligence</h2>
                        <p className="text-lg text-gray-400 mb-12">
                            Manual validation is the silent killer of profitability. It's slow, expensive, and error-prone. ClaimsIQ provides a clear, measurable return by automating the entire pre-adjudication process.
                        </p>
                        <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl shadow-2xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="text-left space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-green-500/20 rounded-lg"><CheckCircleIcon className="h-5 w-5 text-green-400" /></div>
                                        <div>
                                            <h4 className="font-bold text-white">Stop Hard & Soft Leakage</h4>
                                            <p className="text-sm text-gray-400">Eliminate overpayment from inaccurate pricing, missed depreciation, policy exclusions, and soft fraud.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-green-500/20 rounded-lg"><CheckCircleIcon className="h-5 w-5 text-green-400" /></div>
                                        <div>
                                            <h4 className="font-bold text-white">Reduce Administrative Cost</h4>
                                            <p className="text-sm text-gray-400">Automate data entry and evidence gathering, freeing up adjusters for high-value settlement tasks.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-green-500/20 rounded-lg"><CheckCircleIcon className="h-5 w-5 text-green-400" /></div>
                                        <div>
                                            <h4 className="font-bold text-white">Increase Customer Satisfaction</h4>
                                            <p className="text-sm text-gray-400">Faster, more transparent claims processing leads to higher NPS and policyholder retention.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-black/30 rounded-xl border border-white/10 text-center">
                                    <p className="text-sm font-bold text-brand-accent uppercase tracking-widest">Projected Annual Savings</p>
                                    <p className="text-6xl font-black text-white my-2">$8.2M</p>
                                    <p className="text-xs text-gray-400">Based on a carrier with $100M annual contents volume.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* CTA */}
                <section className="pb-32">
                    <div className="max-w-3xl mx-auto px-4 text-center">
                        <h2 className="text-4xl font-bold text-white">Ready to See It in Action?</h2>
                        <p className="text-lg text-gray-400 mt-4">
                            Launch the interactive demo to experience the full power of the Asset Intelligence Portal. No signup required.
                        </p>
                        <div className="mt-10">
                            <button
                                onClick={onGetStarted}
                                className="group relative bg-white text-neutral-dark px-10 py-5 rounded-full font-bold shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20 transition-all text-lg"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-black/20 border-t border-white/10 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} PROVENIQ Technologies. All rights reserved.</p>
                    <p className="mt-2">This is a fictional product demo for a generative AI hackathon.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingScreen;
