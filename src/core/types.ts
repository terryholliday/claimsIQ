/**
 * @file src/core/types.ts
 * @description Core Kernel Types - Pure Domain Definitions
 * @constraint NO Infrastructure Imports
 */

export type ID = string;

export interface Entity<T> {
    id: ID;
    props: T;
    createdAt: Date;
    updatedAt: Date;
}

export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };

export interface UseCase<Input, Output> {
    execute(request: Input): Promise<Result<Output>>;
}

export interface Port<Input, Output> {
    handle(request: Input): Promise<Output>;
}
