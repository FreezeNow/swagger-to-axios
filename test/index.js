import mock from 'mock-fs';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import fs from 'fs/promises';

import { upperFirstCase, urlToName, urlToLinkParams, getSwaggerJson, writeFile } from '../lib/utils';

test('首字母大写', () => {
  expect(upperFirstCase('test')).toBe('Test');
});

test('去除所有括号后，链接根据 / 分割，输出首字母大写的字符串', () => {
  expect(urlToName('/test')).toBe('Test');
  expect(urlToName('/test/id')).toBe('TestId');
  expect(urlToName('/test/{id}')).toBe('TestId');
  expect(urlToName('/test/{id}/num')).toBe('TestIdNum');
  expect(urlToName('/test/{id}/{num}')).toBe('TestIdNum');
  expect(urlToName('/test{id}')).toBe('Testid');
  expect(urlToName('/test{id}{num}')).toBe('Testidnum');
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

test('获取 swagger 文档', async () => {
  const result = {
    info: { description: 'demo', title: 'demo', version: '1.0.0' },
    host: '127.0.0.1:8848',
    produces: ['application/json', 'application/xml'],
    schemes: ['http', 'https'],
    basePath: '',
    swagger: '2.0',
    paths: {
      '/user/login': { post: { parameters: [], description: '用户登录', tags: ['user'], responses: {} } },
      '/user/logout': {
        delete: {
          description: '用户登出',
          parameters: [],
          responses: {},
          tags: ['user'],
        },
      },
      '/user/password': {
        put: {
          description: '修改密码',
          parameters: [],
          responses: {},
          tags: ['user'],
        },
      },
    },
    definitions: {},
    responses: {},
    parameters: {},
    securityDefinitions: {},
    tags: [{ name: 'user', description: '用户' }],
  };

  expect(await getSwaggerJson({ localFile: true, url: './test/getSwaggerJson.yaml', urlType: 'yaml' })).toEqual(result);
  expect(await getSwaggerJson({ localFile: true, url: './test/getSwaggerJson.json', urlType: 'json' })).toEqual(result);
  expect(await getSwaggerJson({ localFile: true, url: './test/undefined.json' })).toEqual(undefined);

  expect(await getSwaggerJson({ url: './test/getSwaggerJson.json', urlType: 'json' })).toEqual();
  const mock = new MockAdapter(axios);
  mock.onGet('https://localhost/json').reply(200, result);
  expect(await getSwaggerJson({ url: 'https://localhost/json', urlType: 'json' })).toEqual(result);
  mock.onGet('https://localhost/yaml').reply(200, await fs.readFile('./test/getSwaggerJson.yaml'));
  expect(await getSwaggerJson({ url: 'https://localhost/yaml', urlType: 'yaml' })).toEqual(result);
});

describe('写入测试', () => {
  beforeEach(() => {
    // 空打印是必须的，参考：https://github.com/nknapp/jest-mock-fs-bug
    console.log();
    mock({
      './tmp': {
        'index.md': '# Hello world!',
      },
    });
  });
  afterAll(() => {
    mock.restore();
  });
  test('写入文件', async () => {
    expect(await writeFile('1.js', '测试')).toBe(true);
    await expect(writeFile('resolve', undefined)).rejects.toMatch('发生异常，已停止写文件');
  });
});
