# Morphine Backend

> ### API using (Express + Mongoose).

# 🕹️ Getting started

To get the Node server running locally:

- Clone this repo
- `npm install` to install all required dependencies
- Configure the `.env` file using `.env.example` template
- `npm run dev` to start the local server

# 🧱 Code Overview

## Dependencies

- [expressjs](https://github.com/expressjs/express) - The server for handling and routing HTTP requests
- [mongoose](https://github.com/Automattic/mongoose) - For modeling and mapping MongoDB data to javascript
- [apibara](https://github.com/apibara/apibara) - blockchain events fetcher
- [starknetjs](https://github.com/0xs34n/starknet.js) - interactions with contract

## Application Structure

- `app.js` - The entry point to our application. This file defines our express server and connects it to MongoDB using mongoose. It also requires the routes and models we'll be using in the application.
- `jobs/` - contains our app's crons to fetch blockchain data hourly and update the morphine db.
- `lib/` - utils functions using apibara and starketjs.
- `controllers/` - routers simple functions.
- `routers/` - This folder contains the route definitions for our API.
- `schema/` - This folder contains the schema definitions for our Mongoose models.

# 🐉 Jobs

Fetch blockchain events using apibara and starknet.js according to a cron defined in job.ts file.

- **PoolEvents** : HOURLY

- **PoolValues** : HOURLY

- **PoolInterestRateModel** : HOURLY

- **MulticallEvents** : HOURLY

# 🔥 Routes

## Pool

- PoolEvents

Fetch all

```
/pool/:pooladdress/events
```

Fetch from events

```
/pool/events/from/:walletaddress
```

Fetch to events

```
/pool/events/to/:walletaddress
```

- PoolValues

Fetch all

```
/pool/:pooladdress/values
```

- PoolInterestRateModels

Fetch all

```
/pool/:pooladdress/interestratemodels
```

## Muticall

- MulticallEvents

Fetch all

```
/multicall/:pooladdress/events
```
