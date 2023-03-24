import { FieldElement } from '@apibara/starknet'
import { hash, Provider, Contract, addAddressPadding } from "starknet";
import BN from "bn.js";
import PoolInterestRateModel from "../schema/poolinterestratemodel.model";
import pool_abi from "../abi/pool.json"
import interest_rate_model_abi from "../abi/interest_rate_model_abi.json"
import { uint256FromBytes } from "./Fetcher"
import config from "../config"

export default class PoolInterestRateModelFetcher {
  private provider: Provider;

  constructor(network: string) {
    //@ts-ignore
    this.provider = new Provider({ sequencer: { network: network } });
  }

  async CallContract(pooladdress: string) {
    try {
      const poolContract = new Contract(pool_abi, pooladdress, this.provider);

      const interestRateModelAddress = addAddressPadding((await poolContract.call("interestRateModel")).interestRateModel.toString());
      console.log("interestRateModelAddress :", interestRateModelAddress);

      const interestRateModelContract = new Contract(interest_rate_model_abi, interestRateModelAddress, this.provider);
      const modelParameters = await interestRateModelContract.call("modelParameters");
      //console.log(modelParameters);

      //@ts-ignore
      const newinterestratemodelvalue = new PoolInterestRateModel(
        {
          pool_address: pooladdress.toLowerCase(),
          interestratemodel_address: interestRateModelAddress,
          optimal: uint256FromBytes(modelParameters.optimalLiquidityUtilization.low, modelParameters.optimalLiquidityUtilization.high).toString(),
          baserate: uint256FromBytes(modelParameters.baseRate.low, modelParameters.baseRate.high).toString(),
          slope1: uint256FromBytes(modelParameters.slope1.low, modelParameters.slope1.high).toString(),
          slope2: uint256FromBytes(modelParameters.slope2.low, modelParameters.slope2.high).toString(),
          date: Date.now()
        }
      )
      // console.log(newinterestratemodelvalue);
      await newinterestratemodelvalue.save()

    } catch (err) {
      console.log(err)
    }
  }

  async PoolIterations() {
    const poolAddresses = config.pools.map(i => i.address)
    for (let poolAddress of poolAddresses) {

      //@ts-ignore
      const poolInterestRateModel = await PoolInterestRateModel.findOne(
        { pool_address: poolAddress },
        {},
        { sort: { 'date': -1 } }
      )

      //check minimum delay between historization
      if (poolInterestRateModel && (Date.now() - poolInterestRateModel.date.getTime() < config.fetchers.poolInterestRateModel.minInterval)) {
        //console.log("waiting minInterval")
        continue
      }


      await this.CallContract(poolAddress.toLowerCase());
    }
  }
}