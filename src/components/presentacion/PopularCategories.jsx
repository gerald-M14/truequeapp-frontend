"use client"

import { useState, useEffect, useRef } from "react"
import { Smartphone, Shirt, Home, Dumbbell, BookOpen, Gamepad2, Palette, Music } from "lucide-react"

const categories = [
  { name: "Electrónicos", icon: Smartphone },
  { name: "Ropa y Accesorios", icon: Shirt },
  { name: "Hogar y Jardín", icon: Home },
  { name: "Deportes", icon: Dumbbell },
  { name: "Libros", icon: BookOpen },
  { name: "Juguetes", icon: Gamepad2 },
  { name: "Arte y Manualidades", icon: Palette },
  { name: "Música", icon: Music },
]

export default function PopularCategories() {
  const [visibleCategories, setVisibleCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger the animation of categories
            categories.forEach((_, index) => {
              setTimeout(() => {
                setVisibleCategories((prev) => [...prev, index])
              }, index * 100)
            })
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleCategoryClick = (index) => {
    setSelectedCategory(index === selectedCategory ? null : index)
  }

  return (
    <section ref={sectionRef} className="py-20 bg-white" id="categorias">
      <div className="max-w-screen-xl mx-auto px-6 xl:px-20 text-center">
        <h2 className="text-3xl xl:text-4xl font-bold mb-4 animate-fade-in">Categorías Populares</h2>
        <p className="text-gray-600 mb-12 max-w-2xl mx-auto animate-fade-in-delay">
          Explora las diferentes categorías de productos disponibles para intercambio.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 place-items-center">
          {categories.map((category, index) => {
            const Icon = category.icon
            const isVisible = visibleCategories.includes(index)
            const isSelected = selectedCategory === index

            return (
              <button
                key={index}
                onClick={() => handleCategoryClick(index)}
                className={`
                  group relative w-full max-w-[200px]
                  border-2 rounded-2xl px-6 py-4
                  transition-all duration-500 ease-out
                  ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                  ${
                    isSelected
                      ? "border-teal-500 bg-teal-500 text-white shadow-lg shadow-teal-200 scale-105"
                      : "border-teal-400 text-teal-600 hover:bg-teal-50 hover:border-teal-500 hover:shadow-md hover:scale-105"
                  }
                `}
                style={{
                  transitionDelay: isVisible ? "0ms" : `${index * 100}ms`,
                }}
              >
                {/* Icon with animation */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`
                      transition-all duration-300
                      ${isSelected ? "scale-110 rotate-12" : "group-hover:scale-110 group-hover:-rotate-12"}
                    `}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? "text-white" : "text-teal-500"}`} />
                  </div>
                  <span className="font-medium text-sm">{category.name}</span>
                </div>

                {/* Animated background effect */}
                <div
                  className={`
                    absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600
                    transition-opacity duration-300
                    ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-10"}
                  `}
                  style={{ zIndex: -1 }}
                />

                {/* Pulse effect on hover */}
                {!isSelected && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-teal-400 opacity-0 group-hover:opacity-100 group-hover:animate-ping-slow" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
