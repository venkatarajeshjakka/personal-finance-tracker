interface PortfolioDetailPageProps {
  params: {
    id: string
  }
}

export default function PortfolioDetailPage({ params }: PortfolioDetailPageProps) {
  return (
    <div>
      <h1>Portfolio Details</h1>
      <p>Portfolio {params.id} details will be implemented here</p>
    </div>
  )
}