export const sourceLabels: Record<string, string> = {
  seed: '内置',
  voa: 'VOA',
  guardian: '卫报',
  atlantic: '大西洋月刊',
  local: '我的',
}

export function sourceLabel(source?: string): string {
  if (!source) return '内置'
  return sourceLabels[source] ?? source
}
