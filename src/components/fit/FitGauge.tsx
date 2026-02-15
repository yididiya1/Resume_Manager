'use client'

import { useEffect, useMemo, useRef, useState } from 'react'    
import GaugeComponent from 'react-gauge-component/dist/lib/GaugeComponent'

export function FitGauge({ value }: { value: number }) {
	return <GaugeComponent
    value={value}
    type="semicircle"
    arc={{
        gradient: true,
        width: 0.15,
        padding: 0,
        subArcs: [
            { limit: 0, color: "#EA4228" },
            { limit: 50, color: "#eab328" },
            { limit: 100, color: "#5BE12C" },
            // { color: "#EA4228" }
        ]
        }}
  pointer={{ type: "arrow", color: "#dfa810", maxFps: 30 }}
  labels={{
      valueLabel: { style: { fontSize: "32px", fill: "#000000" } },
      tickLabels: {
        type: "outer",
        ticks: [
          { value: 0 },
          { value: 20 },
          { value: 40 },
          { value: 60 },
          { value: 80 }
        ],
        defaultTickValueConfig: { style: { fontSize: "9px", fill: "#aaa" } }
      }
    }}
/>
}






