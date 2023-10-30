import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
/**
 * 合并 allOf
 * @param object
 */
export declare const expandAllOf: (object: any) => void;
/** 获取 swagger 文档 */
export declare const getSwaggerJson: ({ url, }: {
    url: string;
}) => Promise<OpenAPIV3.Document | OpenAPIV3_1.Document | undefined>;
/**
 * 获取 swagger 文档列表
 * @param {SwaggerDocument[]} swaggerList - swagger 文档列表
 * @param {Config['cliType']} cliType - cli类型
 * @returns {Promise<Folder[]>} 文件夹数组
 */
export declare const getFolderList: (swaggerList: SwaggerDocument[], cliType: string) => Promise<Folder[]>;
/** 重组 tag 数组 */
export declare const getTagList: (tags?: OpenAPIV3.TagObject[], paths?: OpenAPIV3.PathsObject) => Tag[];
/** 将 openapi 类型转换为 TS 类型 */
export declare const openapiTypeToTypeScript: (schemaObject: OpenAPIV3.SchemaObject) => string;
/** 重组 response */
export declare const getResponse: (response?: OpenAPIV3.ResponseObject) => {
    description: string;
    data?: any;
} | undefined;
/**
 * 写文件
 * @param {string} pathname
 * @param {string} dataBuffer
 */
export declare const writeFile: (pathname: string, dataBuffer: string) => Promise<boolean>;
/** 首字母大写 */
export declare const upperFirstCase: (str: string) => string;
/** 链接变成名称 */
export declare const urlToName: (str: string) => string;
/**
 * 链接变成带参链接（/record/{recordID}/{userID} GET 变成 /record/${params.recordID}/${params.userID}）
 * @param {string} url 链接名
 * @param {string} method http方法
 * @return {string} 转换后的链接
 */
export declare const urlToLinkParams: (url: string, method: string) => string;
