import React from 'react'
import ImpactList from './ImpactList'
import CircularEconomyCard from './CircularEconomyCard'
import CallToAction from './CallToAction'

export default function CommunityImpact() {
  return (
    <section>
      <div className="bg-emerald-600 text-white">
        <div className="max-w-screen-2xl mx-auto px-6 xl:px-20 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ImpactList />
          <CircularEconomyCard />
        </div>
      </div>
      <CallToAction />
    </section>
  )
}
