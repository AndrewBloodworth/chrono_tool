const fs = require("fs");
const crypto = require("crypto");

module.exports = class Encryption {
  constructor(path) {
    this.path = path;
  }
  encrypt(text) {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(
      process.env.ALGORITHM,
      crypto.scryptSync(process.env.SECRET, "salt", 24),
      iv
    );

    fs.writeFileSync(
      this.path,
      JSON.stringify({
        iv,
        encrypted: cipher.update(text, "utf8", "hex") + cipher.final("hex"),
      })
    );
  }
  decrypt() {
    try {
      const {
        iv: { data },
        encrypted,
      } = require(this.path);

      const decipher = crypto.createDecipheriv(
        process.env.ALGORITHM,
        crypto.scryptSync(process.env.SECRET, "salt", 24),
        Buffer.from(data)
      );

      return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
    } catch (error) {
      return null;
    }
  }
};
