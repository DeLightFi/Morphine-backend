import * as schedule from "node-schedule";
import { PoolEventsFetcher, PoolValuesFetcher, PoolInterestRateModelFetcher } from "../lib/pool";
import { DripEventsFetcher } from "../lib/multicall";
import { ActiveDripsFetcher } from "../lib/drip";

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
    schedule.scheduleJob('15 * * * *', async function () {
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
      const multicalleventsfetcher = new DripEventsFetcher(
        "morphine-indexer-1",
        "goerli-2.starknet.stream.apibara.com:443"
      );
      const current_driptransits = await multicalleventsfetcher.getCurrentDripTransits();
      for (let current_driptransit of current_driptransits) {
        console.log(`-- fetching for drip ${current_driptransit.dtaddress}`)
        await multicalleventsfetcher.run(current_driptransit);
      }
      console.log(`--- end | ${toTime(performance.now() - start)}`)
    });
  }

  public ActiveDrips() {
    schedule.scheduleJob('40 * * * *', async function () {
      let start = performance.now();
      console.log("Run ActiveDripsFetcher")
      const activedripsfetcher = new ActiveDripsFetcher(
        "morphine-indexer-1",
        "goerli-2.starknet.stream.apibara.com:443"
      );
      const active_drips = await activedripsfetcher.getActiveDripTransits();
      for (let active_drip of active_drips) {
        console.log(`-- fetching for drip ${active_drip.dtaddress}`)
        await activedripsfetcher.run(active_drip);
      }
      console.log(`--- end | ${toTime(performance.now() - start)}`)
    });
  }
}

export default new job();