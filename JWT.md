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
说明：该字段为json格式。alg字段指定了生成signature的算法，默认值为 HS256，typ默认值为JWT   

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
