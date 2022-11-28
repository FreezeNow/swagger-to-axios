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
const writeFile = (pathname: string, dataBuffer: string) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(pathname, dataBuffer, (err) => {
      if (err) {
        reject(err);
      } else {
        // console.log(`${pathname.replace(/(.+\/)/, '')} 保存成功！`);
        resolve(true);
      }
    });
  });
};

// 首字母大写
const ucFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// 链接变成名称
const url2name = (str: string) =>
  str
    .split('/')
    .reduce(
      (accumulator: string, currentValue: string) =>
        ucFirst(accumulator) + ucFirst(currentValue.replace('{', '').replace('}', '')),
    );
/**
 * 链接变成带参链接（/record/{recordID}/{userID} GET 变成 /record/${params.recordID}/${params.userID}）
 * @param {string} url 链接名
 * @param {string} method http方法
 * @return {string} 转换后的链接
 */
const urlTolinkParams = (url: string, method: string) => {
  const urls = url.split('/');
  let result = '';
  for (let i = 0; i < urls.length; i++) {
    const element = urls[i];
    if (!element) {
      continue;
    }
    if (!element.startsWith('{')) {
      result += `/${element}`;
    } else {
      result += `/\${${method.toUpperCase() === 'GET' ? 'params' : 'data'}.${element.replace(/{(.+)}/, '$1')}}`;
    }
  }
  return result;
};

interface Api {
  url: string;
  method: string[];
  comment: string[];
}

interface Tag {
  name: string;
  comment: string;
  list: Api[];
}

interface Folder {
  name: string;
  cliType: string;
  baseURL: string;
  host: string;
  list: Tag[];
}

/** 创建所有 API 文件
 * @param {Object[]} swaggerList - swagger 文档列表
 * @param {Object} config - 配置项
 */
const createApiFiles = async (
  swaggerList: {
    /** swagger 文档地址 */
    url: string;
    /** swagger 文档文件类型， yaml 还是 json ，默认为 yaml */
    urlType: string;
    /** 生成文件后该文档的文件夹名称 */
    name: string;
    /** cli类型，是 vite 还是 vueCli，默认 vueCli */
    cliType: string;
  }[] = [],
  config: {
    /** 在生成文件时，每个函数是否携带 baseURL 属性. */
    includeBaseURL: boolean;
    /** 生成的文件所在目录，默认输出到当前目录的 apis 文件夹中（如果不存在导出文件夹会自动生成该文件夹） */
    outputFolder: string;
    /** 默认使用 window.axios，该值存在时，使用引用的方式，传入的值为引用文件地址 */
    improtAxiosPath: string;
    /** 该值存在时，baseURL 将使用 https 协议 */
    https: boolean;
  } = {
    includeBaseURL: true,
    outputFolder: './apis',
    improtAxiosPath: '',
    https: false,
  },
  // swaggerList: SwaggerList[] = [],
  // config: Config = {
  //   includeBaseURL: true,
  //   outputFolder: './apis',
  //   improtAxiosPath: '',
  // },
) => {
  try {
    const { includeBaseURL, outputFolder, improtAxiosPath, https } = config;
    const swagger = {
      path: outputFolder ? outputFolder : './apis',
      list: [] as Folder[],
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
          const jsonData: any = YAML.load(res.data);
          return jsonData;
        })
        .catch((error) => console.error(error));
      // 创建文件夹对象
      const folderObj: Folder = {
        name: element.name,
        cliType: element.cliType,
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
              const tag = folderObj.list.find((ele) => ele.name === method.tags[0]);
              if (tag) {
                const api = tag.list.find((ele) => ele.url === path);
                if (api) {
                  api.method.push(name);
                  api.comment.push(method.summary);
                } else {
                  tag.list.push({
                    url: path,
                    method: [name],
                    comment: [method.summary],
                  });
                }
              } else {
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
`;
        if (folder.host && folder.host.includes('127.0.0.1')) {
          fileContent += `const host = '${folder.host}';
`;
        } else {
          const cliTypeString =
            folder.cliType === 'vite' ? 'import.meta.env.VITE_APP_HOST' : 'process.env.VUE_APP_HOST';
          fileContent += `const host = \`\${${cliTypeString} ? ${cliTypeString} : '基于隐私考虑，已隐藏默认ip'}\`;
`;
        }
        if (improtAxiosPath) {
          fileContent += `import request from '${improtAxiosPath}';
`;
        }

        const apiList = file.list;
        for (const api of apiList) {
          for (let l = 0; l < api.method.length; l++) {
            const method = api.method[l];
            fileContent += `
//  ${api.comment[l]}
export function ${method.toLowerCase() + url2name(api.url)}(${
              method.toUpperCase() === 'GET' ? 'params' : 'data'
            }, options) {
  return ${improtAxiosPath ? 'request' : 'window.axios'}({
    url: \`\${baseURL}${urlTolinkParams(api.url, method)}\`,${
              includeBaseURL !== false
                ? `
    baseURL: \`${https ? 'https' : 'http'}://\${host}\`,`
                : ''
            }
    method: '${method}',
    ${method.toLowerCase() === 'get' ? 'params' : 'data'},
    ...options,
  });
}
`;
          }
        }
        await writeFile(`${swagger.path}${folder.name ? '/' + folder.name : ''}/${file.name}.js`, fileContent).catch(
          (err) => console.log(err),
        );
      }
    }
  } catch (error) {
    console.error('错误:', error);
  }
};
export default createApiFiles;
