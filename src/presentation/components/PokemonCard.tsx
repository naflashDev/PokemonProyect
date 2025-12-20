"use client"
import React from 'react'

export default function PokemonCard({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-b from-slate-800 via-slate-900 to-black text-white shadow-2xl transform hover:scale-105 transition">
      <div className="p-4 flex items-center justify-center h-40 bg-gradient-to-b from-black/20 to-transparent">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="max-h-32 object-contain drop-shadow-lg" />
        ) : (
          <div className="w-24 h-24 rounded bg-gray-700 flex items-center justify-center">No Image</div>
        )}
      </div>
      <div className="px-3 py-3 bg-gradient-to-t from-black/40 to-transparent">
        <div className="text-center text-sm font-semibold truncate capitalize">{name}</div>
      </div>
    </div>
  )
}
