import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

describe('Logger Service', () => {
    beforeEach(() => {
        vi.spyOn(console, 'info').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.spyOn(console, 'debug').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should log info messages', () => {
        logger.info('test message', { foo: 'bar' }, 'TEST');
        expect(console.info).toHaveBeenCalledWith(
            expect.stringContaining('[INFO] [TEST]'),
            'test message',
            { foo: 'bar' }
        );
    });

    it('should log error messages', () => {
        logger.error('error message', undefined, 'TEST');
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('[ERROR] [TEST]'),
            'error message',
            ''
        );
    });
});
