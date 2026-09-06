export interface DataAdapter {
  toModel: (formData: any) => any;
  fromModel: (model: any) => any;
  normalize?: (data: any) => Promise<any> | any;
  validate?: (data: any) => { valid: boolean; errors?: string[] };
}
