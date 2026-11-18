import { DURATIONS, WORD_COUNTS, type TestSettings as Settings } from "@/entities/test";
import { Icon } from "@/shared/ui";

type TestSettingsProps = {
  settings: Settings;
  onChange: (settings: Settings) => void;
};

export const TestSettings = ({ settings, onChange }: TestSettingsProps) => {
  const isTimed = settings.mode === "time";
  const options = isTimed ? DURATIONS : WORD_COUNTS;
  const setting = isTimed ? "duration" : "wordCount";

  return (
    <div className='test-settings' aria-label='Настройки теста'>
      <div className='settings-group' role='group' aria-label='Режим теста'>
        {(["time", "words"] as const).map((mode) => (
          <button
            key={mode}
            type='button'
            className='setting-mode'
            aria-pressed={settings.mode === mode}
            onClick={() => onChange({ ...settings, mode })}
          >
            <Icon name={mode} />
            {mode === "time" ? "Время" : "Слова"}
          </button>
        ))}
      </div>
      <span className='settings-divider' aria-hidden='true' />
      <div
        className='settings-group settings-options'
        role='group'
        aria-label={isTimed ? "Время в секундах" : "Количество слов"}
      >
        {options.map((value) => (
          <button
            key={value}
            type='button'
            aria-pressed={value === settings[setting]}
            onClick={() => onChange({ ...settings, [setting]: value })}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
};
