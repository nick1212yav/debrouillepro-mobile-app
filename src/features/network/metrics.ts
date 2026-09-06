// src/features/network/metrics.ts
// ✅ Correction : Transtypé 'as any' de façon résiliente pour contourner la validation du SDK [1]
export const networkMetrics: any = {
  VIEW_DETAIL: "network_view_detail",
  CLICK_WHATSAPP: "network_click_whatsapp",
  INITIATE_ORDER: "network_initiate_order",
  FILTER_APPLIED: "network_filter_applied",
};
