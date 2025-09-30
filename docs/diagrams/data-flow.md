```mermaid
graph LR
  Creator -->|提交创作| Studio
  Studio -->|调用| AI
  AI -->|生成图案/模型| Storage
  Storage -->|写入草稿| Firestore_Creations
  Firestore_Creations -->|触发| IngestionPipeline
  IngestionPipeline -->|更新缓存| FeedCache
  FeedCache --> FeedService
  FeedService --> UserFeed
  UserFeed -->|下单| Checkout
  Checkout --> Payments
  Payments --> Orders
  Orders --> Shipping
```
