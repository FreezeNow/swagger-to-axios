# 说明文档

这是一个用 swagger 文档生成用于 axios 的 api 文件的模块，支持生成 ts 和 js 文件。

使用这个模块需要先导入模块的默认导出，默认导出是一个函数。
这个函数的第一个参数（必填）为需要访问的文件名（文件名请访问内部的 api 接口文档地址网页）；第二个参数（选填）是可选配置项，配置内容如下。

```TypeScript
/** 生成文件配置项 */
interface Config {
  /** 在生成文件时，每个函数是否携带 baseURL 属性，默认为 true */
  includeBaseURL?: boolean;
  /**
   * 如果 includeBaseURL 为 false，则不需要配置该项
   * cli类型，是 Vite 还是 VueCli ，默认 VueCli
   */
  cliType?: string;
  /**
   * 如果 includeBaseURL 为 false，则不需要配置该项
   * host 的配置名称，不填时会根据 cliType 属性自动设为 VUE_APP_HOST 或者 VITE_APP_HOST
   * 注：如果 swagger 的 host 填写了正确的地址，你也可以完全不配置该项，生成的代码会使用三目运算符，并将非的表达式设置为 swagger 的 host
   */
  envHostName?: string;
  /** 生成的文件所在目录，默认为 ./apis */
  outputFolder?: string;
  /** 需要引用的 axios 函数地址，默认为 window.axios */
  improtAxiosPath?: string;
  /** 是否使用 https，默认为 false */
  https?: boolean;
  /** 是否生成 ts 文件，默认为 false */
  typeScript?: boolean;
}
```

以下是参考用例

```JavaScript
const swagger2axios = require('swagger-to-axios');
const folderNameList = ['name'].map((name) => ({
  url: `http://127.0.0.1:114514/swagger?name=${name}.json`,
  urlType: 'json',
  name,
}));
swagger2axios(folderNameList,{
  includeBaseURL: true,
  cliType: 'Vite',
  improtAxiosPath: '@/utils/request',
})
```
