
import React from 'react';
import { Card } from '../ui/Card';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <pre className="bg-neutral-dark text-white p-4 rounded-lg overflow-x-auto text-sm">
    <code>{children}</code>
  </pre>
);

const ApiDocsScreen: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-neutral-dark">API Documentation</h1>
        <p className="mt-2 text-lg text-gray-600">Technical reference for integrating with the TrueManifest API.</p>
      </div>

      <Card>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-neutral-dark">Authentication</h2>
        <p className="mb-4 text-gray-600">
          All API requests must be authenticated using an API Key. Include your key in the <code className="bg-neutral-medium/30 text-neutral-dark px-1.5 py-0.5 rounded font-mono text-sm">Authorization</code> header as a Bearer token.
        </p>
        <CodeBlock>
          {`Authorization: Bearer YOUR_API_KEY`}
        </CodeBlock>
      </Card>

      <Card>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-neutral-dark">Endpoints</h2>
        
        <div className="space-y-8">
          {/* Get All Claims */}
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">GET</span> /claims</h3>
            <p className="mb-3 text-sm text-gray-600">Retrieve a list of all claims associated with your organization.</p>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Example Response</h4>
            <CodeBlock>
{`[
  {
    "id": "CL-2024-001",
    "policyholderName": "Eleanor Vance",
    "policyNumber": "POL-987654",
    "claimDate": "2024-07-15",
    "status": "Pending Review",
    "totalClaimedValue": 8450
  }
]`}
            </CodeBlock>
          </div>

          {/* Get Single Claim */}
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">GET</span> /claims/{`{claimId}`}</h3>
            <p className="mb-3 text-sm text-gray-600">Retrieve detailed information for a specific claim, including a list of its assets.</p>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Example Response</h4>
            <CodeBlock>
{`{
  "id": "CL-2024-001",
  "policyholderName": "Eleanor Vance",
  // ... other claim details
  "assets": [
    {
      "id": "A001",
      "name": "MacBook Pro 16\\"",
      "category": "Electronics",
      "claimedValue": 2500,
      "purchaseDate": "2023-01-20",
      "status": "Verified",
      "fraudAnalysis": null
    }
  ]
}`}
            </CodeBlock>
          </div>
          
          {/* Trigger Fraud Analysis */}
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">POST</span> /claims/{`{claimId}`}/assets/{`{assetId}`}/analyze</h3>
            <p className="mb-3 text-sm text-gray-600">Trigger an AI-powered fraud analysis for a specific asset. The result will be updated on the asset object.</p>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Example Response (Updated Asset)</h4>
            <CodeBlock>
{`{
  "id": "A003",
  "name": "Designer Leather Handbag",
  "claimedValue": 1200,
  "purchaseDate": "2024-07-10",
  "status": "Flagged",
  "fraudAnalysis": {
    "riskLevel": "High",
    "reason": "High-value designer item purchased just 5 days before the claim date is highly suspicious and warrants further investigation."
  }
}`}
            </CodeBlock>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ApiDocsScreen;
