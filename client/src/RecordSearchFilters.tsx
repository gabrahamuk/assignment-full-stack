import { Input } from "antd";
import React from "react";

export type SearchFilters = {
  textSearchQuery: string;
  buyersQuery: string[];
};

type Props = {
  filters: SearchFilters;
  onChange: (newFilters: SearchFilters) => void;
};

function RecordSearchFilters(props: Props) {
  const { filters, onChange } = props;

  const handleQueryChange = React.useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      onChange({
        ...filters,
        textSearchQuery: e.currentTarget.value,
      });
    },
    [onChange, filters]
  );

  return (
    <div>
      <Input
        placeholder="Search text..."
        value={filters.textSearchQuery}
        onChange={handleQueryChange}
      />
    </div>
  );
}

export default RecordSearchFilters;
