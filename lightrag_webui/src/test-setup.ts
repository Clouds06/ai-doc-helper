import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { afterEach } from 'bun:test'

// 立即注册 Happy DOM，而不是等到 beforeAll
// 这确保在任何测试运行前 document 和 window 都可用
GlobalRegistrator.register()

// 在每个测试后清理 DOM，避免测试间的污染
afterEach(() => {
  // 清理 document.body 中的所有内容
  if (document?.body) {
    document.body.innerHTML = ''
  }
  // 清理 document.head 中的动态添加的内容（除了初始 head 内容）
  if (document?.head) {
    const dynamicElements = document.head.querySelectorAll('[data-test]')
    dynamicElements.forEach((el) => el.remove())
  }
})

