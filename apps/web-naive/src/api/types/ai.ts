export interface AiCost {
  by_model: Record<string, number>;
  by_role: Record<string, number>;
  by_status: Record<string, number>;
  total_cost: number;
}
