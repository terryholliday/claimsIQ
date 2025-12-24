import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { BuildingLibraryIcon, MapIcon, MagnifyingGlassIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowRightIcon, PrinterIcon, ArrowDownTrayIcon } from '../icons/Icons';
import { researchStateRegulations, generateComplianceFiling } from '../../services/geminiService';
import { StateRegulation, FilingReport, Claim } from '../../types';
import { MOCK_CLAIMS } from '../../constants'; 

const US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", 
    "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", 
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", 
    "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const ComplianceScreen: React.FC = () => {
  const [selectedState, setSelectedState] = useState('Alabama');
  const [searchTopic, setSearchTopic] = useState('Fair Claims Settlement Practices');
  const [isResearching, setIsResearching] = useState(false);
  const [regulation, setRegulation] = useState<StateRegulation | null>(null);
  const [isFiling, setIsFiling] = useState(false);
  const [filingReport, setFilingReport] = useState<FilingReport | null>(null);

  // Safety check: Ensure MOCK_CLAIMS exists and has items
  const demoClaim: Claim | undefined = (MOCK_CLAIMS && MOCK_CLAIMS.length > 0) ? MOCK_CLAIMS[0] : undefined;

  const handleResearch = async () => {
    setIsResearching(true);
    try {
        const result = await researchStateRegulations(selectedState, searchTopic);
        setRegulation(result);
        setFilingReport(null); // Reset filing if new research done
    } catch (error) {
        console.error("Research failed", error);
    } finally {
        setIsResearching(false);
    }
  };

  const handleFileReport = async () => {
      if (!regulation || !demoClaim) return;
      setIsFiling(true);
      try {
        const result = await generateComplianceFiling(demoClaim, regulation);
        setFilingReport(result);
      } catch (error) {
          console.error("Filing failed", error);
      } finally {
        setIsFiling(false);
      }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center space-x-4">
          <div className="p-3 bg-brand-primary rounded-lg text-white shadow-lg">
              <BuildingLibraryIcon className="h-8 w-8" />
          </div>
          <div>
              <h1 className="text-3xl font-bold text-neutral-dark">Regulatory Compliance Hub</h1>
              <p className="text-gray-500">Research state insurance codes and automate commission filings.</p>
          </div>
      </div>

      {/* Research Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Column */}
          <Card className="lg:col-span-1 space-y-6 h-fit">
              <div className="flex items-center space-x-2 text-brand-secondary font-bold border-b border-gray-100 pb-2">
                  <MapIcon className="h-5 w-5" />
                  <h3>State Jurisdiction</h3>
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select State</label>
                  <select 
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none max-h-60 bg-white text-neutral-black"
                  >
                      {US_STATES.map((state) => (
                          <option key={state} value={state}>{state}</option>
                      ))}
                  </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compliance Topic</label>
                  <input 
                    type="text" 
                    value={searchTopic} 
                    onChange={(e) => setSearchTopic(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none bg-white text-neutral-black"
                    placeholder="e.g., Time Limits, Depreciation"
                  />
              </div>

              <button 
                onClick={handleResearch}
                disabled={isResearching}
                className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 rounded-lg shadow-md flex items-center justify-center gap-2 disabled:opacity-70 transition-colors"
              >
                  {isResearching ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                      <MagnifyingGlassIcon className="h-5 w-5" />
                  )}
                  Research Regulations
              </button>
          </Card>

          {/* Results Column */}
          <div className="lg:col-span-2 space-y-6">
              {regulation ? (
                  <div className="animate-in slide-in-from-bottom-4 fade-in duration-300 space-y-6">
                      <Card className="border-t-4 border-brand-accent">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <h2 className="text-xl font-bold text-neutral-dark">{regulation.regulationName}</h2>
                                  <p className="text-sm text-gray-500">Effective Date: {regulation.lastUpdated}</p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                  regulation.complianceStatus === 'Compliant' ? 'bg-green-100 text-green-800' : 
                                  regulation.complianceStatus === 'At Risk' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'
                              }`}>
                                  {regulation.complianceStatus === 'Compliant' ? <CheckCircleIcon className="h-4 w-4" /> : <ExclamationTriangleIcon className="h-4 w-4" />}
                                  {regulation.complianceStatus}
                              </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700 text-sm leading-relaxed">
                              {regulation.summary}
                          </div>
                      </Card>

                      <Card>
                          <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-bold text-neutral-dark flex items-center gap-2">
                                  <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                                  Commission Filing Report
                              </h3>
                              {!filingReport && (
                                  <button 
                                    onClick={handleFileReport}
                                    disabled={isFiling || !demoClaim}
                                    className="text-sm bg-neutral-dark hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                    title={!demoClaim ? "No active claim data to generate filing." : ""}
                                  >
                                      {isFiling ? 'Drafting Document...' : 'Generate Filing Report'}
                                      {!isFiling && <ArrowRightIcon className="h-4 w-4" />}
                                  </button>
                              )}
                          </div>

                          {filingReport ? (
                              <div className="animate-in fade-in duration-300 mt-6">
                                  <div className="flex justify-end mb-4 gap-2">
                                      <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded border border-gray-300 flex items-center gap-2 font-medium transition-colors">
                                          <ArrowDownTrayIcon className="h-4 w-4" /> Download PDF
                                      </button>
                                      <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded border border-gray-300 flex items-center gap-2 font-medium transition-colors">
                                          <PrinterIcon className="h-4 w-4" /> Print
                                      </button>
                                  </div>
                                  
                                  <div className="bg-white border border-gray-200 shadow-xl mx-auto max-w-[210mm] p-12 font-serif text-gray-900 text-sm leading-relaxed relative min-h-[600px]">
                                      {/* Header */}
                                      <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
                                          <h2 className="text-2xl font-bold uppercase tracking-widest text-gray-800">Certificate of Compliance</h2>
                                          <p className="text-sm text-gray-600 mt-2 font-semibold uppercase">State of {filingReport.state} • Department of Insurance</p>
                                          <p className="text-xs text-gray-500">Market Conduct Division</p>
                                      </div>

                                      {/* Content */}
                                      <div className="whitespace-pre-wrap text-base text-gray-800 mb-12">
                                          {filingReport.content}
                                      </div>

                                      {/* Footer / Signature */}
                                      <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-end">
                                           <div className="text-center">
                                              <div className="h-12 w-48 mb-2 border-b border-gray-400"></div> 
                                              <div className="text-xs text-gray-500 uppercase tracking-wide font-bold">Authorized Signature</div>
                                              <div className="text-[10px] text-gray-400">ClaimsIQ Compliance Officer</div>
                                           </div>
                                           <div className="text-right text-xs text-gray-400 font-mono">
                                               <div>Electronic Filing ID: {filingReport.filingId}</div>
                                               <div>Timestamp: {filingReport.generatedDate}</div>
                                           </div>
                                      </div>
                                       
                                       {/* Stamp Effect */}
                                       <div className="absolute bottom-20 right-12 opacity-20 pointer-events-none transform -rotate-12 border-4 border-green-800 text-green-800 font-black text-5xl p-4 rounded-lg uppercase tracking-widest">
                                          FILED
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400">
                                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                  <p className="font-medium">Research a regulation to generate a filing report.</p>
                              </div>
                          )}
                      </Card>
                  </div>
              ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 min-h-[300px]">
                      <div className="text-center text-gray-400">
                          <MapIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                          <h3 className="text-lg font-medium text-gray-500">No Jurisdiction Selected</h3>
                          <p className="max-w-xs mx-auto mt-2">Select a state and topic to begin researching regulatory requirements.</p>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default ComplianceScreen;