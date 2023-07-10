import fsPromises from 'fs/promises';
import YAML from 'js-yaml';
import axios from 'axios';
import { SwaggerDefinition } from 'swagger-jsdoc';

/** 获取 swagger 文档 */
export const getSwaggerJson = async ({
  localFile,
  url,
  urlType,
}: {
  localFile: boolean;
  url: string;
  urlType: string;
}): Promise<SwaggerDefinition | undefined> => {
  if (localFile) {
    const fileString = await fsPromises.readFile(url, { encoding: 'utf8' }).catch((error) => {
      console.error(error);
    });
    if (!fileString) {
      console.log(`${url}下的文件没有内容，已跳过`);
      return undefined;
    }
    return urlType.toLowerCase() === 'json' ? JSON.parse(fileString) : YAML.load(fileString);
  } else {
    // 获取文档并转换成 json
    return await axios
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
};

/**
 * 写文件
 * @param {string} pathname
 * @param {string} dataBuffer
 */
export const writeFile = async (pathname: string, dataBuffer: string) => {
  try {
    await fsPromises.writeFile(pathname, dataBuffer);
  } catch (error) {
    console.error(error);
    throw '发生异常，已停止写文件';
  }
  return true;
};

/** 首字母大写 */
export const upperFirstCase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/** 链接变成名称 */
export const urlToName = (str: string) =>
  str
    .split('/')
    .reduce(
      (accumulator: string, currentValue: string) =>
        upperFirstCase(accumulator) + upperFirstCase(currentValue.replace(/{/g, '').replace(/}/g, '')),
    );
/**
 * 链接变成带参链接（/record/{recordID}/{userID} GET 变成 /record/${params.recordID}/${params.userID}）
 * @param {string} url 链接名
 * @param {string} method http方法
 * @return {string} 转换后的链接
 */
export const urlToLinkParams = (url: string, method: string) => {
  const urls = url.split('/');
  let result = '';
  for (const element of urls) {
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
