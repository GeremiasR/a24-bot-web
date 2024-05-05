import { decodePassword } from "../../helpers/auth";
import { OperationRequest, OperationResult } from "../models/Operation";

import puppeteer from "puppeteer";


function randomIntFromInterval(min: number, max: number) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}

//todo: max16
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
    if(op.usuario_carga.length > 16) throw new Error("El nombre de usuario debe tener no mas de 16 caracteres")
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

    await page.waitForSelector("#NewPlayerButton");
    await page.click("#NewPlayerButton")

    await page.waitForSelector("#ModalNewUser", { visible: true });
    await page.type("#NewUserPlayerUsername", op.usuario_carga);
    const newPass: string = `TIGER${randomIntFromInterval(1000, 9999)}`;
    await page.type("#NewUserPlayerPassword", newPass);
    await page.click("#ModalNewUserPlayerSubmit");
    await page.waitForSelector("#NewUserPlayerLoading", { visible: true });
    await page.waitForSelector("#NewUserPlayerLoading", { hidden: true });
    const errorMessage = await page.$eval(
      '#NewUserPlayerError',
      (el) => el.textContent
    );
    if(errorMessage && errorMessage.length > 0){
      throw new Error(errorMessage);
    }

    await page.waitForSelector("#ModalNewUser", { hidden: true });
    
    await page.type("#UserSearch", op.usuario_carga);
    await page.click(".btn-add-credit");
    await page.waitForSelector("#ModalCredit", { visible: true });
    operationRes.status = true;
    operationRes.message = `Usuario creado correctamente, su contraseña es: ${newPass}, Descuida, podras cambiarla cuando entres a la sala`;
    await browser.close();
    return operationRes;
  } catch (error: any) {
    await browser.close();
    operationRes.message = error.message;
    return operationRes;
  }
};
