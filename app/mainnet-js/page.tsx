"use client"

import { Suspense } from "react"
import { ProjectCreator } from "@/components/project-creator"
import { puyaPyfiles } from "@/components/puyaPyfiles"

export default function MainnetJsPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ProjectCreator
        initialFiles={puyaPyfiles}
        selectedTemplate="Mainnet-js"
        selectedTemplateName="Mainnet-js"
      />
    </Suspense>
  )
}