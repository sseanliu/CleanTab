export interface TabInfo {
  id: number
  title: string
  url: string
  favIconUrl: string
  domain: string
  friendlyDomain: string
}

export interface DomainGroup {
  domain: string
  friendlyName: string
  tabs: TabInfo[]
}
