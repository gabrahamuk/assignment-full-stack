import express, { request } from "express";

import { Sequelize } from "sequelize-typescript";
import {
  BuyersListResponse,
  ProcurementRecordDto,
  RecordSearchRequest,
  RecordSearchResponse,
} from "./api_types";
import { Buyer } from "./db/Buyer";
import { ProcurementRecord } from "./db/ProcurementRecord";

/**
 * This file has little structure and doesn't represent production quality code.
 * Feel free to refactor it or add comments on what could be improved.
 *
 * We specifically avoided any use of sequelize ORM features for simplicity and used plain SQL queries.
 * Sequelize's data mapping is used to get nice JavaScript objects from the database rows.
 *
 * You can switch to using the ORM features or continue using SQL.
 */

/**
 * STRUCTURE IMPROVEMENT:
 * split off functions querying the backend and handling the response
 * (including their respective types) into their own separate file.
 * We can leave the app configuration, setup and api endpoints in this file.
 */

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env["SQLITE_DB"] || "./db.sqlite3",
});

sequelize.addModels([Buyer, ProcurementRecord]);

const app = express();

app.set("port", process.env.PORT || 3000);
app.set("views", "./views");
app.set("view engine", "ejs");

app.locals["assets_url"] = process.env.VITE_URL || "http://localhost:3001";

app.get("/", (_req, res) => {
  res.render("index.html.ejs");
});

app.use(express.json());

type RecordSearchFilters = {
  textSearch?: string;
  buyersSearch?: string[];
};

type Replacements = {
  offset: number;
  limit: number;
  textSearch?: string;
  buyersSearch?: string[];
};

/**
 * Queries the database for procurement records according to the search filters.
 */
async function searchRecords(
  { textSearch, buyersSearch }: RecordSearchFilters,
  offset: number,
  limit: number
): Promise<ProcurementRecord[]> {
  const getQuery: (
    textSearch: string,
    buyersSearch: string[],
    offset: number,
    limit: number
  ) => [string, Replacements] = (textSearch, buyersSearch, offset, limit) => {
    let replacements: Replacements = { offset: offset, limit: limit };
    let query: string = "SELECT * FROM procurement_records ";
    const hasBuyers: boolean = buyersSearch?.length > 0;

    if (textSearch || hasBuyers) {
      query += "WHERE ";
      if (textSearch) {
        query += "(title LIKE :textSearch OR description LIKE :textSearch) ";
        replacements = { ...replacements, textSearch: `%${textSearch}%` };
        if (hasBuyers) {
          query += "AND ";
        }
      }

      if (hasBuyers) {
        query += "buyer_id IN (:buyersSearch) ";
        replacements = { ...replacements, buyersSearch: buyersSearch };
      }
    }

    query += "LIMIT :limit OFFSET :offset";
    return [query, replacements];
  };

  const [query, replacements] = getQuery(
    textSearch,
    buyersSearch,
    offset,
    limit
  );

  return await sequelize.query(query, {
    model: ProcurementRecord, // by setting this sequelize will return a list of ProcurementRecord objects
    replacements: replacements,
  });
}

/**
 * Converts a DB-style ProcurementRecord object to an API type.
 * Assumes that all related objects (buyers) are prefetched upfront and passed in the `buyersById` map
 */
function serializeProcurementRecord(
  record: ProcurementRecord,
  buyersById: Map<string, Buyer>
): ProcurementRecordDto {
  const buyer = buyersById.get(record.buyer_id);
  if (!buyer) {
    throw new Error(
      `Buyer ${record.buyer_id} was not pre-fetched when loading record ${record.id}.`
    );
  }

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    publishDate: record.publish_date,
    buyer: {
      id: buyer.id,
      name: buyer.name,
    },
    value: {
      amount: record.value,
      currency: record.currency,
    },
    stageInfo: {
      stage: record.stage,
      closeDate: record.close_date,
      awardDate: record.award_date,
    },
  };
}

function unique<T>(items: Iterable<T>): T[] {
  return Array.from(new Set(items));
}

/**
 * Converts an array of DB-style procurement record object into API types.
 * Prefetches all the required relations.
 */
async function serializeProcurementRecords(
  records: ProcurementRecord[]
): Promise<ProcurementRecordDto[]> {
  // Get unique buyer ids for the selected records
  const buyerIds = unique(records.map((pr) => pr.buyer_id));

  // Fetch the buyer data in one query
  const buyers = await sequelize.query(
    "SELECT * FROM buyers WHERE id IN (:buyerIds)",
    {
      model: Buyer,
      replacements: {
        buyerIds,
      },
    }
  );

  const buyersById = new Map(buyers.map((b) => [b.id, b]));
  return records.map((r) => serializeProcurementRecord(r, buyersById));
}

async function getBuyers() {
  return await sequelize.query("SELECT * FROM buyers;", {
    model: Buyer,
  });
}

/**
 * This endpoint implements basic way to paginate through the search results.
 * It returns a `endOfResults` flag which is true when there are no more records to fetch.
 */
app.post("/api/records", async (req, res) => {
  const requestPayload = req.body as RecordSearchRequest;

  const { limit, offset } = requestPayload;

  if (limit === 0 || limit > 100) {
    res.status(400).json({ error: "Limit must be between 1 and 100." });
    return;
  }

  // We fetch one more record than requested.
  // If number of returned records is larger than
  // the requested limit it means there is more data than requested
  // and the client can fetch the next page.
  const records = await searchRecords(
    {
      textSearch: requestPayload.textSearch,
      buyersSearch: requestPayload.buyersSearch,
    },
    offset,
    limit + 1
  );

  const response: RecordSearchResponse = {
    records: await serializeProcurementRecords(
      records.slice(0, limit) // only return the number of records requested
    ),
    endOfResults: records.length <= limit, // in this case we've reached the end of results
  };

  res.json(response);
});

app.get("/api/buyers", async (_, res) => {
  const response: BuyersListResponse = {
    buyers: await getBuyers(),
  };
  res.json(response);
});

app.listen(app.get("port"), () => {
  console.log("  App is running at http://localhost:%d", app.get("port"));
  console.log("  Press CTRL-C to stop\n");
});
