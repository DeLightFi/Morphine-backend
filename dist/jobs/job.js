"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const schedule = __importStar(require("node-schedule"));
const PoolEventsFetcher_1 = __importDefault(require("../fetchers/PoolEventsFetcher"));
const PoolValuesFetcher_1 = __importDefault(require("../fetchers/PoolValuesFetcher"));
const PoolInterestRateModelFetcher_1 = __importDefault(require("../fetchers/PoolInterestRateModelFetcher"));
const DripTransitsFetcher_1 = __importDefault(require("../fetchers/DripTransitsFetcher"));
const DripEventsFetcher_1 = __importDefault(require("../fetchers/DripEventsFetcher"));
const DripValuesFetcher_1 = __importDefault(require("../fetchers/DripValuesFetcher"));
const ActiveDripsFetcher_1 = __importDefault(require("../fetchers/ActiveDripsFetcher"));
const config_1 = __importDefault(require("../config"));
const padZero = (v, n = 2) => `${v}`.padStart(n, "0");
const toTime = (v) => `elapsed (hh:mm:ss:ms) ${padZero(Math.floor(v / (60 * 60000)))}:${padZero(Math.floor(v / 60000))}:${padZero(Math.floor(v / 1000))}:${padZero(Math.floor(v % 1000), 3)}`;
class Job {
    constructor() {
        this.runPoolEvents = async () => {
            const start = performance.now();
            console.log("\nRun PoolEvents");
            const poolEventsFetcher = new PoolEventsFetcher_1.default(config_1.default.apibaraUrl);
            await poolEventsFetcher.run();
            console.log(`--- end | ${toTime(performance.now() - start)}`);
        };
        this.runPoolValues = async () => {
            const start = performance.now();
            console.log("\nRun PoolValues");
            const poolvaluesfetcher = new PoolValuesFetcher_1.default(config_1.default.network);
            await poolvaluesfetcher.PoolIterations();
            console.log(`--- end | ${toTime(performance.now() - start)}`);
        };
        this.runPoolInterestRateModel = async () => {
            const start = performance.now();
            console.log("\nRun PoolInterestRateModel");
            const poolinterestratemodelfetcher = new PoolInterestRateModelFetcher_1.default(config_1.default.network);
            await poolinterestratemodelfetcher.PoolIterations();
            console.log(`--- end | ${toTime(performance.now() - start)}`);
        };
        this.runMulticallEvents = async () => {
            const start = performance.now();
            console.log("\nRun MulticallEvents");
            const dripTransitsFetcher = new DripTransitsFetcher_1.default(config_1.default.network);
            const dripTransits = await dripTransitsFetcher.get();
            const dripEventsFetcher = new DripEventsFetcher_1.default(config_1.default.apibaraUrl, dripTransits);
            await dripEventsFetcher.run();
            console.log(`--- end | ${toTime(performance.now() - start)}`);
        };
        this.runActiveDrips = async () => {
            const start = performance.now();
            console.log("\nRun ActiveDripsFetcher");
            const dripTransitsFetcher = new DripTransitsFetcher_1.default(config_1.default.network);
            const dripTransits = await dripTransitsFetcher.get();
            const activeDripsFetcher = new ActiveDripsFetcher_1.default(config_1.default.apibaraUrl, dripTransits);
            await activeDripsFetcher.run();
            console.log(`--- end | ${toTime(performance.now() - start)}`);
        };
        this.runDripsValues = async () => {
            const start = performance.now();
            console.log("\nRun DripsValues");
            const dripsValuesFetcher = new DripValuesFetcher_1.default(config_1.default.network);
            await dripsValuesFetcher.DripIterations();
            console.log(`--- end | ${toTime(performance.now() - start)}`);
        };
    }
    async scheduleJobs() {
        schedule.scheduleJob(config_1.default.jobs.interval.poolEvents, this.runPoolEvents);
        schedule.scheduleJob(config_1.default.jobs.interval.poolValues, this.runPoolValues);
        schedule.scheduleJob(config_1.default.jobs.interval.poolInterestRateModel, this.runPoolInterestRateModel);
        schedule.scheduleJob(config_1.default.jobs.interval.multicallEvents, this.runMulticallEvents);
        schedule.scheduleJob(config_1.default.jobs.interval.activeDrips, this.runActiveDrips);
        schedule.scheduleJob(config_1.default.jobs.interval.dripsValues, this.runDripsValues);
        this.runAllJobs();
    }
    async runAllJobs() {
        await this.runPoolEvents();
        await this.runPoolValues();
        await this.runPoolInterestRateModel();
        await this.runMulticallEvents();
        await this.runActiveDrips();
        await this.runDripsValues();
    }
}
exports.default = new Job();
//# sourceMappingURL=job.js.map