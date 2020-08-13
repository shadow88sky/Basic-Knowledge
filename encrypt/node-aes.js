const crypto = require("crypto");

const algorithm = 'aes-256-cbc';
const password = '用于生成秘钥的密码';
// 注意: 如果把key换成16位，就会报错了，因为aes-256-cbc应该是32字节长度秘钥
const key = crypto.scryptSync(password, '盐值', 32);
const iv = Buffer.alloc(16, 0); // 初始化向量。
function encrypt(text) {
    var cipher = crypto.createCipheriv(algorithm, key, iv);
    cipher.update(text, "utf8");
    return cipher.final("base64");
}
function decrypt(text) {
    var cipher = crypto.createDecipheriv(algorithm, key, iv);
    cipher.update(text, "base64");
    return cipher.final("utf8");
}

var text = "ni你好hao";
var encoded = encrypt(text)
console.log(encoded);
console.log(decrypt(encoded))


