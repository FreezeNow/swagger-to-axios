import fs from 'fs';
const fsPromises = fs.promises;
import axios from 'axios';
import YAML from 'js-yaml';
// 写文件
/**
 *
 * @param {string} pathname
 * @param {string} dataBuffer
 */
const writeFile = (pathname, dataBuffer) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(pathname, dataBuffer, (err) => {
            if (err) {
                reject(err);
            }
            else {
                // console.log(`${pathname.replace(/(.+\/)/, '')} 保存成功！`);
                resolve(true);
            }
        });
    });
};
// 首字母大写
const ucFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);
// 链接变成名称
const url2name = (str) => str
    .split('/')
    .reduce((accumulator, currentValue) => ucFirst(accumulator) + ucFirst(currentValue.replace('{', '').replace('}', '')));
/** 创建所有 API 文件
 * @param {Object[]} swaggerList - swagger 文档列表
 * @param {Object} config - 配置项
 */
const createApiFiles = async (swaggerList = [], config = {
    includeBaseURL: true,
    outputFolder: './apis',
    improtAxiosPath: '',
    https: false,
}) => {
    try {
        const { includeBaseURL, outputFolder, improtAxiosPath, https } = config;
        const swagger = {
            path: outputFolder ? outputFolder : './apis',
            list: [],
        };
        // 循环 swagger 文档列表
        for (const element of swaggerList) {
            // 获取文档并转换成 json
            const json = await axios
                .get(element.url)
                .then((res) => {
                if (element.urlType && element.urlType === 'json') {
                    return res.data;
                }
                const jsonData = YAML.load(res.data);
                return jsonData;
            })
                .catch((error) => console.error(error));
            // 创建文件夹对象
            const folderObj = {
                name: element.name,
                baseURL: json.basePath,
                host: json.host,
                list: [],
            };
            // 获取文档的 tags，并插入文件夹对象的 list 字段中
            if (json === null || json === void 0 ? void 0 : json.tags) {
                for (const tag of json.tags) {
                    folderObj.list.push({
                        name: tag.name,
                        comment: tag.description,
                        list: [],
                    });
                }
            }
            // 循环文档的 paths，取出 api 地址、类型、描述并放入 tag list 中
            for (const path in json.paths) {
                if (json.paths.hasOwnProperty(path)) {
                    const methods = json.paths[path];
                    for (const name in methods) {
                        if (methods.hasOwnProperty(name)) {
                            const method = methods[name];
                            const tag = folderObj.list.find((ele) => ele.name === method.tags[0]);
                            if (tag) {
                                const api = tag.list.find((ele) => ele.url === path);
                                if (api) {
                                    api.method.push(name);
                                    api.comment.push(method.summary);
                                }
                                else {
                                    tag.list.push({
                                        url: path,
                                        method: [name],
                                        comment: [method.summary],
                                    });
                                }
                            }
                            else {
                                folderObj.list.push({
                                    name: method.tags[0],
                                    comment: '',
                                    list: [
                                        {
                                            url: path,
                                            method: [name],
                                            comment: [method.summary],
                                        },
                                    ],
                                });
                            }
                        }
                    }
                }
            }
            // 将文件夹对象放入 swagger 对象的文件夹 list 中
            swagger.list.push(folderObj);
        }
        //
        await fsPromises.mkdir(`${swagger.path}`, { recursive: true });
        for (const folder of swagger.list) {
            await fsPromises.mkdir(`${swagger.path}/${folder.name}`, { recursive: true });
            for (const file of folder.list) {
                let fileContent = '';
                // 如果包含注释，则在文件顶部添加注释
                if (file.comment) {
                    fileContent += `// ${file.comment}
`;
                }
                fileContent += `const baseURL = '${folder.baseURL}';
const host = \`${folder.host && folder.host.includes('127.0.0.1')
                    ? folder.host
                    : "${process.env.VUE_APP_HOST ? process.env.VUE_APP_HOST : '基于隐私考虑，已隐藏默认ip'}"}\`;
${improtAxiosPath
                    ? `import request from '${improtAxiosPath}';
`
                    : ''}`;
                const apiList = file.list;
                for (const api of apiList) {
                    const urlParams = api.url.search(/{/) > -1 ? api.url.replace(/.+{(.+)}/, '$1') : '';
                    for (let l = 0; l < api.method.length; l++) {
                        const method = api.method[l];
                        fileContent += `
//  ${api.comment[l]}
export function ${method.toLowerCase() + url2name(api.url)}(${method.toUpperCase() === 'GET' ? 'params' : 'data'}, options) {
  return ${improtAxiosPath ? 'request' : 'window.axios'}({
    url: \`\${baseURL}${urlParams
                            ? api.url.replace(/{.+}/, '') + `\${${method.toUpperCase() === 'GET' ? 'params' : 'data'}.${urlParams}}`
                            : api.url}\`,${includeBaseURL !== false
                            ? `
    baseURL: \`${https ? 'https' : 'http'}://\${host}\`,`
                            : ''}
    method: '${method}',
    ${method.toLowerCase() === 'get' ? 'params' : 'data'},
    ...options,
  });
}
`;
                    }
                }
                await writeFile(`${swagger.path}${folder.name ? '/' + folder.name : ''}/${file.name}.js`, fileContent).catch((err) => console.log(err));
            }
        }
    }
    catch (error) {
        console.error('错误:', error);
    }
};
export default createApiFiles;
