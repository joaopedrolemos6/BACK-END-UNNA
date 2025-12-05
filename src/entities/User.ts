// Certifique-se de que este arquivo User.ts existe e tem o enum Role
export enum Role {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  STORE = 'STORE'
}

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string; // Senha criptografada
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}