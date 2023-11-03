export type RecordSearchRequest = {
  textSearch?: string;
  offset: number;
  limit: number;
};

export type BuyerDto = {
  id: string;
  name: string;
};

export type ValueDto = {
  amount: number;
  currency: string;
};

export type ProcurementRecordDto = {
  id: string;
  title: string;
  description: string;
  buyer: BuyerDto;
  publishDate: string;
  value: ValueDto;
};

export type RecordSearchResponse = {
  records: ProcurementRecordDto[];
  endOfResults: boolean; // this is true when there are no more results to search
};
