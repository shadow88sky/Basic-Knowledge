# Node.js中的Pipe原理  
在学习原理之前，先要深入了解可读和可写流
## 可读流
* flowing模式：可读流 自动(不断的) 从底层读取数据（直到读取完毕），并通过EventEmitter 接口的事件尽快将数据提供给应用   
* paused模式：必须显示调用stream.read() 方法来从流中读取数据片段   

下来我们先来看一段代码（1.txt里面内容为1234567890）:    
```js
let fs = require("fs");
let rs = fs.createReadStream('1.txt',{   //这些参数是可选的，不需要精细控制可以不设置
    flags:'r',      //文件的操作是读取操作
    encoding:'utf8',//默认是null,null代表buffer,会按照encoding输出内容
    highWaterMark:3,//单位是字节，表示一次读取多少字节，默认是64k
    autoClose:true,//读完是否自动关闭
    start:0,       //读取的起始位置
    end:9          //读取的结束位置,包括9这个位置的内容
})
//rs.setEncoding('utf8');  //可以设置编码方式

rs.on('open',() => {
    console.log('open');
})

rs.on('data',data => {  //消费数据,变为flowing流动模式
     console.log('data');
})

rs.on('error',() => {
    console.log('error');
})
rs.on('end',() => {
    console.log('end');
})
rs.on('close',() => {
    console.log('close');
})
```
执行结果为:
```
open
123
456
789
end
close
```

1. fs.createReadStream创建可读流实例时，默认打开文件，触发open事件(并不是每个流都会触发open事件)，
但此时并不会将文件中的内容输出(因为处于‘暂停模式’,没有事件消费)，而是将数据存储到内部的缓冲器buffer,buffer的大小取决于highWaterMark参数，
读取大小达到highWaterMark指定的阈值时，流会暂停从底层资源读取数据，直到当前缓冲器的数据被消费   
2. 这里的rs可以理解为流的消费者，当消费者监听了'data'事件时，就开始消费数据，可读流会从paused切换到flowing“流动模式”，不断的向消费者提供数据，直到没有数据   
3. 从打印结果可以看出，可读流每次读取highWaterMark个数据，交给消费者，所以先打印123，再打印456 ... ...   
4. 当读完文件，也就是数据被完全消费后，触发end事件   
5. 最后流或者底层资源文件关闭后，这里就是1.txt这个文件关闭后，触发close事件   
6. error事件通常会在底层系统内部出错从而不能产生数据，或当流的实现试图传递错误数据时发生。    
7. fs.createReadStream第二个参数是可选的，可不填，或只设置部分，比如编码，不需要精细控制可以不设置   

### 手动切换成pause模式    
```js
rs.on('data',data => { // 暂停模式 -> 流动模式
    console.log(data);
    rs.pause(); // 暂停方法 表示暂停读取，暂停data事件触发
    setTimeout(()=> {
       rs.resume(); // 恢复data事件触发，变为流动模式
    },1000)
});
```

## 可写流
```js
let fs = require('fs');
let ws = fs.createWriteStream('./1.txt', {
    flags: 'w',
    mode: 0o666,
    autoClose: true,
    highWaterMark: 3, // 默认是16k ，而createReadStream是64k
    encoding: 'utf8', //默认是utf8
    start: 0
});
for (let i = 0; i < 4; i++) {
    let flag = ws.write(i + '');
    console.log(flag)
}
ws.end("ok"); // 标记文件末尾

ws.on('open', () => {
    console.log('open')
});

ws.on('error', err => {
    console.log(err);
});

ws.on('finish', () => {
    console.log('finish');
});

ws.on('close', () => {
    console.log('close')
});
```   

打印结果:
```
true
true
false
false
open
finish
close
```

1. fs.createWriteStream创建可写流,同样默认会打开文件    
2. 可写流通过反复调用 ws.write(chunk) 方法将数据放到内部缓冲器；    
写入的数据chunk必须是字符串或者buffer；   
write虽然是个异步方法，但有返回值，这个返回值flag的含义，不是文件是否写入，而是表示能否继续写入；   
即缓冲器总大小 < highWaterMark时，可以继续写入，flag为true； 一旦内部缓冲器大小达到或超过highWaterMark，flag返回false；   
注意，即使flag为flase，写入的内容也不会丢失    
3. 上例中指定的highWaterMark是3，调用write时一次写入了一个字节，当调用第三次write方法时，缓冲器中的数据大小达到3这个阈值，开始返回flase，所以先打印了两次true，后打印了两次false   
4. ws.end("ok"); end方法用来标记文件末尾，表示接下来没有数据要写入可写流；   
可以传入可选的 chunk 和 encoding 参数，在关闭流之前再写入一段数据；    
如果传入了可选的 callback 函数，它将作为 'finish' 事件的回调函数。所以'ok'会被写入文件末尾。    
注意，ws.write()方法必须在ws.end()方法之前调用    
5. 在调用了 ws.end() 方法，且缓冲区数据都已经传给底层系统（这里是文件1.txt）之后， 'finish' 事件将被触发。   
6. 'close' 事件将在流或其底层资源（比如一个文件）关闭后触发。'close'事件触发后，该流将不会再触发任何事件。不是所有 可写流/可读流 都会触发 'close' 事件。   

### drain事件
    
     如果调用 stream.write(chunk) 方法返回 false，'drain' 事件会在适合恢复写入数据到流的时候触发。
     
触发条件：
* 缓冲器满了，即write返回false   
* 缓冲器的数据都写入到流，即数据都被消费掉后，才会触发

将上面的for循环改成   
```js
let i = 8;
function write(){
    let flag = true;
    while(i>0&&flag){
        flag = ws.write(--i+'','utf8',()=>{});
        console.log(flag)
    }

    if(i <= 0){
        ws.end("ok");
    }
 }
 write();
 // drain只有当缓存区充满后 ，并且被消费后触发
 ws.on('drain',function(){
   console.log('drain');
   write();
 });
```
打印
```
true
true
false
open
drain
true
true
false
drain
true
true
finish
close
```

## Pipe原理
所以结合上面所说内容，我们可以将pipe原理用代码实现出来:
```js
let fs = require('fs');
let rs = fs.createReadStream('1.txt',{
    highWaterMark:4
});
let ws = fs.createWriteStream('2.txt',{
    highWaterMark:3
});
//rs.pipe(ws);   //可读流上调用pipe()方法，pipe方法就是读一点写一点
rs.on('data',function(chunk){ // chunk 读到的内容
    let flag = ws.write(chunk);
    if(!flag){  //如果缓冲器满了，写不下了，就停止读
        rs.pause();
    }
});
ws.on('drain',function(){ //当缓存都写到文件了，恢复读
    console.log('写一点');
    rs.resume();
});
```

```
