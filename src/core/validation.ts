/**
 * @file src/core/validation.ts
 * @description Core Validation Primitives
 */

import { z } from 'zod';

export const IDSchema = z.string().uuid();

export const TimestampSchema = z.date();

export const BaseEntitySchema = z.object({
    id: IDSchema,
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
});
