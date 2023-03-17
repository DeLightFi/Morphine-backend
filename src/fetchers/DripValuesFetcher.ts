import { hash, Provider, Contract } from "starknet";
import BN from "bn.js";
import DripValue from "../schema/dripvalue.model";
import ActiveDrip from "../schema/activedrip.model";
import dataprovider_abi from "../abi/dataprovider.json"
import { uint256FromBytes } from "./Fetcher"
import config from "../config"

export default class DripValuesFetcher {
  private provider: Provider;

  constructor(network: string) {
    //@ts-ignore
    this.provider = new Provider({ sequencer: { network: network } });
  }

  async CallContract(activedrip: { owner: string, pool: string }) {
    try {
      const poolContract = new Contract(dataprovider_abi, config.dataProvider.address, this.provider);

      const info = await poolContract.getUserDripInfoFromPool(config.registry.address, activedrip.owner, activedrip.pool);

      //@ts-ignore
      const newDripValue = new DripValue(
        {
          owner: activedrip.owner.toLowerCase(),
          pool: activedrip.pool.toLowerCase(),
          user_balance: uint256FromBytes(info.DripFullInfo.user_balance.low, info.DripFullInfo.user_balance.high).toString(),
          total_balance: uint256FromBytes(info.DripFullInfo.total_balance.low, info.DripFullInfo.total_balance.high).toString(),
          total_weighted_balance: uint256FromBytes(info.DripFullInfo.total_weighted_balance.low, info.DripFullInfo.total_weighted_balance.high).toString(),
          debt: uint256FromBytes(info.DripFullInfo.debt.low, info.DripFullInfo.debt.high).toString(),
          health_factor: uint256FromBytes(info.DripFullInfo.health_factor.low, info.DripFullInfo.health_factor.high).toString(),
          date: Date.now(),
        }
      )
      await newDripValue.save()
    } catch (err) {
      console.log(err)
    }
  }

  async DripIterations() {
    //@ts-ignore
    const activeDrips = await ActiveDrip.find({ owner_address: { "$ne": "last_block_index" }, active: true })

    for (let activeDrip of activeDrips) {
      //@ts-ignore
      const dripValue = await DripValue.findOne(
        {
          pool: activeDrip.pool_address.toLowerCase(),
          owner: activeDrip.owner_address.toLowerCase()
        },
        {},
        { sort: { 'date': -1 } }
      )

      //check minimum delay between historization
      if (dripValue && (Date.now() - dripValue.date.getTime() < config.fetchers.dripsValues.minInterval)) {
        // console.log("waiting minInterval")
        continue
      }

      await this.CallContract({ owner: activeDrip.owner_address, pool: activeDrip.pool_address });
    }
  }
}