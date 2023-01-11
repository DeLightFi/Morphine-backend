import * as schedule from "node-schedule";
import { PoolJob } from "../lib/pool";

let padZero = (v: number, n = 2) => `${v}`.padStart(n, "0");
let toTime = (v : number) => 
  `elapsed (hh:mm:ss:ms) ${
    padZero(Math.floor(v/(60*60000)))}:${
      padZero(Math.floor(v/60000))}:${
        padZero(Math.floor(v/1000))}:${
          padZero(Math.floor(v%1000), 3)}`;

class job {
  constructor() {

  }
  public FetchPool() {
    schedule.scheduleJob('45 * * * *', async function () {
      let start = performance.now();
      console.log("Run Pool Fetch")
      const poolfetcher = new PoolJob(
        "morphine-indexer-1",
        "goerli-2.starknet.stream.apibara.com:443"
      );
      await poolfetcher.run()
      console.log(`--- end | ${toTime(performance.now() - start)}`)
    });
  }
}

export default new job();