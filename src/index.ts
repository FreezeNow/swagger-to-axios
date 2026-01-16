import fs from 'fs';
const fsPromises = fs.promises;
import { writeFile, urlToName, urlToLinkParams, getFolderList } from './utils/index.js';
import './types.js';

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
      namedImport,
      typeScript = false,
      namespace = 'API',
      urlInOptions = true,
    } = config;
    const swagger: Swagger = {
      path: outputFolder,
      folderList: await getFolderList(swaggerList, cliType),
    };

    // 生成文件夹
    await fsPromises.mkdir(`${swagger.path}`, { recursive: true });
    for (const folder of swagger.folderList) {
      await fsPromises.mkdir(`${swagger.path}/${folder.name}`, { recursive: true });
      let typings = `declare namespace ${namespace} {`;
      for (const file of folder.tagList) {
        let fileContent = '';
        // 如果包含注释，则在文件顶部添加注释
        if (file.comment) {
          fileContent += `// ${file.comment}
`;
        }
        if (improtAxiosPath) {
          fileContent += `import ${namedImport ? `{ ${namedImport} as request}` : 'request'} from '${improtAxiosPath}';
`;
        }
        fileContent += `
const basePath = '${folder.baseURL}';
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

        const apiList = file.apiList;
        for (const api of apiList) {
          const method = api.method;
          const functionName = method.toLowerCase() + urlToName(api.url);
          if (api?.response) {
            typings += `
  type ${functionName}Response = ${api.response.data}`;
          }
          const { summary, description } = api.comment;
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
          fileContent += `export function ${functionName}(`;
          fileContent += method.toUpperCase() === 'GET' ? 'params' : 'data';
          fileContent += `${typeScript ? '?: any' : ''}, options${typeScript ? '?: { [key: string]: any }' : ''}) {
  `;
          fileContent += `return ${improtAxiosPath ? `request` : 'window.axios'}${
            typeScript ? `<${namespace}.${functionName}Response>` : ''
          }(`;
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

        await writeFile(
          `${swagger.path}${folder.name ? '/' + folder.name : ''}/${file.name}.${typeScript ? 'ts' : 'js'}`,
          fileContent,
        ).catch((err) => console.log(err));
      }
      typings += `
}`;
      if (typeScript) {
        await writeFile(`${swagger.path}${folder.name ? '/' + folder.name : ''}/typings.d.ts`, typings).catch((err) =>
          console.log(err),
        );
      }
    }
  } catch (error) {
    console.error('错误:', error);
  }
};

// /** 生成 mock 文件
//  * @param {SwaggerDocument[]} swaggerList - swagger 文档列表
//  * @param {MockConfig} mockConfig - 配置项
//  */
// const createMockFiles = async (
//   swaggerList: SwaggerDocument[] = [],
//   { mockType = 'vite-plugin-mock', outputFolder = './mocks' }: MockConfig = {},
// ) => {
//   const swagger: Swagger = {
//     path: outputFolder,
//     folderList: await getFolderList(swaggerList, ''),
//   };

//   switch (mockType) {
//     case 'vite-plugin-mock':
//       break;

//     default:
//       break;
//   }
// };
export default createApiFiles;
// export { createMockFiles };
