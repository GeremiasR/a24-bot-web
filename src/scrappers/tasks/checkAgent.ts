import { decodePassword } from "../../helpers/auth";
import { OperationRequest, OperationResult } from "../models/Operation";

import puppeteer from "puppeteer";

export default async (op: OperationRequest) => {
  let operationRes: OperationResult = {
    usuario: op.usuario_carga,
    saldo_actual: 0,
    saldo_anterior: 0,
    status: false,
    fecha_operacion: new Date(),
    message: "",
  };
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
  });
  const page = await browser.newPage();
  page.on("console", (msg: { text: () => any }) => console.log(msg.text()));
  const timeout = 5000;
  page.setDefaultTimeout(timeout);
  await page.setViewport({ width: 1080, height: 1024 });
  try {
    await page.goto(op.url);
    //* Login
    await page.waitForSelector("#user");

    await page.type("#user", op.agente_user);
    const passAgent = decodePassword(op.agente_pass);
    if (!passAgent) throw new Error("Error al obtener los datos del agente");
    await page.type("#passwd", passAgent);
    await page.click("#dologin");

    //* Validate Agent Balance
    await page.waitForSelector(".own-balance");
    let ownBalanceElement = await page.$(".own-balance");
    let agentBalance = await page.evaluate(
      (el) => el?.textContent,
      ownBalanceElement
    );
    if (agentBalance !== undefined && agentBalance !== null) {
      operationRes.status = true;
      operationRes.saldo_actual = parseFloat(
        agentBalance.replaceAll(".", "").replaceAll(",", ".")
      );
    } else {
      throw new Error("Error al obtener el balance del agente");
    }
    await browser.close();
    return operationRes;
  } catch (error: any) {
    await browser.close();
    operationRes.message = error.message;
    return operationRes;
  }
};
