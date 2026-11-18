import { TestResults, TestSettings, TypingArea, useTypingTest } from "@/features/typing-test";
import { Button, Icon } from "@/shared/ui";

export const TypingTestPage = () => {
  const { state, functions } = useTypingTest();
  const { test, remainingSeconds, completedWords } = state;
  const isSetup = test.phase === "setup";
  const isRunning = test.phase === "running";
  const isTimed = test.settings.mode === "time";

  return (
    <div
      className={`typing-app${isRunning || test.phase === "finished" ? " typing-app--started" : ""}`}
    >
      <header className='app-header'>
        <a className='logo' href='./' aria-label='TypingTest — на главную'>
          <Icon name='logo' />
          <span>TypingTest</span>
        </a>
      </header>
      <main className='test-page'>
        {test.phase === "finished" ? (
          <TestResults test={test} onRestart={functions.restart} onNext={functions.next} />
        ) : (
          <section
            className={`test-session${isSetup ? " test-session--setup" : ""}`}
            aria-label='Тест скорости печати'
          >
            <div className='settings-slot'>
              {!isRunning && (
                <TestSettings settings={test.settings} onChange={functions.configure} />
              )}
            </div>
            {isSetup ? (
              <Button icon='next' variant='primary' onClick={functions.start}>
                Начать тест
              </Button>
            ) : (
              <>
                <div className='typing-content'>
                  {isRunning && (
                    <output
                      className='test-progress'
                      aria-label={isTimed ? "Осталось секунд" : "Пройдено слов"}
                      aria-live='off'
                    >
                      {isTimed ? remainingSeconds : `${completedWords}/${test.settings.wordCount}`}
                    </output>
                  )}
                  <TypingArea
                    test={test}
                    onType={functions.typeCharacter}
                    onBackspace={functions.backspace}
                  />
                </div>
                <Button icon='restart' onClick={functions.restart}>
                  Заново
                </Button>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
