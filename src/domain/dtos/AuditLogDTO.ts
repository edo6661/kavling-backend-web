import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type { ActionType } from "@prisma/client";

export interface AuditLogResponseDTO {
  id: number;
  entityName: string;
  entityId: string;
  action: ActionType;
  changes: any;
  userId: number | null;
  username: string | null;
  createdAt: Date;
}

export type AuditLogFilterDTO = BaseFilterDTO;
