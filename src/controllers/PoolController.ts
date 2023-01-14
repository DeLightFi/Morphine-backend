import * as Express from 'express';
import ErrorHandler from "../models/ErrorHandler";
import PoolEvent from "../schema/poolevent.model";
import PoolValue from "../schema/poolvalue.model";


class PoolController {
  defaultMethod() {
    throw new ErrorHandler(501, 'Not implemented method');
  }

  public async get_all_poolevents(req: Express.Request, res: Express.Response) {
    const { pooladdress } = req.params;
    //@ts-ignore
    const data = await PoolEvent.find({ pool_address: pooladdress.toLowerCase() })
    res.json({ data: data })
  }

  public async get_user_from_poolevents(req: Express.Request, res: Express.Response) {
    const { pooladdress, walletaddress } = req.params;
    //@ts-ignore
    const data = await PoolEvent.find({ pool_address: pooladdress.toLowerCase(), from: walletaddress.toLowerCase() })
    res.json({ data: data })
  }

  public async get_user_to_poolevents(req: Express.Request, res: Express.Response) {
    const { pooladdress, walletaddress } = req.params;
    //@ts-ignore
    const data = await PoolEvent.find({ pool_address: pooladdress.toLowerCase(), to: walletaddress.toLowerCase() })
    res.json({ data: data })
  }

  public async get_all_poolvalues(req: Express.Request, res: Express.Response) {
    const { pooladdress } = req.params;
    //@ts-ignore
    const data = await PoolValue.find({ pool_address: pooladdress.toLowerCase() })
    res.json({ data: data })
  }
}

export = new PoolController();