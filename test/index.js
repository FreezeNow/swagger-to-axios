// import { describe, expect, test } from '@jest/globals';
import { upperFirstCase, urlToName, urlToLinkParams } from '../lib/utils';

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
