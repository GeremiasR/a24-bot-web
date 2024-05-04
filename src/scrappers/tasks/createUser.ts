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
      if (
        parseFloat(agentBalance.replaceAll(".", "").replaceAll(",", ".")) <
        parseFloat(op.monto)
      ) {
        throw new Error("Balance de agente insuficiente");
      }
    } else {
      throw new Error("Error al obtener el balance del agente");
    }

    //* Navigate to users table
    await page.waitForSelector("#sidemenu_global_ul > li:nth-of-type(2) > a");

    await page.click("#sidemenu_global_ul > li:nth-of-type(2) > a");

    await page.waitForSelector("#UserSearch");

    await page.type("#UserSearch", op.usuario_carga);
    await page.click("#UserSearchButton");

    await page.waitForSelector("#users");

    operationRes = await page.evaluate(
      (op: OperationRequest, operationRes: OperationResult) => {
        let operationResult: OperationResult = operationRes;
        const rows = document.querySelectorAll("#users tbody tr");
        for (let index = 0; index < rows.length; index++) {
          const userNameScraped = document
            .querySelectorAll("#users tbody tr")
            [index].querySelectorAll("td")[0].innerText;
          if (userNameScraped.toLowerCase() == op.usuario_carga.toLowerCase()) {
            operationResult.usuario = userNameScraped;
            operationResult.saldo_anterior = parseFloat(
              document
                .querySelectorAll("#users tbody tr")
                [index].querySelectorAll("td")[1]
                .innerText.replaceAll(".", "")
                .replaceAll(",", ".")
            );
            if (
              !op.esCarga &&
              operationResult.saldo_anterior < parseFloat(op.monto)
            )
              throw new Error("Monto insuficiente para retiro");
            const addFichasAction: any = document
              .querySelectorAll("#users tbody tr")
              [index].querySelectorAll("td")[2].children[op.esCarga ? 0 : 1];
            addFichasAction.click();
            break;
          }
          if (rows.length - 1 == index) {
            throw new Error("Usuario no encontrado");
          }
        }
        return operationResult;
      },
      op,
      operationRes
    );

    await page.waitForSelector("#ModalCredit", { visible: true });
    await page.type("#ModalCreditAmount", op.monto);

    await page.click("#ModalCreditSubmit");
    await page.waitForSelector("#ModalCredit", { hidden: true });

    operationRes = await page.evaluate(
      (op: OperationRequest, operationRes: OperationResult) => {
        let operationResult: OperationResult = operationRes;
        const rows = document.querySelectorAll("#users tbody tr");
        for (let index = 0; index < rows.length; index++) {
          const userNameScraped = document
            .querySelectorAll("#users tbody tr")
            [index].querySelectorAll("td")[0].innerText;
          if (userNameScraped.toLowerCase() == op.usuario_carga.toLowerCase()) {
            operationRes.saldo_actual = parseFloat(
              document
                .querySelectorAll("#users tbody tr")
                [index].querySelectorAll("td")[1]
                .innerText.replaceAll(".", "")
                .replaceAll(",", ".")
            );
            if (
              operationRes.saldo_anterior + parseFloat(op.monto) ==
              operationRes.saldo_actual
            ) {
              operationRes.message = "Carga Exitosa";
              operationRes.status = true;
            }
            if (
              operationRes.saldo_anterior - parseFloat(op.monto) ==
              operationRes.saldo_actual
            ) {
              operationRes.message = "Retiro Exitoso";
              operationRes.status = true;
            }
            break;
          }
        }
        return operationResult;
      },
      op,
      operationRes
    );

    await browser.close();
    return operationRes;
  } catch (error: any) {
    await browser.close();
    operationRes.message = error.message;
    return operationRes;
  }
};
