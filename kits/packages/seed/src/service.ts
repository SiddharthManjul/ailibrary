/** The baseline file every independently applicable review patch targets. */
export const SERVICE_SOURCE = `export interface WorkOrder { id: string; tenantId: string; costCents: number; hours: number; closed: boolean }

export function canRead(order: WorkOrder, tenantId: string): boolean {
  return order.tenantId === tenantId;
}

export function totalCost(orders: WorkOrder[]): number {
  return orders.reduce((sum, order) => sum + order.costCents, 0);
}

export function averageHours(orders: WorkOrder[]): number {
  return orders.length === 0 ? 0 : orders.reduce((sum, order) => sum + order.hours, 0) / orders.length;
}

export function openOrders(orders: WorkOrder[]): WorkOrder[] {
  return orders.filter((order) => !order.closed);
}

export function nextPage(page: number, maxPage: number): number {
  return Math.min(page + 1, maxPage);
}

export function retryDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 30000);
}
`;

export const BUG_EDITS = [
  { kind: "tenant_isolation", line: 4, before: "  return order.tenantId === tenantId;", after: "  return order.tenantId !== tenantId;", expected: "Reject records owned by a different tenant; same-tenant access must succeed." },
  { kind: "currency_unit", line: 8, before: "  return orders.reduce((sum, order) => sum + order.costCents, 0);", after: "  return orders.reduce((sum, order) => sum + order.costCents / 100, 0);", expected: "Return integer cents; 1234 cents must remain 1234." },
  { kind: "empty_average", line: 12, before: "  return orders.length === 0 ? 0 : orders.reduce((sum, order) => sum + order.hours, 0) / orders.length;", after: "  return orders.reduce((sum, order) => sum + order.hours, 0) / orders.length;", expected: "An empty work-order list must have average zero, never NaN." },
  { kind: "closed_filter", line: 16, before: "  return orders.filter((order) => !order.closed);", after: "  return orders.filter((order) => order.closed);", expected: "Only work orders with closed=false belong in the open queue." },
  { kind: "page_boundary", line: 20, before: "  return Math.min(page + 1, maxPage);", after: "  return Math.max(page + 1, maxPage);", expected: "The next page must never exceed maxPage." },
  { kind: "retry_cap", line: 24, before: "  return Math.min(1000 * 2 ** attempt, 30000);", after: "  return Math.max(1000 * 2 ** attempt, 30000);", expected: "Retry delay must start at 1000 ms and stay at or below 30000 ms." },
] as const;
