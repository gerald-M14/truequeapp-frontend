"use client"

import { useState, useEffect, useRef } from "react"
import SuggestedSwapCard from "./SuggestedSwapCard"
import Stats from "./Stats"

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  return (
    <section ref={sectionRef} className="bg-green-50 py-20 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 xl:px-20 2xl:px-32 grid md:grid-cols-2 items-center gap-16 xl:gap-24">
        {/* Texto principal */}
        <div className="space-y-6">
          <h1
            className={`text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Intercambia con{" "}
            <span className="text-teal-600 inline-block hover:scale-110 transition-transform duration-300">confianza</span>
          </h1>

          <p
            className={`text-gray-700 text-lg lg:text-xl transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Conecta con personas de tu comunidad para intercambiar productos que ya no usas por artículos que realmente
            necesitas. Promueve el consumo responsable y reduce el desperdicio.
          </p>

          <div
            className={`transition-all duration-1000 delay-400 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <Stats />
          </div>
        </div>

        {/* Tarjeta sugerida */}
        <div
          className={`transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
          }`}
        >
          <div className="hover:scale-105 transition-transform duration-500 ease-out">
            <SuggestedSwapCard />
          </div>
        </div>
      </div>
    </section>
  )
}
