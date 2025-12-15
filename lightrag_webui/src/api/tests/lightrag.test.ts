import { describe, it, expect, mock, beforeEach } from 'bun:test';

// --- 1. 先定义 Mock (在业务代码加载前拦截) ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockPost = mock((..._args: any[]) => 
  Promise.resolve({ 
    data: { status: 'success', message: 'ok' } 
  })
);

mock.module('axios', () => ({
  default: {
    create: () => ({
      interceptors: {
        request: { use: () => {} },
        response: { use: () => {} },
      },
      post: mockPost,
    }),
  },
}));

// --- 2. 使用动态导入加载业务代码 ---
// 这样能确保上面的 mock.module 已经生效
const { uploadDocument } = await import('../lightrag');

describe('API: lightrag', () => {
  beforeEach(() => {
    mockPost.mockClear();
  });

  it('uploadDocument should post FormData to correct endpoint', async () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const response = await uploadDocument(file);

    expect(mockPost).toHaveBeenCalled();
    const [url, formData, config] = mockPost.mock.calls[0];
    
    expect(url).toBe('/documents/upload');
    expect(formData).toBeInstanceOf(FormData);
    expect(config.headers['Content-Type']).toBe('multipart/form-data');
    expect(response).toEqual({ status: 'success', message: 'ok' });
  });

  it('uploadDocument should handle progress callback', async () => {
    const file = new File(['test'], 'test.txt');
    const onProgress = mock();

    mockPost.mockImplementation((url, data, config) => {
      if (config.onUploadProgress) {
        config.onUploadProgress({ loaded: 50, total: 100 });
      }
      return Promise.resolve({ 
        data: { status: 'success', message: 'ok' } 
      });
    });

    await uploadDocument(file, onProgress);
    expect(onProgress).toHaveBeenCalledWith(50);
  });
});