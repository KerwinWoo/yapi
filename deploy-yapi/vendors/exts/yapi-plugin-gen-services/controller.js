const baseController = require('controllers/base.js');
const interfaceModel = require('models/interface.js');
const projectModel = require('models/project.js');
// const wikiModel = require('../yapi-plugin-wiki/wikiModel.js');
const interfaceCatModel = require('models/interfaceCat.js');
const yapi = require('yapi.js');
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItTableOfContents = require('markdown-it-table-of-contents');
const defaultTheme = require('./defaultTheme.js');
const md = require('../../common/markdown');

// const htmlToPdf = require("html-pdf");
class exportController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.catModel = yapi.getInst(interfaceCatModel);
    this.interModel = yapi.getInst(interfaceModel);
    this.projectModel = yapi.getInst(projectModel);
    
  }

  async handleListClass(pid, status) {
    let result = await this.catModel.list(pid),
      newResult = [];
    for (let i = 0, item, list; i < result.length; i++) {
      item = result[i].toObject();
      list = await this.interModel.listByInterStatus(item._id, status);
      list = list.sort((a, b) => {
        return a.index - b.index;
      });
      if (list.length > 0) {
        item.list = list;
        newResult.push(item);
      }
    }
    
    return newResult;
  }

  handleExistId(data) {
    function delArrId(arr, fn) {
      if (!Array.isArray(arr)) return;
      arr.forEach(item => {
        delete item._id;
        delete item.__v;
        delete item.uid;
        delete item.edit_uid;
        delete item.catid;
        delete item.project_id;

        if (typeof fn === 'function') fn(item);
      });
    }

    delArrId(data, function(item) {
      delArrId(item.list, function(api) {
        delArrId(api.req_body_form);
        delArrId(api.req_params);
        delArrId(api.req_query);
        delArrId(api.req_headers);
        if (api.query_path && typeof api.query_path === 'object') {
          delArrId(api.query_path.params);
        }
      });
    });

    return data;
  }

  // @feat: serives

  async exportFullData (ctx) {
    return this.exportData(ctx, 'full-path');
  }

  async exportData(ctx, fullPath) {
    let pid = ctx.request.query.pid;
    let type = ctx.request.query.type;
    let status = ctx.request.query.status;
    let isWiki = ctx.request.query.isWiki;

    if (!pid) {
      return ctx.body = yapi.commons.resReturn(null, 200, 'pid 不为空');
    }
    let curProject, wikiData;
    let tp = '';
    try {
      curProject = await this.projectModel.get(pid);
      const basepath = curProject.basepath;
      if (isWiki === 'true') {
        const wikiModel = require('../yapi-plugin-wiki/wikiModel.js');
        wikiData = await yapi.getInst(wikiModel).get(pid);
      }
      ctx.set('Content-Type', 'application/octet-stream');
      const list = await this.handleListClass(pid, status);

      switch (type) {
        case 'markdown': {
          tp = await createMarkdown.bind(this)(list, false);
          ctx.set('Content-Disposition', `attachment; filename=api.md`);
          return (ctx.body = tp);
        }
        case 'json': {
          let data = this.handleExistId(list);
          if (Array.isArray(data) && fullPath === 'full-path' && basepath) {
            data.forEach(function(cate) {
              if (Array.isArray(cate.list)) {
                cate.proBasepath = basepath;
                cate.proName = curProject.name;
                cate.proDescription = curProject.desc;
                cate.list = cate.list.map(function(api) {
                  api.path = api.query_path.path = (basepath + '/' + api.path).replace(/[\/]{2,}/g, '/');
                  return api;
                });
              }
            })
          }
          tp = JSON.stringify(data, null, 2);
          ctx.set('Content-Disposition', `attachment; filename=api.json`);
          return (ctx.body = tp);
        }
        default: {
          //默认为html
          tp = await createHtml.bind(this)(list);
          ctx.set('Content-Disposition', `attachment; filename=api.html`);
          return (ctx.body = tp);
        }
      }
    } catch (error) {
      yapi.commons.log(error, 'error');
      ctx.body = yapi.commons.resReturn(null, 502, '下载出错');
    }

    async function createHtml(list) {
      let md = await createMarkdown.bind(this)(list, true);
      let markdown = markdownIt({ html: true, breaks: true });
      markdown.use(markdownItAnchor); // Optional, but makes sense as you really want to link to something
      markdown.use(markdownItTableOfContents, {
        markerPattern: /^\[toc\]/im
      });

      // require('fs').writeFileSync('./a.markdown', md);
      let tp = unescape(markdown.render(md));
      // require('fs').writeFileSync('./a.html', tp);
      let left;
      // console.log('tp',tp);
      let content = tp.replace(
        /<div\s+?class="table-of-contents"\s*>[\s\S]*?<\/ul>\s*<\/div>/gi,
        function(match) {
          left = match;
          return '';
        }
      );

      return createHtml5(left || '', content);
    }

    function createHtml5(left, tp) {
      //html5模板
      let html = `<!DOCTYPE html>
      <html>
      <head>
      <title>${curProject.name}</title>
      <meta charset="utf-8" />
      ${defaultTheme}
      </head>
      <body>
        <div class="m-header">
          <a href="#"><h1 class="title">接口文档</h1></a>
        </div>
        <div class="g-doc">
          ${left}
          <div id="right" class="content-right">
          ${tp}
          </div>
        </div>
      </body>
      </html>
      `;
      return html;
    }

    function createMarkdown(list, isToc) {
      //拼接markdown
      //模板
      let mdTemplate = ``;
      try {
        // 项目名称信息
        mdTemplate += md.createProjectMarkdown(curProject, wikiData);
        // 分类信息
        mdTemplate += md.createClassMarkdown(curProject, list, isToc);
        return mdTemplate;
      } catch (e) {
        yapi.commons.log(e, 'error');
        ctx.body = yapi.commons.resReturn(null, 502, '下载出错');
      }
    }
  }
}

module.exports = exportController;
