import * as Express from 'express';
import ErrorHandler from "../models/ErrorHandler";
import ActiveDrip from "../schema/activedrip.model";


class DripController {
  defaultMethod() {
    throw new ErrorHandler(501, 'Not implemented method');
  }

  public async get_all_activedrip(req: Express.Request, res: Express.Response) {
    //@ts-ignore
    const data = await ActiveDrip.find({ drip_address: { "$ne": "last_block_index" }, active: true })
    res.json({ data: data })
  }
}

export = new DripController();