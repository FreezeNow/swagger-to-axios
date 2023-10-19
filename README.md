# 说明文档

这是一个用 swagger 文档生成用于 axios 的 api 文件的模块，支持生成 ts 和 js 文件。

使用这个模块需要先导入模块的默认导出，默认导出是一个函数。
这个函数的第一个参数（必填）为需要访问的文件名（文件名请访问内部的 api 接口文档地址网页）；第二个参数（选填）是可选配置项，配置内容如下。

```TypeScript
/** swagger 文档配置项 */
declare interface SwaggerDocument {
  /** swagger 文档地址 */
  url: string;
  /** 
   * 生成文件后该文档的文件夹名称。
   * 默认值：字符串随机数。
   * */
  name?: string;
}

/** 生成文件配置项 */
declare interface Config {
  /**
   * 生成文件时，每个函数是否携带 baseURL 属性。
   * 默认值：true。
   * */
  includeBaseURL?: boolean;
  /**
   * cli类型。
   * 默认值：VueCli。
   * 注：
   * 1、如果 includeBaseURL 为 false，则不需要配置该项。
   */
  cliType?: 'Vite' | 'VueCli';
  /**
   * host 的配置名称。
   * 默认值：VUE_APP_HOST | VITE_APP_HOST（根据 cliType 属性）。
   * 注：
   * 1、如果 includeBaseURL 为 false，则不需要配置该项。
   * 2、如果 swagger 的 host 填写了正确的地址，你也可以完全不配置该项，生成的代码会使用三目运算符，并将非的表达式设置为 swagger 的 host。
   */
  envHostName?: string;
  /**
   * 网络协议的配置名称。
   * 默认值：VUE_APP_PROTOCOL | VITE_APP_PROTOCOL（根据 cliType 属性）。
   * 注：
   * 1、如果 includeBaseURL 为 false，则不需要配置该项。
   * 2、推荐只在生产环境和开发环境使用不同协议时配置该项。
   * 3、VUE_APP_PROTOCOL / VITE_APP_PROTOCOL 的值应该为 'https' 或者 'http'。
   */
  envProtocolName?: string;
  /**
   * 是否使用 https。
   * 默认值：false。
   * 注：
   * 1、如果 includeBaseURL 为 false，则不需要配置该项。
   * */
  https?: boolean;
  /**
   * 生成的文件所在目录。
   * 默认值：./apis。
   * */
  outputFolder?: string;
  /**
   * 需要引用的 axios 函数地址。
   * 默认值：window.axios。
   * */
  improtAxiosPath?: string;
  /**
   * 是否生成 ts 文件。
   * 默认值：false。
   * */
  typeScript?: boolean;
  /**
   * url是否放置于 options 中。
   * 默认值：true。
   * 注：
   * 1、如为 false，则将放在第一个参数中。
   * */
  urlInOptions?: boolean;
}
```

## 参考用例

```JavaScript
const swagger2axios = require('swagger-to-axios');
const swaggerDocumentList = ['name'].map((name) => ({
  url: `http://127.0.0.1:14514/swagger?name=${name}.json`,
  name,
}));
swagger2axios(swaggerDocumentList, {
  includeBaseURL: false,
  improtAxiosPath: '@/utils/request',
  https: true
})

/**以下是生成的文件内容*/
// user.js
// 用户相关接口
import request from '@/utils/request';

const basePath = '/api/v1';

//  获取用户信息
export function getUserInfo(params, options) {
  return request({
    url: `${basePath}/user/info`,
    baseURL: `${protocol}://${host}`,
    method: 'get',
    params,
    ...options,
  });
}
```

## 注意事项
如果想使用 umi-request，需要写一个文件转换一下，之后将 improtAxiosPath 配置项指向该文件的地址就好了。你要问为什么需要转换一下，因为我懒得多想一个配置项的名称。下面是实例代码：
```JavaScript
import { request } from '@umijs/max';
export default request;
```