import { HttpStatus, InternalServerErrorException, Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { FileModule } from './file/file.module';
import { DeviceModule } from './device/device.module';
import { ScheduleModule } from './schedule/schedule.module';
import { StatisticsModule } from './statistics/statistics.module';
import { APP_PIPE } from '@nestjs/core';

@Module({
  imports: [
    UserModule,
    ScheduleModule,
    FileModule,
    DeviceModule,
    AuthModule,
    StatisticsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      expandVariables: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        uri: config.get('MONGO_CONNECTION_URL'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName:config.get('MONGO_DB_NAME')
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
          if (errors?.length > 0) {
            throw new InternalServerErrorException({
              errors: errors.map(({ property, constraints }) => ({
                property,
                errors: constraints && Object.values(constraints),
              })),
              statusCode: HttpStatus.BAD_REQUEST,
            });
          }
          return errors;
        },
      }),
    },
  ],
})
export class AppModule {}
