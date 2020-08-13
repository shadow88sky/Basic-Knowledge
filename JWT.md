# JWT 和 Session
## 传统的session认证
用户名 + 密码 的basic认证，生成session存在服务器端的内存中，有几个缺点:
* 随着用户数增多，开销增大  
* 不支持分布式，如果服务有负载，需要引入redis这种共享内存数据  
* CSRF: 因为是基于cookie来进行用户识别的, cookie如果被截获，用户就会很容易受到跨站请求伪造的攻击。

## 基于token的鉴权机制
基于token的鉴权机制类似于http协议也是无状态的，它不需要在服务端去保留用户的认证信息或者会话信息。   
这就意味着基于token认证机制的应用不需要去考虑用户在哪一台服务器登录了，这就为应用的扩展提供了便利。

# JWT组成  
JWT由三个部分组成：header.payload.signature

## header   
```
{
  "alg": "HS256",
  "typ": "JWT"
}
```
对应base64UrlEncode编码为：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9   
说明：该字段为json格式。alg字段指定了生成signature的算法，默认值为 HS256，typ默认值为JWT  （加密算法:HS256,RS256...） 

## payload    
```
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}
```   

对应base64UrlEncode编码为：eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ   
说明：该字段为json格式，表明用户身份的数据，可以自己自定义字段，很灵活。sub 面向的用户，name 姓名 ,iat 签发时间。例如可自定义示例如下：   

```
{
    "iss": "admin",          //该JWT的签发者
    "iat": 1535967430,        //签发时间
    "exp": 1535974630,        //过期时间
    "nbf": 1535967430,         //该时间之前不接收处理该Token
    "sub": "www.admin.com",   //面向的用户
    "jti": "9f10e796726e332cec401c569969e13e"   //该Token唯一标识
}
```   
    
## signature    
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  123456
)
```   

对应的签名为：keH6T3x1z7mmhKL1T3r9sQdAxxdzB6siemGMr_6ZOwU    
最终得到的JWT的Token为(header.payload.signature)：     

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.keH6T3x1z7mmhKL1T3r9sQdAxxdzB6siemGMr_6ZOwU
```     

说明：对header和payload进行base64UrlEncode编码后进行拼接。通过key（这里是123456）进行HS256算法签名。   

# 缺点    

JWT的最大缺点是服务器不保存会话状态，所以在使用期间不可能取消令牌或更改令牌的权限。也就是说，一旦JWT签发，在有效期内将会一直有效。    
JWT本身包含认证信息，因此一旦信息泄露，任何人都可以获得令牌的所有权限。为了减少盗用，JWT的有效期不宜设置太长。对于某些重要操作，用户在使用时应该每次都进行进行身份验证。   
为了减少盗用和窃取，JWT不建议使用HTTP协议来传输代码，而是使用加密的HTTPS协议进行传输。
