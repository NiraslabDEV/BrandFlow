'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface StoryTask {
  id: string
  scheduled_for: string
  hour: number
  theme: string
  title: string
  instructions: string
  status: 'pending' | 'sent' | 'done' | 'skipped'
}

interface StoriesResponse {
  view: 'day' | 'week'
  tz: string
  tasks: StoryTask[]
}

const STATUS_BADGE: Record<StoryTask['status'], { label: string; cls: string }> = {
  pending: { label: 'Pendente', cls: 'bg-gray-100 text-gray-600' },
  sent: { label: 'Enviado', cls: 'bg-blue-100 text-blue-700' },
  done: { label: 'Feito ✓', cls: 'bg-green-100 text-green-700' },
  skipped: { label: 'Ignorado', cls: 'bg-amber-100 text-amber-700' },
}

async function fetchStories(view: 'day' | 'week'): Promise<StoriesResponse> {
  const res = await fetch(`/api/stories?view=${view}`)
  if (!res.ok) throw new Error('Falha ao carregar stories')
  return res.json()
}

export function StoriesView() {
  const [view, setView] = useState<'day' | 'week'>('day')
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['stories', view],
    queryFn: () => fetchStories(view),
  })

  const markDone = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch('/api/stories/done', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      })
      if (!res.ok) throw new Error('Falha ao marcar')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  })

  const tasks = data?.tasks ?? []
  const tz = data?.tz ?? 'Africa/Maputo'
  const doneCount = tasks.filter((t) => t.status === 'done').length

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stories</h1>
          <p className="mt-1 text-sm text-gray-500">
            {view === 'day'
              ? `Hoje · ${doneCount}/${tasks.length} feitos`
              : 'Próximos 7 dias · rotação de temas'}
          </p>
        </div>
        <div className="inline-flex rounded-md border border-gray-200 bg-white p-1 text-sm">
          <button
            onClick={() => setView('day')}
            className={`rounded px-3 py-1 ${view === 'day' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}
          >
            Dia
          </button>
          <button
            onClick={() => setView('week')}
            className={`rounded px-3 py-1 ${view === 'week' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}
          >
            Semana
          </button>
        </div>
      </div>

      {isLoading && <p className="text-gray-500">A carregar…</p>}
      {isError && <p className="text-red-600">Erro ao carregar stories.</p>}

      {!isLoading && !isError && view === 'day' && (
        <DayList tasks={tasks} onDone={(id) => markDone.mutate(id)} pendingId={markDone.isPending ? markDone.variables : undefined} />
      )}

      {!isLoading && !isError && view === 'week' && (
        <WeekList tasks={tasks} tz={tz} onDone={(id) => markDone.mutate(id)} pendingId={markDone.isPending ? markDone.variables : undefined} />
      )}
    </div>
  )
}

function SlotCard({
  task,
  onDone,
  pending,
}: {
  task: StoryTask
  onDone: (id: string) => void
  pending: boolean
}) {
  const badge = STATUS_BADGE[task.status]
  return (
    <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="w-12 shrink-0 text-lg font-semibold text-gray-900">{task.hour}h</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{task.title}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${badge.cls}`}>{badge.label}</span>
        </div>
        <p className="mt-1 text-sm text-gray-600">{task.instructions}</p>
        <p className="mt-1 text-xs text-gray-400">Tema: {task.theme}</p>
      </div>
      <button
        onClick={() => onDone(task.id)}
        disabled={task.status === 'done' || pending}
        className="shrink-0 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {task.status === 'done' ? 'Feito ✓' : 'Feito'}
      </button>
    </div>
  )
}

function DayList({
  tasks,
  onDone,
  pendingId,
}: {
  tasks: StoryTask[]
  onDone: (id: string) => void
  pendingId?: string
}) {
  if (tasks.length === 0) return <p className="text-gray-500">Sem stories para hoje.</p>
  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <SlotCard key={t.id} task={t} onDone={onDone} pending={pendingId === t.id} />
      ))}
    </div>
  )
}

function WeekList({
  tasks,
  tz,
  onDone,
  pendingId,
}: {
  tasks: StoryTask[]
  tz: string
  onDone: (id: string) => void
  pendingId?: string
}) {
  const fmt = new Intl.DateTimeFormat('pt-PT', {
    timeZone: tz,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  })
  const groups = new Map<string, StoryTask[]>()
  for (const t of tasks) {
    const key = fmt.format(new Date(t.scheduled_for))
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(t)
  }
  if (tasks.length === 0) return <p className="text-gray-500">Sem stories na semana.</p>
  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([day, dayTasks]) => (
        <div key={day}>
          <h2 className="mb-2 text-sm font-semibold capitalize text-gray-700">{day}</h2>
          <div className="space-y-2">
            {dayTasks.map((t) => (
              <SlotCard key={t.id} task={t} onDone={onDone} pending={pendingId === t.id} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
