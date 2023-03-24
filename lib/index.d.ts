/** swagger 文档配置项 */
interface SwaggerDocument {
    /** swagger 文档地址 */
    url: string;
    /** 是否使用本地 swagger 文档，默认为 false。
     * 如果该项为 true，则 url 应填本地地址，建议填写完整路径 */
    localFile?: boolean;
    /** swagger 文档文件类型，yaml 还是 json ，默认为 yaml */
    urlType?: string;
    /** 生成文件后该文档的文件夹名称，默认会使用随机数作为文件夹名称 */
    name?: string;
}
/** 生成文件配置项 */
interface Config {
    /** 在生成文件时，每个函数是否携带 baseURL 属性，默认为 true。 */
    includeBaseURL?: boolean;
    /**
     * 如果 includeBaseURL 为 false，则不需要配置该项。
     * cli类型，是 Vite 还是 VueCli ，默认 VueCli。
     */
    cliType?: string;
    /**
     * 如果 includeBaseURL 为 false，则不需要配置该项。
     * host 的配置名称，不填时会根据 cliType 属性自动设为 VUE_APP_HOST 或者 VITE_APP_HOST。
     * 如果 swagger 的 host 填写了正确的地址，你也可以完全不配置该项，生成的代码会使用三目运算符，并将非的表达式设置为 swagger 的 host。
     */
    envHostName?: string;
    /**
     * 如果 includeBaseURL 为 false，则不需要配置该项。
     * 网络协议的配置名称，不填时会根据 cliType 属性自动设为 VUE_APP_PROTOCOL 或者 VITE_APP_PROTOCOL。
     * VUE_APP_PROTOCOL / VITE_APP_PROTOCOL 的值应该为 'https' 或者 'http'。
     */
    envProtocolName?: string;
    /**
     * 如果 includeBaseURL 为 false，则不需要配置该项。
     * 是否使用 https，默认为 false。 */
    https?: boolean;
    /** 生成的文件所在目录，默认为 ./apis。 */
    outputFolder?: string;
    /** 需要引用的 axios 函数地址，默认为 window.axios。 */
    improtAxiosPath?: string;
    /** 是否生成 ts 文件，默认为 false。 */
    typeScript?: boolean;
    /** url是否放置于 options 中，默认为 true。如为 false，则将放在第一个参数中。 */
    urlInOptions?: boolean;
}
/** 创建所有 API 文件
 * @param {SwaggerDocument[]} swaggerList - swagger 文档列表
 * @param {Config} config - 配置项
 */
declare const createApiFiles: (swaggerList?: SwaggerDocument[], config?: Config) => Promise<void>;
export default createApiFiles;
