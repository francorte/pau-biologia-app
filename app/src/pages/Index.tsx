import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Target, CheckCircle, BarChart3, ChevronRight, Clock, Eye } from 'lucide-react';

export default function Index() {
  const { isAuthenticated, enterDemoMode } = useAuthContext();
  const navigate = useNavigate();

  const handleDemoMode = () => {
    enterDemoMode();
    navigate('/bloques');
  };

  const features = [
    { icon: BookOpen, title: 'Preguntas Reales PAU', description: 'Practica con preguntas de convocatorias oficiales anteriores' },
    { icon: Target, title: 'Bloques Temáticos A-F', description: 'Contenido organizado según el temario oficial de 2º Bachillerato' },
    { icon: CheckCircle, title: 'Criterios Oficiales', description: 'Corrección basada en los criterios de evaluación de la PAU' },
    { icon: BarChart3, title: 'Seguimiento de Progreso', description: 'Estadísticas detalladas de tu evolución por bloques' },
  ];

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Prepara la <span className="text-primary">PAU de Biología</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Practica con preguntas reales de convocatorias anteriores y mejora tu preparación con criterios oficiales de corrección.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              {isAuthenticated ? (
                <>
                  <Link to="/bloques">
                    <Button size="lg" className="w-full sm:w-auto">
                      Practicar por Bloques
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/examen">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      <Clock className="mr-2 h-5 w-5" />
                      Modo Examen
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button size="lg" className="w-full sm:w-auto" onClick={handleDemoMode}>
                    <Eye className="mr-2 h-5 w-5" />
                    Probar sin registro
                  </Button>
                  <Link to="/registro">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Crear cuenta
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Todo lo que necesitas para aprobar
            </h2>
            <p className="mt-4 text-muted-foreground">
              Una herramienta diseñada específicamente para estudiantes de 2º de Bachillerato
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/50 py-16">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              ¿Listo para empezar a practicar?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Prueba la aplicación sin registro o crea tu cuenta para guardar tu progreso.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {isAuthenticated ? (
                <Link to="/bloques">
                  <Button size="lg">Ver Bloques Temáticos</Button>
                </Link>
              ) : (
                <>
                  <Button size="lg" onClick={handleDemoMode}>
                    <Eye className="mr-2 h-5 w-5" />
                    Probar sin registro
                  </Button>
                  <Link to="/registro">
                    <Button size="lg" variant="outline">Crear Cuenta</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
