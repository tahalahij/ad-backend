import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getHashes, pbkdf2 } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class CryptoService {
  private readonly pbkdf2Async = promisify(pbkdf2);
  private readonly salt: string;
  private iterations: number;
  private keylen: number;
  private algorithm: string;

  constructor(private readonly configService: ConfigService) {
    this.iterations = parseInt(this.configService.get('HASH_ITERATION'));
    this.keylen = parseInt(this.configService.get('HASH_KEY_LENGTH'));
    this.algorithm = this.getProperDigest(this.configService.get('HASH_ALGORITHM'));
    this.salt = this.configService.get('HASH_SALT');
  }

  getProperDigest(hashAlgorithm: string) {
    const hashAlgo = getHashes().find((hash) => hash.toLocaleUpperCase() === hashAlgorithm?.toLocaleUpperCase());
    return hashAlgo || 'SHA256';
  }

  async hashValidation(password: string, hash: string): Promise<boolean> {
    const hashFromPassword: Buffer = await this.pbkdf2Async(
      password,
      this.salt,
      this.iterations,
      this.keylen,
      this.algorithm,
    );
    return hash === hashFromPassword.toString('hex');
  }

  async hashPassword(password: string) {
    const hashPass = await this.pbkdf2Async(password, this.salt, this.iterations, this.keylen, this.algorithm);
    return hashPass.toString('hex');
  }
}
