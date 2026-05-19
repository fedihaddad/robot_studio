import React, { useMemo, useState, useEffect } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  BeakerIcon,
  ClipboardDocumentIcon,
  Cog6ToothIcon,
  ComputerDesktopIcon,
  MoonIcon,
  SignalIcon,
  SunIcon,
  VideoCameraIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid';
import { AppConfig, ROSState, RobotMode } from '../types';
import { ROSService } from '../services/ros.service';
import DiagnosticsPanel from '../components/shared/DiagnosticsPanel';
import { LANGUAGES, Language } from '../i18n';
import { useAppStore } from '../store/appStore';
import {
  DEFAULT_ROSBRIDGE_HOSTNAME,
  DEFAULT_ROSBRIDGE_URL,
  normalizeRosbridgeUrl,
} from '../services/ros-endpoint.service';

interface SettingsPageProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  onSave: () => void;
  onLoad: () => void;
  rosState: ROSState;
  rosService: ROSService | null;
  currentMode: RobotMode;
  aiNodeActive: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  config,
  onConfigChange,
  onSave,
  onLoad,
  rosState,
  rosService,
  currentMode,
  aiNodeActive,
  theme,
  onToggleTheme,
}) => {
  const { language, setLanguage, t } = useAppStore();
  const [formData, setFormData] = useState(config);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(true);
  const [rosTest, setRosTest] = useState<
    | { status: 'idle' }
    | { status: 'testing' }
    | { status: 'ok'; latencyMs: number; topicsCount: number }
    | { status: 'fail'; error: string }
  >({ status: 'idle' });
  const [copied, setCopied] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [isSecurityVerified, setIsSecurityVerified] = useState(!config.passwordEnabled);
  const [verificationError, setVerificationError] = useState(false);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleChange = (field: keyof AppConfig, value: string | boolean) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onConfigChange(newData);
  };

  const effectiveRosUrl = useMemo(() => normalizeRosbridgeUrl(formData.rosUrl), [formData.rosUrl]);

  const handleSave = () => {
    const normalizedConfig = {
      ...formData,
      rosUrl: effectiveRosUrl,
    };
    setFormData(normalizedConfig);
    onConfigChange(normalizedConfig);
    onSave();
    setSaveMessage(t('settings.saved'));
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleLoad = () => {
    onLoad();
    setSaveMessage(t('settings.loaded'));
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleTestConnection = async (url: string, label: string) => {
    setSaveMessage(`🧪 Testing ${label}...`);
    const success = await testConnection(url);
    if (success) {
      setSaveMessage(`✅ ${label} connected successfully!`);
    } else {
      setSaveMessage(`❌ ${label} connection failed. Check the URL and ensure the service is running.`);
    }
    setTimeout(() => setSaveMessage(null), 5000);
  };

  const testRosbridge = async () => {
    const url = effectiveRosUrl;
    setRosTest({ status: 'testing' });

    const start = performance.now();
    try {
      if (!window.ROSLIB) {
        throw new Error('ROSLIB not loaded in renderer');
      }

      const ros = new (window as any).ROSLIB.Ros({ url });
      const result = await new Promise<{ topicsCount: number }>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          try {
            ros.close();
          } catch {
            // ignore
          }
          reject(new Error('Timeout connecting to rosbridge'));
        }, 3500);

        ros.on('connection', () => {
          ros.getTopics(
            (topics: any) => {
              window.clearTimeout(timeout);
              try {
                ros.close();
              } catch {
                // ignore
              }
              const count = Array.isArray(topics?.topics) ? topics.topics.length : 0;
              resolve({ topicsCount: count });
            },
            (err: any) => {
              window.clearTimeout(timeout);
              try {
                ros.close();
              } catch {
                // ignore
              }
              reject(new Error(typeof err === 'string' ? err : 'getTopics failed'));
            }
          );
        });
        ros.on('error', (err: any) => {
          window.clearTimeout(timeout);
          try {
            ros.close();
          } catch {
            // ignore
          }
          reject(new Error(err?.message || 'WebSocket error'));
        });
      });

      const latencyMs = Math.round(performance.now() - start);
      setRosTest({ status: 'ok', latencyMs, topicsCount: result.topicsCount });
      setSaveMessage(`✅ ROSBridge OK (${latencyMs}ms, topics: ${result.topicsCount})`);
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setRosTest({ status: 'fail', error: msg });
      setSaveMessage(`❌ ROSBridge failed: ${msg}`);
      setTimeout(() => setSaveMessage(null), 6000);
    }
  };

  const copyConfig = async () => {
    const payload = {
      ...formData,
      rosUrlNormalized: effectiveRosUrl,
      rosConnected: rosState.isConnected,
      currentMode,
      aiNodeActive,
      exportedAt: new Date().toISOString(),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  const resetDefaults = () => {
    const defaults: AppConfig = {
      rosUrl: DEFAULT_ROSBRIDGE_URL,
      cameraUrl: 'http://axel.local:8000/?action=stream',
      robotIp: DEFAULT_ROSBRIDGE_HOSTNAME,
      robotName: 'AXEL',
      passwordEnabled: false,
      password: '',
    };
    setFormData(defaults);
    onConfigChange(defaults);
    setSaveMessage(t('settings.defaultsRestored'));
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const testConnection = async (url: string) => {
    try {
      // Check if it's a WebSocket URL
      if (url.startsWith('ws://') || url.startsWith('wss://')) {
        // Test WebSocket connection
        return new Promise((resolve) => {
          const ws = new WebSocket(url);
          const timeout = setTimeout(() => {
            ws.close();
            resolve(false);
          }, 3000);

          ws.onopen = () => {
            clearTimeout(timeout);
            ws.close();
            resolve(true);
          };

          ws.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
          };
        });
      } else {
        // Test HTTP connection
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        return true;
      }
    } catch (error) {
      return false;
    }
  };

  const handleVerifyPassword = () => {
    if (currentPasswordInput === config.password) {
      setIsSecurityVerified(true);
      setVerificationError(false);
    } else {
      setVerificationError(true);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] flex items-center justify-center">
              <Cog6ToothIcon className="w-6 h-6 text-cyan-200" aria-hidden />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[color:var(--axel-text)]">{t('settings.title')}</h1>
              <p className="text-sm md:text-base axel-muted mt-1">{t('settings.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="axel-surface rounded-2xl border border-slate-700/60 px-4 py-3 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${rosState.isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="axel-muted">ROS</span>
            <span className={rosState.isConnected ? 'text-emerald-200' : 'text-rose-200'}>
              {rosState.isConnected ? t('common.connected') : t('common.disconnected')}
            </span>
          </div>
          <span className="opacity-30">|</span>
          <div className="flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="w-4 h-4 text-slate-300" aria-hidden />
            <span className="axel-muted">{t('dashboard.robotMode')}</span>
            <span className="text-cyan-200 font-semibold">{currentMode}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="axel-surface rounded-2xl border border-slate-700/60 p-4 flex flex-wrap items-center gap-2">
        <button onClick={testRosbridge} className="axel-button-primary px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2">
          <BeakerIcon className="w-4 h-4" aria-hidden />
          {rosTest.status === 'testing' ? t('settings.testingRos') : t('settings.testRos')}
        </button>
        <button onClick={copyConfig} className="axel-button-secondary px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2">
          <ClipboardDocumentIcon className="w-4 h-4" aria-hidden />
          {copied ? t('settings.copied') : t('settings.copyConfig')}
        </button>
        <button onClick={resetDefaults} className="axel-button-secondary px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2">
          <WrenchScrewdriverIcon className="w-4 h-4" aria-hidden />
          {t('settings.resetDefaults')}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs axel-muted hidden sm:block">{t('settings.theme')}</span>
          <button
            type="button"
            onClick={onToggleTheme}
            className="axel-button-secondary px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2"
            title={t('common.toggleTheme')}
          >
            {theme === 'dark' ? <MoonIcon className="w-4 h-4" aria-hidden /> : <SunIcon className="w-4 h-4" aria-hidden />}
            {theme === 'dark' ? t('settings.dark') : t('settings.light')}
          </button>
          <label className="flex items-center gap-2 text-xs axel-muted">
            <span className="hidden sm:block">{t('language.label')}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="rounded-xl border px-3 py-2 text-xs font-bold"
              style={{
                background: 'var(--axel-surface-soft)',
                borderColor: 'var(--axel-border)',
                color: 'var(--axel-text)',
              }}
            >
              {LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="axel-surface rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-4 text-emerald-200 text-sm">
          {saveMessage}
        </div>
      )}

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Robot Configuration */}
        <div className="space-y-6">
          <div className="axel-surface rounded-2xl border border-slate-700/60 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] flex items-center justify-center">
                <ComputerDesktopIcon className="w-5 h-5 text-slate-200" aria-hidden />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[color:var(--axel-text)] leading-tight">{t('settings.robotTitle')}</h2>
                <p className="text-xs axel-muted">{t('settings.robotSubtitle')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">{t('settings.robotName')}</label>
                <input
                  type="text"
                  value={formData.robotName}
                  onChange={(e) => handleChange('robotName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] text-[color:var(--axel-text)] placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/60"
                  placeholder="e.g., AXEL-01"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">{t('settings.robotIp')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.robotIp}
                    onChange={(e) => handleChange('robotIp', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] text-[color:var(--axel-text)] placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/60"
                  placeholder={DEFAULT_ROSBRIDGE_HOSTNAME}
                  />
                  <button
                    onClick={() => handleTestConnection(`http://${formData.robotIp}:8080`, 'Camera Stream')}
                    className="axel-button-secondary px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap inline-flex items-center gap-2"
                  >
                    <BeakerIcon className="w-4 h-4" aria-hidden />
                    {t('settings.test')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Configuration */}
        <div className="space-y-6">
          <div className="axel-surface rounded-2xl border border-slate-700/60 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] flex items-center justify-center">
                <SignalIcon className="w-5 h-5 text-slate-200" aria-hidden />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[color:var(--axel-text)] leading-tight">{t('settings.networkTitle')}</h2>
                <p className="text-xs axel-muted">{t('settings.networkSubtitle')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">{t('settings.rosBridgeUrl')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.rosUrl}
                    onChange={(e) => handleChange('rosUrl', e.target.value)}
                    onBlur={() => {
                      const normalized = normalizeRosbridgeUrl(formData.rosUrl);
                      if (normalized !== formData.rosUrl) {
                        handleChange('rosUrl', normalized);
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] text-[color:var(--axel-text)] placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/60 font-mono text-sm"
                    placeholder={DEFAULT_ROSBRIDGE_URL}
                  />
                  <button
                    onClick={() => handleTestConnection(formData.rosUrl, 'ROS Bridge')}
                    className="axel-button-secondary px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap inline-flex items-center gap-2"
                  >
                    <BeakerIcon className="w-4 h-4" aria-hidden />
                    {t('settings.test')}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {t('settings.normalized')}: <span className="font-mono text-slate-200">{effectiveRosUrl}</span>
                </p>
                <p className="text-xs axel-muted mt-1">{t('settings.rosBridgeHelp')}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">{t('settings.cameraStreamUrl')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.cameraUrl}
                    onChange={(e) => handleChange('cameraUrl', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] text-[color:var(--axel-text)] placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/60 font-mono text-sm"
                    placeholder={`http://${DEFAULT_ROSBRIDGE_HOSTNAME}:8080/?action=stream`}
                  />
                  <button
                    onClick={() => handleTestConnection(formData.cameraUrl, 'MJPEG Camera')}
                    className="axel-button-secondary px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap inline-flex items-center gap-2"
                  >
                    <VideoCameraIcon className="w-4 h-4" aria-hidden />
                    {t('settings.test')}
                  </button>
                </div>
                <p className="text-xs axel-muted mt-1">{t('settings.cameraHelp')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Configuration */}
      <div className="axel-surface rounded-2xl border border-slate-700/60 p-6 mt-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5 text-blue-400" aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[color:var(--axel-text)] leading-tight">{t('settings.securityTitle')}</h2>
            <p className="text-xs axel-muted">{t('settings.securitySubtitle')}</p>
          </div>
        </div>

        {!isSecurityVerified && config.passwordEnabled ? (
          <div className="space-y-4 max-w-md">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {t('settings.currentPasswordLabel')}
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  className={`flex-1 px-4 py-3 rounded-xl bg-[var(--axel-surface-soft)] border ${
                    verificationError ? 'border-red-500/50' : 'border-[color:var(--axel-border)]'
                  } text-[color:var(--axel-text)] focus:outline-none focus:border-blue-500/60 font-mono text-sm`}
                  placeholder={t('settings.currentPasswordPlaceholder')}
                />
                <button
                  onClick={handleVerifyPassword}
                  className="axel-button-primary px-6 py-3 rounded-xl text-sm font-bold text-white"
                >
                  {t('settings.verify')}
                </button>
              </div>
              {verificationError && (
                <p className="text-xs text-red-400 mt-1 animate-in fade-in slide-in-from-top-1">
                  {t('settings.invalidCurrentPassword')}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-in fade-in duration-500">
            <div className="flex items-center justify-between p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-base font-bold text-slate-200">{t('settings.passwordEnabled')}</label>
                  {config.passwordEnabled && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                      {t('settings.verified')}
                    </span>
                  )}
                </div>
                <p className="text-xs axel-muted max-w-xs">{t('settings.passwordHelp')}</p>
              </div>
              <button
                onClick={() => handleChange('passwordEnabled', !formData.passwordEnabled)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                  formData.passwordEnabled ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                    formData.passwordEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {formData.passwordEnabled && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">{t('settings.passwordLabel')}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full px-4 py-4 rounded-xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] text-[color:var(--axel-text)] placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 font-mono text-sm tracking-widest"
                  placeholder={t('settings.passwordPlaceholder')}
                />
              </div>
            )}
          </div>
        )}
      </div>


      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={handleSave}
          className="axel-button-primary px-6 py-3 rounded-2xl font-extrabold text-white inline-flex items-center justify-center gap-2"
        >
          <ArrowDownTrayIcon className="w-5 h-5" aria-hidden />
          {t('common.save')}
        </button>
        <button
          onClick={handleLoad}
          className="axel-button-secondary px-6 py-3 rounded-2xl font-extrabold inline-flex items-center justify-center gap-2"
        >
          <ArrowUpTrayIcon className="w-5 h-5" aria-hidden />
          {t('settings.load')}
        </button>
      </div>

      {/* Configuration Preview */}
      <div className="axel-surface rounded-2xl border border-slate-700/60 p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ClipboardDocumentIcon className="w-5 h-5 text-slate-200" aria-hidden />
            <h3 className="text-lg font-extrabold text-[color:var(--axel-text)]">{t('settings.summary')}</h3>
          </div>
          <button onClick={copyConfig} className="axel-button-secondary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2">
            <ClipboardDocumentIcon className="w-4 h-4" aria-hidden />
            {copied ? t('settings.copied') : t('settings.copy')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-[color:var(--axel-border)] bg-[var(--axel-surface-soft)] p-4">
            <p className="text-xs axel-muted mb-1">{t('settings.robotTitle')}</p>
            <p className="text-[color:var(--axel-text)] font-semibold">{formData.robotName}</p>
            <p className="text-xs axel-muted mt-2">{t('settings.ip')}</p>
            <p className="text-[color:var(--axel-text)] font-mono text-sm">{formData.robotIp}</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--axel-border)] bg-[var(--axel-surface-soft)] p-4">
            <p className="text-xs axel-muted mb-1">{t('settings.rosUrl')}</p>
            <p className="text-[color:var(--axel-text)] font-mono text-sm break-all">{formData.rosUrl}</p>
            <p className="text-xs axel-muted mt-2">{t('settings.cameraUrl')}</p>
            <p className="text-[color:var(--axel-text)] font-mono text-sm break-all">{formData.cameraUrl}</p>
          </div>
        </div>
      </div>

      {/* Diagnostics (embedded) */}
      <div className="axel-surface rounded-xl border border-slate-700/60 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BeakerIcon className="w-5 h-5 text-slate-200" aria-hidden />
              <h2 className="text-2xl font-extrabold text-[color:var(--axel-text)]">{t('settings.diagnostics')}</h2>
            </div>
            <p className="text-sm axel-muted">{t('settings.diagnosticsSubtitle')}</p>
          </div>
          <button
            onClick={() => setShowDiagnostics((v) => !v)}
            className="axel-button-secondary px-4 py-2 rounded-xl text-sm font-bold"
          >
            {showDiagnostics ? t('settings.hide') : t('settings.show')}
          </button>
        </div>

        {showDiagnostics && (
          <DiagnosticsPanel
            rosState={rosState}
            rosService={rosService}
            currentMode={currentMode}
            aiNodeActive={aiNodeActive}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
