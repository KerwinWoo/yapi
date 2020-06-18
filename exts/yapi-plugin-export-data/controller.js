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

  async exportData(ctx) {
    let pid = ctx.request.query.pid;
    let type = ctx.request.query.type;
    let status = ctx.request.query.status;
    let isWiki = ctx.request.query.isWiki;

    if (!pid) {
      ctx.body = yapi.commons.resReturn(null, 200, 'pid 不为空');
    }
    let curProject, wikiData;
    let tp = '';
    try {
      curProject = await this.projectModel.get(pid);
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
      <title>${curProject.name}接口文档</title>
      <meta charset="utf-8" />
      ${defaultTheme}
      </head>
      <body>
        <div class="m-header">
          <a href="#" style="display: inherit;"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="125px" height="44px" viewBox="0 0 125 44" enable-background="new 0 0 125 44" xml:space="preserve">  <image id="image0" width="125" height="44" x="0" y="0"
              href="data:image/png;base64,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
          oiWZ20miH/Ek0o9+JJJEf5JIsmy0H6WBV3wJH/w+dY2Mjuio5wpZoY6vApgaJur/EeRhk0ahkipU
          vEZJEWSCar9uSLzg7jzLARN9Ce+17XxLZkqcC7PHyl/kjO0It4QxXSznvR9pUrM1/ilp0Bz7hCHR
          HJXpXTJYQJ5yFPhCyuUGR6OHyDI56Kh7wEEry1HjWk3qWkcpfwWZINGhURJ8ydMeQmi3FGilxV81
          1zpkiw91khbW9G45oGkUWuR22o57QhKVxP4ojd/se8k8mLlMDXHudpL1vEk9kMF0HiDHUfIgddSE
          +MwkW/U1MZr5rAWgOGhbM4ztpu93ABqZw79Va6LxxgfASwetdNFOJ1466KITL14u0EknXZznHF4u
          8hD3K4tW6l9VZDCXmSEOiMs4Qrlj7ymq1AsoZ9ys3r1/SxqwkXmU85it7AJGc6VxmvM9DVRa+peR
          yjH+yymOcVY9C0LjK4YDq1hOW/AHJZO4h7n81EbtCMe53YbfxUZqqXX1SVkqxaTRg4d9hhunsMPV
          pGODLJazyTgRtL0j4yRPKk1v40RE9khl0B3zniyQqyN6FF42P/v9eg+11JLGbOaQ67AtbeBN1oVZ
          5V/eCOud62SFfCgiIk2yTUREmqVCci51zKL/hf9a0odJzOMqOkmhhip6+z3DZYX/AXkDNGDbfHfe
          AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIwLTA2LTE4VDE3OjI4OjU4KzA4OjAwcIlPGgAAACV0RVh0
          ZGF0ZTptb2RpZnkAMjAyMC0wNi0xOFQxNzoyODo1OCswODowMAHU96YAAAAgdEVYdHNvZnR3YXJl
          AGh0dHBzOi8vaW1hZ2VtYWdpY2sub3JnvM8dnQAAABh0RVh0VGh1bWI6OkRvY3VtZW50OjpQYWdl
          cwAxp/+7LwAAABd0RVh0VGh1bWI6OkltYWdlOjpIZWlnaHQANDSO1ssGAAAAF3RFWHRUaHVtYjo6
          SW1hZ2U6OldpZHRoADEyNa48bWAAAAAZdEVYdFRodW1iOjpNaW1ldHlwZQBpbWFnZS9wbmc/slZO
          AAAAF3RFWHRUaHVtYjo6TVRpbWUAMTU5MjQ3MjUzOBPXBjMAAAASdEVYdFRodW1iOjpTaXplADMy
          NTBCQtH8yxQAAABCdEVYdFRodW1iOjpVUkkAZmlsZTovLy90bXAvaW1hZ2VsYy9pbWd2aWV3Ml83
          XzE1OTI0NzA4Nzc1NzE1NDA0XzczX1swXdKVCHgAAAAASUVORK5CYII=" ></image>
          </svg>
          </a>
          <a href="#"><h1 class="title">${curProject.name}接口文档</h1></a>
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
        // mdTemplate += md.createProjectMarkdown(curProject, wikiData);
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