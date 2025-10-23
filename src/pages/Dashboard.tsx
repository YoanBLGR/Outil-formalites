import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Layout } from '../components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { DashboardSkeleton } from '../components/ui/loading-states'
import { getDatabase } from '../db/database'
import type { Dossier, WorkflowStatus, FormeJuridique } from '../types'
import { WORKFLOW_STATUS_LABELS, FORME_JURIDIQUE_LABELS } from '../types'
import { FileText, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { GUConfigDebug } from '../components/guichet-unique/GUConfigDebug'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export function Dashboard() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    nouveau: 0,
    enCours: 0,
    cloture: 0,
  })

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
      setStats({
        total: dossiersData.length,
        nouveau: dossiersData.filter((d) => d.statut === 'NOUVEAU').length,
        enCours: dossiersData.filter(
          (d) => !['NOUVEAU', 'CLOTURE'].includes(d.statut)
        ).length,
        cloture: dossiersData.filter((d) => d.statut === 'CLOTURE').length,
      })
    } finally {
      setLoading(false)
    }
  }

  const recentDossiers = [...dossiers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Chart data for status distribution
  const statusChartData = useMemo(() => {
    const statusCount: Record<string, number> = {}
    dossiers.forEach((d) => {
      const label = WORKFLOW_STATUS_LABELS[d.statut as WorkflowStatus]
      statusCount[label] = (statusCount[label] || 0) + 1
    })
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }))
  }, [dossiers])

  // Chart data for legal form distribution
  const formeJuridiqueChartData = useMemo(() => {
    const formeCount: Record<string, number> = {}
    dossiers.forEach((d) => {
      if (d.typeDossier === 'SOCIETE' && d.societe) {
        const label = FORME_JURIDIQUE_LABELS[d.societe.formeJuridique as FormeJuridique]
        formeCount[label] = (formeCount[label] || 0) + 1
      } else if (d.typeDossier === 'EI') {
        formeCount['Entrepreneur Individuel'] = (formeCount['Entrepreneur Individuel'] || 0) + 1
      }
    })
    return Object.entries(formeCount).map(([name, value]) => ({ name, value }))
  }, [dossiers])

  if (loading) {
    return (
      <Layout title="Tableau de bord" subtitle="Vue d'ensemble de vos dossiers">
        <DashboardSkeleton />
      </Layout>
    )
  }

  return (
    <Layout title="Tableau de bord" subtitle="Vue d'ensemble de vos dossiers">
      <div className="space-y-6">
        <motion.div
          className="grid gap-4 md:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total dossiers</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Nouveaux</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.nouveau}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">En cours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.enCours}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Clôturés</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.cloture}</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {dossiers.length > 0 && (
          <motion.div
            className="grid gap-4 md:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par statut</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statusChartData}>
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Formes juridiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formeJuridiqueChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {formeJuridiqueChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dossiers récents</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDossiers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucun dossier créé</p>
                <Link
                  to="/dossiers/nouveau"
                  className="text-primary underline mt-2 inline-block"
                >
                  Créer votre premier dossier
                </Link>
              </div>
            ) : (
              <motion.div
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {recentDossiers.map((dossier) => (
                  <motion.div key={dossier.id} variants={itemVariants}>
                    <Link to={`/dossiers/${dossier.id}`} className="block">
                      <motion.div
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{dossier.numero}</p>
                            <Badge variant="outline" className="text-xs">
                              {dossier.typeDossier === 'SOCIETE' && dossier.societe
                                ? FORME_JURIDIQUE_LABELS[dossier.societe.formeJuridique]
                                : 'Entrepreneur Individuel'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {dossier.client.prenom} {dossier.client.nom}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {WORKFLOW_STATUS_LABELS[dossier.statut]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(dossier.createdAt), 'dd MMM yyyy', {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Composant de diagnostic temporaire - À SUPPRIMER une fois le problème résolu */}
        <GUConfigDebug />
      </div>
    </Layout>
  )
}
