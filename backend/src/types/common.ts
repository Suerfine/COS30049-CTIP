// Use this format for pagination and filtering results:
// https://restfulapi.net/api-pagination-sorting-filtering/
export interface PaginateRequestParams {
  page?: string | number;
  size?: string | number;
  isDeleted?: string | boolean;

  // Filter format: {attribute} {eq|ne|gt|ge|lt|le} {value}
  // Multiple filters can be chained with "and|or|not" and grouped with parentheses,
  // e.g. "username eq 'john' and (created_at gt '2023-01-01' or role eq 'admin')"
  filter?: string;

  // orderBy format: {attribute} {asc|desc}
  // Multiple orderings can be separated by commas
  // e.g. "username asc" or "username asc, created_at desc",
  orderBy?: string;
}

export interface PaginateResponse<T> {
  data: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  _links?: {
    self?: {
      href: string;
    };
    first?: {
      href: string;
    };
    prev?: {
      href: string;
    };
    next?: {
      href: string;
    };
    last?: {
      href: string;
    };
  };
}

export interface ErrorResponse {
  message: string;
}
