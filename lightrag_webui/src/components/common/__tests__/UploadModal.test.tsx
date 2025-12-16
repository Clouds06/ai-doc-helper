import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'

// 1. 模拟 API 模块
mock.module('@/api/lightrag', () => ({
  uploadDocument: mock(() => Promise.resolve({ status: 'success', message: 'ok' }))
}))

const { render, screen, fireEvent, waitFor, cleanup } = await import('@testing-library/react')
const { UploadModal } = await import('../UploadModal')
const { useUploadStore } = await import('@/hooks/useUploadStore')

describe('UploadModal Component', () => {
  beforeEach(() => {
    cleanup()
    const { close } = useUploadStore.getState()
    close()
  })

  afterEach(() => {
    mock.restore()
  })

  it('should not render when store isOpen is false', () => {
    render(<UploadModal />)
    const title = screen.queryByText('上传文档')
    expect(title).toBeNull()
  })

  it('should render correctly when store is opened', () => {
    useUploadStore.getState().open()
    render(<UploadModal />)
    expect(screen.getByText('上传文档')).toBeTruthy()
  })

  it('should add files via UI interaction and display them', async () => {
    // 1. 打开弹窗
    useUploadStore.getState().open()
    const { container } = render(<UploadModal />)

    // 2. 模拟用户选择文件 (因为不能通过 Store 注入，必须模拟 input change)
    const file = new File(['content'], 'test-doc.pdf', { type: 'application/pdf' })
    // 获取 react-dropzone 创建的隐藏 input
    const input = container.querySelector('input[type="file"]')

    expect(input).toBeTruthy()
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }

    // 3. 验证界面是否显示了文件名
    await waitFor(() => {
      expect(screen.getByText('test-doc.pdf')).toBeTruthy()
    })
  })

  it('should call onUploadComplete prop when upload finishes', async () => {
    const file = new File(['abc'], 'test.txt', { type: 'text/plain' })
    const onCompleteMock = mock()

    useUploadStore.getState().open()
    const { container } = render(<UploadModal onUploadComplete={onCompleteMock} />)

    // 模拟添加文件
    const input = container.querySelector('input[type="file"]')
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }

    // 等待文件显示
    await waitFor(() => screen.getByText('test.txt'))

    // 点击上传
    const uploadBtn = screen.getByText('确认上传')
    fireEvent.click(uploadBtn)

    // 验证 API 调用和回调
    await waitFor(() => {
      expect(onCompleteMock).toHaveBeenCalled()
    })
  })

  it('should call store.onSuccess if defined (legacy support)', async () => {
    const file = new File(['123'], 'legacy.txt', { type: 'text/plain' })
    const onSuccessMock = mock()

    // 1. 打开弹窗并传入回调 (这是你 useUploadStore 的原生逻辑)
    useUploadStore.getState().open(onSuccessMock)

    const { container } = render(<UploadModal />)

    // 2. 模拟添加文件
    const input = container.querySelector('input[type="file"]')
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }

    // 等待文件显示
    await waitFor(() => screen.getByText('legacy.txt'))

    // 3. 点击上传
    const uploadBtn = screen.getByText('确认上传')
    fireEvent.click(uploadBtn)

    // 4. 验证 store 中的 onSuccess 是否被调用
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalled()
    })
  })
})

