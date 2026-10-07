import { BatchDetailView } from './batch-detail-view'
import { getBatchDetail } from './data'

export default async function LoteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const batch = getBatchDetail(decodeURIComponent(id))
  return <BatchDetailView batch={batch} />
}
