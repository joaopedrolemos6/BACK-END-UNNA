import { ICategoryRepository } from "../repositories/interfaces/ICategoryRepository";
import { AppError } from "../errors/AppError";

export class CategoryService {
  constructor(private categoryRepository: ICategoryRepository) {}

  async getAll() {
    return this.categoryRepository.findAll();
  }

  async getBySlug(slug: string) {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) throw new AppError("Category not found", 404);

    return category;
  }
}
