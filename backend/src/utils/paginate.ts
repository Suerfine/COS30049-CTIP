import {
  FindAndCountOptions,
  Model,
  ModelStatic,
  Op,
  Order,
  WhereOptions,
} from "sequelize";
import { PaginateRequestParams, PaginateResponse } from "../types/common";

type FilterAst =
  | {
      type: "comparison";
      attribute: string;
      operator: ComparisonOperator;
      value: unknown;
    }
  | {
      type: "not";
      operand: FilterAst;
    }
  | {
      type: "and" | "or";
      operands: FilterAst[];
    };

interface Token {
  type: "word" | "string" | "lparen" | "rparen";
  value: string;
}

type ComparisonOperator = "eq" | "ne" | "gt" | "ge" | "lt" | "le" | "like";

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;
const MAX_SIZE = 100;

const FILTER_OPERATORS: Record<ComparisonOperator, symbol> = {
  eq: Op.eq,
  ne: Op.ne,
  gt: Op.gt,
  ge: Op.gte,
  lt: Op.lt,
  le: Op.lte,
  like: Op.like,
};

function normalizePositiveInt(
  value: string | number | undefined,
  fallback: number,
): number {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsed));
}

function tokenizeFilter(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if (ch === "(") {
      tokens.push({ type: "lparen", value: ch });
      i += 1;
      continue;
    }

    if (ch === ")") {
      tokens.push({ type: "rparen", value: ch });
      i += 1;
      continue;
    }

    if (ch === "'" || ch === '"') {
      const quote = ch;
      i += 1;
      let value = "";

      while (i < input.length) {
        const current = input[i];

        if (current === "\\" && i + 1 < input.length) {
          value += input[i + 1];
          i += 2;
          continue;
        }

        if (current === quote) {
          i += 1;
          break;
        }

        value += current;
        i += 1;
      }

      tokens.push({ type: "string", value });
      continue;
    }

    let word = "";
    while (
      i < input.length &&
      !/\s/.test(input[i]) &&
      input[i] !== "(" &&
      input[i] !== ")"
    ) {
      word += input[i];
      i += 1;
    }

    if (word.length > 0) {
      tokens.push({ type: "word", value: word });
    }
  }

  return tokens;
}

function parseValue(token: Token): unknown {
  if (token.type === "string") {
    return token.value;
  }

  const lowered = token.value.toLowerCase();

  if (lowered === "null") {
    return null;
  }
  if (lowered === "true") {
    return true;
  }
  if (lowered === "false") {
    return false;
  }

  const asNumber = Number(token.value);
  if (!Number.isNaN(asNumber) && token.value.trim() !== "") {
    return asNumber;
  }

  return token.value;
}

function parseFilter(filter: string): FilterAst {
  const tokens = tokenizeFilter(filter);
  let cursor = 0;

  const current = (): Token | undefined => tokens[cursor];
  const consume = (): Token | undefined => {
    const token = tokens[cursor];
    cursor += 1;
    return token;
  };

  const parsePrimary = (): FilterAst => {
    const token = current();

    if (!token) {
      throw new Error("Invalid filter syntax: expression expected");
    }

    if (token.type === "lparen") {
      consume();
      const node = parseOrExpression();
      const close = consume();
      if (!close || close.type !== "rparen") {
        throw new Error("Invalid filter syntax: missing closing parenthesis");
      }
      return node;
    }

    if (token.type !== "word") {
      throw new Error("Invalid filter syntax: attribute expected");
    }

    const attribute = consume()!.value;
    const operatorToken = consume();
    if (!operatorToken || operatorToken.type !== "word") {
      throw new Error(
        `Invalid filter syntax near '${attribute}': operator expected`,
      );
    }

    const operator = operatorToken.value.toLowerCase();
    if (!(operator in FILTER_OPERATORS)) {
      throw new Error(`Invalid filter operator '${operatorToken.value}'`);
    }

    const valueToken = consume();
    if (
      !valueToken ||
      (valueToken.type !== "word" && valueToken.type !== "string")
    ) {
      throw new Error(
        `Invalid filter syntax near '${attribute} ${operator}': value expected`,
      );
    }

    return {
      type: "comparison",
      attribute,
      operator: operator as ComparisonOperator,
      value: parseValue(valueToken),
    };
  };

  const parseNotExpression = (): FilterAst => {
    const token = current();
    if (token && token.type === "word" && token.value.toLowerCase() === "not") {
      consume();
      return { type: "not", operand: parseNotExpression() };
    }
    return parsePrimary();
  };

  const parseAndExpression = (): FilterAst => {
    let left = parseNotExpression();

    while (true) {
      const token = current();
      if (
        !token ||
        token.type !== "word" ||
        token.value.toLowerCase() !== "and"
      ) {
        break;
      }

      consume();
      const right = parseNotExpression();

      if (left.type === "and") {
        left = { type: "and", operands: [...left.operands, right] };
      } else {
        left = { type: "and", operands: [left, right] };
      }
    }

    return left;
  };

  const parseOrExpression = (): FilterAst => {
    let left = parseAndExpression();

    while (true) {
      const token = current();
      if (
        !token ||
        token.type !== "word" ||
        token.value.toLowerCase() !== "or"
      ) {
        break;
      }

      consume();
      const right = parseAndExpression();

      if (left.type === "or") {
        left = { type: "or", operands: [...left.operands, right] };
      } else {
        left = { type: "or", operands: [left, right] };
      }
    }

    return left;
  };

  const ast = parseOrExpression();

  if (cursor !== tokens.length) {
    throw new Error(`Invalid filter syntax near '${tokens[cursor].value}'`);
  }

  return ast;
}

function assertAttributeAllowed(
  attribute: string,
  allowedAttributes: Set<string>,
): void {
  if (!allowedAttributes.has(attribute)) {
    throw new Error(`Invalid attribute '${attribute}' in filter/orderBy`);
  }
}

function toWhereClause(
  ast: FilterAst,
  allowedAttributes: Set<string>,
): WhereOptions {
  if (ast.type === "comparison") {
    assertAttributeAllowed(ast.attribute, allowedAttributes);
    return {
      [ast.attribute]: {
        [FILTER_OPERATORS[ast.operator]]: ast.value,
      },
    };
  }

  if (ast.type === "not") {
    return {
      [Op.not]: toWhereClause(ast.operand, allowedAttributes),
    };
  }

  const expressions = ast.operands.map((operand) =>
    toWhereClause(operand, allowedAttributes),
  );
  return {
    [ast.type === "and" ? Op.and : Op.or]: expressions,
  };
}

function parseOrderBy(
  orderBy: string | undefined,
  allowedAttributes: Set<string>,
): Order | undefined {
  if (!orderBy || orderBy.trim() === "") {
    return undefined;
  }

  const order: Order = [];
  const segments = orderBy
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const [attribute, directionRaw] = segment.split(/\s+/);
    if (!attribute) {
      continue;
    }

    assertAttributeAllowed(attribute, allowedAttributes);

    const direction = (directionRaw ?? "asc").toLowerCase();
    if (direction !== "asc" && direction !== "desc") {
      throw new Error(
        `Invalid order direction '${directionRaw}' for '${attribute}'`,
      );
    }

    order.push([attribute, direction.toUpperCase() as "ASC" | "DESC"]);
  }

  return order.length > 0 ? order : undefined;
}

function mergeWhere(
  baseWhere: WhereOptions | undefined,
  filterWhere: WhereOptions | undefined,
): WhereOptions | undefined {
  if (baseWhere && filterWhere) {
    return {
      [Op.and]: [baseWhere, filterWhere],
    };
  }

  return filterWhere ?? baseWhere;
}

type PaginationSummary = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

type PaginateResponseMeta = PaginationSummary & {
  baseUrl?: string;
};

function buildPaginateQueryString(
  params: PaginateRequestParams,
  page: number,
  size: number,
): string {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("size", String(size));

  if (
    params.isDeleted !== undefined &&
    params.isDeleted !== null &&
    params.isDeleted !== ""
  ) {
    query.set("isDeleted", String(params.isDeleted));
  }

  if (params.filter && params.filter.trim() !== "") {
    query.set("filter", params.filter);
  }

  if (params.orderBy && params.orderBy.trim() !== "") {
    query.set("orderBy", params.orderBy);
  }

  const queryString = query.toString();
  return queryString.length > 0 ? `?${queryString}` : "";
}

function buildPaginateLinks(
  params: PaginateRequestParams,
  meta: PaginationSummary,
  baseUrl = "",
): NonNullable<PaginateResponse<unknown>["_links"]> {
  const base = baseUrl.replace(/[?#].*$/, "");
  const createHref = (page: number): string =>
    `${base}${buildPaginateQueryString(params, page, meta.size)}`;

  const links: NonNullable<PaginateResponse<unknown>["_links"]> = {
    self: { href: createHref(meta.page) },
    first: { href: createHref(1) },
    last: { href: createHref(meta.totalPages > 0 ? meta.totalPages : 1) },
  };

  if (meta.page > 1) {
    links.prev = { href: createHref(meta.page - 1) };
  }

  if (meta.totalPages > 0 && meta.page < meta.totalPages) {
    links.next = { href: createHref(meta.page + 1) };
  }

  return links;
}

/**
 * Formats an array of data into a paginated response structure, including pagination metadata and optional HATEOAS links.
 * @param data The array of data items for the current page
 * @param params Pagination parameters from the request query
 * @param includeLinks Boolean indicating whether to include HATEOAS links in the response
 * @param meta Optional metadata for the pagination response (if not provided, it will be calculated from the data and params)
 * @returns A PaginateResponse object containing the paginated data and metadata
 */
export function formatPaginateResponse<T>(
  data: T[],
  params: PaginateRequestParams,
  includeLinks = true,
  meta?: Partial<PaginateResponseMeta>,
): PaginateResponse<T> {
  const page = normalizePositiveInt(meta?.page ?? params.page, DEFAULT_PAGE);
  const size = normalizePositiveInt(meta?.size ?? params.size, DEFAULT_SIZE);
  const totalElements = meta?.totalElements ?? data.length;
  const totalPages =
    meta?.totalPages ??
    (totalElements === 0 ? 0 : Math.ceil(totalElements / size));

  const response: PaginateResponse<T> = {
    data,
    page,
    size,
    totalElements,
    totalPages,
  };

  if (includeLinks) {
    response._links = buildPaginateLinks(
      params,
      { page, size, totalElements, totalPages },
      meta?.baseUrl,
    );
  }

  return response;
}

/**
 * Applies pagination, filtering, and sorting to a Sequelize model based on the provided parameters.
 * @param model The Sequelize model to query
 * @param params Pagination, filtering, and sorting parameters
 * @param baseOptions Additional options to pass to the Sequelize query (excluding where/order/limit/offset)
 * @returns A paginated response containing the results and metadata
 */
export async function paginateModel<T extends Model>(
  model: ModelStatic<T>,
  params: PaginateRequestParams,
  baseOptions: Omit<
    FindAndCountOptions,
    "where" | "order" | "limit" | "offset"
  > & {
    where?: WhereOptions;
  } = {},
): Promise<PaginateResponse<T>> {
  const page = normalizePositiveInt(params.page, DEFAULT_PAGE);
  const requestedSize = normalizePositiveInt(params.size, DEFAULT_SIZE);
  const size = Math.min(requestedSize, MAX_SIZE);
  const offset = (page - 1) * size;

  const allowedAttributes = new Set(Object.keys(model.getAttributes()));

  const filterWhere =
    params.filter && params.filter.trim() !== ""
      ? toWhereClause(parseFilter(params.filter), allowedAttributes)
      : undefined;

  const order = parseOrderBy(params.orderBy, allowedAttributes);
  const where = mergeWhere(baseOptions.where, filterWhere);

  const queryOptions: FindAndCountOptions = {
    ...baseOptions,
    where,
    order,
    limit: size,
    offset,
    distinct: baseOptions.distinct ?? true,
  };

  const { rows, count } = await model.findAndCountAll(queryOptions);
  const totalElements = Number(count);

  return formatPaginateResponse(rows, params, true, {
    page,
    size,
    totalElements,
    totalPages: totalElements === 0 ? 0 : Math.ceil(totalElements / size),
  });
}
