import OpenAI from 'openai';

import { config } from '../../config.js';
import { LLMError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

const MODEL = 'gpt-4o';
const MAX_TOKENS = 2048;

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Выполнение запроса к OpenAI API
 */
export async function complete(
  prompt: string,
  options: CompletionOptions = {}
): Promise<string> {
  const { maxTokens = MAX_TOKENS, temperature = 0.7 } = options;

  try {
    const response = await openai.chat.completions.create({
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

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new LLMError('No text response from OpenAI');
    }

    logger.debug(
      {
        model: MODEL,
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
      },
      'OpenAI API call completed'
    );

    return content;
  } catch (error) {
    logger.error({ error }, 'OpenAI API call failed');

    if (error instanceof OpenAI.APIError) {
      throw new LLMError(`OpenAI API error: ${error.message}`, {
        status: error.status,
        code: error.code,
      });
    }

    throw new LLMError('Failed to complete LLM request', error);
  }
}
