import type { Customer } from "@prisma/client";
import type {
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerFilterDTO,
} from "../dtos/CustomerDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export interface ICustomerRepository {
  create(data: CreateCustomerDTO): Promise<Customer>;
  findById(id: number): Promise<Customer | null>;
  findByUserId(userId: number): Promise<Customer | null>;
  findByNik(nikKtp: string): Promise<Customer | null>;
  update(id: number, data: UpdateCustomerDTO): Promise<Customer>;
  delete(id: number): Promise<void>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: CustomerFilterDTO,
  ): Promise<CursorPaginatedData<Customer>>;
}
