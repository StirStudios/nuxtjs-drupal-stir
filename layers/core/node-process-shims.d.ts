 type NodeBufferLike = {
   length: number
   toString(encoding?: string): string
 }
 
 declare module 'node:buffer' {
   export const Buffer: {
     from(value: string, encoding?: string): NodeBufferLike
     from(value: ArrayBuffer | ArrayBufferView | ArrayLike<number>): NodeBufferLike
   }
 }
 
 declare module 'node:crypto' {
   type NodeCryptoHash = {
     update(data: string): {
       digest(encoding: string): string
     }
   }
 
   export function createHmac(
     algorithm: string,
     secret: string | ArrayBuffer | ArrayBufferView | ArrayLike<number> | NodeBufferLike,
   ): NodeCryptoHash
   export function timingSafeEqual(a: NodeBufferLike, b: NodeBufferLike): boolean
 }
 
 declare module 'node:process' {
   export const env: Record<string, string | undefined>
 }
