import { hash, Provider, Contract } from "starknet";
import BN from "bn.js";

import PoolValue from "../schema/poolvalue.model";
import pool_abi from "../abi/pool.json"
import multicall_abi from "../abi/multicall.json"
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
            const multicallContract = new Contract(multicall_abi, config.multicall.address, this.provider);

            //  // should use a multicall
            //  const borrowrate = await poolContract.call("borrowRate");
            //  const totalsupply = await poolContract.call("totalSupply");
            //  const totalassets = await poolContract.call("totalAssets");
            //  const totalborrowed = await poolContract.call("totalBorrowed");

            const callArray = [
                {
                    to: pooladdress,
                    selector: hash.getSelectorFromName("borrowRate"),
                    data_offset: 0,
                    data_len: 0,
                },
                {
                    to: pooladdress,
                    selector: hash.getSelectorFromName("totalSupply"),
                    data_offset: 0,
                    data_len: 0,
                },
                {
                    to: pooladdress,
                    selector: hash.getSelectorFromName("totalAssets"),
                    data_offset: 0,
                    data_len: 0,
                },
                {
                    to: pooladdress,
                    selector: hash.getSelectorFromName("totalBorrowed"),
                    data_offset: 0,
                    data_len: 0,
                },
            ]

            const results = await multicallContract.call("aggregate", [callArray, [0, 0, 0, 0]])

            //console.log(results.retdata)
            const borrowrate = uint256FromBytes(results.retdata[1], results.retdata[2]).toString()
            const totalsupply = uint256FromBytes(results.retdata[4], results.retdata[5]).toString()
            const totalassets = uint256FromBytes(results.retdata[7], results.retdata[8]).toString()
            const totalborrowed = uint256FromBytes(results.retdata[10], results.retdata[11]).toString()

            //@ts-ignore
            const newpoolvalue = new PoolValue(
                {
                    pool_address: pooladdress.toLowerCase(),
                    borrowrate: borrowrate,
                    totalsupply: totalsupply,
                    totalassets: totalassets,
                    totalborrowed: totalborrowed,
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