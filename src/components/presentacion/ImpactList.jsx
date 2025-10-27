"use client"

import { useState, useEffect, useRef } from "react"
import { RefreshCw, DollarSign, Users } from "lucide-react"

const benefits = [
  {
    icon: RefreshCw,
    title: "Reduce el Desperdicio",
    description: "Dale una segunda vida a productos en buen estado que ya no usas.",
  },
  {
    icon: DollarSign,
    title: "Ahorra Dinero",
    description: "Obtén lo que necesitas sin gastar dinero en efectivo.",
  },
  {
    icon: Users,
    title: "Conecta con tu Comunidad",
    description: "Conoce personas de tu área con intereses similares.",
  },
]

export default function ImpactList() {
  const [visibleItems, setVisibleItems] = useState([])
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          benefits.forEach((_, index) => {
            setTimeout(() => {
              setVisibleItems((prev) => [...prev, index])
            }, index * 150)
          })
        }
      },
      { threshold: 0.2 },
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
    <div ref={sectionRef}>
      <h2 className="text-3xl xl:text-4xl font-bold mb-6 text-white">Impacto Positivo en tu Comunidad</h2>
      <p className="text-white/90 mb-8">
        Al usar TruequeApp no solo obtienes lo que necesitas, sino que también contribuyes a crear un mundo más
        sostenible y una economía más colaborativa.
      </p>

      <ul className="space-y-6">
        {benefits.map((item, i) => {
          const Icon = item.icon
          const isVisible = visibleItems.includes(i)

          return (
            <li
              key={i}
              className={`
                flex items-start gap-4 p-4 rounded-lg
                transition-all duration-500 ease-out
                hover:bg-white/5 hover:translate-x-2
                group cursor-pointer
                ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}
              `}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="mt-1 relative">
                <div
                  className="absolute inset-0 bg-emerald-400/30 rounded-full blur-md 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <Icon
                  className="w-6 h-6 text-white relative z-10 transition-all duration-300
                             group-hover:scale-125 group-hover:rotate-12"
                />
              </div>
              <div className="flex-1">
                <h4
                  className="font-semibold text-white transition-all duration-300
                               group-hover:text-emerald-300"
                >
                  {item.title}
                </h4>
                <p
                  className="text-white/80 text-sm transition-all duration-300
                              group-hover:text-white/90"
                >
                  {item.description}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
