import { Table } from "antd";
import { ColumnType } from "antd/lib/table";
import React from "react";
import { ProcurementRecord } from "./Api";
import ProcurementRecordPreviewModal from "./ProcurementRecordPreview";
import { SearchFilters } from "./RecordSearchFilters";

type Props = {
  records: ProcurementRecord[];
  buyersNameToIds: Map<string, string[]>;
  filters: SearchFilters;
  onChange: (newFilters: SearchFilters) => void;
};

function RecordsTable(props: Props) {
  const { records, buyersNameToIds, filters, onChange } = props;
  const [previewedRecord, setPreviewedRecord] = React.useState<
    ProcurementRecord | undefined
  >();

  const columns = React.useMemo<ColumnType<ProcurementRecord>[]>(() => {
    return [
      {
        title: "Published",
        render: (record: ProcurementRecord) =>
          new Date(record.publishDate).toLocaleDateString(),
      },
      {
        title: "Title",
        render: (record: ProcurementRecord) => {
          const handleClick = (e: React.MouseEvent) => {
            e.preventDefault();
            setPreviewedRecord(record);
          };
          return (
            <a href="#" onClick={handleClick}>
              {record.title}
            </a>
          );
        },
      },
      {
        title: "Buyer name",
        render: (record: ProcurementRecord) => record.buyer.name,
        filters: Array.from(buyersNameToIds.keys())
          .sort()
          .map((k: string) => ({
            text: k,
            value: k,
          })),
        filterSearch: true,
        onFilter: (value: string, record: ProcurementRecord) =>
          value === record.buyer.name,
      },
      {
        title: "Value",
        render: (record: ProcurementRecord) => getRecordValue(record),
      },
      {
        title: "Stage",
        render: (record: ProcurementRecord) => getStage(record),
      },
    ];
  }, []);

  const handleQueryChange = React.useCallback(
    (pagination, buyerFilters: Record<string, string[]>, sorter, extra) => {
      // TODO: add a map to map column names to an index. For now we use [2]
      onChange({
        ...filters,
        buyersQuery:
          buyerFilters[2]?.length > 0
            ? buyerFilters[2].map((b) => buyersNameToIds.get(b)).flat()
            : [],
      });
    },
    [onChange, filters]
  );

  return (
    <>
      <Table
        columns={columns}
        dataSource={records}
        pagination={false}
        onChange={handleQueryChange}
      />
      <ProcurementRecordPreviewModal
        record={previewedRecord}
        onClose={() => setPreviewedRecord(undefined)}
      />
    </>
  );
}

function getRecordValue(record: ProcurementRecord): string {
  let res = "";
  if (record.value.amount && record.value.currency) {
    const perUnitTime: boolean = record.value.currency.includes("/");
    let [currency, timeUnit]: string[] = perUnitTime
      ? record.value.currency.split("/")
      : [record.value.currency, ""];

    const formatter = new Intl.NumberFormat("default", {
      style: "currency",
      currency: currency,
    });

    res =
      `${formatter.format(record.value.amount)}` +
      `${perUnitTime ? " / " : ""}` +
      timeUnit;
  }
  return res;
}

function getStage(record: ProcurementRecord): string {
  const isAfterToday: (stringDate: string) => boolean = (stringDate) => {
    if (stringDate) {
      // compare to current date
      return new Date(stringDate) > new Date();
    }
    return false;
  };

  let res: string = "";
  switch (record.stageInfo.stage) {
    /*TODO:
     * convert stage into an enum type to detect data errors here
     * specify behaviour for TenderIntent
     */
    case "TENDER":
      if (isAfterToday(record.stageInfo.closeDate)) {
        res = `Open until ${record.stageInfo.closeDate}`;
      } else {
        res = "Closed";
      }
      break;
    case "CONTRACT":
      if (record.stageInfo.awardDate) {
        res = `Awarded on ${record.stageInfo.awardDate}`;
      }
      break;
    default:
      // TODO: handle error here for unknown stage
      break;
  }
  return res;
}

export default RecordsTable;
