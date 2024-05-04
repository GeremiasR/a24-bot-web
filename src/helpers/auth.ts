import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const internalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  if (token !== process.env.INTERNAL_TOKEN) return res.sendStatus(401);
  next();
};

export const decodePassword = (encoded: string) => {
  try {
    return jwt.verify(
      encoded || "",
      process.env.TOKEN_SECRET as string,
      (err: any, result: any) => result
    );
  } catch (error) {
    return "";
  }
};
