import { describe, it, expect, beforeEach } from 'bun:test';
import { useUploadStore } from '../useUploadStore';

describe('useUploadStore', () => {
  // 每次测试前重置 store 状态
  beforeEach(() => {
    const { close } = useUploadStore.getState();
    close();
  });

  it('should initialize with default closed state', () => {
    const { isOpen, onSuccess } = useUploadStore.getState();
    expect(isOpen).toBe(false);
    expect(onSuccess).toBeUndefined();
  });

  it('should open modal and store the success callback', () => {
    // 模拟一个回调函数
    const mockCallback = () => console.log('refresh list');

    // 调用 open
    useUploadStore.getState().open(mockCallback);

    const { isOpen, onSuccess } = useUploadStore.getState();
    expect(isOpen).toBe(true);
    // 验证回调函数是否被正确存储
    expect(onSuccess).toBe(mockCallback);
  });

  it('should close modal and clear the callback', () => {
    const mockCallback = () => {};

    // 先打开
    useUploadStore.getState().open(mockCallback);
    // 再关闭
    useUploadStore.getState().close();

    const { isOpen, onSuccess } = useUploadStore.getState();
    expect(isOpen).toBe(false);
    // 验证回调是否被清理，防止污染下一次操作
    expect(onSuccess).toBeUndefined();
  });

  it('should overwrite callback when opened again', () => {
    const callback1 = () => 1;
    const callback2 = () => 2;

    useUploadStore.getState().open(callback1);
    expect(useUploadStore.getState().onSuccess).toBe(callback1);

    useUploadStore.getState().open(callback2);
    expect(useUploadStore.getState().onSuccess).toBe(callback2);
  });
});
