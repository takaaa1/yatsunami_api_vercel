export declare class PaginationDto {
    page?: number;
    limit?: number;
    get skip(): number;
    get take(): number;
}
export declare class PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    constructor(data: T[], total: number, page: number, limit: number);
}
