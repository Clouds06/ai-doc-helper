import { create } from 'zustand';

type UploadStore = {
  /* 上传弹窗是否打开 */
  isOpen: boolean;
  /* 打开上传弹窗 */
  open: () => void;
  /* 关闭上传弹窗 */
  close: () => void;
};

export const useUploadStore = create<UploadStore>((set) => ({
  isOpen: false,

  open: () =>
    set(() => ({
      isOpen: true,
    })),

  close: () =>
    set(() => ({
      isOpen: false,
    })),
}));
