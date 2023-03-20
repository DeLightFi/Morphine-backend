"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const starknet_1 = require("starknet");
const poolvalue_model_1 = __importDefault(require("../schema/poolvalue.model"));
const pool_json_1 = __importDefault(require("../abi/pool.json"));
const multicall_json_1 = __importDefault(require("../abi/multicall.json"));
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
            const multicallContract = new starknet_1.Contract(multicall_json_1.default, config_1.default.multicall.address, this.provider);
            //  // should use a multicall
            //  const borrowrate = await poolContract.call("borrowRate");
            //  const totalsupply = await poolContract.call("totalSupply");
            //  const totalassets = await poolContract.call("totalAssets");
            //  const totalborrowed = await poolContract.call("totalBorrowed");
            const callArray = [
                {
                    to: pooladdress,
                    selector: starknet_1.hash.getSelectorFromName("borrowRate"),
                    data_offset: 0,
                    data_len: 0,
                },
                {
                    to: pooladdress,
                    selector: starknet_1.hash.getSelectorFromName("totalSupply"),
                    data_offset: 0,
                    data_len: 0,
                },
                {
                    to: pooladdress,
                    selector: starknet_1.hash.getSelectorFromName("totalAssets"),
                    data_offset: 0,
                    data_len: 0,
                },
                {
                    to: pooladdress,
                    selector: starknet_1.hash.getSelectorFromName("totalBorrowed"),
                    data_offset: 0,
                    data_len: 0,
                },
            ];
            const results = await multicallContract.call("aggregate", [callArray, [0, 0, 0, 0]]);
            //console.log(results.retdata)
            const borrowrate = (0, Fetcher_1.uint256FromBytes)(results.retdata[1], results.retdata[2]).toString();
            const totalsupply = (0, Fetcher_1.uint256FromBytes)(results.retdata[4], results.retdata[5]).toString();
            const totalassets = (0, Fetcher_1.uint256FromBytes)(results.retdata[7], results.retdata[8]).toString();
            const totalborrowed = (0, Fetcher_1.uint256FromBytes)(results.retdata[10], results.retdata[11]).toString();
            //@ts-ignore
            const newpoolvalue = new poolvalue_model_1.default({
                pool_address: pooladdress.toLowerCase(),
                borrowrate: borrowrate,
                totalsupply: totalsupply,
                totalassets: totalassets,
                totalborrowed: totalborrowed,
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