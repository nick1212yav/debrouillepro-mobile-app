export interface ModuleCapabilities {
  call?: boolean | ((context: any) => boolean);
  chat?: boolean | ((context: any) => boolean);
  booking?: boolean | ((context: any) => boolean);
  payment?: boolean | ((context: any) => boolean);
  navigation?: boolean | ((context: any) => boolean);
  share?: boolean | ((context: any) => boolean);
  save?: boolean | ((context: any) => boolean);
  report?: boolean | ((context: any) => boolean);
  review?: boolean | ((context: any) => boolean);
  livestream?: boolean | ((context: any) => boolean);
  videoCall?: boolean | ((context: any) => boolean);
  document?: boolean | ((context: any) => boolean);
  whatsapp?: boolean | ((context: any) => boolean);
  email?: boolean | ((context: any) => boolean);
  voice?: boolean | ((context: any) => boolean);
  video?: boolean | ((context: any) => boolean);
  live?: boolean | ((context: any) => boolean);
  delivery?: boolean | ((context: any) => boolean);
}
