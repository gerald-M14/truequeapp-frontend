"use client"

import { useState, useEffect, useRef } from "react"
import { Leaf, Users, Shield, Sparkles } from "lucide-react"

export default function WhyChoose() {
  const [visibleCards, setVisibleCards] = useState([])
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Trigger staggered animation
            features.forEach((_, index) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...prev, index])
              }, index * 150)
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const features = [
    {
      icon: Leaf,
      title: "Sostenible",
      description: "Reduce el desperdicio y promueve la economía circular",
      color: "from-green-500 to-emerald-600",
      hoverColor: "hover:from-green-600 hover:to-emerald-700",
    },
    {
      icon: Users,
      title: "Comunidad",
      description: "Conecta con personas de tu zona que comparten tus valores",
      color: "from-blue-500 to-cyan-600",
      hoverColor: "hover:from-blue-600 hover:to-cyan-700",
    },
    {
      icon: Shield,
      title: "Seguro",
      description: "Sistema de verificación y valoraciones de usuarios",
      color: "from-purple-500 to-pink-600",
      hoverColor: "hover:from-purple-600 hover:to-pink-700",
    },
    {
      icon: Sparkles,
      title: "Fácil de usar",
      description: "Interfaz intuitiva para intercambios rápidos y sencillos",
      color: "from-orange-500 to-red-600",
      hoverColor: "hover:from-orange-600 hover:to-red-700",
    },
  ]

  return (
    <section ref={sectionRef} className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">¿Por qué elegir Trueque?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Una nueva forma de intercambiar que beneficia a todos
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isVisible = visibleCards.includes(index)

            return (
              <div
                key={index}
                className={`
                  group relative bg-white rounded-2xl p-6 shadow-lg
                  transition-all duration-500 ease-out
                  hover:shadow-2xl hover:scale-105 hover:-translate-y-2
                  ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                `}
                style={{
                  transitionDelay: isVisible ? `${index * 150}ms` : "0ms",
                }}
              >
                {/* Gradient background on hover */}
                <div
                  className={`
                    absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color}
                    opacity-0 group-hover:opacity-5 transition-opacity duration-300
                  `}
                />

                {/* Icon container */}
                <div
                  className={`
                    relative w-16 h-16 mb-4 rounded-xl bg-gradient-to-br ${feature.color}
                    flex items-center justify-center
                    transform transition-all duration-300
                    group-hover:scale-110 group-hover:rotate-6
                    shadow-md group-hover:shadow-xl
                  `}
                >
                  <Icon
                    className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110"
                    strokeWidth={2.5}
                  />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 transition-colors duration-300 group-hover:text-gray-700">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed transition-colors duration-300 group-hover:text-gray-700">
                  {feature.description}
                </p>

                {/* Decorative corner accent */}
                <div
                  className={`
                    absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.color}
                    opacity-0 group-hover:opacity-10 rounded-bl-full rounded-tr-2xl
                    transition-opacity duration-300
                  `}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
