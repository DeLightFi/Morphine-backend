import { hash, Provider, Contract } from "starknet";
import BN from "bn.js";

import PoolValue from "../schema/poolvalue.model";
import pool_abi from "../abi/pool.json"
import { uint256FromBytes } from "./Fetcher"
import config from "../config"

export default class PoolValuesFetcher {
    private provider: Provider;

    constructor(network: string) {
        //@ts-ignore
        this.provider = new Provider({ sequencer: { network: network } });
    }

    async CallContract(pooladdress: string) {
        try {
            const poolContract = new Contract(pool_abi, pooladdress, this.provider);

            // should use a multicall
            const borrowrate = await poolContract.call("borrowRate");
            const totalsupply = await poolContract.call("totalSupply");
            const totalassets = await poolContract.call("totalAssets");
            const totalborrowed = await poolContract.call("totalBorrowed");

            //@ts-ignore
            const newpoolvalue = new PoolValue(
                {
                    pool_address: pooladdress.toLowerCase(),
                    borrowrate: uint256FromBytes(borrowrate[0].low, borrowrate[0].high).toString(),
                    totalsupply: uint256FromBytes(totalsupply[0].low, totalsupply[0].high).toString(),
                    totalassets: uint256FromBytes(totalassets[0].low, totalassets[0].high).toString(),
                    totalborrowed: uint256FromBytes(totalborrowed[0].low, totalborrowed[0].high).toString(),
                    date: Date.now()
                }
            )
            await newpoolvalue.save()
        } catch (err) {
            console.log(err)
        }
    }

    async PoolIterations() {
        const poolAddresses = config.pools.map(i => i.address)
        for (let poolAddress of poolAddresses) {
            //@ts-ignore
            const poolValue = await PoolValue.findOne(
                { pool_address: poolAddress },
                {},
                { sort: { 'date': -1 } }
            )

            //check minimum delay between historization
            if (poolValue && (Date.now() - poolValue.date.getTime() < config.fetchers.poolValues.minInterval)) {
                // console.log("waiting minInterval")
                continue
            }

            await this.CallContract(poolAddress.toLowerCase());
        }
    }
}