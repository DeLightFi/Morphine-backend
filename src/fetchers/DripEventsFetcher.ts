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
import MulticallEvent from "../schema/multicallevent.model";
import { hash, addAddressPadding } from "starknet";

import Fetcher, { uint256FromFields } from './Fetcher';
import config from "../config"



export default class DripEventsFetcher extends Fetcher {

  private filter: Uint8Array;
  private selectorToEventName: { [key: string]: string } = {}
  private dripTransits: { pool: string, dtaddress: string }[] = []

  constructor(url: string, dripTransits: { pool: string, dtaddress: string }[], startBlock: number = 51707) {
    super(DripEventsFetcher.name, url, startBlock)

    this.dripTransits = dripTransits;

    this.selectorToEventName = this.getSelectorsToEventnames(
      [...config.fetchers.dripEvents.eventNames, ...config.fetchers.multicall.eventNames]
    )


    this.initFilter()
  }

  private initFilter() {
    const { eventNames } = config.fetchers.dripEvents

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
    const lastMulticallEvent = await MulticallEvent.findOne({}, {}, { sort: { 'block': -1 } });

    // start from last event blocknumber
    if (lastMulticallEvent) {
      this.cursor = StarkNetCursor.createWithBlockNumber(parseInt(lastMulticallEvent.block) + 1)
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
        console.log(DripEventsFetcher.name, e.message)
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

      if (eventName === "MultiCallStarted") {
        const borrower = FieldElement.toHex(event.event.data[0])
        const payloads = await this.getPayloadsFromReceiptEvent(event.receipt.events)

        const dripTransitInfos = this.dripTransits.find(i => i.dtaddress === emitterAddress)

        const eventUpdate = {
          tx: transactionHash,
          pool_address: dripTransitInfos.pool,
          drip: emitterAddress,
          block: blockNumber,
          borrower,
          payload: payloads,
          date,
        }

        // console.log("-----------------------------")
        // console.log(eventUpdate)

        //@ts-ignore
        await MulticallEvent.findOneAndUpdate(
          {
            tx: eventUpdate.tx
          },
          eventUpdate,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )

      }
    }
  }

  async getPayloadsFromReceiptEvent(receipt: starknet.IEvent[]) {
    const payloads = []

    let i = 0
    let isInMulticall = false;
    let borrower = undefined
    for (let event of receipt) {

      const eventNameSelector = FieldElement.toHex(event.keys[0])
      const eventName = this.selectorToEventName[eventNameSelector] || 'Unknown'

      if (eventName === "MultiCallStarted") {
        // start adding payload
        isInMulticall = true;
        borrower = FieldElement.toHex(event.data[0])
      }
      else if (eventName === "MultiCallFinished") {
        // return payload
        return payloads
      } else if (isInMulticall) {
        // add multicall payloads
        payloads.push({
          id: i,
          tx_id: i,
          name: eventName,
          data: event.data,
          address: addAddressPadding(FieldElement.toHex(event.fromAddress))
        })
        i++
      }

    }
    return payloads
  }


}




