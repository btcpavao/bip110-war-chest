import {
  dashboardSchema,
  receiptsDatasetSchema,
  signalingDatasetSchema,
  spamTaxSchema,
  type DashboardData,
  type ReceiptData,
  type SignalingBlock,
  type SpamTaxData,
} from './schemas'

export interface AppData {
  dashboard: DashboardData
  blocks: SignalingBlock[]
  receipts: ReceiptData
  spamTax: SpamTaxData
}

async function loadJson(path: string): Promise<unknown> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${path}`)
  if (!response.ok) {
    throw new Error(`Data request failed (${response.status}): ${path}`)
  }
  return response.json()
}

export async function loadAppData(): Promise<AppData> {
  const [dashboardRaw, blocksRaw, receiptsRaw, spamTaxRaw] = await Promise.all([
    loadJson('dashboard.json'),
    loadJson('signaling-blocks.json'),
    loadJson('influencer-receipts.json'),
    loadJson('spam-rug-tax.json'),
  ])
  const dashboard = dashboardSchema.parse(dashboardRaw)
  const blockDataset = signalingDatasetSchema.parse(blocksRaw)
  return {
    dashboard,
    blocks: blockDataset.records,
    receipts: receiptsDatasetSchema.parse(receiptsRaw),
    spamTax: spamTaxSchema.parse(spamTaxRaw),
  }
}
