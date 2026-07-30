export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

export function appPath(path: string): string {
  const normalizedPath = path.replace(/^\/+/, '')
  return `${import.meta.env.BASE_URL}${normalizedPath}`
}

export function routeFromPathname(pathname: string): string {
  const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '')
  const withoutBase = basePath && basePath !== '/' && pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname

  const normalized = withoutBase.replace(/^\/+|\/+$/g, '')
  return normalized ? `/${normalized}` : '/'
}
