import { create } from 'zustand';

type UploadStore = {
  isOpen: boolean;
  /* 存储上传成功后的临时回调函数 */
  onSuccess?: () => void | Promise<void>;
  /* 打开上传弹窗，可选传入成功回调 */
  open: (onSuccess?: () => void | Promise<void>) => void;
  close: () => void;
};

export const useUploadStore = create<UploadStore>((set) => ({
  isOpen: false,
  onSuccess: undefined,

  open: (callback) =>
    set(() => ({
      isOpen: true,
      onSuccess: callback, // 将回调存入 store
    })),

  close: () =>
    set(() => ({
      isOpen: false,
      onSuccess: undefined, // 关闭时清理回调，避免污染下次调用
    })),
}));
