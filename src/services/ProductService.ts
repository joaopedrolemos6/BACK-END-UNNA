import { IProductRepository } from "../repositories/interfaces/IProductRepository";
import { Product, ProductImage, ProductVariant, Role } from "../entities/Product"; // Importe Role
import { Category } from "../entities/Category"; // Assumindo que Category existe
import { AppError } from "../errors/AppError";
import { CategoryService } from "./CategoryService";
import { slugify } from "../utils/slugify";
import { OrderItem } from "../entities/Order"; // Necessário para a função de baixa de estoque

// Assumimos que o tipo de ProductData está definido no arquivo productSchemas.ts
interface ProductData {
  categoryId: number;
  slug?: string; // Opcional, será gerado
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  discountPercent?: number;
  sku: string;
  status: 'active' | 'inactive';
  isFeatured: boolean;
  // Para variantes (se o produto tiver diferentes tamanhos/cores)
  variants?: Array<{
    sizeId: number;
    colorId: number;
    sku: string;
    stock: number;
    price: number; // Preço pode ser diferente por variante
  }>;
  // Para imagens (será preenchido pelo controller de imagem)
  images?: Array<{
    imageUrl: string;
    isMain: boolean;
    sortOrder?: number;
  }>
}

export class ProductService {
  constructor(
    private productRepository: IProductRepository,
  ) {}

  // ==========================================================
  // 1. CRIAÇÃO DE PRODUTO (ADMIN)
  // ==========================================================
  async createProduct(data: ProductData, userId: number): Promise<Product> {
    
    // 1. Validar se o slug é único ou gerar um
    let slug = data.slug || slugify(data.name);
    
    // Verifica se o slug já existe e tenta adicionar um sufixo numérico se necessário
    let counter = 1;
    let uniqueSlug = slug;
    while (await this.productRepository.findBySlug(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter++}`;
        if (counter > 10) throw new AppError("Não foi possível gerar um slug único.", 500);
    }
    slug = uniqueSlug;

    const newProductData: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
        categoryId: data.categoryId,
        slug,
        name: data.name,
        description: data.description,
        price: data.price,
        oldPrice: data.oldPrice || null,
        discountPercent: data.discountPercent || null,
        sku: data.sku,
        status: data.status,
        isFeatured: data.isFeatured,
    };

    // 2. Cria o produto base
    const product = await this.productRepository.createProduct(newProductData);
    
    // 3. Cria as variantes (se existirem)
    if (data.variants && data.variants.length > 0) {
      const variantsToCreate = data.variants.map(v => ({
        ...v,
        productId: product.id,
      }));
      await this.productRepository.createVariants(product.id, variantsToCreate);
    }

    // 4. Cria as imagens (se existirem, já devem estar na requisição do Admin)
    if (data.images && data.images.length > 0) {
      await this.productRepository.createImages(product.id, data.images);
    }

    // Retorna o produto completo
    return (await this.productRepository.findById(product.id)) as Product;
  }

  // ==========================================================
  // 2. ATUALIZAÇÃO DE PRODUTO (ADMIN)
  // ==========================================================
  async updateProduct(id: number, data: Partial<ProductData>, userId: number): Promise<Product> {
    const productExists = await this.productRepository.findById(id);

    if (!productExists) {
        throw new AppError("Produto não encontrado.", 404);
    }

    // 1. Atualiza o slug se o nome foi alterado e o slug não foi explicitamente fornecido
    if (data.name && !data.slug) {
        const newSlug = slugify(data.name);
        
        if (newSlug !== productExists.slug) {
            let counter = 1;
            let uniqueSlug = newSlug;
            while (await this.productRepository.findBySlug(uniqueSlug)) {
                uniqueSlug = `${newSlug}-${counter++}`;
                if (counter > 10) throw new AppError("Não foi possível gerar um slug único.", 500);
            }
            data.slug = uniqueSlug;
        }
    }

    const updateData: Partial<Product> = {
        categoryId: data.categoryId,
        slug: data.slug,
        name: data.name,
        description: data.description,
        price: data.price,
        oldPrice: data.oldPrice,
        discountPercent: data.discountPercent,
        sku: data.sku,
        status: data.status,
        isFeatured: data.isFeatured,
    };
    
    // Remove campos undefined para não sobrescrever com valores nulos indevidamente
    Object.keys(updateData).forEach(key => 
        (updateData as any)[key] === undefined && delete (updateData as any)[key]
    );

    // 2. Atualiza o produto base
    await this.productRepository.updateProduct(id, updateData);

    // 3. Se houver novas variantes, a lógica de atualização deve ser implementada no Repository
    // Por simplicidade aqui, vamos apenas ignorar a atualização de variantes/imagens por esta rota,
    // já que as rotas separadas (como ProductImageController) são o padrão mais limpo.

    return (await this.productRepository.findById(id)) as Product;
  }
  
  // ==========================================================
  // 3. CONSULTA DE PRODUTO
  // ==========================================================
  async getProductBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findBySlug(slug);

    if (!product) {
        throw new AppError("Produto não encontrado.", 404);
    }

    // Como o ProductRepository já faz o "populate" das imagens, basta retornar o produto
    return product;
  }

  async listProducts(params: { categoryId?: number, search?: string, featured?: boolean }): Promise<Product[]> {
    return this.productRepository.findAll(params);
  }

  // ==========================================================
  // 4. GERENCIAMENTO DE IMAGEM (Upload direto para S3/Disk)
  // Já estava funcionando, mas é bom ter o método aqui
  // ==========================================================
  async uploadImage(productId: number, filename: string): Promise<ProductImage> {
    const productExists = await this.productRepository.findById(productId);

    if (!productExists) {
      throw new AppError("Produto não encontrado.", 404);
    }
    
    const imageUrl = `${env.API_URL}/uploads/${filename}`;
    
    // Adiciona a imagem no banco. O primeiro upload deve ser a imagem principal (true)
    const imagesCount = productExists.images ? productExists.images.length : 0;
    const isMain = imagesCount === 0;

    return this.productRepository.addImage(productId, imageUrl, isMain);
  }

  // ==========================================================
  // 5. BAIXA DE ESTOQUE (Usado pelo OrderService)
  // ==========================================================
  async decreaseStock(productVariantId: number, quantity: number): Promise<void> {
    // Nota: Em produção, você precisaria fazer um LOCK na linha do banco de dados 
    // para evitar race conditions (dois clientes comprando a última unidade ao mesmo tempo).
    
    // Aqui, vamos apenas chamar o método do repositório
    await this.productRepository.decreaseStock(productVariantId, quantity);
  }
}