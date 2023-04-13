import fs from 'fs';
const fsPromises = fs.promises;
import axios from 'axios';
import YAML from 'js-yaml';
import { writeFile, urlToName, urlToLinkParams } from './utils/index.js';

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
const createApiFiles = async (swaggerList: SwaggerDocument[] = [], config: Config = {}) => {
  try {
    const {
      includeBaseURL = true,
      cliType = 'VueCli',
      envHostName = cliType === 'VueCli' ? 'VUE_APP_HOST' : 'VITE_APP_HOST',
      envProtocolName = cliType === 'VueCli' ? 'VUE_APP_PROTOCOL' : 'VITE_APP_PROTOCOL',
      https = false,
      outputFolder = './apis',
      improtAxiosPath,
      typeScript = false,
      urlInOptions = true,
    } = config;
    const swagger = {
      path: outputFolder,
      list: [] as Folder[],
    };
    // 循环 swagger 文档列表
    for (const element of swaggerList) {
      const { url, localFile = false, urlType = 'yaml', name = Math.random().toString() } = element;
      let json;
      if (localFile) {
        const fileString = await fsPromises.readFile(url, { encoding: 'utf8' }).catch((error) => console.error(error));
        if (!fileString) {
          console.log(`${url}下的文件没有内容，已跳过`);
          continue;
        }
        json = urlType === 'json' ? fileString : YAML.load(fileString);
      } else {
        // 获取文档并转换成 json
        json = await axios
          .get(url)
          .then((res) => {
            if (urlType && urlType === 'json') {
              return res.data;
            }
            const jsonData: any = YAML.load(res.data);
            return jsonData;
          })
          .catch((error) => console.error(error));
      }
      // 创建文件夹对象
      const folderObj: Folder = {
        name,
        cliType,
        baseURL: json.basePath,
        host: json.host,
        list: [],
      };
      // 获取文档的 tags，并插入文件夹对象的 list 字段中
      if (json?.tags) {
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
          } else {
            const hostCliTypeString = `${cliTypePrefix}${envHostName}`;
            fileContent += `const host = \`\${${hostCliTypeString} ? ${hostCliTypeString} : '${folder.host}'}\`;
`;
          }
          const protocolCliTypeString = `${cliTypePrefix}${envProtocolName}`;
          fileContent += `const protocol = \`\${${protocolCliTypeString} ? ${protocolCliTypeString} : 'http${
            https ? 's' : ''
          }'}\`;
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
        await writeFile(
          `${swagger.path}${folder.name ? '/' + folder.name : ''}/${file.name}.${typeScript ? 'ts' : 'js'}`,
          fileContent,
        ).catch((err) => console.log(err));
      }
    }
  } catch (error) {
    console.error('错误:', error);
  }
};
export default createApiFiles;
