## CSDN 专栏优化用户脚本

### 概述

本用户脚本旨在优化 CSDN 专栏的阅读体验。通过在页面侧边添加一个菜单，用户可以快速查看当前专栏下的所有文章列表，并实现点击切换文章的功能。此外，脚本还支持缓存机制，以提高加载速度。

### 前置条件

- 您需要先安装一个用户脚本管理器，如 [Tampermonkey](https://tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)。
- 您还需要先安装 [CSDNGreener](https://github.com/adlered/CSDNGreener) 脚本，因为开发时使用了该脚本，所以没考虑不安装本脚本的格式。

### 运行方法

1. 安装好用户脚本管理器后，使用添加新脚本，然后将 `src/BlogColumn.user.js` 代码粘贴到对应位置。
2. 安装完成后，访问任意 CSDN 专栏文章页面，即可看到侧边栏菜单。

### 功能特点

- **专栏文章列表**：在侧边栏显示当前专栏的所有文章列表。
- **缓存机制**：通过本地存储缓存文章列表，减少重复请求，提高加载速度。
- **文章切换**：点击文章列表中的文章链接，可快速跳转到对应文章。
- **文章目录**：支持切换显示文章目录，方便导航。
- **定位功能**：提供定位当前文章/目录的按钮，方便用户快速找到当前文章/目录的位置。
- **返回顶端功能**：在专栏模式下，提供返回目录顶端的按钮，方便文章数量较多时快速回到顶部。
- **侧边栏控制**：提供展开和收起侧边栏的按钮，以及切换专栏文章和文章目录的按钮。
- **用户行为参数去除**：去除文章页面的用户行为参数，避免对用户隐私的侵犯。

### 技术细节

- **缓存机制**：使用 `localStorage` 存储文章列表，设置缓存过期时间为24小时。
- **懒加载**：首次加载时只加载第一页专栏文章（100篇），后续页面按需加载。
- **动态生成**：根据页面内容动态生成侧边栏菜单和文章目录。
- **滚动监听**：使用 `IntersectionObserver` 监听文章标题的滚动，自动高亮当前可视区域的文章标题。

### 构建方法

如果您希望自行构建或修改此用户脚本，请按照以下步骤操作：

1. 克隆或下载此项目到本地。
2. 打开 `src/BlogColumn.user.js` 文件。
3. 根据您的需求进行修改。
4. 保存文件并在用户脚本管理器中重新加载。

### 许可证

本项目采用 [MIT 许可证](LICENSE)。

### 其他信息

- 本用户脚本仅供学习和交流使用，请勿用于任何商业目的。
- 本项目不存储、不处理任何个人可识别信息（PII）。
- 使用本用户脚本时，请遵守 CSDN 的相关使用规定和法律法规。

---

请注意，为了保护个人隐私和遵守规定，原始 README 文件中的个人可识别信息（PII）和某些网站的超链接已被删除。