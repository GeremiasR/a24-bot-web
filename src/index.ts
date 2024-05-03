import express from "express";
import dontenv from "dotenv";
import fichas from "./scrappers/tasks/fichas";
import { Request, Response } from "express";
import {
  OperationRequest,
  OperationResult,
} from "./scrappers/models/Operation";

dontenv.config();

const app = express();

app.use(express.json());

//todo: fichas
//todo: crear usuario
//todo: check agente
//todo: repo

app.post("/agent/fichas", async (req: Request, res: Response) => {
  try {
    const operationReq = <OperationRequest>req.body;
    const crapRes: OperationResult = await fichas(operationReq);
    if (crapRes.status) {
      return res.send({
        status: 200,
        message: "Operacion realizada correctamente",
        data: crapRes,
      });
    } else {
      return res.send({
        status: 500,
        message: "Internal server error",
        errors: crapRes,
      });
    }
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
