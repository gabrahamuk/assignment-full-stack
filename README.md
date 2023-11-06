# Stotles work sample assignment

## Getting started

This sample codebase consists of a separate client & server code.

It's set up in a simple way to make it as easy as possible to start making changes,
the only requirement is having recent versions of `node` & `npm` installed.

This is not a production ready configuration (nor production ready code),
it's only set up for easy development, including live reload.

To run the client bundler:

```
cd client
npm install
npm run dev
```

The processed code will be available at http://localhost:3001

To start the server:

```
cd server
npm install
npm run dev
```

The server will be available at http://localhost:3000 - the page is automatically configured
to use the assets served by vite on port 3001.

You should see something similar to this page:

![Search page](./screenshot.png)

### Disabling/Enabling TypeScript

If you prefer to completely disable TypeScript for a file, add `// @ts-nocheck` on the first line.
If on the other hand you'd like to enable strict type checking, modify `tsconfig.json` according to your needs.

Note that you can import plain JavaScript files that won't be fully typechecked.

### Browsing the database

You should start by looking at the migration in `./migrations` folder.
If you prefer to browse the DB using SQL, you can use the sqlite command line (just run `sqlite3 ./db.sqlite3`)
or any other SQL client that supports sqlite.

If for any reason the database becomes unusable, you can rebuild it using `./reset_db.sh` script`.

## The task

All the instructions are available [here](https://www.notion.so/stotles/Full-stack-software-engineer-work-sample-assignment-ae7c64e08f2a42a097d16cee4bc661fc).


## Improvements
I did not have enough time to refactor/restructure the code and add unit tests. Below are some improvements...

### Testing
Add unit tests for:
* getStage() in RecordsTable.tsx - to ensure the correct behaviour is occuring for stages e.g. closed if date is in the past
* getRecordValue() in RecordsTable.tsx - to check that the currency is being converted correctly
* checking Buyer column index is correct
* ensuring mapping of buyer names to buyer IDs is correct (so we are looking up records w/ correct buyers in the db)
* ensuring the search filtering isn't broken i.e.
    - it's always returning the limit number of records if there is more records and not truncating results when there are more records.
    - the search filters are updating correctly for both the text-search and buyers-search (i.e. Buyer column filter)
* possibly for testing db queries, utilising mock data from an in-memory db for the unit tests

### Structure
At the moment the code (particularly the backend code) is quite intertwined. We'd ideally have them split (modularised). E.g.:
* a file for API-related functions 
* a file handling database retrieval and serialisation of objects
Additionally it might benefit us to have some shared types in a lib that can be used by the backend and frontend so that we can centralise where to make type changes. This avoids us missing changes, especially in cases where we make changes to our Data Objects e.g. if we add more column in our db to track additional data.

### Performance
Caching:
In the real world where we have tens of thousands of buyers and large volumes of records, we would benefit from caching. 
We can cache the list of buyers and have an event that triggers a cache to update when a new buyer is added. For this we will need to start tracking when a buyer was added in the buyers table. We may also notice that a subset of our records are accessed more frequently than others so we may want to cache these.

Record sorting/filtering:
Users may want to see the newest records first so we can add a datetime column to track when records were added to the database and provide sorting for Newest/Oldest first. 
Additional enhancements can include providing the option to sort/filter by multiple columns, e.g. by Value or Stage. It may also be beneficial for users to see and filter the buyer's Country.
