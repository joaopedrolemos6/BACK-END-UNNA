import { IStoreRepository } from "../repositories/interfaces/IStoreRepository";
import { AppError } from "../errors/AppError";

export class StoreService {
  constructor(private storeRepository: IStoreRepository) {}

  async list() {
    return this.storeRepository.findAll();
  }

  async getBySlug(slug: string) {
    const store = await this.storeRepository.findBySlug(slug);
    if (!store) throw new AppError("Store not found", 404);

    return store;
  }
}
