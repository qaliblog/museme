'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssetsTab } from "@/components/assets-tab"
import { AgentTab } from "@/components/agent-tab"
import { MusicAgentTab } from "@/components/music-agent-tab"
import { SettingsTab } from "@/components/settings-tab"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const [activeTab, setActiveTab] = useState("assets")

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Museme</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="agent">Agent</TabsTrigger>
            <TabsTrigger value="music">Music Agent</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="mt-6">
            <AssetsTab />
          </TabsContent>

          <TabsContent value="agent" className="mt-6">
            <AgentTab />
          </TabsContent>

          <TabsContent value="music" className="mt-6">
            <MusicAgentTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
