import { SwaggerDefinition } from 'swagger-jsdoc';
/** 获取 swagger 文档 */
export declare const getSwaggerJson: ({ localFile, url, urlType, }: {
    localFile: boolean;
    url: string;
    urlType: string;
}) => Promise<SwaggerDefinition | undefined>;
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
