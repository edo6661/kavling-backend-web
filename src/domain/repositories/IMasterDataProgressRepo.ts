import type { MasterDataProgress } from "@prisma/client";
import type {
  CreateMasterDataProgressDTO,
  UpdateMasterDataProgressDTO,
  MasterDataProgressFilterDTO,
} from "../dtos/MasterDataProgressDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export interface IMasterDataProgressRepository {
  create(data: CreateMasterDataProgressDTO): Promise<MasterDataProgress>;
  findById(id: number): Promise<MasterDataProgress | null>;
  findBySprId(sprId: number): Promise<MasterDataProgress | null>;
  update(
    id: number,
    data: UpdateMasterDataProgressDTO,
  ): Promise<MasterDataProgress>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: MasterDataProgressFilterDTO,
  ): Promise<CursorPaginatedData<MasterDataProgress>>;
}
