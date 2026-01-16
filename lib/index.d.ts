import './types.js';
/** 创建所有 API 文件
 * @param {SwaggerDocument[]} swaggerList - swagger 文档列表
 * @param {Config} config - 配置项
 */
declare const createApiFiles: (swaggerList?: SwaggerDocument[], config?: Config) => Promise<void>;
export default createApiFiles;
