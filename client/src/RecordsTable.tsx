import { Table } from "antd";
import { ColumnType } from "antd/lib/table";
import React from "react";
import { ProcurementRecord } from "./Api";
import ProcurementRecordPreviewModal from "./ProcurementRecordPreview";

type Props = {
  records: ProcurementRecord[];
};

function RecordsTable(props: Props) {
  const { records } = props;
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
      },
      {
        title: "Value",
        render: (record: ProcurementRecord) => getRecordValue(record),
      },
    ];
  }, []);
  return (
    <>
      <Table columns={columns} dataSource={records} pagination={false} />
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

export default RecordsTable;
