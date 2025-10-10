import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import Fuse from 'fuse.js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { Layout } from '../components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { StatusBadge } from '../components/workflow/StatusBadge'
import { DossierListSkeleton } from '../components/ui/loading-states'
import { getDatabase } from '../db/database'
import type { Dossier, WorkflowStatus } from '../types'
import { WORKFLOW_STATUS_LABELS, FORME_JURIDIQUE_LABELS } from '../types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { LayoutGrid, List, Search, Filter, X } from 'lucide-react'

type ViewMode = 'kanban' | 'list'

type Filters = {
  status: WorkflowStatus[]
  formeJuridique: string[]
  dateFrom: string
  dateTo: string
}

const WORKFLOW_COLUMNS: WorkflowStatus[] = [
  'NOUVEAU',
  'DEVIS_ENVOYE',
  'PROJET_STATUTS',
  'ATTENTE_DEPOT',
  'DEPOT_VALIDE',
  'PREP_RDV',
  'RDV_SIGNE',
  'FORMALITE_SAISIE',
  'SUIVI',
  'CLOTURE',
]

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

function DraggableCard({ dossier, children }: { dossier: Dossier; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dossier.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

function DroppableColumn({ status, children }: { status: WorkflowStatus; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'bg-accent/50 rounded-lg' : ''}`}
    >
      {children}
    </div>
  )
}

export function DossierList() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDossier, setActiveDossier] = useState<Dossier | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    status: [],
    formeJuridique: [],
    dateFrom: '',
    dateTo: '',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    loadDossiers()
  }, [])

  const loadDossiers = async () => {
    try {
      setLoading(true)
      const db = await getDatabase()
      const allDossiers = await db.dossiers.find().exec()
      const dossiersData = allDossiers.map((doc: any) => doc.toJSON()) as Dossier[]
      setDossiers(dossiersData)
    } finally {
      setLoading(false)
    }
  }

  // Fuse.js configuration for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(dossiers, {
        keys: [
          { name: 'numero', weight: 2 },
          { name: 'client.nom', weight: 1.5 },
          { name: 'client.prenom', weight: 1.5 },
          { name: 'client.email', weight: 1 },
          { name: 'societe.denomination', weight: 2 },
        ],
        threshold: 0.3,
        includeScore: true,
      }),
    [dossiers]
  )

  // Filter dossiers based on search query and filters
  const filteredDossiers = useMemo(() => {
    let result = dossiers

    // Apply search
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery)
      result = searchResults.map((r) => r.item)
    }

    // Apply status filter
    if (filters.status.length > 0) {
      result = result.filter((d) => filters.status.includes(d.statut))
    }

    // Apply forme juridique filter
    if (filters.formeJuridique.length > 0) {
      result = result.filter((d) => filters.formeJuridique.includes(d.societe.formeJuridique))
    }

    // Apply date range filter
    if (filters.dateFrom) {
      result = result.filter((d) => new Date(d.createdAt) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      result = result.filter((d) => new Date(d.createdAt) <= new Date(filters.dateTo))
    }

    return result
  }, [dossiers, searchQuery, fuse, filters])

  const getDossiersByStatus = (status: WorkflowStatus) => {
    return filteredDossiers.filter((d) => d.statut === status)
  }

  const handleStatusChange = async (dossierId: string, newStatus: WorkflowStatus) => {
    try {
      const db = await getDatabase()
      const dossier = await db.dossiers.findOne(dossierId).exec()

      if (dossier) {
        const dossierData = dossier.toJSON() as Dossier

        const newTimelineEvent = {
          id: crypto.randomUUID(),
          type: 'STATUS_CHANGE' as const,
          description: `Statut changé: ${WORKFLOW_STATUS_LABELS[newStatus]}`,
          createdAt: new Date().toISOString(),
          createdBy: 'Utilisateur',
        }

        await dossier.patch({
          statut: newStatus,
          updatedAt: new Date().toISOString(),
          timeline: [...dossierData.timeline, newTimelineEvent],
        })

        toast.success(`Statut changé: ${WORKFLOW_STATUS_LABELS[newStatus]}`)
      }

      loadDossiers()
    } catch (error) {
      toast.error('Erreur lors du changement de statut')
      console.error(error)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const dossierId = event.active.id as string
    const dossier = dossiers.find((d) => d.id === dossierId)
    setActiveDossier(dossier || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDossier(null)

    const { active, over } = event
    if (!over) return

    const dossierId = active.id as string
    const newStatus = over.id as WorkflowStatus

    const dossier = dossiers.find((d) => d.id === dossierId)
    if (dossier && dossier.statut !== newStatus) {
      handleStatusChange(dossierId, newStatus)
    }
  }

  if (loading) {
    return (
      <Layout title="Dossiers" subtitle="Gestion de vos dossiers clients">
        <DossierListSkeleton />
      </Layout>
    )
  }

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.formeJuridique.length > 0 ||
    filters.dateFrom ||
    filters.dateTo

  const clearFilters = () => {
    setFilters({
      status: [],
      formeJuridique: [],
      dateFrom: '',
      dateTo: '',
    })
  }

  const toggleStatusFilter = (status: WorkflowStatus) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }))
  }

  const toggleFormeFilter = (forme: string) => {
    setFilters((prev) => ({
      ...prev,
      formeJuridique: prev.formeJuridique.includes(forme)
        ? prev.formeJuridique.filter((f) => f !== forme)
        : [...prev.formeJuridique, forme],
    }))
  }

  return (
    <Layout title="Dossiers" subtitle="Gestion de vos dossiers clients">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex-1 w-full sm:max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un dossier, client, société..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={hasActiveFilters ? 'border-primary' : ''}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtres
              {hasActiveFilters && (
                <Badge variant="default" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  !
                </Badge>
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="mr-2 h-4 w-4" />
                Liste
              </Button>
            </div>

            <Link to="/dossiers/nouveau">
              <Button>Nouveau dossier</Button>
            </Link>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Filtres avancés</CardTitle>
                    <div className="flex gap-2">
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="mr-2 h-4 w-4" />
                          Réinitialiser
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Statut</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {WORKFLOW_COLUMNS.map((status) => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.status.includes(status)}
                            onChange={() => toggleStatusFilter(status)}
                            className="rounded"
                          />
                          <span className="text-sm">{WORKFLOW_STATUS_LABELS[status]}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Forme juridique</Label>
                    <div className="space-y-2">
                      {Object.entries(FORME_JURIDIQUE_LABELS).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.formeJuridique.includes(key)}
                            onChange={() => toggleFormeFilter(key)}
                            className="rounded"
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateFrom" className="text-sm font-medium">
                        Date de début
                      </Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateTo" className="text-sm font-medium">
                        Date de fin
                      </Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {viewMode === 'kanban' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {WORKFLOW_COLUMNS.map((status) => {
                const statusDossiers = getDossiersByStatus(status)
                return (
                  <div key={status} className="flex-shrink-0 w-80">
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">
                            {WORKFLOW_STATUS_LABELS[status]}
                          </CardTitle>
                          <Badge variant="outline" className="ml-2">
                            {statusDossiers.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <DroppableColumn status={status}>
                        <CardContent className="space-y-2 min-h-[200px]">
                          {statusDossiers.map((dossier) => (
                            <DraggableCard key={dossier.id} dossier={dossier}>
                              <Link
                                to={`/dossiers/${dossier.id}`}
                                className="block"
                                onClick={(e) => {
                                  if (activeDossier) {
                                    e.preventDefault()
                                  }
                                }}
                              >
                                <Card className="hover:bg-accent transition-colors cursor-grab active:cursor-grabbing">
                                  <CardContent className="p-4">
                                    <div className="space-y-2">
                                      <div>
                                        <p className="font-medium text-sm truncate">
                                          {dossier.numero}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {dossier.client.prenom} {dossier.client.nom}
                                        </p>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-xs">
                                          {FORME_JURIDIQUE_LABELS[dossier.societe.formeJuridique]}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground">
                                          {format(new Date(dossier.createdAt), 'dd/MM', {
                                            locale: fr,
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            </DraggableCard>
                          ))}
                          {statusDossiers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              Aucun dossier
                            </p>
                          )}
                        </CardContent>
                      </DroppableColumn>
                    </Card>
                  </div>
                )
              })}
            </div>
            <DragOverlay>
              {activeDossier ? (
                <Card className="w-80 opacity-90 rotate-3 shadow-xl">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium text-sm truncate">
                          {activeDossier.numero}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activeDossier.client.prenom} {activeDossier.client.nom}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {FORME_JURIDIQUE_LABELS[activeDossier.societe.formeJuridique]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <Card>
            <CardContent className="p-0">
              {filteredDossiers.length === 0 ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Aucun dossier trouvé' : 'Aucun dossier'}
                  </p>
                </motion.div>
              ) : (
                <div className="divide-y">
                  <AnimatePresence mode="popLayout">
                    {filteredDossiers.map((dossier, index) => (
                      <motion.div
                        key={dossier.id}
                        variants={listItemVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={`/dossiers/${dossier.id}`}
                          className="block hover:bg-accent transition-colors"
                        >
                          <motion.div
                            className="p-4 flex items-center justify-between"
                            whileHover={{ x: 4 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <p className="font-medium">{dossier.numero}</p>
                                <Badge variant="outline">
                                  {FORME_JURIDIQUE_LABELS[dossier.societe.formeJuridique]}
                                </Badge>
                                <StatusBadge status={dossier.statut} />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {dossier.client.prenom} {dossier.client.nom} •{' '}
                                {dossier.client.email}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">
                                {format(new Date(dossier.createdAt), 'dd MMMM yyyy', {
                                  locale: fr,
                                })}
                              </p>
                            </div>
                          </motion.div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
