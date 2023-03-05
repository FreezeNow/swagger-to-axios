import fs from 'fs';
/**
 * 写文件
 * @param {string} pathname
 * @param {string} dataBuffer
 */
export const writeFile = (pathname, dataBuffer) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(pathname, dataBuffer, (err) => {
            if (err) {
                reject(err);
            }
            else {
                // console.log(`${pathname.replace(/(.+\/)/, '')} 保存成功！`);
                resolve(true);
            }
        });
    });
};
/** 首字母大写 */
export const upperFirstCase = (str) => str.charAt(0).toUpperCase() + str.slice(1);
/** 链接变成名称 */
export const urlToName = (str) => str
    .split('/')
    .reduce((accumulator, currentValue) => upperFirstCase(accumulator) + upperFirstCase(currentValue.replace('{', '').replace('}', '')));
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
