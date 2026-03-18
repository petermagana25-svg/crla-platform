'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<any[]>([])

  useEffect(() => {
    checkAccess()
    fetchAgents()
  }, [])

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const isAdmin = roles?.some(r => r.role === 'admin')

    if (!isAdmin) {
      router.push('/dashboard')
    }
  }

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from('agent_profiles')
      .select('*')

    if (!error && data) {
      setAgents(data)
    }

    setLoading(false)
  }

  const approveAgent = async (id: string) => {
    await supabase
      .from('agent_profiles')
      .update({
        approval_status: 'approved',
        is_visible: true
      })
      .eq('id', id)

    fetchAgents()
  }

  const rejectAgent = async (id: string) => {
    await supabase
      .from('agent_profiles')
      .update({
        approval_status: 'rejected',
        is_visible: false
      })
      .eq('id', id)

    fetchAgents()
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Panel</h1>

      <h2>Agents</h2>

      {agents.map(agent => (
        <div key={agent.id} style={{ borderBottom: '1px solid #ccc', padding: 10 }}>
          <p><strong>{agent.full_name}</strong></p>
          <p>Status: {agent.approval_status}</p>

          <button onClick={() => approveAgent(agent.id)}>Approve</button>
          <button onClick={() => rejectAgent(agent.id)}>Reject</button>
        </div>
      ))}
    </div>
  )
}