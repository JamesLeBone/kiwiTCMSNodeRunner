declare type BasicValue = string|number|boolean|null|undefined
declare type KVP = { [key: string]: BasicValue }
declare type KVS = { [key: string]: string }

declare interface DbUser {
    userId: number
    firstName: string|null
    lastName: string|null
    email: string|null
    secret: string|null
}

declare interface NextPageProps {
    params: Promise<Record<string, string | string[]>>
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare type GenericClickEvent = {
  buttonText: string
  callback: (data:any) => Promise // StatusOperation
}

