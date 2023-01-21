import * as Express from 'express';
import ErrorHandler from "../models/ErrorHandler";
import MutlicallEvent from "../schema/multicallevent.model";


class MulticallController {
  defaultMethod() {
    throw new ErrorHandler(501, 'Not implemented method');
  }

  public async get_all_multicallevents(req: Express.Request, res: Express.Response) {
    const { pooladdress } = req.params;
    //@ts-ignore
    const data = await MutlicallEvent.find({ pool_address: pooladdress.toLowerCase() })
    res.json({ data: data })
  }
}

export = new MulticallController();