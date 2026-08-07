import crypto from 'crypto';

export class PaytmChecksum {
  private static iv = '@@@@&&&&####$$$$';

  static async encrypt(input: string, key: string): Promise<string> {
    const cipher = crypto.createCipheriv('AES-128-CBC', key, this.iv);
    let encrypted = cipher.update(input, 'binary', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  static async decrypt(encrypted: string, key: string): Promise<string> {
    const decipher = crypto.createDecipheriv('AES-128-CBC', key, this.iv);
    let decrypted = decipher.update(encrypted, 'base64', 'binary');
    try {
      decrypted += decipher.final('binary');
    } catch (e) {
      console.log(e);
    }
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
    return this.calculateChecksum(params, key, salt);
  }

  static async verifySignature(params: Record<string, any> | string, key: string, checksum: string): Promise<boolean> {
    if (typeof params !== 'string' && typeof params !== 'object') {
      throw new Error(`String or Object expected, got ${typeof params}`);
    }

    let data: string;
    if (typeof params === 'object') {
      const copy = { ...params };
      if ('CHECKSUMHASH' in copy) {
        delete copy.CHECKSUMHASH;
      }
      data = this.getStringByParams(copy);
    } else {
      data = params;
    }

    return this.verifySignatureByString(data, key, checksum);
  }

  static async verifySignatureByString(params: string, key: string, checksum: string): Promise<boolean> {
    try {
      const paytmHash = await this.decrypt(checksum, key);
      const salt = paytmHash.substr(paytmHash.length - 4);
      const calculatedHash = this.calculateHash(params, salt);
      return paytmHash === calculatedHash;
    } catch (e) {
      return false;
    }
  }

  private static generateRandomString(length: number): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.randomBytes((length * 3.0) / 4.0, (err, buf) => {
        if (err) return reject(err);
        const salt = buf.toString('base64');
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

  private static calculateHash(params: string, salt: string): string {
    const finalString = `${params}|${salt}`;
    return crypto.createHash('sha256').update(finalString).digest('hex') + salt;
  }

  private static calculateChecksum(params: string, key: string, salt: string): Promise<string> {
    const hashString = this.calculateHash(params, salt);
    return this.encrypt(hashString, key);
  }
}
