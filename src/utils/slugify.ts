/**
 * Converte uma string (como nome de produto) em um slug URL-safe.
 * Ex: "Camiseta Manga Longa Azul" -> "camiseta-manga-longa-azul"
 * @param text A string original.
 * @returns O slug gerado.
 */
export function slugify(text: string): string {
  // Converte para minúsculas, remove acentos/caracteres especiais e espaços
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove caracteres que não são letras, números, espaços ou hífens
    .replace(/[\s_-]+/g, '-') // Substitui espaços e múltiplos hífens por um único hífen
    .replace(/^-+|-+$/g, ''); // Remove hífens no início ou fim
}