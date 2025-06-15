import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JsonWebTokenError, verify } from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const token = request.cookies.token;
      if (!token) {
        throw new ForbiddenException();
      }
      //verify token
      const verif = verify(token, process.env.TOKEN_KEY ?? 'x');
      request.user = verif;
      return true;
    } catch (error) {
      console.error(error);
      if (error instanceof JsonWebTokenError) {
        if (error.name == 'TokenExpiredError') {
          throw new UnauthorizedException();
        }
      }
      throw new ForbiddenException();
    }
  }
}
