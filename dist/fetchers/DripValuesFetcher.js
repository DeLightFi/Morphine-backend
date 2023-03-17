"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const starknet_1 = require("starknet");
const dripvalue_model_1 = __importDefault(require("../schema/dripvalue.model"));
const activedrip_model_1 = __importDefault(require("../schema/activedrip.model"));
const dataprovider_json_1 = __importDefault(require("../abi/dataprovider.json"));
const Fetcher_1 = require("./Fetcher");
const config_1 = __importDefault(require("../config"));
class DripValuesFetcher {
    constructor(network) {
        //@ts-ignore
        this.provider = new starknet_1.Provider({ sequencer: { network: network } });
    }
    async CallContract(activedrip) {
        try {
            const poolContract = new starknet_1.Contract(dataprovider_json_1.default, config_1.default.dataProvider.address, this.provider);
            const info = await poolContract.getUserDripInfoFromPool(config_1.default.registry.address, activedrip.owner, activedrip.pool);
            //@ts-ignore
            const newDripValue = new dripvalue_model_1.default({
                owner: activedrip.owner.toLowerCase(),
                pool: activedrip.pool.toLowerCase(),
                user_balance: (0, Fetcher_1.uint256FromBytes)(info.DripFullInfo.user_balance.low, info.DripFullInfo.user_balance.high).toString(),
                total_balance: (0, Fetcher_1.uint256FromBytes)(info.DripFullInfo.total_balance.low, info.DripFullInfo.total_balance.high).toString(),
                total_weighted_balance: (0, Fetcher_1.uint256FromBytes)(info.DripFullInfo.total_weighted_balance.low, info.DripFullInfo.total_weighted_balance.high).toString(),
                debt: (0, Fetcher_1.uint256FromBytes)(info.DripFullInfo.debt.low, info.DripFullInfo.debt.high).toString(),
                health_factor: (0, Fetcher_1.uint256FromBytes)(info.DripFullInfo.health_factor.low, info.DripFullInfo.health_factor.high).toString(),
                date: Date.now(),
            });
            await newDripValue.save();
        }
        catch (err) {
            console.log(err);
        }
    }
    async DripIterations() {
        //@ts-ignore
        const activeDrips = await activedrip_model_1.default.find({ owner_address: { "$ne": "last_block_index" }, active: true });
        for (let activeDrip of activeDrips) {
            //@ts-ignore
            const dripValue = await dripvalue_model_1.default.findOne({
                pool: activeDrip.pool_address.toLowerCase(),
                owner: activeDrip.owner_address.toLowerCase()
            }, {}, { sort: { 'date': -1 } });
            //check minimum delay between historization
            if (dripValue && (Date.now() - dripValue.date.getTime() < config_1.default.fetchers.dripsValues.minInterval)) {
                // console.log("waiting minInterval")
                continue;
            }
            await this.CallContract({ owner: activeDrip.owner_address, pool: activeDrip.pool_address });
        }
    }
}
exports.default = DripValuesFetcher;
//# sourceMappingURL=DripValuesFetcher.js.map