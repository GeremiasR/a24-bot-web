import express from "express";
import dontenv from "dotenv";
import fichas from "./scrappers/tasks/fichas";
import checkAgent from "./scrappers/tasks/checkAgent";
import { Request, Response } from "express";
import {
  OperationRequest,
  OperationResult,
} from "./scrappers/models/Operation";
import { internalAuth } from "./helpers/auth";

dontenv.config();

const app = express();

app.use(express.json());

//todo: fichas
//todo: crear usuario

app.post("/agent/fichas", internalAuth, async (req: Request, res: Response) => {
  try {
    const operationReq = <OperationRequest>req.body;
    const crapRes: OperationResult = await fichas(operationReq);
    if (!crapRes.status) {
      return res.send({
        status: 500,
        message: "Internal server error",
        errors: crapRes,
      });
    }
    return res.send({
      status: 200,
      message: "Operacion realizada correctamente",
      data: crapRes,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      errors: error,
    });
  }
});

app.post("/agent/check", internalAuth, async (req: Request, res: Response) => {
  try {
    const operationReq = <OperationRequest>req.body;
    const crapRes: OperationResult = await checkAgent(operationReq);
    if (!crapRes.status) {
      return res.send({
        status: 500,
        message: "Internal server error",
        errors: crapRes,
      });
    }
    return res.send({
      status: 200,
      message: "Operacion realizada correctamente",
      data: crapRes,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      errors: error,
    });
  }
});

app.post("/user/create", internalAuth, async (req: Request, res: Response) => {
  try {
    const operationReq = <OperationRequest>req.body;
    const crapRes: OperationResult = await fichas(operationReq);
    if (!crapRes.status) {
      return res.send({
        status: 500,
        message: "Internal server error",
        errors: crapRes,
      });
    }
    return res.send({
      status: 200,
      message: "Operacion realizada correctamente",
      data: crapRes,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      errors: error,
    });
  }
});

app.listen(process.env.APP_PORT, () => {
  console.log("Running on port " + process.env.APP_PORT);
});
