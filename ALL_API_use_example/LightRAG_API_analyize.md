

## 1. 主要接口和端点

### 1.1 文档管理相关接口

| 接口名称                 | 方法   | 端点                                | 功能描述                       |
| ------------------------ | ------ | ----------------------------------- | ------------------------------ |
| getDocuments             | GET    | `/documents`                        | 获取所有文档状态               |
| getDocumentsPaginated    | POST   | `/documents/paginated`              | 分页获取文档                   |
| scanNewDocuments         | POST   | `/documents/scan`                   | 扫描新文档                     |
| reprocessFailedDocuments | POST   | `/documents/reprocess_failed`       | 重新处理失败文档               |
| getDocumentsScanProgress | GET    | `/documents/scan-progress`          | 获取文档扫描进度               |
| getPipelineStatus        | GET    | `/documents/pipeline_status`        | 获取处理管道状态               |
| cancelPipeline           | POST   | `/documents/cancel_pipeline`        | 取消处理管道                   |
| getDocumentStatusCounts  | GET    | `/documents/status_counts`          | 获取文档状态计数               |
| uploadDocument           | POST   | `/documents/upload`                 | 上传单个文档                   |
| batchUploadDocuments     | POST   | `/documents/upload`                 | 批量上传文档(内部调用单个上传) |
| deleteDocuments          | DELETE | `/documents/delete_document`        | 删除文档                       |
| clearDocuments           | DELETE | `/documents`                        | 清除所有文档                   |
| clearCache               | POST   | `/documents/clear_cache`            | 清除缓存                       |
| insertText               | POST   | `/documents/text`                   | 插入文本                       |
| insertTexts              | POST   | `/documents/texts`                  | 插入多个文本                   |
| getTrackStatus           | GET    | `/documents/track_status/{trackId}` | 获取文档处理状态跟踪           |

### 1.2 图数据相关接口

| 接口名称              | 方法 | 端点                   | 功能描述             |
| --------------------- | ---- | ---------------------- | -------------------- |
| queryGraphs           | GET  | `/graphs`              | 查询图谱数据         |
| getGraphLabels        | GET  | `/graph/label/list`    | 获取所有图谱标签     |
| getPopularLabels      | GET  | `/graph/label/popular` | 获取热门标签         |
| searchLabels          | GET  | `/graph/label/search`  | 搜索标签             |
| updateEntity          | POST | `/graph/entity/edit`   | 更新实体属性         |
| updateRelation        | POST | `/graph/relation/edit` | 更新关系属性         |
| checkEntityNameExists | GET  | `/graph/entity/exists` | 检查实体名称是否存在 |

### 1.3 查询和认证相关接口

| 接口名称        | 方法 | 端点            | 功能描述         |
| --------------- | ---- | --------------- | ---------------- |
| queryText       | POST | `/query`        | 文本查询         |
| queryTextStream | POST | `/query/stream` | 流式文本查询     |
| checkHealth     | GET  | `/health`       | 检查后端健康状态 |
| getAuthStatus   | GET  | `/auth-status`  | 获取认证状态     |
| loginToServer   | POST | `/login`        | 登录认证         |


