import * as schedule from "node-schedule";
import { PoolJob } from "../lib/pool";


class job {
  constructor() {

  }
  public FetchPool() {
    schedule.scheduleJob('15 * * * *', async function () {
      console.log("Run Pool Fetch")
      const poolfetcher = new PoolJob(
        "morphine-indexer-1",
        "goerli-2.starknet.stream.apibara.com:443"
      );
      await poolfetcher.run()
      console.log("--- end")
    });
  }
}

export default new job();