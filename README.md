# 说明文档

这是一个用 swagger 文档生成用于 axios 的 api 文件的模块

使用这个模块需要先导入模块的默认导出，默认导出是一个函数。
这个函数的第一个参数（必填）为需要访问的文件名（文件名请访问内部的 api 接口文档地址网页）；第二个参数（选填）是可选配置项，具体内容参考代码提示。

```JavaScript
const swagger2axios = require('swagger-to-axios');
const folderNameList = [];
swagger2axios(folderNameList)
```
