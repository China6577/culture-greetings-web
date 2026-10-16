# culture-greetings-web · 拾笺 Kinship

《基于文化感知的智能 H5 数字贺卡生成平台》第一阶段：文化自适应前端基础系统。

## 本地运行

需要 Node.js 22.12+（或受当前 Vite 支持的 Node 版本），以及 npm。

```powershell
cd culture-greetings-web
npm install
npm run dev
```

打开终端显示的地址（默认 http://127.0.0.1:5173）。

```powershell
npm run build    # TypeScript 严格检查 + 生产构建，输出 dist/
npm test         # 文化映射、翻译完整性、定位异常、分享数据协议测试
npm run preview # 本地预览生产构建
```

## 当前功能

| 路由        | 功能                                               |
| ----------- | -------------------------------------------------- |
| `/`         | 自适应文化首页、文化明信片、创建入口               |
| `/create`   | 文化上下文、场景选择、表单校验、本机草稿、实时预览 |
| `/generate` | 三步模拟流程；支持返回编辑并清理定时器             |
| `/card/:id` | H5 贺卡、全屏、分享、损坏或不存在链接的提示        |
| `/settings` | 国家选择、对应语言与主题展示、动画、重新定位       |

右上角使用自定义国家菜单，中国固定简体中文、日本固定日文、美国固定美式英文、英国固定英式英文、法国固定法文，Global 固定美式英文。菜单包含国家、对应语言、选中标记，支持方向键、Home/End、Enter、Escape 及点击外部关闭。语言与主题均由国家决定，无法独立覆盖。偏好保存到 localStorage，旧版本的跨语言设置会按保存的国家纠正。文化探索独立页面与导航已移除，旧 `/culture` 地址自动返回首页；首页的文化卡片展示和三步介绍区已按设计反馈删除。

## 架构

```text
src/
  components/  ThemeProvider、Header、Hero、CultureCard、CountrySwitcher、AnimatedBackground、CardExperience
  pages/       五个页面；除首页外按路由懒加载
  themes/      六套独立配置、类型、主题注册表、assets 说明
  locales/     五份完整 JSON 文案
  services/    locationService、cardService 与协议测试
  animations/  本地 Lottie 动画数据
  utils/       可容错的浏览器存储工具
public/art/    六套第一方 SVG 文化插画，无外部图片依赖
scripts/       本地文化插画与语言资源生成工具
docs/          架构与接口说明
```

主题配置提供颜色、字体、资源、动效与文化内容。ThemeProvider 用 CSS 变量统一注入，不在页面中按国家编写条件分支。GSAP 用于首页入场，Framer Motion 用于页面过渡，Lottie 用于模拟流程。动效遵守系统减少动画偏好及页面设置。

## 模拟定位与部署

开发服务器与 `npm run preview` 提供 `GET /api/location`：

```json
{ "country": "CN", "language": "zh-CN", "source": "mock" }
```

**当前不读取真实 IP。** Vite 插件只用于本地开发/预览，不是生产后端。生产静态托管时，如未配置 API，前端会超时/异常回退 Global。真实环境需由服务端提供定位接口；客户端不应持有 IP 服务密钥。无法仅靠 IP 可靠识别 VPN，本阶段不声称提供 VPN 检测；用户可随时手动覆盖地区。

部署 `dist/` 时需将非静态资源的页面路径回写到 `index.html`，以支持 React Router 深链接。`/api/*` 应交给独立后端，不能回写为 HTML。详细契约见 `docs/ARCHITECTURE.md`。

## 演示数据与边界

- 不调用 AI / 大模型 / 图片生成 / 向量数据库；不提供用户数据库或登录。
- 生成过程只把用户原文与主题配置组合成预览，约 3.6 秒后进入展示页。
- 草稿、偏好、贺卡保存在本机；存储不可用时仍可在当前会话完成预览。
- 分享链接携带经过校验的贺卡内容，可在相同站点的其他设备打开。链接持有者可以读到收件人、署名和消息。它不是加密链接或服务器持久化记录。
- 个人的 localhost 地址仅本机可访问。外部设备分享需要将静态站点部署到可访问的地址。
- 支持全屏 API 与系统分享 API；环境不支持时分别提示或回退到复制链接。
- 文化配置是创意起点，不把地区识别视为个人文化身份。文化资料如用于论文，应补充学术来源审校。

## 扩展

新增国家：添加 `themes/<country>/config.ts` 与静态资源，扩展 `CountryCode` / 主题注册表，并补齐五份语言的 country、theme、story 文案。

下一阶段可沿 `locationService` 与 `cardService` 边界接入服务端、生成任务、RAG、图片资源及身份权限。完整建议见架构说明。

技术：React 19、TypeScript strict、Vite、React Router、Tailwind CSS、GSAP、Framer Motion、Lottie、i18next。视觉样式由语义 CSS 变量与自定义组件负责，Tailwind 通过 Vite 插件启用。
