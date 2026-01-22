import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Clock, Play, Bell, PauseCircle } from 'lucide-react';

interface PracticeConfigProps {
  blockName: string;
  questionCount: number;
  onStart: (config: PracticeSettings) => void;
}

export interface PracticeSettings {
  timerEnabled: boolean;
  timerMinutes: number;
  warningMinutes: number;
  maxPauses: number;
}

const STORAGE_KEY = 'practice-preferences';
const DEFAULT_TIMER_MINUTES = 20;
const MIN_TIMER_MINUTES = 5;
const MAX_TIMER_MINUTES = 60;
const DEFAULT_WARNING_MINUTES = 5;
const MIN_WARNING_MINUTES = 1;
const DEFAULT_MAX_PAUSES = 3;
const MIN_PAUSES = 0;
const MAX_PAUSES = 5;

function loadSavedPreferences(): Partial<PracticeSettings> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Could not load practice preferences:', error);
  }
  return {};
}

function savePreferences(settings: PracticeSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Could not save practice preferences:', error);
  }
}

export function PracticeConfig({ blockName, questionCount, onStart }: PracticeConfigProps) {
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(DEFAULT_TIMER_MINUTES);
  const [warningMinutes, setWarningMinutes] = useState(DEFAULT_WARNING_MINUTES);
  const [maxPauses, setMaxPauses] = useState(DEFAULT_MAX_PAUSES);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const saved = loadSavedPreferences();
    if (saved.timerEnabled !== undefined) setTimerEnabled(saved.timerEnabled);
    if (saved.timerMinutes !== undefined) setTimerMinutes(saved.timerMinutes);
    if (saved.warningMinutes !== undefined) setWarningMinutes(saved.warningMinutes);
    if (saved.maxPauses !== undefined) setMaxPauses(saved.maxPauses);
    setPrefsLoaded(true);
  }, []);

  // Ensure warning is less than total time
  const maxWarningMinutes = Math.max(MIN_WARNING_MINUTES, timerMinutes - 1);
  const effectiveWarningMinutes = Math.min(warningMinutes, maxWarningMinutes);

  const handleTimerChange = (value: number) => {
    setTimerMinutes(value);
    // Adjust warning if it exceeds new timer value
    if (warningMinutes >= value) {
      setWarningMinutes(Math.max(MIN_WARNING_MINUTES, value - 1));
    }
  };

  const handleStart = () => {
    const settings: PracticeSettings = {
      timerEnabled,
      timerMinutes,
      warningMinutes: effectiveWarningMinutes,
      maxPauses,
    };
    savePreferences(settings);
    onStart(settings);
  };

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Configurar práctica</CardTitle>
          <CardDescription>
            {blockName} • {questionCount} pregunta{questionCount !== 1 ? 's' : ''} disponible{questionCount !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="timer-toggle" className="text-base font-medium">
                    Temporizador
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Simula condiciones de examen real
                  </p>
                </div>
              </div>
              <Switch
                id="timer-toggle"
                checked={timerEnabled}
                onCheckedChange={setTimerEnabled}
              />
            </div>

            {/* Timer settings when enabled */}
            {timerEnabled && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                {/* Timer duration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Duración total</Label>
                    <span className="font-mono text-lg font-bold text-primary">
                      {timerMinutes} min
                    </span>
                  </div>
                  <Slider
                    value={[timerMinutes]}
                    onValueChange={([value]) => handleTimerChange(value)}
                    min={MIN_TIMER_MINUTES}
                    max={MAX_TIMER_MINUTES}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{MIN_TIMER_MINUTES} min</span>
                    <span>{MAX_TIMER_MINUTES} min</span>
                  </div>
                </div>

                {/* Warning time */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Aviso previo</Label>
                    <span className="ml-auto font-mono text-base font-semibold text-yellow-600 dark:text-yellow-400">
                      {effectiveWarningMinutes} min
                    </span>
                  </div>
                  <Slider
                    value={[effectiveWarningMinutes]}
                    onValueChange={([value]) => setWarningMinutes(value)}
                    min={MIN_WARNING_MINUTES}
                    max={maxWarningMinutes}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recibirás un aviso sonoro cuando queden {effectiveWarningMinutes} minuto{effectiveWarningMinutes !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Max pauses */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <PauseCircle className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Pausas permitidas</Label>
                    <span className="ml-auto font-mono text-base font-semibold">
                      {maxPauses === 0 ? 'Sin pausas' : maxPauses}
                    </span>
                  </div>
                  <Slider
                    value={[maxPauses]}
                    onValueChange={([value]) => setMaxPauses(value)}
                    min={MIN_PAUSES}
                    max={MAX_PAUSES}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {maxPauses === 0 
                      ? 'No podrás pausar el temporizador (modo examen estricto)'
                      : `Podrás pausar hasta ${maxPauses} vece${maxPauses !== 1 ? 's' : ''} durante la práctica`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleStart} size="lg" className="w-full">
            <Play className="mr-2 h-4 w-4" />
            Comenzar práctica
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
