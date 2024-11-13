// ==UserScript==
// @name         CSDN Column Optimization
// @description  Optimize CSDN columns by adding a side menu with a list of all articles in the current column.
// @version      1.0
// @author       Silence
// @match        *://blog.csdn.net/*/article/*
// @match        *://*.blog.csdn.net/article/*
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
    };

    async function getColumnArticles(columnId, blogUsername, articleCount) {
        const pageSize = 100; // 每页最大100条
        const totalPages = Math.ceil(articleCount / pageSize);
        let allArticles = [];
        
        try {
            // 并发请求所有页面
            const promises = Array.from({ length: totalPages }, (_, i) => {
                const page = i + 1;
                return fetch(`https://blog.csdn.net/phoenix/web/v1/column/article/list?columnId=${columnId}&blogUsername=${blogUsername}&page=${page}&pageSize=${pageSize}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.code === 200) {
                            return data.data.map(article => ({
                                url: article.url,
                                title: article.title
                            }));
                        }
                        throw new Error(`获取专栏文章失败: ${data.message}`);
                    });
            });
    
            const results = await Promise.all(promises);
            allArticles = results.flat();
            
        } catch (error) {
            console.error('获取专栏文章失败:', error);
        }
        console.log('allArticles length:', allArticles.length);
        return allArticles;
    } 

    function getColumnInfo() {
        // const columnItems = $$('#item-target');
        // console.log('columnItems: ', columnItems);
        const columnInfoListDom = $$('#blogColumnPayAdvert .column-group-item');
        const promises = Array.from(columnInfoListDom).map(async element => {
            const columnUrl = element.querySelector('.item-target').href;
            const columnTitle = element.querySelector('.item-target').title;
            const columnInfo = element.querySelector('.item-m').querySelectorAll('span');
            let articleCount = 0;
            columnInfo.forEach(info => {
                if (info.innerText.includes('篇文章')) {
                    articleCount = info.innerText.replace(' 篇文章', '');
                }
            })
            console.log('articleCount: ', articleCount);
            // 从columnUrl获取blogUserName和columnId
            const urlInfo = parseColumnUrl(columnUrl);
            if (!urlInfo) {
                console.error('无法解析专栏 URL:', columnUrl);
                return null;
            }

            const { blogUsername, columnId } = urlInfo;
            console.log('解析结果:', { blogUsername, columnId });
            
            // 访问专栏地址，获取专栏所有文章列表
            try {
                const articles = await getColumnArticles(columnId, blogUsername, articleCount);
                return { columnTitle, articles };
            } catch (error) {
                console.error('Error fetching column articles:', error);
                return null;
            }
        });
    
        return Promise.all(promises).then(results => {
            return results.filter(column => column !== null);  // 过滤掉null值
        });
    }

    function parseColumnUrl(url) {
        // 使用正则表达式匹配 URL 中的用户名和专栏 ID
        const regex = /blog\.csdn\.net\/([^\/]+)\/category_(\d+)\.html/;
        const match = url.match(regex);
        
        if (match) {
            return {
                blogUsername: match[1],  // 第一个捕获组是用户名
                columnId: match[2]       // 第二个捕获组是专栏 ID
            };
        }
        
        return null;
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

    function buildMenu(columnInfo) {
        const currentUrl = window.location.href;
        const menu = document.createElement('div');
        menu.classList.add('column-menu');
        
        // 添加专栏选择器
        const columnSelector = document.createElement('select');
        columnSelector.classList.add('column-selector');
        
        // 找到当前文章所在的专栏
        let currentColumnIndex = 0;
        columnInfo.forEach((column, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = column.columnTitle;
            columnSelector.appendChild(option);
            // 检查当前文章是否在这个专栏中
            if (column.articles.some(article => article.url.split('/').pop().split('?')[0] === currentUrl.split('/').pop().split('?')[0])) {
                currentColumnIndex = index;
            }
        });

        // 设置当前专栏为默认选中
        columnSelector.value = currentColumnIndex;

        // 添加切换事件
        columnSelector.addEventListener('change', (e) => {
            const selectedIndex = e.target.value;
            showColumnArticles(columnInfo[selectedIndex], menu);
        });

        menu.appendChild(columnSelector);

        // 显示当前专栏的文章
        showColumnArticles(columnInfo[currentColumnIndex], menu);
        
        return menu;
    }

    function showColumnArticles(column, menu) {
        const currentUrl = window.location.href;
    
        // 移除现有的文章列表
        const existingList = menu.querySelector('.article-list');
        if (existingList) {
            existingList.remove();
        }

        const articleList = document.createElement('ul');
        articleList.classList.add('article-list');

        let activeArticleElement = null;

        column.articles.forEach(article => {
            const articleItem = document.createElement('li');
            const articleLink = document.createElement('a');
            articleLink.href = article.url;
            articleLink.textContent = article.title;
            
            if (article.url.split('/').pop().split('?')[0] === currentUrl.split('/').pop().split('?')[0]) {
                articleItem.classList.add('column-active');
                activeArticleElement = articleItem;
            }
            
            articleItem.appendChild(articleLink);
            articleList.appendChild(articleItem);
        });

        menu.appendChild(articleList);

        // 滚动到当前文章
        if (activeArticleElement) {
            // 等待 DOM 更新完成后再滚动
            setTimeout(() => {
                activeArticleElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center'
                });
            }, 100);
        }
    }

    function addMenuToSidebar(menu) {
        const sidebar = document.createElement('div');
        sidebar.id = 'custom-sidebar';
        sidebar.classList.add('column-menu-sidebar');
        
        // 添加标题栏
        const titleBar = document.createElement('div');
        titleBar.classList.add('sidebar-title');
        
        // 添加标题文本容器
        const titleContent = document.createElement('div');
        titleContent.classList.add('title-content');
        titleContent.textContent = '专栏文章';
        
        // 添加按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('title-buttons');
        
        // 添加定位按钮
        const locateBtn = document.createElement('button');
        locateBtn.classList.add('sidebar-btn', 'locate-btn');
        locateBtn.innerHTML = '&#x1F50D;'; // 放大镜图标
        locateBtn.title = '定位当前文章';
        locateBtn.onclick = () => {
            const activeArticle = sidebar.querySelector('.column-active');
            if (activeArticle) {
                activeArticle.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        };
        
        // 添加收起按钮
        const collapseBtn = document.createElement('button');
        collapseBtn.classList.add('sidebar-btn', 'collapse-btn');
        collapseBtn.innerHTML = '&times;'; // × 符号
        collapseBtn.title = '收起侧边栏';
        
        // 组装按钮容器
        buttonContainer.appendChild(locateBtn);
        buttonContainer.appendChild(collapseBtn);
        
        // 组装标题栏
        titleBar.appendChild(titleContent);
        titleBar.appendChild(buttonContainer);
        sidebar.appendChild(titleBar);
        sidebar.appendChild(menu);
        
        // 添加收起后的展开按钮
        const expandBtn = document.createElement('div');
        expandBtn.id = 'sidebar-expand-btn';
        expandBtn.title = '展开侧边栏';
        expandBtn.style.display = 'none';
        document.body.appendChild(expandBtn);
        
        // 添加收起/展开事件
        collapseBtn.addEventListener('click', () => toggleSidebar(false));
        expandBtn.addEventListener('click', () => toggleSidebar(true));
        
        // 插入侧边栏到页面
        const blogContentBox = document.querySelector('.blog-content-box');
        if (blogContentBox) {
            blogContentBox.insertAdjacentElement('beforeBegin', sidebar);
        } else {
            document.body.insertBefore(sidebar, document.body.firstChild);
        }
        
        adjustMainContentStyle(true);
    }

    function toggleSidebar(show) {
        const sidebar = document.querySelector('#custom-sidebar');
        const expandBtn = document.querySelector('#sidebar-expand-btn');
        
        if (show) {
            sidebar.style.transform = 'translateX(0)';
            expandBtn.style.display = 'none';
            adjustMainContentStyle(true);
        } else {
            sidebar.style.transform = 'translateX(-250px)';
            expandBtn.style.display = 'block';
            adjustMainContentStyle(false);
        }
    }

    function adjustMainContentStyle(isExpanded) {
        const mainContent = document.querySelector('.blog-content-box');
        if (mainContent) {
            const margin = isExpanded ? '250px' : '0';
            
            mainContent.style.marginLeft = margin;
            mainContent.style.marginRight = '0';
    
            // 调整顶部工具栏
            const topToolbarBox = document.querySelector('#toolbarBox');
            if (topToolbarBox) {
                topToolbarBox.style.marginLeft = margin;
            }
            
            // 调整底部工具栏
            const bottomToolbox = document.querySelector('#toolBarBox');
            if (bottomToolbox) {
                bottomToolbox.style.marginLeft = margin;
            }
    
            // 调整评论区
            const footer = document.querySelector('#pcCommentBox');
            if (footer) {
                footer.style.marginLeft = margin;
            }
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

// 更新样式
const customStyle = `
    #custom-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        width: 250px;
        height: 100vh;
        background-color: #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        z-index: 999;
        overflow-y: auto;
        padding: 0;
        border-right: 1px solid #eee;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        transition: transform 0.3s ease;
    }

    .sidebar-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        font-size: 16px;
        font-weight: bold;
        border-bottom: 1px solid #eee;
        background-color: #f8f9fa;
    }

    .title-buttons {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .sidebar-btn {
        background: none;
        border: none;
        color: #666;
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
    }

    .sidebar-btn:hover {
        background-color: rgba(0, 0, 0, 0.05);
        color: #1890ff;
    }

    .locate-btn {
        font-size: 14px;
    }

    .title-content {
        flex: 1;
    }

    .collapse-btn {
        //background: none;
        //border: none;
        //color: #666;
        font-size: 18px;
        //cursor: pointer;
        //padding: 0 5px;
        //transition: color 0.2s;
    }

     /* 添加按钮激活状态样式 */
    .sidebar-btn:active {
        transform: scale(0.95);
    }

    .collapse-btn:hover {
        color: #1890ff;
    }

    #sidebar-expand-btn {
        position: fixed;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 50px;
        background-color: #fff;
        box-shadow: 2px 0 4px rgba(0,0,0,0.1);
        cursor: pointer;
        z-index: 999;
        border-radius: 0 4px 4px 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
        text-align: center;
        line-height: 50px;
    }

    #sidebar-expand-btn:hover {
        background-color: #f0f0f0;
    }

    #sidebar-expand-btn::after {
        content: '›';
        font-size: 20px;
        color: #666;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        line-height: 1;
    }

    .column-selector {
        width: 90%;
        margin: 10px auto;
        display: block;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        background-color: #fff;
    }

    .column-selector:hover {
        border-color: #40a9ff;
    }

    .column-selector:focus {
        outline: none;
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24,144,255,0.2);
    }

    .article-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .article-list li {
        padding: 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .article-list li a {
        display: block;
        padding: 12px 15px;
        color: #333;
        text-decoration: none;
        font-size: 14px;
        line-height: 1.5;
        transition: all 0.2s;
    }

    .article-list li:hover {
        background-color: #f8f9fa;
    }

    .article-list li:hover a {
        color: #1890ff;
    }

    .column-active {
        background-color: #e6f7ff;
    }

    .column-active a {
        color: #1890ff !important;
        font-weight: 500;
    }

    /* 滚动条样式 */
    #custom-sidebar::-webkit-scrollbar {
        width: 6px;
    }

    #custom-sidebar::-webkit-scrollbar-track {
        background: #f1f1f1;
    }

    #custom-sidebar::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 3px;
    }

    #custom-sidebar::-webkit-scrollbar-thumb:hover {
        background: #555;
    }

    /* 响应式设计 */
    @media (max-width: 1200px) {
        #custom-sidebar {
            width: 200px;
        }
        
        .blog-content-box {
            margin-left: 200px !important;
        }
        
        #sidebar-expand-btn {
            width: 16px;
        }
        
        .column-selector {
            width: 85%;
        }
    }

    /* 动画过渡效果 */
    .blog-content-box,
    #toolbarBox,
    #toolBarBox,
    #pcCommentBox {
        transition: margin-left 0.3s ease;
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