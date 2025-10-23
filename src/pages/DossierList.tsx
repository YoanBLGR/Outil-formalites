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
import { WORKFLOW_STATUS_LABELS, FORME_JURIDIQUE_LABELS, DOSSIER_TYPE_LABELS } from '../types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { LayoutGrid, List, Search, Filter, X, MoreVertical, Eye, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'

type ViewMode = 'kanban' | 'list'

type Filters = {
  status: WorkflowStatus[]
  formeJuridique: string[]
  typeDossier: string[]
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
      className={`transition-all duration-200 ${
        isOver ? 'bg-primary/10 ring-2 ring-primary/50 ring-inset rounded-lg scale-[1.02]' : ''
      }`}
    >
      {children}
    </div>
  )
}

export function DossierList() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDossier, setActiveDossier] = useState<Dossier | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    status: [],
    formeJuridique: [],
    typeDossier: [],
    dateFrom: '',
    dateTo: '',
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [dossierToDelete, setDossierToDelete] = useState<Dossier | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

    // Apply forme juridique filter (only for societe dossiers)
    if (filters.formeJuridique.length > 0) {
      result = result.filter((d) => d.societe && filters.formeJuridique.includes(d.societe.formeJuridique))
    }

    // Apply type dossier filter
    if (filters.typeDossier.length > 0) {
      result = result.filter((d) => filters.typeDossier.includes(d.typeDossier))
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
    filters.typeDossier.length > 0 ||
    filters.dateFrom ||
    filters.dateTo

  const clearFilters = () => {
    setFilters({
      status: [],
      formeJuridique: [],
      typeDossier: [],
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

  const toggleTypeFilter = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      typeDossier: prev.typeDossier.includes(type)
        ? prev.typeDossier.filter((t) => t !== type)
        : [...prev.typeDossier, type],
    }))
  }

  const handleDeleteClick = (dossier: Dossier, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDossierToDelete(dossier)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!dossierToDelete) return

    try {
      setIsDeleting(true)
      const db = await getDatabase()
      const doc = await db.dossiers.findOne(dossierToDelete.id).exec()

      if (doc) {
        await doc.remove()
        toast.success('Dossier supprimé avec succès')
        loadDossiers()
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression du dossier')
      console.error(error)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setDossierToDelete(null)
    }
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
                <CardContent className="grid gap-6 md:grid-cols-4">
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
                    <Label className="text-sm font-medium">Type de dossier</Label>
                    <div className="space-y-2">
                      {Object.entries(DOSSIER_TYPE_LABELS).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.typeDossier.includes(key)}
                            onChange={() => toggleTypeFilter(key)}
                            className="rounded"
                          />
                          <span className="text-sm">{label}</span>
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

                // Définir les couleurs par statut
                const getStatusColor = (status: WorkflowStatus) => {
                  const colors = {
                    NOUVEAU: 'from-blue-500 to-blue-600',
                    DEVIS_ENVOYE: 'from-indigo-500 to-indigo-600',
                    PROJET_STATUTS: 'from-purple-500 to-purple-600',
                    ATTENTE_DEPOT: 'from-pink-500 to-pink-600',
                    DEPOT_VALIDE: 'from-rose-500 to-rose-600',
                    PREP_RDV: 'from-orange-500 to-orange-600',
                    RDV_SIGNE: 'from-amber-500 to-amber-600',
                    FORMALITE_SAISIE: 'from-yellow-500 to-yellow-600',
                    SUIVI: 'from-lime-500 to-lime-600',
                    CLOTURE: 'from-green-500 to-green-600',
                  }
                  return colors[status] || 'from-gray-500 to-gray-600'
                }

                const getStatusIcon = (status: WorkflowStatus) => {
                  const icons = {
                    NOUVEAU: '🆕',
                    DEVIS_ENVOYE: '📧',
                    PROJET_STATUTS: '📝',
                    ATTENTE_DEPOT: '⏳',
                    DEPOT_VALIDE: '✅',
                    PREP_RDV: '📅',
                    RDV_SIGNE: '✍️',
                    FORMALITE_SAISIE: '📋',
                    SUIVI: '👀',
                    CLOTURE: '🎉',
                  }
                  return icons[status] || '📄'
                }

                return (
                  <div key={status} className="flex-shrink-0 w-80">
                    <Card className="border-2">
                      <CardHeader className={`pb-3 bg-gradient-to-r ${getStatusColor(status)} text-white`}>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <span className="text-xl">{getStatusIcon(status)}</span>
                            {WORKFLOW_STATUS_LABELS[status]}
                          </CardTitle>
                          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                            {statusDossiers.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <DroppableColumn status={status}>
                        <CardContent className="space-y-3 min-h-[300px] pt-4 bg-gray-50/50">
                          {statusDossiers.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                              <div className="text-4xl mb-2 opacity-30">📋</div>
                              <p className="text-xs">Glissez un dossier ici</p>
                            </div>
                          )}
                          {statusDossiers.map((dossier) => {
                            const checklistProgress = dossier.checklist.length > 0
                              ? Math.round((dossier.checklist.filter(item => item.completed).length / dossier.checklist.length) * 100)
                              : 0

                            return (
                              <DraggableCard key={dossier.id} dossier={dossier}>
                                <div className="relative group">
                                  <Link
                                    to={`/dossiers/${dossier.id}`}
                                    className="block"
                                    onClick={(e) => {
                                      if (activeDossier) {
                                        e.preventDefault()
                                      }
                                    }}
                                  >
                                    <Card className="hover:shadow-lg transition-all cursor-grab active:cursor-grabbing border-2 border-transparent hover:border-primary/20 bg-white">
                                      <CardContent className="p-4">
                                        <div className="space-y-3">
                                          {/* Titre et numéro */}
                                          <div>
                                            <p className="font-semibold text-sm truncate text-primary">
                                              {dossier.numero}
                                            </p>
                                            <p className="font-medium text-sm truncate mt-1">
                                              {dossier.typeDossier === 'EI' && dossier.entrepreneurIndividuel
                                                ? (dossier.entrepreneurIndividuel.nomCommercial || 
                                                   `${dossier.entrepreneurIndividuel.prenoms} ${dossier.entrepreneurIndividuel.nomNaissance}`)
                                                : dossier.societe?.denomination || 'N/A'}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                              {dossier.client.prenom} {dossier.client.nom}
                                            </p>
                                          </div>

                                          {/* Badges */}
                                          <div className="flex items-center justify-between gap-2">
                                            <Badge variant="outline" className="text-xs font-medium">
                                              {dossier.typeDossier === 'EI' 
                                                ? DOSSIER_TYPE_LABELS[dossier.typeDossier]
                                                : (dossier.societe ? FORME_JURIDIQUE_LABELS[dossier.societe.formeJuridique] : 'N/A')}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground">
                                              {format(new Date(dossier.createdAt), 'dd MMM', {
                                                locale: fr,
                                              })}
                                            </p>
                                          </div>

                                          {/* Barre de progression checklist */}
                                          <div>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs font-medium text-gray-600">Progression</span>
                                              <span className="text-xs font-bold text-primary">{checklistProgress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                              <div
                                                className={`h-full rounded-full transition-all ${
                                                  checklistProgress === 100
                                                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                                                    : checklistProgress >= 50
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                                    : 'bg-gradient-to-r from-orange-500 to-orange-600'
                                                }`}
                                                style={{ width: `${checklistProgress}%` }}
                                              />
                                            </div>
                                          </div>

                                          {/* Indicateurs */}
                                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                              📄 {dossier.documents.length}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              ✓ {dossier.checklist.filter(item => item.completed).length}/{dossier.checklist.length}
                                            </span>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </Link>
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 bg-white shadow-md hover:bg-gray-100 rounded-full"
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                          }}
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                          <Link
                                            to={`/dossiers/${dossier.id}`}
                                            className="flex items-center cursor-pointer"
                                          >
                                            <Eye className="mr-2 h-4 w-4" />
                                            Voir les détails
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                          onClick={(e) => handleDeleteClick(dossier, e)}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Supprimer
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </DraggableCard>
                            )
                          })}
                        </CardContent>
                      </DroppableColumn>
                    </Card>
                  </div>
                )
              })}
            </div>
            <DragOverlay>
              {activeDossier ? (
                <Card className="w-80 opacity-95 rotate-2 shadow-2xl border-4 border-primary/50 bg-white">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-sm truncate text-primary">
                          {activeDossier.numero}
                        </p>
                        <p className="font-medium text-sm truncate mt-1">
                          {activeDossier.typeDossier === 'EI' && activeDossier.entrepreneurIndividuel
                            ? (activeDossier.entrepreneurIndividuel.nomCommercial || 
                               `${activeDossier.entrepreneurIndividuel.prenoms} ${activeDossier.entrepreneurIndividuel.nomNaissance}`)
                            : activeDossier.societe?.denomination || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {activeDossier.client.prenom} {activeDossier.client.nom}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-medium">
                          {activeDossier.typeDossier === 'EI' 
                            ? DOSSIER_TYPE_LABELS[activeDossier.typeDossier]
                            : (activeDossier.societe ? FORME_JURIDIQUE_LABELS[activeDossier.societe.formeJuridique] : 'N/A')}
                        </Badge>
                      </div>
                      <div className="text-center py-2 bg-primary/10 rounded-md">
                        <p className="text-xs font-medium text-primary">🎯 Glissez pour changer de statut</p>
                      </div>
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
                        <div className="relative group">
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
                                    {dossier.typeDossier === 'EI' 
                                      ? DOSSIER_TYPE_LABELS[dossier.typeDossier]
                                      : (dossier.societe ? FORME_JURIDIQUE_LABELS[dossier.societe.formeJuridique] : 'N/A')}
                                  </Badge>
                                  <StatusBadge status={dossier.statut} />
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {dossier.client.prenom} {dossier.client.nom} •{' '}
                                  {dossier.client.email}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-sm">
                                    {format(new Date(dossier.createdAt), 'dd MMMM yyyy', {
                                      locale: fr,
                                    })}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          </Link>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                  }}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link
                                    to={`/dossiers/${dossier.id}`}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir les détails
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                  onClick={(e) => handleDeleteClick(dossier, e)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog de confirmation de suppression */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                {dossierToDelete && (
                  <>
                    Êtes-vous sûr de vouloir supprimer le dossier{' '}
                    <strong>{dossierToDelete.numero}</strong> pour{' '}
                    <strong>
                      {dossierToDelete.client.prenom} {dossierToDelete.client.nom}
                    </strong>{' '}
                    ?
                    <br />
                    <br />
                    Cette action est irréversible et supprimera définitivement :
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>Toutes les informations du dossier</li>
                      <li>Les documents associés</li>
                      <li>L'historique complet</li>
                    </ul>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                variant="default"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer définitivement
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
