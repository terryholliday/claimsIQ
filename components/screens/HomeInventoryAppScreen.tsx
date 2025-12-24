import React from 'react';
import {
  SparklesIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  QrCodeIcon,
  ReceiptPercentIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalculatorIcon,
  HeartIcon,
} from '../icons/Icons';

interface HomeInventoryAppScreenProps {
  onBack: () => void;
}

const FeaturePill: React.FC<{ icon: React.ReactNode; title: string; desc: React.ReactNode }> = ({ icon, title, desc }) => (
  <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
    <div className="p-3 bg-brand-accent/20 text-brand-accent rounded-lg">{icon}</div>
    <div>
      <h3 className="font-bold text-white">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const BenefitCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="p-6 bg-neutral-800 border border-neutral-700 rounded-2xl text-center flex flex-col items-center">
    <div className="p-3 bg-brand-primary/30 text-brand-accent rounded-full mb-4">{icon}</div>
    <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
    <p className="text-sm text-gray-400">{desc}</p>
  </div>
);

const HomeInventoryAppScreen: React.FC<HomeInventoryAppScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans overflow-x-hidden">
      <header className="py-6 px-4 md:px-8 max-w-7xl mx-auto w-full relative z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-300 hover:text-white font-medium transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Main Site
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-24">
        <section className="text-center pt-16 pb-24">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-tight">PROVENIQ Home</h1>
          <p className="max-w-3xl mx-auto text-lg text-gray-400 mt-6 leading-relaxed">
            The inventory and evidence vault for your valuables. PROVENIQ Home helps you create a secure, verified inventory of your
            possessions—making insurance claims faster and less adversarial.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4">
            <a
              href="#"
              className="bg-white text-neutral-dark px-8 py-3 rounded-full font-bold shadow-lg w-full sm:w-auto"
            >
              Download on the App Store
            </a>
            <a
              href="#"
              className="bg-white/10 border border-white/20 text-white px-8 py-3 rounded-full font-bold w-full sm:w-auto"
            >
              Get it on Google Play
            </a>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">The End of the Shoebox Receipt.</h2>
            <p className="text-gray-400 leading-relaxed">
              After a loss, the last thing you want to do is hunt for proof of ownership. PROVENIQ Home replaces that stress with a
              simple, secure process. Document your items before a loss to create an immutable record your insurer can trust.
            </p>
            <div className="space-y-4">
              <FeaturePill
                icon={<QrCodeIcon className="h-6 w-6" />}
                title="Barcode Scanning"
                desc={<>Instantly pull exact model, specs, and MSRP by scanning an item's UPC. No manual entry required.</>}
              />
              <FeaturePill
                icon={<ReceiptPercentIcon className="h-6 w-6" />}
                title="Receipt Locker"
                desc={<>Forward email receipts to your unique inventory address. We'll parse and link them automatically.</>}
              />
              <FeaturePill
                icon={<MapPinIcon className="h-6 w-6" />}
                title="Geo-Verified Photos"
                desc="Photos taken in-app are stamped with time and GPS, proving your item was at your home."
              />
            </div>
          </div>

          <div className="relative border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl mx-auto">
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-neutral-900">
              <div className="p-4 h-full flex flex-col gap-4">
                <div className="text-center text-xs text-gray-400">Inventory</div>
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {['MacBook Pro 16"', 'Sony A7 IV Camera', 'Designer Handbag', 'Antique Gold Watch', 'Custom Gaming PC'].map(
                    (item, i) => (
                      <div
                        key={i}
                        className="bg-white/5 p-3 rounded-lg flex items-center gap-3 border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="w-10 h-10 bg-white/10 rounded"></div>
                        <div>
                          <div className="text-sm font-medium text-white">{item}</div>
                          <div className="text-xs text-gray-400">Verified Pre-Loss</div>
                        </div>
                        <div className="ml-auto text-green-400">
                          <CheckCircleIcon className="h-5 w-5" />
                        </div>
                      </div>
                    ),
                  )}
                </div>
                <button className="w-full bg-brand-accent text-neutral-900 py-3 rounded-xl font-bold mt-auto">+ Add New Item</button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Peace of Mind is a Feature.</h2>
            <p className="text-lg text-gray-400">Inventory is not paperwork. It's leverage when reality breaks.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <BenefitCard
              icon={<ShieldCheckIcon className="h-8 w-8" />}
              title="Faster Claims"
              desc="When you file a claim, your inventory and evidence package is ready to export immediately."
            />
            <BenefitCard
              icon={<ClockIcon className="h-8 w-8" />}
              title="Save Time"
              desc="No more digging through emails or shoeboxes. Proof of ownership is organized and ready."
            />
            <BenefitCard
              icon={<CalculatorIcon className="h-8 w-8" />}
              title="Coverage Check"
              desc="Understand if your policy limits are high enough to cover your valuables before it's too late."
            />
            <BenefitCard icon={<HeartIcon className="h-8 w-8" />} title="Simple" desc="Capture, verify, and move on." />
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomeInventoryAppScreen;
