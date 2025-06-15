import { SetMetadata } from '@nestjs/common';
export type Role = 'ADMIN' | 'EMPLOYEE';
export const ROLE_KEY = 'role';

export const Roles = (role: Role) => SetMetadata(ROLE_KEY, role);
