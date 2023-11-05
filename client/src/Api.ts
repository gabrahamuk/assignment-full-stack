export type SearchRecordsRequest = {
  textSearch?: string;
  limit: number;
  offset: number;
};

export type ProcurementRecord = {
  id: string;
  title: string;
  description: string;
  publishDate: string;
  buyer: {
    id: string;
    name: string;
  };
  value: {
    amount: number;
    currency: string;
  };
  stageInfo: {
    stage: string;
    closeDate?: string;
    awardDate?: string;
  };
};

export type SearchRecordsResponse = {
  records: ProcurementRecord[];
  endOfResults: boolean;
};

export type Buyer = {
  id: string;
  name: string;
};

export type BuyersListResponse = {
  buyers: Buyer[];
};

class Api {
  async searchRecords(
    request: SearchRecordsRequest
  ): Promise<SearchRecordsResponse> {
    const response = await fetch("/api/records", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(request),
    });
    return await response.json();
  }

  async getBuyers(): Promise<BuyersListResponse> {
    const response = await fetch("/api/buyers", {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    });
    return await response.json();
  }
}

export default Api;
