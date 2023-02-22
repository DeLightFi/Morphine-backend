import * as schedule from "node-schedule";
import { PoolEventsFetcher, PoolValuesFetcher, PoolInterestRateModelFetcher } from "../lib/pool";
import { DripEventsFetcher } from "../lib/multicall";
import { ActiveDripsFetcher, DripValuesFetcher } from "../lib/drip";
import { DripTransitsFetcher } from "../lib/driptransit";

let padZero = (v: number, n = 2) => `${v}`.padStart(n, "0");
let toTime = (v: number) =>
  `elapsed (hh:mm:ss:ms) ${padZero(Math.floor(v / (60 * 60000)))}:${padZero(Math.floor(v / 60000))}:${padZero(Math.floor(v / 1000))}:${padZero(Math.floor(v % 1000), 3)}`;

class job {
  constructor() {

  }
  public PoolEvents() {
    schedule.scheduleJob('05 * * * *', async function () {
      let start = performance.now();
      console.log("Run PoolEvents")
      const pooleventsfetcher = new PoolEventsFetcher(
        "morphine-indexer-1",
        "goerli-2.starknet.stream.apibara.com:443"
      );
      await pooleventsfetcher.run()
      console.log(`--- end | ${toTime(performance.now() - start)}`)
    });
  }

  public PoolValues() {
    schedule.scheduleJob('23 * * * *', async function () {
      let start = performance.now();
      console.log("Run PoolValues")
      const poolvaluesfetcher = new PoolValuesFetcher();
      await poolvaluesfetcher.PoolIterations();
      console.log(`--- end | ${toTime(performance.now() - start)}`)
    });
  }

  public PoolInterestRateModel() {
    schedule.scheduleJob('20 * * * *', async function () {
      let start = performance.now();
      console.log("Run PoolInterestRateModel")
      const poolinterestratemodelfetcher = new PoolInterestRateModelFetcher();
      await poolinterestratemodelfetcher.PoolIterations();
      console.log(`--- end | ${toTime(performance.now() - start)}`)
    });
  }

  public MulticallEvents() {
    schedule.scheduleJob('30 * * * *', async function () {
      let start = performance.now();
      console.log("Run MulticallEvents")
      const driptransitsfetcher = new DripTransitsFetcher(
        "morphine-indexer-1",
        "goerli-2.starknet.stream.apibara.com:443"
      );
      const driptransits = await driptransitsfetcher.get();
      for (let driptransit of driptransits) {
        const multicalleventsfetcher = new DripEventsFetcher(
          "morphine-indexer-1",
          "goerli-2.starknet.stream.apibara.com:443"
        );
        console.log(`-- fetching for drip ${driptransit.dtaddress}`)
        await multicalleventsfetcher.run(driptransit);
      }
      console.log(`--- end | ${toTime(performance.now() - start)}`)
    });
  }

  public ActiveDrips() {
    schedule.scheduleJob('26 * * * *', async function () {
      let start = performance.now();
      console.log("Run ActiveDripsFetcher")
      const driptransitsfetcher = new DripTransitsFetcher(
        "morphine-indexer-1",
        "goerli-2.starknet.stream.apibara.com:443"
      );
      const driptransits = await driptransitsfetcher.get();
      for (let driptransit of driptransits) {
        console.log(`-- fetching for pool: ${driptransit.pool}`)
        const activedripsfetcher = new ActiveDripsFetcher(
          "morphine-indexer-1",
          "goerli-2.starknet.stream.apibara.com:443"
        );
        await activedripsfetcher.run(driptransit);
      }
      console.log(`--- end | ${toTime(performance.now() - start)}`)
    });
  }

  public DripsValues() {
    schedule.scheduleJob('55 * * * *', async function () {
      let start = performance.now();
      console.log("Run DripsValues")
      const dripsvaluesfetcher = new DripValuesFetcher();
      await dripsvaluesfetcher.DripIterations();
      console.log(`--- end | ${toTime(performance.now() - start)}`)
    });
  }
}

export default new job();