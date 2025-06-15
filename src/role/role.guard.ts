import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Role, ROLE_KEY } from 'src/decorators/role.decorator';

export class DecodedTokenDTO {
  user_id: string;
  role: Role;
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const sess = request.user as DecodedTokenDTO;
    const allowedRole = this.reflector.getAllAndOverride<Role>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (sess.role != allowedRole) {
      throw new ForbiddenException({
        message: 'Forbidden',
      });
    }

    return true;
  }
}
