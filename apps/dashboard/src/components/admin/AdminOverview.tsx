'use client'

import { Users, Database, Coins, Activity } from 'lucide-react'
import CardPremium from '../ui/CardPremium'

export default function AdminOverview() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-light">System Übersicht</h2>
      
      <div className="grid grid-cols-4 gap-4">
        <CardPremium>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-accent-turquoise" />
              <span className="text-sm text-text-gray">Total</span>
            </div>
            <p className="text-3xl font-bold text-text-light">0</p>
            <p className="text-sm text-text-gray">Benutzer</p>
          </div>
        </CardPremium>
        
        <CardPremium>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-accent-violet" />
              <span className="text-sm text-text-gray">Aktiv</span>
            </div>
            <p className="text-3xl font-bold text-text-light">0</p>
            <p className="text-sm text-text-gray">Caves</p>
          </div>
        </CardPremium>
        
        <CardPremium>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Coins className="w-8 h-8 text-accent-gold" />
              <span className="text-sm text-text-gray">Verbraucht</span>
            </div>
            <p className="text-3xl font-bold text-text-light">0</p>
            <p className="text-sm text-text-gray">Tokens</p>
          </div>
        </CardPremium>
        
        <CardPremium>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-accent-blue" />
              <span className="text-sm text-text-gray">Heute</span>
            </div>
            <p className="text-3xl font-bold text-text-light">0</p>
            <p className="text-sm text-text-gray">Aktivität</p>
          </div>
        </CardPremium>
      </div>
    </div>
  )
}
