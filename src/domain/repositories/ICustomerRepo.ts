import type { Customer } from "@prisma/client";
import type {
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerFilterDTO,
} from "../dtos/CustomerDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";

export interface ICustomerRepository {
  create(data: CreateCustomerDTO): Promise<Customer>;
  findById(id: number): Promise<Customer | null>;
  findByUserId(userId: number): Promise<Customer | null>;
  findByNik(nikKtp: string): Promise<Customer | null>;
  update(id: number, data: UpdateCustomerDTO): Promise<Customer>;
  delete(id: number): Promise<void>;
  findWithOffsetPagination(
    page: number,
    limit: number,
    filters?: CustomerFilterDTO,
  ): Promise<OffsetPaginatedData<Customer>>;
}
