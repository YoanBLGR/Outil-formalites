import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Download, ExternalLink } from 'lucide-react'

export function UpdateLinkPanel() {
  const CURRENT_VERSION = '2.0.0'
  const RELEASES_URL = 'https://github.com/yoyoboul/formalyse/releases'

  const openReleasesPage = () => {
    window.open(RELEASES_URL, '_blank')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="shadow-lg border-2 border-blue-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Mises à jour</CardTitle>
          <CardDescription>
            Version actuelle: {CURRENT_VERSION}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground">
            Pour vérifier les mises à jour disponibles, consultez la page des releases GitHub.
          </p>
        </CardContent>

        <div className="px-6 pb-4">
          <Button
            onClick={openReleasesPage}
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            Voir les releases
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </div>
  )
}

