```mermaid
graph TD
  User -->|浏览| FeedUI
  FeedUI -->|Server Actions| FeedService
  FeedService --> Firestore
  FeedService --> Cache
  FeedService -->|日志| Logging
  FeedService -->|队列| CloudFunctions
  CloudFunctions --> AI
  CloudFunctions --> Payments
  CloudFunctions --> Moderation
  CloudFunctions --> Shipping
```
