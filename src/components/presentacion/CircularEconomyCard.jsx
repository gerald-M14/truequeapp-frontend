"use client"

import { useState, useEffect, useRef } from "react"
import { Repeat } from "lucide-react"

export default function CircularEconomyCard() {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 },
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={`
        bg-emerald-700/40 rounded-xl p-10 
        flex flex-col justify-center items-center text-center
        transition-all duration-700 ease-out
        hover:bg-emerald-700/50 hover:scale-105 hover:shadow-2xl
        group cursor-pointer
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
    >
      <div className="relative">
        <Repeat
          className="w-14 h-14 text-white mb-4 transition-all duration-500 ease-out
                     group-hover:rotate-180 group-hover:scale-110"
        />
        <div
          className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-0 
                        group-hover:opacity-100 transition-opacity duration-500"
        />
      </div>

      <h3
        className="text-2xl font-semibold mb-2 text-white transition-all duration-300
                     group-hover:scale-105"
      >
        Economía Circular
      </h3>

      <p
        className="text-white/80 text-sm transition-all duration-300
                    group-hover:text-white"
      >
        Forma parte del movimiento hacia una economía más sostenible donde los recursos se reutilizan y nada se
        desperdicia.
      </p>
    </div>
  )
}
