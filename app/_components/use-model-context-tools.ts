import { useEffect, useEffectEvent } from 'react';
import { flushSync } from 'react-dom';
import {
  rankScenarios,
  scenarios,
  validateAnswers,
  type Answers,
  type Scenario,
} from '../futures';

type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: object;
  execute: (input: unknown) => unknown;
};

type ModelContext = {
  registerTool: (
    tool: Tool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

type Handlers = {
  onCompleteValues: (answers: Answers) => void;
  onOpenScenario: (scenario: Scenario) => void;
};

/**
 * Exposes the quiz and scenario dialogs as tools to in-browser AI agents via
 * `document.modelContext`, when the browser provides it.
 */
export function useModelContextTools({
  onCompleteValues,
  onOpenScenario,
}: Handlers) {
  const completeValues = useEffectEvent(onCompleteValues);
  const openScenario = useEffectEvent(onOpenScenario);

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Optional browser capability. */
      }
    };

    register({
      name: 'complete_values_exploration',
      title: 'Explore futures from five values',
      description:
        'Complete the visible values journey using five user-supplied choices ordered as agency, distribution, pluralism, development, continuity. Each value is -1, 0, 1, or null for unsure; do not infer the user’s values. Updates the visible results; these are discussion matches, not predictions.',
      inputSchema: {
        type: 'object',
        properties: {
          answers: {
            type: 'array',
            items: { enum: [-1, 0, 1, null] },
            minItems: 5,
            maxItems: 5,
          },
        },
        required: ['answers'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (
          !input ||
          typeof input !== 'object' ||
          Object.keys(input).some((k) => k !== 'answers')
        )
          throw new Error('Expected an answers object.');
        const answers = validateAnswers(
          (input as { answers: unknown }).answers,
        );
        flushSync(() => completeValues(answers));
        document
          .getElementById('values')
          ?.scrollIntoView({ behavior: 'instant' });
        return {
          kind: 'discussion_matches',
          matches: rankScenarios(answers)
            .slice(0, 3)
            .map((r) => ({
              id: r.scenario.id,
              name: r.scenario.name,
              dimensionsCompared: r.compared.length,
            })),
          prediction: false,
        };
      },
    });

    register({
      name: 'open_ai_scenario',
      title: 'Open a future scenario',
      description:
        'Open the visible detail dialog for one of the twelve AI futures.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', enum: scenarios.map((s) => s.id) },
        },
        required: ['id'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (
          !input ||
          typeof input !== 'object' ||
          Object.keys(input).some((k) => k !== 'id')
        )
          throw new Error('Expected a scenario id.');
        const scenario = scenarios.find(
          (s) => s.id === (input as { id: unknown }).id,
        );
        if (!scenario) throw new Error('Unknown scenario.');
        flushSync(() => openScenario(scenario));
        return {
          id: scenario.id,
          name: scenario.name,
          summary: scenario.summary,
          warning: scenario.profile === null,
        };
      },
    });

    return () => lifecycle.abort();
  }, []);
}
