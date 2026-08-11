export type HotDealsBatchSummary = {
  id: number;
  name: string;
  createdAt: string;
  storeCount: number;
};

export type HotDealsDeal = {
  id: number;
  name: string;
  code: string;
};

export type HotDealsBandValue = {
  tier: number | null;
  price: number | null;
};

export type HotDealsStoreRow = {
  id: number;
  storeId: string;
  expirationDate: string | null;
  bandValues: Record<string, HotDealsBandValue>;
};

export type HotDealsBatchDetail = {
  id: number;
  name: string;
  createdAt: string;
  flatDeals: HotDealsDeal[];
  bandDeals: HotDealsDeal[];
  storeRows: HotDealsStoreRow[];
};
