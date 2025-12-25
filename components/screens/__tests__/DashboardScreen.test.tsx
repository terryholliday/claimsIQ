import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardScreen from '../DashboardScreen';
import { createMockClaim } from '../../../test-utils';
import { ClaimStatus } from '../../../types';

describe('DashboardScreen', () => {
    const mockClaims = [
        createMockClaim({
            id: 'claim-1',
            policyholderName: 'Alice',
            status: ClaimStatus.NEW_FROM_MYARK,
            totalClaimedValue: 1200
        }),
        createMockClaim({
            id: 'claim-2',
            policyholderName: 'Bob',
            status: ClaimStatus.READY_TO_SYNC,
            totalClaimedValue: 800
        })
    ];

    const onSelectClaim = vi.fn();
    const onSyncClaims = vi.fn().mockReturnValue(5);

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, 'alert').mockImplementation(() => { });
    });

    it('renders the dashboard with claims list', () => {
        render(<DashboardScreen claims={mockClaims} onSelectClaim={onSelectClaim} onSyncClaims={onSyncClaims} />);

        expect(screen.getByText('Manifest Inbox')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('$1,200.00')).toBeInTheDocument();
    });

    it('filters claims by status', async () => {
        render(<DashboardScreen claims={mockClaims} onSelectClaim={onSelectClaim} onSyncClaims={onSyncClaims} />);

        // Find the "Ready for Export" card/button and click it to filter
        // The card text is "Ready for Export"
        const readyCard = screen.getByText('Ready for Export');
        fireEvent.click(readyCard);

        // Should show Bob, but NOT Alice
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    it('handles Sync from MyARK action', async () => {
        vi.useFakeTimers();
        render(<DashboardScreen claims={mockClaims} onSelectClaim={onSelectClaim} onSyncClaims={onSyncClaims} />);

        // Find Sync button. Text contains "Sync from MyARK"
        // Since MyARK has a trademark using <sup>, getting by text might be tricky if it splits nodes.
        // We can search by role 'button' and text match.
        const syncButton = screen.getByRole('button', { name: /Sync from MyARK/i });
        fireEvent.click(syncButton);

        // It sets local state loading, then calls onSyncClaims after timeout
        expect(onSyncClaims).not.toHaveBeenCalled(); // due to timeout

        vi.advanceTimersByTime(1500);

        expect(onSyncClaims).toHaveBeenCalled();

        vi.useRealTimers();
    });
});
