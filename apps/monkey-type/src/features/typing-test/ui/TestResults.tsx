import { useEffect, useRef } from "react";
import { getResults, type TestState } from "@/entities/test";
import { Button } from "@/shared/ui";

type TestResultsProps = {
  test: TestState;
  onRestart: () => void;
  onNext: () => void;
};

export const TestResults = ({ test, onRestart, onNext }: TestResultsProps) => {
  const { cpm, accuracy, characters, errors } = getResults(test);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { mode, duration, wordCount } = test.settings;
  const metrics = [
    ["тип теста", mode === "time" ? `время ${duration}` : `слова ${wordCount}`],
    ["cpm", cpm],
    ["точность", `${accuracy}%`],
    ["символы", characters],
    ["ошибки", errors]
  ];

  useEffect(() => headingRef.current?.focus(), []);

  return (
    <section className='test-results' aria-labelledby='results-heading'>
      <h1 id='results-heading' className='sr-only' tabIndex={-1} ref={headingRef}>
        Результаты теста
      </h1>
      <dl className='result-metrics'>
        {metrics.map(([label, value]) => (
          <div className='result-metric' key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className='result-actions'>
        <Button icon='restart' onClick={onRestart}>
          Заново
        </Button>
        <Button icon='next' variant='primary' onClick={onNext}>
          Следующий тест
        </Button>
      </div>
    </section>
  );
};
