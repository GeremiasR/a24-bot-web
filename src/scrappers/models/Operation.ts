export interface OperationResult {
  usuario: string;
  saldo_anterior: number;
  saldo_actual: number;
  status: boolean;
  fecha_operacion: Date;
  message: string;
}

export interface OperationRequest {
  usuario_carga: string;
  url: string;
  monto: string;
  agente_user: string;
  agente_pass: string;
  esCarga: boolean;
}
