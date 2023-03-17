"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const starknet_1 = require("starknet");
const poolvalue_model_1 = __importDefault(require("../schema/poolvalue.model"));
const pool_json_1 = __importDefault(require("../abi/pool.json"));
const Fetcher_1 = require("./Fetcher");
const config_1 = __importDefault(require("../config"));
class PoolValuesFetcher {
    constructor(network) {
        //@ts-ignore
        this.provider = new starknet_1.Provider({ sequencer: { network: network } });
    }
    async CallContract(pooladdress) {
        try {
            const poolContract = new starknet_1.Contract(pool_json_1.default, pooladdress, this.provider);
            // should use a multicall
            const borrowrate = await poolContract.call("borrowRate");
            const totalsupply = await poolContract.call("totalSupply");
            const totalassets = await poolContract.call("totalAssets");
            const totalborrowed = await poolContract.call("totalBorrowed");
            //@ts-ignore
            const newpoolvalue = new poolvalue_model_1.default({
                pool_address: pooladdress.toLowerCase(),
                borrowrate: (0, Fetcher_1.uint256FromBytes)(borrowrate[0].low, borrowrate[0].high).toString(),
                totalsupply: (0, Fetcher_1.uint256FromBytes)(totalsupply[0].low, totalsupply[0].high).toString(),
                totalassets: (0, Fetcher_1.uint256FromBytes)(totalassets[0].low, totalassets[0].high).toString(),
                totalborrowed: (0, Fetcher_1.uint256FromBytes)(totalborrowed[0].low, totalborrowed[0].high).toString(),
                date: Date.now()
            });
            await newpoolvalue.save();
        }
        catch (err) {
            console.log(err);
        }
    }
    async PoolIterations() {
        const poolAddresses = config_1.default.pools.map(i => i.address);
        for (let poolAddress of poolAddresses) {
            //@ts-ignore
            const poolValue = await poolvalue_model_1.default.findOne({ pool_address: poolAddress }, {}, { sort: { 'date': -1 } });
            //check minimum delay between historization
            if (poolValue && (Date.now() - poolValue.date.getTime() < config_1.default.fetchers.poolValues.minInterval)) {
                // console.log("waiting minInterval")
                continue;
            }
            await this.CallContract(poolAddress.toLowerCase());
        }
    }
}
exports.default = PoolValuesFetcher;
//# sourceMappingURL=PoolValuesFetcher.js.map