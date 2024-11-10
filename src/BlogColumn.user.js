// ==UserScript==
// @name         CSDN Column Optimization
// @description  Optimize CSDN columns by adding a side menu with a list of all articles in the current column.
// @version      1.0
// @author       Silence
// @match        *://blog.csdn.net/*/article/details/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const $ = (Selector, el) => (el || document).querySelector(Selector);
    const $$ = (Selector, el) => (el || document).querySelectorAll(Selector);

    window.onload = function () {
        console.log('CSDN Column Optimization loaded.');

        // 步骤 1: 获取当前文章所属的专栏信息
        getColumnInfo().then(columnInfo => {
            // 步骤 2: 构建专栏和文章的目录结构
            const menu = buildMenu(columnInfo);

            // 步骤 3: 将目录添加到边侧
            addMenuToSidebar(menu);

            // 步骤 4: 实现点击切换文章
            addClickEventToMenu(menu);
        });

        // // 步骤 1: 获取当前文章所属的专栏信息
        // const columnInfo = getColumnInfo();

        // // 步骤 2: 构建专栏和文章的目录结构
        // const menu = buildMenu(columnInfo);

        // // 步骤 3: 将目录添加到边侧
        // addMenuToSidebar(menu);

        // // 步骤 4: 实现点击切换文章
        // addClickEventToMenu(menu);
    };

    function getColumnInfo() {
        const columnInfoListDom = $$('#blogColumnPayAdvert .column-group-item');
        const promises = Array.from(columnInfoListDom).map(element => {
            const columnUrl = element.querySelector('.item-target').href;
            const columnTitle = element.querySelector('.item-target').title;
            // 访问专栏地址，获取专栏所有文章列表
            return fetch(columnUrl)
                .then(res => res.text())
                .then(data => {
                    const articles = parseArticlesFromHTML(data);
                    return { columnTitle, articles };
                })
                .catch(e => {
                    console.error('Error fetching column articles:', e);
                    return null;  // 在错误发生时返回null，以确保数组的长度不变
                });
        });
    
        return Promise.all(promises).then(results => {
            return results.filter(column => column !== null);  // 过滤掉null值
        });
    }


    function parseArticlesFromHTML(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const ul = doc.querySelector('.column_article_list');
        if (!ul) return []; // 检查.column_article_list是否存在
    
        const lis = Array.from(ul.querySelectorAll('li')); // 转换为数组
        const result = lis.map(li => {
            const a = li.querySelector('a');
            if (!a) return null; // 检查<a>标签是否存在
    
            const url = a.getAttribute('href');
            const title = a.querySelector('.title')?.innerText.trim(); // 使用?.避免错误，使用trim简化去空格和换行
            if (!title) return null; // 确保标题存在
    
            return { url, title };
        }).filter(article => article !== null); // 过滤掉null值
    
        // 如果需要反转结果，请确保有明确的排序逻辑
        result.reverse();
    
        return result;
    }

    function processArticles(columnTitle, articles) {
        // 处理文章信息，添加锚点链接
        // 这里需要根据实际需求来实现
        console.log(columnTitle);
        articles.forEach((article) => {
            console.log(article);
        });
    }

    function buildMenu(columnInfo) {
        const currentUrl = window.location.href;
        const menu = document.createElement('div');
        menu.classList.add('column-menu');
        console.log('columnInfo: ', columnInfo);
        console.log('listLength: ', columnInfo.length);
        columnInfo.forEach(column => {
            const columnTitle = column.columnTitle;
            const articles = column.articles;

            console.log('title: ', columnTitle);

            const columnHeader = document.createElement('h3');
            columnHeader.textContent = columnTitle;
            menu.appendChild(columnHeader);

            const articleList = document.createElement('ul');
            articleList.classList.add('article-list');

            articles.forEach(article => {
                const articleItem = document.createElement('li');
                const articleLink = document.createElement('a');
                articleLink.href = article.url;
                articleLink.textContent = article.title;
                if (article.url === currentUrl) {
                    // 文章链接与当前页面URL匹配，添加高亮样式
                    articleItem.classList.add('column-active');
                }
                articleItem.appendChild(articleLink);
                articleList.appendChild(articleItem);
            });

            menu.appendChild(articleList);
        });
        console.log('build menu finished.')

        return menu;
    }

    function addMenuToSidebar(menu) {
        console.log(menu);
        // 创建一个侧边栏容器
        // const sidebar = document.createElement('aside');
        const sidebar = document.createElement('div');
        sidebar.id = 'custom-sidebar'; // 添加一个ID以便于样式定位
        sidebar.classList.add('column-menu-sidebar');
        
        // 获取toolbarBox的高度，然后设置sidebar上边距
        //const toolbarBoxHeight = document.querySelector('.toolbarBox').offsetHeight;
        //sidebar.style.marginTop = `${toolbarBoxHeight}px`; // 设置上边距

        // 设置侧边栏样式，可以根据需要调整
        sidebar.style.position = 'fixed';
        sidebar.style.left = '0'; // 放置在页面左侧
        sidebar.style.right = 'auto'; // 重置右侧定位
        sidebar.style.width = '250px'; // 设置宽度
        sidebar.style.height = '100%'; // 设置高度为全屏
        sidebar.style.backgroundColor = '#f5f5f5'; // 设置背景颜色
        sidebar.style.overflowY = 'auto'; // 允许纵向滚动
        sidebar.style.padding = '10px'; // 设置内边距
        sidebar.style.boxShadow = '-2px 0 5px rgba(0,0,0,0.1)'; // 添加阴影效果
        sidebar.style.zIndex = '9999'; // 确保侧边栏在最上层

        sidebar.appendChild(menu);

        // 将侧边栏添加到body元素中
        // document.body.appendChild(sidebar);
        // 将侧边栏添加到toolbarBox后面
        // let toolbarBox = document.querySelector('#toolbarBox');
        let blogContentBox = document.querySelector('.blog-content-box');
        // let main = document.querySelector('#mainBox main')
        if (blogContentBox) {
            // 将侧边栏添加到mainBox后面
            blogContentBox.insertAdjacentElement('beforeBegin', sidebar);
        } else {
            document.body.insertBefore(sidebar, document.body.firstChild);
        }
        // document.body.insertBefore(sidebar, document.body.firstChild); // 将侧边栏添加到body元素的第一个子元素之前
        adjustMainContentStyle();
        

        console.log('add menu to sidebar success.')
    }

    function adjustMainContentStyle() {
        const mainContent = document.querySelector('.blog-content-box');
        if (mainContent) {
            mainContent.style.marginLeft = '250px'; // 调整主内容的margin-left，以留出侧边栏的空间
            mainContent.style.marginRight = '0'; // 重置主内容的margin-right
        } else {
            console.warn('Cannot find .article_content element.');
        }
    }

    function addClickEventToMenu(menu) {
        const articleLinks = menu.querySelectorAll('.article-list a');
        articleLinks.forEach(link => {
            link.addEventListener('click', event => {
                event.preventDefault();
                const targetUrl = link.getAttribute('href');
                // 直接在当前页面重新加载
                window.location.href = targetUrl;
            });
        });
    }

    // 在脚本末尾添加样式，可以使用GM_addStyle如果支持
    const customStyle = `
    #custom-sidebar {
        /* 这里可以添加更多的自定义样式 */
    }
    .column-menu {
        /* 菜单样式 */
    }
    .column-menu h3 {
        /* 标题样式 */
        margin-top: 0;
        padding: 10px;
        background-color: #eee;
    }
    .article-list {
        /* 文章列表样式 */
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .article-list li {
        /* 列表项样式 */
        padding: 5px 10px;
    }
    .article-list li:hover {
        /* 鼠标悬停样式 */
        background-color: #e0e0e0;
        cursor: pointer;
    }
    .article-list a {
        /* 链接样式 */
        text-decoration: none;
        color: inherit; /* 继承父元素颜色 */
    }
    .column-active {
        background-color: #ffcc00; /* 高亮颜色 */
        font-weight: bold; /* 字体加粗 */
    }
    `;

    // 如果支持GM_addStyle，则使用它来添加样式
    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(customStyle);
    } else {
        // 否则，创建一个style元素并添加到head中
        const styleEl = document.createElement('style');
        styleEl.type = 'text/css';
        styleEl.innerHTML = customStyle;
        document.head.appendChild(styleEl);
    }
})();
