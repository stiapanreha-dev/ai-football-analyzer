import Anthropic from '@anthropic-ai/sdk';

import { config } from '../../config.js';
import { LLMError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const anthropic = new Anthropic({
  apiKey: config.openaiApiKey, // Using OpenAI API key for now (configured in env)
});

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2048;

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Выполнение запроса к Claude API
 */
export async function complete(
  prompt: string,
  options: CompletionOptions = {}
): Promise<string> {
  const { maxTokens = MAX_TOKENS, temperature = 0.7 } = options;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new LLMError('No text response from Claude');
    }

    logger.debug(
      {
        model: MODEL,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      'Claude API call completed'
    );

    return textBlock.text;
  } catch (error) {
    logger.error({ error }, 'Claude API call failed');

    if (error instanceof Anthropic.APIError) {
      throw new LLMError(`Claude API error: ${error.message}`, {
        status: error.status,
        code: error.error,
      });
    }

    throw new LLMError('Failed to complete LLM request', error);
  }
}
