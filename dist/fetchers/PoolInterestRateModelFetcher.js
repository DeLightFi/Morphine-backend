"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const starknet_1 = require("starknet");
const poolinterestratemodel_model_1 = __importDefault(require("../schema/poolinterestratemodel.model"));
const pool_json_1 = __importDefault(require("../abi/pool.json"));
const interest_rate_model_abi_json_1 = __importDefault(require("../abi/interest_rate_model_abi.json"));
const Fetcher_1 = require("./Fetcher");
const config_1 = __importDefault(require("../config"));
class PoolInterestRateModelFetcher {
    constructor(network) {
        //@ts-ignore
        this.provider = new starknet_1.Provider({ sequencer: { network: network } });
    }
    async CallContract(pooladdress) {
        try {
            const poolContract = new starknet_1.Contract(pool_json_1.default, pooladdress, this.provider);
            const interestRateModelAddress = (0, starknet_1.addAddressPadding)((await poolContract.call("interestRateModel")).interestRateModel.toString());
            console.log("interestRateModelAddress :", interestRateModelAddress);
            const interestRateModelContract = new starknet_1.Contract(interest_rate_model_abi_json_1.default, interestRateModelAddress, this.provider);
            const modelParameters = await interestRateModelContract.call("modelParameters");
            //console.log(modelParameters);
            //@ts-ignore
            const newinterestratemodelvalue = new poolinterestratemodel_model_1.default({
                pool_address: pooladdress.toLowerCase(),
                interestratemodel_address: interestRateModelAddress,
                optimal: (0, Fetcher_1.uint256FromBytes)(modelParameters.optimalLiquidityUtilization.low, modelParameters.optimalLiquidityUtilization.high).toString(),
                baserate: (0, Fetcher_1.uint256FromBytes)(modelParameters.baseRate.low, modelParameters.baseRate.high).toString(),
                slope1: (0, Fetcher_1.uint256FromBytes)(modelParameters.slope1.low, modelParameters.slope1.high).toString(),
                slope2: (0, Fetcher_1.uint256FromBytes)(modelParameters.slope2.low, modelParameters.slope2.high).toString(),
                date: Date.now()
            });
            // console.log(newinterestratemodelvalue);
            await newinterestratemodelvalue.save();
        }
        catch (err) {
            console.log(err);
        }
    }
    async PoolIterations() {
        const poolAddresses = config_1.default.pools.map(i => i.address);
        for (let poolAddress of poolAddresses) {
            //@ts-ignore
            const poolInterestRateModel = await poolinterestratemodel_model_1.default.findOne({ pool_address: poolAddress }, {}, { sort: { 'date': -1 } });
            //check minimum delay between historization
            if (poolInterestRateModel && (Date.now() - poolInterestRateModel.date.getTime() < config_1.default.fetchers.poolInterestRateModel.minInterval)) {
                //console.log("waiting minInterval")
                continue;
            }
            await this.CallContract(poolAddress.toLowerCase());
        }
    }
}
exports.default = PoolInterestRateModelFetcher;
//# sourceMappingURL=PoolInterestRateModelFetcher.js.map