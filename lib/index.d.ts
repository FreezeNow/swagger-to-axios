/** 创建所有 API 文件
 * @param {Object[]} swaggerList - swagger 文档列表
 * @param {Object} config - 配置项
 */
declare const createApiFiles: (swaggerList?: {
    /** swagger 文档地址 */
    url: string;
    /** 生成文件后该文档的文件夹名称 */
    name: string;
}[], config?: {
    /** 在生成文件时，每个函数是否携带 baseURL 属性. */
    includeBaseURL: boolean;
    /** 生成的文件所在目录，默认输出到当前目录的 apis 文件夹中（如果不存在导出文件夹会自动生成该文件夹） */
    outputFolder: string;
    /** 默认使用 window.axios，该值存在时，使用引用的方式，传入的值为引用文件地址 */
    improtAxiosPath: string;
}) => Promise<void>;
export default createApiFiles;
