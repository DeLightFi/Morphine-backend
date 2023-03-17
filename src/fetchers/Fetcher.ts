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

import { hash, addAddressPadding } from "starknet";
import BN from "bn.js";


export const delay = (ms: number, value: any) => new Promise(resolve => {
    setTimeout(resolve, ms, value);
});

export async function* timeoutWrapper(asyncIterable: AsyncIterable<v1alpha2.IStreamDataResponse>, timeoutDuration: number): AsyncIterable<v1alpha2.IStreamDataResponse> {
    const TIMEOUT_VALUE = { isTimeout: true };
    const it = asyncIterable[Symbol.asyncIterator]();
    try {
        while (true) {
            const result: { done?: boolean, value?: any, isTimeout?: boolean } = await Promise.race([
                it.next(),
                delay(timeoutDuration, TIMEOUT_VALUE)
            ]);
            if (result.isTimeout) {
                throw new Error(`Timeout after ${timeoutDuration}ms`);
            } else if (result.done) {
                break;
            } else {
                yield result.value;
            }
        }
    } finally {
        it.return?.();
    }
}


export const uint256FromFields = (low: starknet.IFieldElement, high: starknet.IFieldElement): BN => {
    const lowB = new BN(FieldElement.toHex(low).substring(2), "hex");
    const highB = new BN(FieldElement.toHex(high).substring(2), "hex");
    return highB.shln(128).add(lowB);
}

export const uint256FromBytes = (low: Buffer, high: Buffer): BN => {
    const lowB = new BN(low);
    const highB = new BN(high);
    return highB.shln(128).add(lowB);
}


export default class Fetcher {
    protected readonly client: StreamClient;
    protected readonly indexerId: string;
    protected cursor: v1alpha2.ICursor;

    constructor(indexerId: string, url: string, startBlock: number) {
        this.indexerId = indexerId;
        this.client = new StreamClient({ url });
        this.cursor = StarkNetCursor.createWithBlockNumber(startBlock)
    }

    getSelectorsToEventnames(eventNames : string[]): { [key: string]: string; } {
        const selectors :{ [key: string]: string; } = {}
        for (let eventName of eventNames) {
            // keep track of selector => eventName
            const selector = hash.getSelectorFromName(eventName)
            const selector64 = addAddressPadding(selector)
            selectors[selector64] = eventName
        }
        return selectors
    }


    getClientIterator(timeoutMs: number = 10_000): AsyncIterable<v1alpha2.IStreamDataResponse> {
        if (timeoutMs && timeoutMs > 0) {
            return timeoutWrapper(this.client, timeoutMs)
        }
        return this.client
    }

    async run() {
        console.log("override me")
    }

}