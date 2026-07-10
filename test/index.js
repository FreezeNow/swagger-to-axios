import mockFs from 'mock-fs';
import fs from 'fs/promises';

import { getSwaggerJson, getFolderList, upperFirstCase, urlToName, urlToLinkParams, writeFile, openapiTypeToTypeScript, parametersToTypeScript, getResponse, getTagList, expandAllOf } from '../lib/utils';

import pactum from 'pactum';

const mock = pactum.mock;

test('获取 swagger 文档', async () => {
    const result = {
    openapi: '3.0.0',
    info: { description: 'demo', title: 'demo', version: '1.0.0' },
    paths: {
      '/user/login': { post: { description: '用户登录', tags: ['user'], responses: {} } },
      '/user/logout': { delete: { description: '用户登出', tags: ['user'], responses: {} } },
      '/user/password': { put: { description: '修改密码', tags: ['user'], responses: {} } },
      '/user/{id}': {
        get: {
          description: '获取用户详情',
          tags: ['user'],
          responses: {},
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'keyword', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'pageNum', in: 'query', required: false, schema: { type: 'integer' } },
          ],
        },
      },
      '/user/{groupId}/members': {
        post: {
          description: '添加成员',
          tags: ['user'],
          responses: {},
          parameters: [{ name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email'],
                  properties: { name: { type: 'string' }, email: { type: 'string' }, role: { type: 'string' } },
                },
              },
            },
            required: true,
          },
        },
      },
      '/user/notify': {
        post: {
          description: '发送通知',
          tags: ['user'],
          responses: {},
          parameters: [{ name: 'Access-Token', in: 'header', description: '令牌', required: true, schema: { type: 'string', default: 'device' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: { message: { type: 'string' }, type: { type: 'integer' } },
                },
              },
            },
          },
        },
      },
    },
    tags: [{ name: 'user', description: '用户' }],
    servers: [{ url: 'http://127.0.0.1:8848/a/b/c' }, { url: 'https://127.0.0.1:8848/a/b/c' }],
  };

  expect(await getSwaggerJson({ url: './test/getSwaggerJson.yaml' })).toEqual(result);
  expect(await getSwaggerJson({ url: './test/getSwaggerJson.json' })).toEqual(result);
  expect(await getSwaggerJson({ url: './test/undefined.json' })).toEqual(undefined);

  expect(await getSwaggerJson({ url: './test/allOf.yaml' })).toEqual({
    openapi: '3.0.0',
    info: { description: 'demo', title: 'demo', version: '1.0.0' },
    paths: {
      '/user': {
        get: {
          description: '获取用户',
          tags: ['user'],
          responses: {
            200: {
              description: '请求成功',
              content: {
                'application/json': {
                  schema: {
                    properties: {
                      errorCode: {
                        description: '错误码，正常请求无错误的情况为0',
                        type: 'integer',
                        example: 0,
                      },
                      message: { description: '错误码的文本描述', type: 'string', example: '成功' },
                      data: { description: '请求结果数据' },
                    },
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [{ name: 'user', description: '用户' }],
    servers: [{ url: 'http://127.0.0.1:8848' }, { url: 'https://127.0.0.1:8848' }],
    components: {
      schemas: {
        Response: {
          properties: {
            errorCode: { description: '错误码，正常请求无错误的情况为0', type: 'integer', example: 0 },
            message: { description: '错误码的文本描述', type: 'string', example: '成功' },
            data: { description: '请求结果数据' },
          },
          type: 'object',
        },
      },
    },
  });

  mock.addInteraction({ request: { method: 'GET', path: '/json' }, response: { status: 200, body: result } });

  mock.start(8080);
  expect(
    await getSwaggerJson({
      url: 'http://localhost:8080/json',
    }),
  ).toEqual(result);
  // mock.onGet('https://localhost/yaml').reply(200, await fs.readFile('./test/getSwaggerJson.yaml'));
  const yaml = (await fs.readFile('./test/getSwaggerJson.yaml')).toString();
  mock.addInteraction({ request: { method: 'GET', path: '/yaml' }, response: { status: 200, body: yaml } });
  expect(
    await getSwaggerJson({
      url: 'http://localhost:8080/yaml',
    }),
  ).toEqual(result);
  mock.addInteraction({ request: { method: 'GET', path: '/undefined' }, response: { status: 200 } });
  expect(
    await getSwaggerJson({
      url: 'http://localhost:8080/undefined',
    }),
  ).toEqual(undefined);
  mock.stop();
});
test('获取 swagger 文档列表', async () => {
  const result = [
    {
      name: 'test',
      cliType: 'Vite',
      baseURL: '/a/b/c',
      host: '127.0.0.1:8848',
      tagList: [
        {
          name: 'user',
          comment: '用户',
          apiList: [
            {
              url: '/user/login',
              method: 'post',
              comment: { description: '用户登录', summary: '' },
              response: undefined,
            },
            {
              url: '/user/logout',
              method: 'delete',
              comment: { description: '用户登出', summary: '' },
              response: undefined,
            },
            {
              url: '/user/password',
              method: 'put',
              comment: { description: '修改密码', summary: '' },
              response: undefined,
            },
            {
              url: '/user/{id}',
              method: 'get',
              comment: { description: '获取用户详情', summary: '' },
              response: undefined,
              paramType: "{ 'id': number; 'keyword'?: string; 'pageNum'?: number; }",
              paramRequired: true,
            },
            {
              url: '/user/{groupId}/members',
              method: 'post',
              comment: { description: '添加成员', summary: '' },
              response: undefined,
              paramType: "{ 'groupId': number; 'name': string; 'email': string; 'role'?: string; }",
              paramRequired: true,
            },
            {
              url: '/user/notify',
              method: 'post',
              comment: { description: '发送通知', summary: '' },
              response: undefined,
              paramType: "{ 'message': string; 'type'?: number; }",
              paramRequired: true,
            },
          ],
        },
      ],
    },
  ];
  const list = [{ url: './test/getSwaggerJson.yaml', name: 'test' }, { url: './test/undefined.yaml' }];

  expect(await getFolderList(list, 'Vite')).toEqual(result);
});

test('首字母大写', () => {
  expect(upperFirstCase('test')).toBe('Test');
});

test('去除所有括号后，链接根据 / 分割，输出首字母大写的字符串', () => {
  expect(urlToName('/test')).toBe('Test');
  expect(urlToName('/test/id')).toBe('TestId');
  expect(urlToName('/test/{id}')).toBe('TestId');
  expect(urlToName('/test/{id}/num')).toBe('TestIdNum');
  expect(urlToName('/test/{id}/{num}')).toBe('TestIdNum');
  expect(urlToName('/test{id}')).toBe('TestId');
  expect(urlToName('/test{id}{num}')).toBe('TestIdNum');
  // 路径含 -
  expect(urlToName('/user/get-info')).toBe('UserGetInfo');
  expect(urlToName('/order/what-are-you-doing')).toBe('OrderWhatAreYouDoing');
  // 路径含 _
  expect(urlToName('/user/get_info')).toBe('UserGetInfo');
  expect(urlToName('/api/base_url')).toBe('ApiBaseUrl');
  // 路径参数内含 -
  expect(urlToName('/user/{user-id}')).toBe('UserUserId');
  expect(urlToName('/user/{first-name}/{last-name}')).toBe('UserFirstNameLastName');
  // 路径参数内含 _
  expect(urlToName('/user/{user_id}')).toBe('UserUserId');
  expect(urlToName('/user/{first_name}/{last_name}')).toBe('UserFirstNameLastName');
  // 路径参数内含多个 - 和 _
  expect(urlToName('/order/{order-type-name}')).toBe('OrderOrderTypeName');
  expect(urlToName('/order/{order_type_name}')).toBe('OrderOrderTypeName');
  // 混合：路径和参数都含 -
  expect(urlToName('/api/v1-{order-id}/detail')).toBe('ApiV1OrderIdDetail');
  // 混合：路径含 -，路径参数无分隔符
  expect(urlToName('/api/get-list/{id}')).toBe('ApiGetListId');
  // 路径参数紧跟前缀无 /
  expect(urlToName('/test{user-id}')).toBe('TestUserId');
  // 空字符串边界
  expect(urlToName('')).toBe('');
});

test('链接字符串变成带参模板字符串', () => {
  const methodMap = {
    get: 'params',
    post: 'data',
  };
  for (const method in methodMap) {
    if (Object.hasOwnProperty.call(methodMap, method)) {
      const element = methodMap[method];
      expect(urlToLinkParams('/test', method)).toBe('/test');
      expect(urlToLinkParams('/test/{id}', method)).toBe(`/test/$\{${element}.id}`);
      expect(urlToLinkParams('/test/{id}/num', method)).toBe(`/test/$\{${element}.id}/num`);
      expect(urlToLinkParams('/test/{id}/{num}', method)).toBe(`/test/$\{${element}.id}/$\{${element}.num}`);
      expect(urlToLinkParams('/test{id}', method)).toBe(`/test{id}`);
    }
  }
});

describe('写入测试', () => {
  beforeEach(() => {
    // 空打印是必须的，参考：https://github.com/nknapp/jest-mock-fs-bug
    console.log();
    mockFs({
      './tmp': {
        'index.md': '# Hello world!',
      },
    });
  });
  afterAll(() => {
    mockFs.restore();
  });
  test('写入文件', async () => {
    expect(await writeFile('1.js', '测试')).toBe(true);
    await expect(writeFile('resolve', undefined)).rejects.toMatch('发生异常，已停止写文件');
  });
});

describe('import 语句生成', () => {
  const genImport = (namedImport, importPath) =>
    `import ${!namedImport ? 'request' : namedImport === 'request' ? `{ request }` : `{ ${namedImport} as request }`} from '${importPath}';`;

  test('namedImport 为空时生成默认 import request', () => {
    expect(genImport(undefined, './request')).toBe("import request from './request';");
    expect(genImport(null, './request')).toBe("import request from './request';");
  });

  test('namedImport 为 request 时生成命名导入 { request }', () => {
    expect(genImport('request', './request')).toBe("import { request } from './request';");
  });

  test('namedImport 为非 request 时生成别名导入', () => {
    expect(genImport('http', './request')).toBe("import { http as request } from './request';");
    expect(genImport('axios', './request')).toBe("import { axios as request } from './request';");
  });
});

describe('expandAllOf', () => {
  test('展开简单 allOf', () => {
    const obj = { allOf: [{ a: 1 }, { b: 2 }], c: 3 };
    expandAllOf(obj);
    expect(obj).toEqual({ a: 1, b: 2, c: 3 });
  });

  test('无 allOf 时不变', () => {
    const obj = { a: 1, b: 2 };
    expandAllOf(obj);
    expect(obj).toEqual({ a: 1, b: 2 });
  });

  test('嵌套 allOf', () => {
    const obj = { allOf: [{ a: 1, allOf: [{ b: 2 }] }] };
    expandAllOf(obj);
    expect(obj).toEqual({ a: 1, b: 2 });
  });

  test('合并数组字段去重', () => {
    const obj = { allOf: [{ arr: [1, 2] }, { arr: [2, 3] }] };
    expandAllOf(obj);
    expect(obj).toEqual({ arr: [1, 2, 3] });
  });
});

describe('openapiTypeToTypeScript', () => {
  test('number 类型', () => {
    expect(openapiTypeToTypeScript({ type: 'integer' })).toBe('number');
    expect(openapiTypeToTypeScript({ type: 'number' })).toBe('number');
    expect(openapiTypeToTypeScript({ type: 'int64' })).toBe('number');
    expect(openapiTypeToTypeScript({ type: 'float' })).toBe('number');
  });

  test('date 类型', () => {
    expect(openapiTypeToTypeScript({ type: 'date' })).toBe('Date');
    expect(openapiTypeToTypeScript({ type: 'dateTime' })).toBe('Date');
    expect(openapiTypeToTypeScript({ type: 'datetime' })).toBe('Date');
  });

  test('string 类型', () => {
    expect(openapiTypeToTypeScript({ type: 'string' })).toBe('string');
    expect(openapiTypeToTypeScript({ type: 'email' })).toBe('string');
    expect(openapiTypeToTypeScript({ type: 'url' })).toBe('string');
  });

  test('boolean 类型', () => {
    expect(openapiTypeToTypeScript({ type: 'boolean' })).toBe('boolean');
  });

  test('array 类型', () => {
    expect(openapiTypeToTypeScript({ type: 'array', items: { type: 'string' } })).toBe('string[]');
    expect(openapiTypeToTypeScript({ type: 'array', items: { type: 'integer' } })).toBe('number[]');
  });

  test('array 联合类型', () => {
    expect(openapiTypeToTypeScript({ type: 'array', items: { type: 'array', items: { type: 'string' } } })).toBe('string[][]');
  });

  test('array 多类型 items', () => {
    expect(openapiTypeToTypeScript({ type: 'array', items: [{ type: 'string' }, { type: 'integer' }] })).toBe('[string,number]');
  });

  test('object 类型有 properties', () => {
    expect(openapiTypeToTypeScript({ type: 'object', properties: { name: { type: 'string' }, age: { type: 'integer' } } })).toBe("{ 'name': string; 'age': number; }");
  });

  test('object 类型无 properties', () => {
    expect(openapiTypeToTypeScript({ type: 'object' })).toBe('Record<string, any>');
  });

  test('object 隐式类型（只有 properties）', () => {
    expect(openapiTypeToTypeScript({ properties: { title: { type: 'string' } } })).toBe("{ 'title': string; }");
  });

  test('未知类型返回 any', () => {
    expect(openapiTypeToTypeScript({ type: 'unknown' })).toBe('any');
  });

  test('空 schema 返回 any', () => {
    expect(openapiTypeToTypeScript({})).toBe('any');
  });
});

describe('parametersToTypeScript', () => {
  test('GET 方法 query 参数', () => {
    const result = parametersToTypeScript(
      [{ name: 'page', in: 'query', schema: { type: 'integer' } }],
      undefined,
      'GET',
    );
    expect(result).toEqual({ type: "{ 'page'?: number; }", required: false });
  });

  test('GET 方法 path 参数', () => {
    const result = parametersToTypeScript(
      [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      undefined,
      'GET',
    );
    expect(result).toEqual({ type: "{ 'id': number; }", required: true });
  });

  test('GET 忽略非 query/path 参数', () => {
    const result = parametersToTypeScript(
      [{ name: 'token', in: 'header', schema: { type: 'string' } }],
      undefined,
      'GET',
    );
    expect(result).toEqual({ type: '', required: false });
  });

  test('非 GET 方法 path 参数和 requestBody', () => {
    const result = parametersToTypeScript(
      [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      { content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, age: { type: 'integer' } } } } }, required: true },
      'POST',
    );
    expect(result).toEqual({ type: "{ 'id': number; 'name': string; 'age'?: number; }", required: true });
  });

  test('非 GET 仅有 requestBody（无 path 参数）', () => {
    const result = parametersToTypeScript(
      [{ name: 'token', in: 'header', schema: { type: 'string' } }],
      { content: { 'application/json': { schema: { type: 'object', required: ['message'], properties: { message: { type: 'string' }, type: { type: 'integer' } } } } }, required: true },
      'POST',
    );
    expect(result).toEqual({ type: "{ 'message': string; 'type'?: number; }", required: true });
  });

  test('非 GET 无参数', () => {
    const result = parametersToTypeScript([], undefined, 'POST');
    expect(result).toEqual({ type: '', required: false });
  });
});

describe('getResponse', () => {
  test('undefined 返回 undefined', () => {
    expect(getResponse(undefined)).toBeUndefined();
  });

  test('有 response 携带 schema', () => {
    const result = getResponse({
      description: '成功',
      content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'integer' } } } } },
    });
    expect(result).toEqual({ description: '成功', data: "{ 'id': number; }" });
  });

  test('有 response 无 schema', () => {
    const result = getResponse({ description: '成功' });
    expect(result).toEqual({ description: '成功', data: 'any' });
  });
});

describe('getTagList', () => {
  test('tags 和 paths 生成 tagList', () => {
    const tags = [{ name: 'user', description: '用户' }];
    const paths = {
      '/user': { get: { tags: ['user'], description: '获取用户', summary: '获取用户', responses: {} } },
    };
    const result = getTagList(tags, paths);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('user');
    expect(result[0].comment).toBe('用户');
    expect(result[0].apiList).toHaveLength(1);
    expect(result[0].apiList[0].url).toBe('/user');
    expect(result[0].apiList[0].method).toBe('get');
  });

  test('未出现在 tags 中的方法标签自动创建', () => {
    const paths = {
      '/info': { get: { tags: ['info'], description: '获取信息', responses: {} } },
    };
    const result = getTagList([], paths);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('info');
    expect(result[0].comment).toBe('');
  });

  test('无 tags 和 paths 返回空数组', () => {
    expect(getTagList()).toEqual([]);
    expect(getTagList([], {})).toEqual([]);
  });

  test('忽略无 methods 的 path', () => {
    const result = getTagList([], { '/invalid': null });
    expect(result).toEqual([]);
  });
});
