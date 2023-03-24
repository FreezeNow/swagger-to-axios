// @ts-ignore
declare interface Api {
  url: string;
  method: string[];
  comment: { summary: string; description: string }[];
}

declare interface Tag {
  name: string;
  comment: string;
  list: Api[];
}

declare interface Folder {
  name: string;
  cliType: string;
  baseURL: string;
  host: string;
  list: Tag[];
}
