"use client"

import { useState, useEffect, useRef } from "react"

const steps = [
  {
    number: "01",
    title: "Regístrate",
    description: "Crea tu cuenta gratuita y completa tu perfil para comenzar a intercambiar.",
  },
  {
    number: "02",
    title: "Publica tus productos",
    description: "Sube fotos y describe los artículos que quieres intercambiar con detalles y categorías.",
  },
  {
    number: "03",
    title: "Encuentra coincidencias",
    description: "Nuestro sistema te sugerirá intercambios perfectos basados en tus intereses.",
  },
  {
    number: "04",
    title: "Intercambia",
    description: "Envía solicitudes, confirma intercambios y disfruta de tus nuevos productos.",
  },
]

export default function HowItWorks() {
  const [visibleSteps, setVisibleSteps] = useState([])
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger the animation of each step
            steps.forEach((_, index) => {
              setTimeout(() => {
                setVisibleSteps((prev) => [...new Set([...prev, index])])
              }, index * 150)
            })
            observer.unobserve(entry.target)
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

  return (
    <section ref={sectionRef} className="bg-gray-50 py-20 overflow-hidden" id="comofunciona">
      <div className="max-w-screen-xl mx-auto px-6 xl:px-20">
        <h2 className="text-3xl xl:text-4xl font-bold text-center mb-4 text-balance">Cómo Funciona</h2>
        <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto text-pretty">
          En solo 4 pasos simples puedes comenzar a intercambiar productos y formar parte de nuestra comunidad
          colaborativa.
        </p>

        <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10 text-center">
          {/* Connecting line for desktop */}
          <div
            className="hidden xl:block absolute top-7 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200 -z-0"
            style={{
              width: "calc(100% - 120px)",
              marginLeft: "60px",
              opacity: visibleSteps.length > 0 ? 1 : 0,
              transition: "opacity 0.8s ease-in-out",
            }}
          />

          {steps.map((step, index) => (
            <div
              key={index}
              className={`relative flex flex-col items-center transition-all duration-700 ease-out ${
                visibleSteps.includes(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{
                transitionDelay: `${index * 150}ms`,
              }}
            >
              {/* Animated number badge */}
              <div
                className={`bg-teal-600 text-white rounded-full w-14 h-14 flex items-center justify-center text-lg font-semibold mb-3 relative z-10 transition-all duration-500 ease-out group-hover:scale-110 ${
                  visibleSteps.includes(index) ? "scale-100 rotate-0" : "scale-0 rotate-180"
                }`}
                style={{
                  transitionDelay: `${index * 150 + 200}ms`,
                  boxShadow: "0 4px 14px rgba(13, 148, 136, 0.3)",
                }}
              >
                <span className="relative z-10">{step.number}</span>

                {/* Pulse animation ring */}
                <span
                  className={`absolute inset-0 rounded-full bg-teal-400 animate-ping ${
                    visibleSteps.includes(index) ? "opacity-75" : "opacity-0"
                  }`}
                  style={{
                    animationDuration: "2s",
                    animationDelay: `${index * 150 + 400}ms`,
                  }}
                />
              </div>

              {/* Step content with hover effect */}
              <div className="group cursor-default">
                <h3 className="font-bold text-lg mb-2 transition-colors duration-300 group-hover:text-teal-600">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 max-w-xs transition-all duration-300 group-hover:text-gray-800">
                  {step.description}
                </p>
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 -z-10 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:shadow-lg group-hover:scale-105 -m-4 p-4" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
