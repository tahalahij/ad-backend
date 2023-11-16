import { forwardRef, Module } from "@nestjs/common";
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { ConfigService } from '@nestjs/config';
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [
    UserModule,
    PassportModule,
    forwardRef(() => AuditLogsModule),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get<string>('PASSPORT_JWT_SECRET'),
          signOptions: {
            expiresIn: config.get<string | number>('PASSPORT_JWT_EXPIRATION'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
