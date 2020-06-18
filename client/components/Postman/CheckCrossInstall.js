import React from 'react';
import { Alert } from 'antd';
import PropTypes from 'prop-types';

exports.initCrossRequest = function (fn) {
  let startTime = 0;
  let _crossRequest = setInterval(() => {
    startTime += 500;
    if (startTime > 5000) {
      clearInterval(_crossRequest);
    }
    if (window.crossRequest) {
      clearInterval(_crossRequest);
      fn(true);
    } else {
      fn(false);
    }
  }, 500);
  return _crossRequest;
};

CheckCrossInstall.propTypes = {
  hasPlugin: PropTypes.bool
};

function CheckCrossInstall(props) {
  const hasPlugin = props.hasPlugin;
  return (
    <div className={hasPlugin ? null : 'has-plugin'}>
      {hasPlugin ? (
        ''
      ) : (
        <Alert
          message={
            <div>
              重要：当前的接口测试服务，需安装免费测试增强插件,仅支持 chrome
              浏览器。
              <ol>
                <li>步骤01：<a href="https://github.com/YMFE/cross-request/archive/master.zip" target="blank">点击下载安装包</a></li>
                <li>步骤02：新开一个浏览器页面，并在地址栏中输入：chrome://extensions</li>
                <li>步骤03：点击页面左上角“加载已解压的扩展程序”按钮，将步骤01中下载的文件（解压后）导入进去即可。</li>
                <li>备注：记住要打开开发者模式（点击页面右上角“开发者模式”开关）</li>
              </ol>
              
              {/* <div>
                <a
                  target="blank"
                  href="https://chrome.google.com/webstore/detail/cross-request/cmnlfmgbjmaciiopcgodlhpiklaghbok?hl=en-US"
                >
                  [Google 商店获取（需翻墙]
                </a>
              </div> */}
              <div>
                <a target="blank" href="https://juejin.im/post/5e3bbd986fb9a07ce152b53d">
                  {' '}
                  [如果安装不成功请参考谷歌请求插件详细安装教程]{' '}
                </a>
              </div>
            </div>
          }
          type="warning"
        />
      )}
    </div>
  );
}

export default CheckCrossInstall;
