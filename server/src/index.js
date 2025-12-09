import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';

const app = new Koa();
const router = new Router();

// Enable CORS
app.use(cors());

// Body parser middleware
app.use(bodyParser());

// In-memory database (replace with a real database in production)
let ads = [
  { id: 1, title: "我是标题1", publisher: "淘宝联盟", content: "这里是广告文案内容，它将尝试占据至少两行空间，以保持卡片的视觉平衡。", landingUrl: "#", price: 123, clicked: 123 },
  { id: 2, title: "广告标题2", publisher: "阿里云", content: "简洁的广告内容。", landingUrl: "#", price: 100, clicked: 100 },
  { id: 3, title: "广告标题3", publisher: "极客时间", content: "这是一个较长的内容描述，用于测试卡片在横向布局下的自适应和换行效果。", landingUrl: "#", price: 3, clicked: 3 },
];

// Form configuration
const formConfig = {
  fields: [
    {
      name: 'title',
      label: '广告标题',
      type: 'text',
      required: true,
      placeholder: '请输入广告标题',
      maxLength: 50
    },
    {
      name: 'publisher',
      label: '发布人',
      type: 'text',
      required: true,
      placeholder: '请输入发布人',
      maxLength: 20
    },
    {
      name: 'content',
      label: '内容文案',
      type: 'textarea',
      required: true,
      placeholder: '请输入广告内容',
      maxLength: 500
    },
    {
      name: 'landingUrl',
      label: '落地页',
      type: 'url',
      required: true,
      placeholder: '请输入落地页URL',
      pattern: 'https?://.*'
    },
    {
      name: 'price',
      label: '出价',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01,
      suffix: '元'
    }
  ]
};

// Get form configuration
router.get('/api/form-config', (ctx) => {
  ctx.body = {
    success: true,
    data: formConfig
  };
});

// Get all ads
router.get('/api/ads', (ctx) => {
  ctx.body = {
    success: true,
    data: ads
  };
});

// Get a single ad
router.get('/api/ads/:id', (ctx) => {
  const ad = ads.find(a => a.id === parseInt(ctx.params.id));
  if (!ad) {
    ctx.status = 404;
    ctx.body = { success: false, message: 'Ad not found' };
    return;
  }
  ctx.body = { success: true, data: ad };
});

// Create a new ad
router.post('/api/ads', (ctx) => {
  const { title, publisher, content, landingUrl, price } = ctx.request.body;
  
  if (!title || !publisher || !content || !landingUrl || price === undefined) {
    ctx.status = 400;
    ctx.body = { success: false, message: 'Missing required fields' };
    return;
  }

  const newAd = {
    id: Date.now(),
    title,
    publisher,
    content,
    landingUrl,
    price: parseFloat(price),
    clicked: 0
  };

  ads.push(newAd);
  
  ctx.status = 201;
  ctx.body = { success: true, data: newAd };
});

// Update an ad
router.put('/api/ads/:id', (ctx) => {
  const id = parseInt(ctx.params.id);
  const adIndex = ads.findIndex(a => a.id === id);
  
  if (adIndex === -1) {
    ctx.status = 404;
    ctx.body = { success: false, message: 'Ad not found' };
    return;
  }

  const { title, publisher, content, landingUrl, price } = ctx.request.body;
  
  const updatedAd = {
    ...ads[adIndex],
    ...(title !== undefined && { title }),
    ...(publisher !== undefined && { publisher }),
    ...(content !== undefined && { content }),
    ...(landingUrl !== undefined && { landingUrl }),
    ...(price !== undefined && { price: parseFloat(price) })
  };

  ads[adIndex] = updatedAd;
  
  ctx.body = { success: true, data: updatedAd };
});

// Delete an ad
router.delete('/api/ads/:id', (ctx) => {
  const id = parseInt(ctx.params.id);
  const adIndex = ads.findIndex(a => a.id === id);
  
  if (adIndex === -1) {
    ctx.status = 404;
    ctx.body = { success: false, message: 'Ad not found' };
    return;
  }
  
  ads.splice(adIndex, 1);
  
  ctx.body = { success: true, message: 'Ad deleted successfully' };
});

// Increment click count
router.post('/api/ads/:id/click', (ctx) => {
  const id = parseInt(ctx.params.id);
  const ad = ads.find(a => a.id === id);
  
  if (!ad) {
    ctx.status = 404;
    ctx.body = { success: false, message: 'Ad not found' };
    return;
  }
  
  ad.clicked += 1;
  
  ctx.body = { 
    success: true, 
    data: { 
      id: ad.id, 
      clicked: ad.clicked 
    } 
  };
});

// Use routes
app.use(router.routes()).use(router.allowedMethods());

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app; // For testing purposes
