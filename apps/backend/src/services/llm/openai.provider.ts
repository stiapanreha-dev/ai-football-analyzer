import OpenAI from 'openai';

import { config } from '../../config.js';
import { LLMError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

const MODEL = 'gpt-5.1';
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
      max_completion_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const choice = response.choices[0];
    const content = choice?.message?.content;

    if (!content) {
      // Log detailed info for debugging
      logger.error({
        finishReason: choice?.finish_reason,
        refusal: choice?.message?.refusal,
        usage: response.usage,
      }, 'OpenAI returned empty content');

      throw new LLMError('No text response from OpenAI', {
        finishReason: choice?.finish_reason,
        refusal: choice?.message?.refusal,
      });
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
