export type Memo = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export type ToastMessage = {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
};
