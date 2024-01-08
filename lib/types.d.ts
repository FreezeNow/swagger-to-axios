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
declare interface Swagger {
    path: string;
    folderList: Folder[];
}
declare interface Folder {
    name: string;
    cliType: string;
    baseURL: string;
    host: string;
    tagList: Tag[];
}
declare interface Tag {
    name: string;
    comment: string;
    apiList: Api[];
}
declare interface Api {
    url: string;
    method: string;
    comment: {
        summary: string;
        description: string;
    };
    response?: any;
}
/** 生成 mock 文件配置项 */
declare interface MockConfig {
    /**
     * 使用的 mock 服务器类型。
     * 默认值：vite-plugin-mock。
     */
    mockType?: 'vite-plugin-mock' | 'umi';
    /**
     * 生成的文件所在目录。
     * 默认值：./mocks。
     * */
    outputFolder?: string;
}
declare interface MockSwagger {
    path: string;
    folderList: MockFolder[];
}
declare interface MockFolder {
    name: string;
    tagList: MockTag[];
}
declare interface MockTag {
    name: string;
    comment: string;
    apiList: MockApi[];
}
declare interface MockApi {
    url: string;
    method: string;
    comment: {
        summary: string;
        description: string;
    };
    response?: any;
}
