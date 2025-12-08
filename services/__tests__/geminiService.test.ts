import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runMyArkFastTrackCheck } from '../geminiService';
import { Claim, ClaimStatus, FraudRiskLevel } from '../../types';
import { GoogleGenAI } from '@google/genai';

// Mock the GoogleGenAI library
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: vi.fn().mockImplementation(() => ({
            models: {
                generateContent: mockGenerateContent,
            },
            chats: {
                create: vi.fn()
            }
        })),
        SchemaType: {
            STRING: 'string',
            NUMBER: 'number',
            BOOLEAN: 'boolean',
            ARRAY: 'array',
            OBJECT: 'object',
        }
    };
});

describe('Gemini Service - MyARK Fast Track', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should analyze a claim and return validation results', async () => {
        // Mock response from Gemini
        const mockAnalysisResult = {
            riskScore: 10,
            verdict: 'low-risk',
            summary: 'Claim matches pre-loss data perfectly.',
            discrepancies: [],
            recommendations: ['Auto-approve']
        };

        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify(mockAnalysisResult)
        });

        const mockClaim: Claim = {
            id: 'test-123',
            policyholderName: 'Test User',
            policyNumber: 'POL-123',
            policyStartDate: '2023-01-01',
            coverageLimit: 100000,
            deductible: 500,
            claimDate: '2023-06-01',
            location: 'Test City',
            status: ClaimStatus.NEW_FROM_MYARK,
            totalClaimedValue: 5000,
            touchTime: 0,
            auditTrail: [],
            assets: [],
            preLossMetadata: {
                preLossItemCount: 5,
                preLossTotalValue: 5000,
                documentedPhotosCount: 5,
                vaultId: 'v-123',
                lastUpdated: '2023-05-01'
            }
        };

        const result = await runMyArkFastTrackCheck(mockClaim);

        expect(mockGenerateContent).toHaveBeenCalled();
        expect(result).toEqual(mockAnalysisResult);
        expect(result?.verdict).toBe('low-risk');
    });

    it('should handle API errors gracefully', async () => {
        mockGenerateContent.mockRejectedValue(new Error('API Failure'));

        const mockClaim: Claim = {
            id: 'test-error',
            policyholderName: 'Error User',
            policyNumber: 'POL-ERR',
            policyStartDate: '2023-01-01',
            coverageLimit: 100000,
            deductible: 500,
            claimDate: '2023-06-01',
            location: 'Test City',
            status: ClaimStatus.NEW_FROM_MYARK,
            totalClaimedValue: 5000,
            touchTime: 0,
            auditTrail: [],
            assets: [],
        };

        const result = await runMyArkFastTrackCheck(mockClaim);
        expect(result).toBeNull();
    });
});
