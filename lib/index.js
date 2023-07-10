import fs from 'fs';
const fsPromises = fs.promises;
import { writeFile, urlToName, urlToLinkParams, getSwaggerJson } from './utils/index.js';
/** 创建所有 API 文件
 * @param {SwaggerDocument[]} swaggerList - swagger 文档列表
 * @param {Config} config - 配置项
 */
const createApiFiles = async (swaggerList = [], config = {}) => {
    try {
        const { includeBaseURL = true, cliType = 'VueCli', envHostName = cliType === 'VueCli' ? 'VUE_APP_HOST' : 'VITE_APP_HOST', envProtocolName = cliType === 'VueCli' ? 'VUE_APP_PROTOCOL' : 'VITE_APP_PROTOCOL', https = false, outputFolder = './apis', improtAxiosPath, typeScript = false, urlInOptions = true, } = config;
        const swagger = {
            path: outputFolder,
            list: [],
        };
        // 循环 swagger 文档列表
        for (const element of swaggerList) {
            const { url, localFile = false, urlType = 'yaml', name = Math.random().toString() } = element;
            const json = await getSwaggerJson({ localFile, url, urlType });
            if (json === undefined)
                continue;
            // let json;
            // if (localFile) {
            //   const fileString = await fsPromises.readFile(url, { encoding: 'utf8' }).catch((error) => console.error(error));
            //   if (!fileString) {
            //     console.log(`${url}下的文件没有内容，已跳过`);
            //     continue;
            //   }
            //   json = urlType === 'json' ? fileString : YAML.load(fileString);
            // } else {
            //   // 获取文档并转换成 json
            //   json = await axios
            //     .get(url)
            //     .then((res) => {
            //       if (urlType && urlType === 'json') {
            //         return res.data;
            //       }
            //       const jsonData: any = YAML.load(res.data);
            //       return jsonData;
            //     })
            //     .catch((error) => console.error(error));
            // }
            // 创建文件夹对象
            const folderObj = {
                name,
                cliType,
                baseURL: json?.basePath ?? '',
                host: json?.host ?? '',
                list: [],
            };
            // 获取文档的 tags，并插入文件夹对象的 list 字段中
            if (json?.tags) {
                for (const tag of json.tags) {
                    folderObj.list.push({
                        name: tag.name,
                        comment: tag?.description ?? '',
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
                            let tag = folderObj.list.find((ele) => ele.name === method.tags[0]);
                            if (!tag) {
                                tag = {
                                    name: method.tags[0],
                                    comment: '',
                                    list: [],
                                };
                                folderObj.list.push(tag);
                            }
                            let api = tag.list.find((ele) => ele.url === path);
                            if (!api) {
                                api = {
                                    url: path,
                                    method: [],
                                    comment: [],
                                };
                                tag.list.push(api);
                            }
                            api.method.push(name);
                            api.comment.push({
                                summary: method.summary,
                                description: method.description,
                            });
                        }
                    }
                }
            }
            // 将文件夹对象放入 swagger 对象的文件夹 list 中
            swagger.list.push(folderObj);
        }
        // 生成文件夹
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
                if (improtAxiosPath) {
                    fileContent += `import request from '${improtAxiosPath}';
`;
                }
                fileContent += `const basePath = '${folder.baseURL}';
`;
                if (includeBaseURL) {
                    const cliTypePrefix = folder.cliType === 'Vite' ? `import.meta.env.` : `process.env.`;
                    if (folder.host && folder.host.includes('127.0.0.1')) {
                        fileContent += `const host = '${folder.host}';
`;
                    }
                    else {
                        const hostCliTypeString = `${cliTypePrefix}${envHostName}`;
                        fileContent += `const host = \`\${${hostCliTypeString} ? ${hostCliTypeString} : '${folder.host}'}\`;
`;
                    }
                    const protocolCliTypeString = `${cliTypePrefix}${envProtocolName}`;
                    fileContent += `const protocol = \`\${${protocolCliTypeString} ? ${protocolCliTypeString} : 'http${https ? 's' : ''}'}\`;
`;
                }
                const apiList = file.list;
                for (const api of apiList) {
                    for (let l = 0; l < api.method.length; l++) {
                        const method = api.method[l];
                        const { summary, description } = api.comment[l];
                        if (summary) {
                            fileContent += `
//  ${summary}`;
                        }
                        if (description) {
                            fileContent += `
//  ${description}`;
                        }
                        fileContent += `
`;
                        fileContent += `export function ${method.toLowerCase() + urlToName(api.url)}(`;
                        fileContent += method.toUpperCase() === 'GET' ? 'params' : 'data';
                        fileContent += `${typeScript ? '?: any' : ''}, options${typeScript ? '?: { [key: string]: any }' : ''}) {
  `;
                        fileContent += `return ${improtAxiosPath ? `request${typeScript ? '<any>' : ''}` : 'window.axios'}(`;
                        if (!urlInOptions) {
                            fileContent += `\`\${basePath}${urlToLinkParams(api.url, method)}\`, `;
                        }
                        fileContent += `{
    `;
                        if (urlInOptions) {
                            fileContent += `url: \`\${basePath}${urlToLinkParams(api.url, method)}\`,
    `;
                        }
                        if (includeBaseURL) {
                            fileContent += `baseURL: \`\${protocol}://\${host}\`,
    `;
                        }
                        fileContent += `method: '${method}',
    ${method.toLowerCase() === 'get' ? 'params' : 'data'},
    ...(options || {}),
  });
}
`;
                    }
                }
                await writeFile(`${swagger.path}${folder.name ? '/' + folder.name : ''}/${file.name}.${typeScript ? 'ts' : 'js'}`, fileContent).catch((err) => console.log(err));
            }
        }
    }
    catch (error) {
        console.error('错误:', error);
    }
};
export default createApiFiles;
