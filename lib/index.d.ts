/** swagger 文档配置项 */
interface SwaggerDocument {
    /** swagger 文档地址 */
    url: string;
    /** swagger 文档文件类型， yaml 还是 json ，默认为 yaml */
    urlType: string;
    /** 生成文件后该文档的文件夹名称 */
    name: string;
}
/** 生成文件配置项 */
interface Config {
    /** 在生成文件时，每个函数是否携带 baseURL 属性. */
    includeBaseURL: boolean;
    /**
     * 如果 includeBaseURL 为 false，则不需要配置该项
     * cli类型，是 Vite 还是 VueCli ，默认 VueCli */
    cliType?: string;
    /**
     * 如果 includeBaseURL 为 false，则不需要配置该项
     * host 的配置名称，不填时会根据 cliType 属性自动设为 VUE_APP_HOST 或者 VITE_APP_HOST
     * 注：如果 swagger 的 host 填写了正确的地址，你也可以完全不配置该项，生成的代码会使用三目运算符，并将非的表达式设置为 swagger 的 host */
    envHostName?: string;
    /** 生成的文件所在目录，默认输出到当前目录的 apis 文件夹中（如果不存在导出文件夹会自动生成该文件夹） */
    outputFolder: string;
    /** 默认使用 window.axios，该值存在时，使用引用的方式，传入的值为引用文件地址 */
    improtAxiosPath: string;
    /** 该值存在时，baseURL 将使用 https 协议 */
    https: boolean;
    /** 是否生成 ts 文件，默认生成 js 文件 */
    typeScript: boolean;
}
/** 创建所有 API 文件
 * @param {SwaggerDocument[]} swaggerList - swagger 文档列表
 * @param {Config} config - 配置项
 */
declare const createApiFiles: (swaggerList?: SwaggerDocument[], config?: Config) => Promise<void>;
export default createApiFiles;
