export interface PathConfig {
    base: string
    separator: string
    normalize: boolean
  }
  
  export interface ResolvedPath {
    absolute: string
    relative: string
    normalized: string
    exists?: boolean
  }
  
  export type PathResolver = (...segments: string[]) => string
  export type PathValidator = (path: string) => boolean
  export type PathNormalizer = (path: string) => string