export declare class CacheService {
    private cache;
    constructor();
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T, ttl?: number): boolean;
    del(key: string): number;
    flush(): void;
    delByPrefix(prefix: string): void;
}
