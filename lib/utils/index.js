import fsPromises from 'fs/promises';
import SwaggerParser from '@apidevtools/swagger-parser';
import { convertObj } from 'swagger2openapi';
import lodash from 'lodash';
const mergeWith = lodash.mergeWith;
/**
 * 合并 allOf
 * @param object
 */
export const expandAllOf = (object) => {
    while (object.hasOwnProperty('allOf')) {
        const allOf = object.allOf;
        delete object.allOf;
        const override = mergeWith({}, ...allOf, object, function (target, source) {
            if (Array.isArray(target)) {
                return target.concat(source).filter((v, i, a) => a.indexOf(v) === i);
            }
            if (target && typeof target === 'object') {
                expandAllOf(target);
            }
            if (source && typeof source === 'object') {
                expandAllOf(source);
            }
        });
        Object.assign(object, override);
    }
    Object.keys(object).forEach((key) => {
        if (object[key] && typeof object[key] === 'object') {
            expandAllOf(object[key]);
        }
    });
};
/** 获取 swagger 文档 */
export const getSwaggerJson = async ({ url, }) => {
    try {
        const swagger = await SwaggerParser.dereference(url);
        if (swagger === undefined)
            return undefined;
        expandAllOf(swagger?.paths ?? {});
        if ('definitions' in swagger) {
            expandAllOf(swagger?.definitions ?? {});
        }
        if ('swagger' in swagger) {
            const result = await convertObj(swagger, {});
            return result.openapi;
        }
        return swagger;
    }
    catch (error) {
        console.error(`${url}异常：${error}`);
        return undefined;
    }
};
/**
 * 获取 swagger 文档列表
 * @param {SwaggerDocument[]} swaggerList - swagger 文档列表
 * @param {Config['cliType']} cliType - cli类型
 * @returns {Promise<Folder[]>} 文件夹数组
 */
export const getFolderList = async (swaggerList, cliType) => {
    const result = [];
    for (const element of swaggerList) {
        const { url, name = Math.random().toString() } = element;
        const json = await getSwaggerJson({ url });
        if (json === undefined)
            continue;
        const { tags, paths, servers } = json;
        const basePath = servers?.[0].url.replace(/^.+:\/\/((\d|\w)+\.{0,1})+(:\d+){0,1}/, '') ?? '';
        // 三次替换，分别匹配 http://api.example.com/api , /api , //api.example.com，使结果保持为 api.example.com
        const host = servers?.[0].url
            .replace(/^.+:\/\/(((\d|\w)+\.{0,1})+(:\d+){0,1}).*$/, '$1')
            .replace(/^\/[\w|\d]+/, '')
            .replace(/^\/\//, '') ?? '';
        result.push({
            name,
            cliType,
            baseURL: basePath,
            host: host,
            tagList: getTagList(tags, paths),
        });
    }
    return result;
};
/** 重组 tag 数组 */
export const getTagList = (tags = [], paths) => {
    const tagList = [];
    // 获取文档的 tags，并插入文件夹对象的 list 字段中
    for (const tag of tags) {
        tagList.push({
            name: tag.name,
            comment: tag?.description ?? '',
            apiList: [],
        });
    }
    // 循环文档的 paths，取出 api 地址、类型、描述并放入 tag list 中
    for (const path in paths) {
        if (paths.hasOwnProperty(path)) {
            const methods = paths[path];
            if (!methods) {
                continue;
            }
            for (const name in methods) {
                if (methods.hasOwnProperty(name)) {
                    const method = methods[name];
                    const methodTag = method?.tags?.[0] ?? '';
                    let tag = tagList.find((ele) => ele.name === methodTag);
                    if (!tag) {
                        tag = {
                            name: methodTag,
                            comment: '',
                            apiList: [],
                        };
                        tagList.push(tag);
                    }
                    tag.apiList.push({
                        url: path,
                        method: name,
                        comment: {
                            summary: method?.summary ?? '',
                            description: method?.description ?? '',
                        },
                        response: getResponse(method?.responses?.[200]),
                    });
                }
            }
        }
    }
    return tagList;
};
/** 将 openapi 类型转换为 TS 类型 */
export const openapiTypeToTypeScript = (schemaObject) => {
    const { type = '' } = schemaObject;
    const numberEnum = [
        'int64',
        'integer',
        'long',
        'float',
        'double',
        'number',
        'int',
        'float',
        'double',
        'int32',
        'int64',
    ];
    const dateEnum = ['Date', 'date', 'dateTime', 'date-time', 'datetime'];
    const stringEnum = ['string', 'email', 'password', 'url', 'byte', 'binary'];
    if (numberEnum.includes(type)) {
        return 'number';
    }
    if (dateEnum.includes(type)) {
        return 'Date';
    }
    if (stringEnum.includes(type)) {
        return 'string';
    }
    if (type === 'boolean') {
        return 'boolean';
    }
    if (type === 'array') {
        let { items = {} } = schemaObject;
        if ('schema' in schemaObject) {
            items = schemaObject?.schema?.items;
        }
        if (Array.isArray(items)) {
            const arrayItemType = items
                .map((subType) => openapiTypeToTypeScript(subType))
                .toString();
            return `[${arrayItemType}]`;
        }
        const arrayType = openapiTypeToTypeScript(items);
        return arrayType.includes(' | ') ? `(${arrayType})[]` : `${arrayType}[]`;
    }
    if (type === 'object' || schemaObject.properties) {
        const keys = Object.keys(schemaObject.properties || {});
        if (!keys?.length) {
            return 'Record<string, any>';
        }
        return `{ ${keys
            .map((key) => {
            const required = 'required' in (schemaObject?.properties?.[key] || {})
                ? (schemaObject?.properties?.[key] || {}).required
                : false;
            /**
             * 将类型属性变为字符串，兼容错误格式如：
             * 3d_tile(数字开头)等错误命名，
             * 在后面进行格式化的时候会将正确的字符串转换为正常形式，
             * 错误的继续保留字符串。
             * */
            return `'${key}': ${openapiTypeToTypeScript(schemaObject?.properties &&
                schemaObject?.properties?.[key])}; `;
        })
            .join('')}}`;
    }
    return 'any';
};
/** 重组 response */
export const getResponse = (response) => {
    if (response === undefined)
        return response;
    const result = {
        description: response.description,
        data: {},
    };
    result.data = openapiTypeToTypeScript(response?.content?.['application/json']?.schema ?? {});
    return result;
};
/**
 * 写文件
 * @param {string} pathname
 * @param {string} dataBuffer
 */
export const writeFile = async (pathname, dataBuffer) => {
    try {
        await fsPromises.writeFile(pathname, dataBuffer);
    }
    catch (error) {
        console.error(error);
        throw '发生异常，已停止写文件';
    }
    return true;
};
/** 首字母大写 */
export const upperFirstCase = (str) => str.charAt(0).toUpperCase() + str.slice(1);
/** 链接变成名称 */
export const urlToName = (str) => str
    .split('/')
    .reduce((accumulator, currentValue) => upperFirstCase(accumulator) + upperFirstCase(currentValue.replace(/{/g, '').replace(/}/g, '')));
/**
 * 链接变成带参链接（/record/{recordID}/{userID} GET 变成 /record/${params.recordID}/${params.userID}）
 * @param {string} url 链接名
 * @param {string} method http方法
 * @return {string} 转换后的链接
 */
export const urlToLinkParams = (url, method) => {
    const urls = url.split('/');
    let result = '';
    for (const element of urls) {
        if (!element) {
            continue;
        }
        if (!element.startsWith('{')) {
            result += `/${element}`;
        }
        else {
            result += `/\${${method.toUpperCase() === 'GET' ? 'params' : 'data'}.${element.replace(/{(.+)}/, '$1')}}`;
        }
    }
    return result;
};
