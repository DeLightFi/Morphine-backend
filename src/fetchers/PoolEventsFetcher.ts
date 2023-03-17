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
import PoolEvent from "../schema/poolevent.model";
import { hash, addAddressPadding } from "starknet";
import Fetcher, { uint256FromFields } from './Fetcher';
import config from '../config';


export default class PoolEventsFetcher extends Fetcher {

  private filter: Uint8Array;
  private selectorToEventName: { [key: string]: string } = {}

  constructor(url: string, startBlock: number = 36875) {
    super(PoolEventsFetcher.name, url, startBlock)

    this.selectorToEventName = this.getSelectorsToEventnames(config.fetchers.poolEvents.eventNames)

    this.initFilter()
  }

  private initFilter() {
    const { eventNames } = config.fetchers.poolEvents
    const poolAddresses = config.pools.map(i => i.address)

    const filterBuilder = Filter.create()
      .withHeader({ weak: true })

    for (let poolAddress of poolAddresses) {

      for (let eventName of eventNames) {
        const selector = hash.getSelectorFromName(eventName)

        // add filter for poolAddress / eventName
        filterBuilder.addEvent((e) => e
          .withFromAddress(FieldElement.fromBigInt(poolAddress))
          .withKeys([FieldElement.fromBigInt(selector)]))

      }
    }

    this.filter = filterBuilder.encode()
  }


  override async run() {

    //@ts-ignore
    const lastPoolEvent = await PoolEvent.findOne({}, {}, { sort: { 'block': -1 } });

    // start from last event blocknumber
    if (lastPoolEvent) {
      this.cursor = StarkNetCursor.createWithBlockNumber(parseInt(lastPoolEvent.block) + 1)
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
        console.log(PoolEventsFetcher.name, e.message)
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

    let i = 0
    // loop on events
    for (let event of events) {

      const poolAddress = FieldElement.toHex(event.event.fromAddress)
      const transactionHash = FieldElement.toHex(event.transaction.meta.hash)
      const eventId = `${transactionHash}_${i}`
      const blockNumber = header.blockNumber.toString()
      const date = Number(header.timestamp.seconds) * 1000

      const eventNameSelector = FieldElement.toHex(event.event.keys[0])
      const eventName = this.selectorToEventName[eventNameSelector]
      const from = FieldElement.toHex(event.event.data[0])
      const to = FieldElement.toHex(event.event.data[1])
      let amountIndex = 0

      if (["Deposit", "Withdraw"].includes(eventName)) {
        amountIndex = 2
      }
      if (["Borrow"].includes(eventName)) {
        amountIndex = 1
      }
      if (["RepayDebt"].includes(eventName)) {
        amountIndex = 0
      }

      const amount = uint256FromFields(event.event.data[amountIndex], event.event.data[amountIndex + 1]).toString()

      const eventUpdate = {
        blockNumber,
        transactionHash,
        eventId,
        date,
        poolAddress,
        eventName,
        from,
        to,
        amount,
      }

      console.log("-----------------------------")
      console.log(eventUpdate)

      //@ts-ignore
      await PoolEvent.findOneAndUpdate(
        {
          event_id: eventUpdate.eventId
        },
        {
          event_id: eventUpdate.eventId,
          block: eventUpdate.blockNumber,
          pool_address: eventUpdate.poolAddress,
          event_name: eventUpdate.eventName,
          from: eventUpdate.from,
          to: eventUpdate.to,
          amount: eventUpdate.amount,
          date: eventUpdate.date
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )

      i++

    }


  }


}




