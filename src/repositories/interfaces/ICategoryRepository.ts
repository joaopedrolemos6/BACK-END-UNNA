import { Category } from "../../entities/Category";

export interface ICategoryRepository {
  create(data: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category>;
  findAll(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
  findById(id: number): Promise<Category | null>;
}
