import mockFs from 'mock-fs';
import fs from 'fs/promises';

import { getSwaggerJson, getFolderList, upperFirstCase, urlToName, urlToLinkParams, writeFile } from '../lib/utils';

import pactum from 'pactum';

const mock = pactum.mock;

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
    openapi: '3.0.0',
    info: { description: 'demo', title: 'demo', version: '1.0.0' },
    paths: {
      '/user/login': { post: { description: '用户登录', tags: ['user'], responses: {} } },
      '/user/logout': { delete: { description: '用户登出', tags: ['user'], responses: {} } },
      '/user/password': { put: { description: '修改密码', tags: ['user'], responses: {} } },
    },
    tags: [{ name: 'user', description: '用户' }],
    servers: [{ url: 'http://127.0.0.1:8848' }, { url: 'https://127.0.0.1:8848' }],
  };

  expect(await getSwaggerJson({ url: './test/getSwaggerJson.yaml' })).toEqual(result);
  expect(await getSwaggerJson({ url: './test/getSwaggerJson.json' })).toEqual(result);
  expect(await getSwaggerJson({ url: './test/undefined.json' })).toEqual(undefined);

  mock.addInteraction({ request: { method: 'GET', path: '/json' }, response: { status: 200, body: result } });

  mock.start(80);
  expect(
    await getSwaggerJson({
      url: 'http://localhost/json',
    }),
  ).toEqual(result);
  // mock.onGet('https://localhost/yaml').reply(200, await fs.readFile('./test/getSwaggerJson.yaml'));
  const yaml = (await fs.readFile('./test/getSwaggerJson.yaml')).toString();
  mock.addInteraction({ request: { method: 'GET', path: '/yaml' }, response: { status: 200, body: yaml } });
  expect(
    await getSwaggerJson({
      url: 'http://localhost/yaml',
    }),
  ).toEqual(result);
  mock.stop();
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
