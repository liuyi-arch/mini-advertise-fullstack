// 广告数据类型
export interface Ad {
  id?: number;
  title: string;
  publisher: string;
  content: string;
  landingUrl: string;
  price: number | string;
  clicked?: number;
}

// 表单字段配置类型
export interface FormField {
  name: keyof Ad;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  min?: number;
  step?: number | string;
  suffix?: string;
  pattern?: string;
}

// 表单配置类型
export interface FormConfig {
  fields: FormField[];
}
