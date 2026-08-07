import crypto from 'crypto';

export class PaytmChecksum {
  private static iv = '4641041059261441';

  static async encrypt(input: string, key: string): Promise<string> {
    const cipher = crypto.createCipheriv('aes-128-cbc', key, this.iv);
    let encrypted = cipher.update(input, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  static async decrypt(encrypted: string, key: string): Promise<string> {
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, this.iv);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  static async generateSignature(params: Record<string, any> | string, key: string): Promise<string> {
    if (typeof params !== 'string' && typeof params !== 'object') {
      throw new Error(`String or Object expected, got ${typeof params}`);
    }
    let data: string;
    if (typeof params === 'object') {
      data = this.getStringByParams(params);
    } else {
      data = params;
    }

    return this.generateSignatureByString(data, key);
  }

  static async generateSignatureByString(params: string, key: string): Promise<string> {
    const salt = await this.generateRandomString(4);
    return this.calculateHash(params, salt, key);
  }

  static async verifySignature(params: Record<string, any> | string, key: string, checksum: string): Promise<boolean> {
    if (typeof params !== 'object' && typeof params !== 'string') {
      throw new Error(`String or Object expected, got ${typeof params}`);
    }

    if (params && typeof params === 'object' && 'CHECKSUMHASH' in params) {
      delete params.CHECKSUMHASH;
    }

    let data: string;
    if (typeof params === 'object') {
      data = this.getStringByParams(params);
    } else {
      data = params;
    }

    return this.verifySignatureByString(data, key, checksum);
  }

  static async verifySignatureByString(params: string, key: string, checksum: string): Promise<boolean> {
    try {
      const paytmHash = await this.decrypt(checksum, key);
      const salt = paytmHash.substr(paytmHash.length - 4);
      const calculatedHash = await this.calculateHash(params, salt, key);
      return paytmHash === (await this.decrypt(calculatedHash, key));
    } catch (e) {
      return false;
    }
  }

  private static async generateRandomString(length: number): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.randomBytes((length * 300) / 4, (err, buf) => {
        if (err) return reject(err);
        const salt = buf.toString('base64').replace(/[^a-zA-Z0-9]/g, '').substr(0, length);
        resolve(salt);
      });
    });
  }

  private static getStringByParams(params: Record<string, any>): string {
    const data: Record<string, any> = {};
    Object.keys(params)
      .sort()
      .forEach((key) => {
        const val = params[key] !== undefined && params[key] !== null ? String(params[key]) : '';
        if (val !== 'null' && val !== 'undefined') {
          data[key] = val;
        }
      });
    return Object.values(data).join('|');
  }

  private static async calculateHash(params: string, salt: string, key: string): Promise<string> {
    const finalString = `${params}|${salt}`;
    const sha256 = crypto.createHash('sha256').update(finalString).digest('hex');
    const hashAndSalt = sha256 + salt;
    return this.encrypt(hashAndSalt, key);
  }
}
