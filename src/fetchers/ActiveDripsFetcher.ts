import {
  StreamClient,
  ChannelCredentials,
  v1alpha2,
  Cursor
} from '@apibara/protocol'

import {
  Filter,
  FieldElement,
  v1alpha2 as starknet,
  StarkNetCursor,
  FilterBuilder
} from '@apibara/starknet'

import BN from "bn.js";
import ActiveDrip from "../schema/activedrip.model";
import DripValue from "../schema/dripvalue.model";
import { hash, addAddressPadding } from "starknet";
import Fetcher from "./Fetcher";
import config from "../config"


export default class ActiveDripsFetcher extends Fetcher {
  private filter: Uint8Array;
  private selectorToEventName: { [key: string]: string } = {}
  private dripTransits: { pool: string, dtaddress: string }[] = []

  constructor(url: string, dripTransits: { pool: string, dtaddress: string }[], startBlock: number = 60000) {
    super(ActiveDripsFetcher.name, url, startBlock)

    this.selectorToEventName = this.getSelectorsToEventnames(config.fetchers.activeDrips.eventNames)

    this.dripTransits = dripTransits;

    this.initFilter()
  }

  private initFilter() {
    const { eventNames } = config.fetchers.activeDrips

    const filterBuilder = Filter.create()
      .withHeader({ weak: true })

    for (let dripTransit of this.dripTransits) {
      for (let eventName of eventNames) {
        const selector = hash.getSelectorFromName(eventName)

        // add filter for dtaddress / eventName
        filterBuilder.addEvent((e) => e
          .withFromAddress(FieldElement.fromBigInt(dripTransit.dtaddress))
          .withKeys([FieldElement.fromBigInt(selector)]))
      }
    }

    this.filter = filterBuilder.encode()
  }


  override async run() {

    //@ts-ignore
    const lastActiveDrip = await ActiveDrip.findOne({}, {}, { sort: { 'block': -1 } });

    // start from last event blocknumber
    if (lastActiveDrip) {
      this.cursor = StarkNetCursor.createWithBlockNumber(parseInt(lastActiveDrip.block) + 1)
    }

    await this.client.configure({
      filter: this.filter,
      batchSize: 100,
      finality: v1alpha2.DataFinality.DATA_STATUS_FINALIZED,
      cursor: this.cursor
    })

    try {
      // start looping on messages
      for await (const message of this.getClientIterator()) {
        // console.log(`\nBatch: ${Cursor.toString(message.data.cursor)} -- ${Cursor.toString(message.data.endCursor)}`)
        await this.handleData(message)
      }
    }
    catch (e) {
      if (e instanceof Error) {
        console.log(ActiveDripsFetcher.name, e.message)
      }
      else {
        console.log(e)
      }
    }

  }

  async handleData(message: v1alpha2.IStreamDataResponse) {
    if (message.data?.data) {
      // loop on blocks
      for (let item of message.data.data) {
        const block = starknet.Block.decode(item)
        await this.handleBlock(block)
      }
    }
    else if (message.invalidate) {
      console.log("invalidate : ", message.invalidate);
    }
  }

  async handleBlock(block: starknet.IBlock) {
    const { header, events } = block

    console.log("\nblock :", header.blockNumber.toString())

    // loop on events
    for (let event of events) {
      const eventNameSelector = FieldElement.toHex(event.event.keys[0])
      const eventName = this.selectorToEventName[eventNameSelector]

      const emitterAddress = FieldElement.toHex(event.event.fromAddress)
      const transactionHash = FieldElement.toHex(event.transaction.meta.hash)
      const blockNumber = header.blockNumber.toString()
      const date = Number(header.timestamp.seconds) * 1000

      if (eventName === "OpenDrip") {
        const owner = FieldElement.toHex(event.event.data[0])
        const dripTransitInfos = this.dripTransits.find(i => i.dtaddress === emitterAddress)
        console.log("OpenDrip ", owner)

        //@ts-ignore
        await ActiveDrip.findOneAndUpdate(
          {
            owner_address: owner,
            pool_address: dripTransitInfos.pool
          },
          {
            owner_address: owner,
            pool_address: dripTransitInfos.pool,
            block: blockNumber,
            date: date,
            updated: Date.now(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )

      }
      if (eventName === "CloseDrip") {
        const to = FieldElement.toHex(event.event.data[1])
        const dripTransitInfos = this.dripTransits.find(i => i.dtaddress === emitterAddress)
        console.log("CloseDrip ", to)

        //@ts-ignore
        await ActiveDrip.findOneAndUpdate(
          {
            owner_address: to,
            pool_address: dripTransitInfos.pool
          },
          {
            drip_address: to,
            pool_address: dripTransitInfos.pool,
            block: blockNumber,
            active: false,
            updated: Date.now(),
          },
          { upsert: true, setDefaultsOnInsert: true }
        )

        //@ts-ignore
        await DripValue.deleteMany(
          {
            owner: to,
            pool: dripTransitInfos.pool
          },
        )

      }

    }

  }


}

