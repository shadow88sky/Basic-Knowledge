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

