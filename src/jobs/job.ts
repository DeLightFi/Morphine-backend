import * as schedule from "node-schedule";
import PoolEventsFetcher from "../fetchers/PoolEventsFetcher";
import PoolValuesFetcher from "../fetchers/PoolValuesFetcher";
import PoolInterestRateModelFetcher from "../fetchers/PoolInterestRateModelFetcher";

import DripTransitsFetcher from "../fetchers/DripTransitsFetcher";
import DripEventsFetcher from "../fetchers/DripEventsFetcher";

import DripValuesFetcher from "../fetchers/DripValuesFetcher";
import ActiveDripsFetcher from "../fetchers/ActiveDripsFetcher";

import config from "../config";

const padZero = (v: number, n = 2) => `${v}`.padStart(n, "0");
const toTime = (v: number) =>
  `elapsed (hh:mm:ss:ms) ${padZero(Math.floor(v / (60 * 60000)))}:${padZero(Math.floor(v / 60000))}:${padZero(Math.floor(v / 1000))}:${padZero(Math.floor(v % 1000), 3)}`;


class Job {
  constructor() { }

  async scheduleJobs() {
    schedule.scheduleJob(config.jobs.interval.poolEvents, this.runPoolEvents);
    schedule.scheduleJob(config.jobs.interval.poolValues, this.runPoolValues);
    schedule.scheduleJob(config.jobs.interval.poolInterestRateModel, this.runPoolInterestRateModel);

    schedule.scheduleJob(config.jobs.interval.multicallEvents, this.runMulticallEvents);

    schedule.scheduleJob(config.jobs.interval.activeDrips, this.runActiveDrips);
    schedule.scheduleJob(config.jobs.interval.dripsValues, this.runDripsValues);


    // run all jobs on start
    this.runAllJobs()

  }

  async runAllJobs() {

    await this.runPoolEvents()
    await this.runPoolValues()
    await this.runPoolInterestRateModel()

    await this.runMulticallEvents()

    await this.runActiveDrips();
    await this.runDripsValues();

  }

  runPoolEvents = async () => {
    const start = performance.now();
    console.log("\nRun PoolEvents")

    const poolEventsFetcher = new PoolEventsFetcher(config.apibaraUrl);
    await poolEventsFetcher.run()

    console.log(`--- end | ${toTime(performance.now() - start)}`)
  }

  runPoolValues = async () => {
    const start = performance.now();
    console.log("\nRun PoolValues")

    const poolvaluesfetcher = new PoolValuesFetcher(config.network);
    await poolvaluesfetcher.PoolIterations();

    console.log(`--- end | ${toTime(performance.now() - start)}`)
  }

  runPoolInterestRateModel = async () => {
    const start = performance.now();
    console.log("\nRun PoolInterestRateModel")

    const poolinterestratemodelfetcher = new PoolInterestRateModelFetcher(config.network);
    await poolinterestratemodelfetcher.PoolIterations();

    console.log(`--- end | ${toTime(performance.now() - start)}`)
  }

  runMulticallEvents = async () => {
    const start = performance.now();
    console.log("\nRun MulticallEvents")

    const dripTransitsFetcher = new DripTransitsFetcher(config.network);
    const dripTransits = await dripTransitsFetcher.get();

    const dripEventsFetcher = new DripEventsFetcher(
      config.apibaraUrl,
      dripTransits
    );
    await dripEventsFetcher.run();

    console.log(`--- end | ${toTime(performance.now() - start)}`)
  }

  runActiveDrips = async () => {
    const start = performance.now();
    console.log("\nRun ActiveDripsFetcher")

    const dripTransitsFetcher = new DripTransitsFetcher(config.network);
    const dripTransits = await dripTransitsFetcher.get();

    const activeDripsFetcher = new ActiveDripsFetcher(
      config.apibaraUrl,
      dripTransits
    );
    await activeDripsFetcher.run();

    console.log(`--- end | ${toTime(performance.now() - start)}`)
  }

  runDripsValues = async () => {
    const start = performance.now();
    console.log("\nRun DripsValues")

    const dripsValuesFetcher = new DripValuesFetcher(config.network);
    await dripsValuesFetcher.DripIterations();

    console.log(`--- end | ${toTime(performance.now() - start)}`)
  }

}

export default new Job();