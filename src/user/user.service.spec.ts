import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';
import mongoose from 'mongoose';
import { CryptoService } from './crypto.service';
import { ConfigModule } from '@nestjs/config';

const mockUserModel = () => ({
  findOne:()=>({
    _id: new mongoose.Types.ObjectId('63cd1f5e9c9abe5feca3fad6'),
    name: 'user 1',
    email: 'user1@gmail.com',
    password: 'b22803518320f6f0c7088129530d03ef5f7ab3c6354328a7d4809dac483fe3e4028447ed56c7799d163b6b884e7997821a21a18c00e1e6fba44447159027b765', //hash of '123'
    createdAt: new Date(),
  })
});
describe('UserService', () => {
  let service: UserService;
  let cryptoService: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env'],
          expandVariables: true,
        }),
      ],
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useFactory: mockUserModel,
        },
        CryptoService,
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should  validate User', async () => {
    mockUserModel['findOne'] = jest.fn().mockResolvedValue({
      _id: new mongoose.Types.ObjectId('63cd1f5e9c9abe5feca3fad6'),
      name: 'user 1',
      email: 'user1@gmail.com',
      password: await cryptoService.hashPassword('123'),
      createdAt: new Date(),
    });

    const { name, id } = await service.validateUser({ password: '123', email: 'user1@gmail.com' });
    expect(name).toBe('user 1');
    expect(String(id)).toBe('63cd1f5e9c9abe5feca3fad6');
  });
});
