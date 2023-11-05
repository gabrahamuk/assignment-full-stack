import { Button } from "antd";
import React from "react";
import Api, { Buyer, ProcurementRecord } from "./Api";
import RecordSearchFilters, { SearchFilters } from "./RecordSearchFilters";
import RecordsTable from "./RecordsTable";

/**
 * This component implements very basic pagination.
 * We fetch `PAGE_SIZE` records using the search endpoint which also returns
 * a flag indicating whether there are more results available or we reached the end.
 *
 * If there are more we show a "Load more" button which fetches the next page and
 * appends the new results to the old ones.
 *
 * Any change to filters resets the pagination state.
 *
 */

const PAGE_SIZE = 10;

function RecordSearchPage() {
  const [page, setPage] = React.useState<number>(1);
  const [searchFilters, setSearchFilters] = React.useState<SearchFilters>({
    textSearchQuery: "",
    buyersQuery: [],
  });

  const [buyersNameToIds, setBuyers] = React.useState<
    Map<string, string[]> | undefined
  >();

  const [records, setRecords] = React.useState<
    ProcurementRecord[] | undefined
  >();

  const [reachedEndOfSearch, setReachedEndOfSearch] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      const api = new Api();

      const buyersResponse = await api.getBuyers();
      // map names to IDs in the event that we have the same buyer name mapping to different IDs e.g. same org name but different countries
      // TODO: perhaps append countries to duplicated buyer names on backend
      const buyersNameToIds: Map<string, string[]> = new Map();
      buyersResponse.buyers.map((b) =>
        buyersNameToIds.set(
          b.name,
          buyersNameToIds.has(b.name)
            ? [b.id, ...buyersNameToIds.get(b.name)]
            : [b.id]
        )
      );

      setBuyers(buyersNameToIds);

      const recordsResponse = await api.searchRecords({
        textSearch: searchFilters.textSearchQuery,
        buyersSearch: searchFilters.buyersQuery,
        limit: PAGE_SIZE,
        offset: PAGE_SIZE * (page - 1),
      });

      if (page === 1) {
        setRecords(recordsResponse.records);
      } else {
        // append new results to the existing records
        setRecords((oldRecords) => [...oldRecords, ...recordsResponse.records]);
      }
      setReachedEndOfSearch(recordsResponse.endOfResults);
    })();
  }, [searchFilters, page]);

  const handleChangeFilters = React.useCallback((newFilters: SearchFilters) => {
    setSearchFilters(newFilters);
    setPage(1); // reset pagination state
  }, []);

  const handleLoadMore = React.useCallback(() => {
    setPage((page) => page + 1);
  }, []);

  return (
    <>
      <RecordSearchFilters
        filters={searchFilters}
        onChange={handleChangeFilters}
      />
      {records && (
        <>
          <RecordsTable
            records={records}
            buyersNameToIds={buyersNameToIds}
            filters={searchFilters}
            onChange={handleChangeFilters}
          />
          {!reachedEndOfSearch && (
            <Button onClick={handleLoadMore}>Load more</Button>
          )}
        </>
      )}
    </>
  );
}

export default RecordSearchPage;
