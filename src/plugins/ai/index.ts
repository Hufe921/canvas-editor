import OpenAI from 'openai'
import Editor, { Command } from '../../editor'
import { Stream } from 'openai/streaming'

export interface IExecuteAIPayload {
  apiKey: string
  baseURL: string
  model: string
  systemContent?: string
  temperature?: number
  inputText: string
}

export type CommandWithAI = Command & {
  executeAI(
    payload: IExecuteAIPayload
  ): Promise<Stream<OpenAI.Chat.Completions.ChatCompletionChunk>>
}

export function aiPlugin(editor: Editor) {
  const command = <CommandWithAI>editor.command
  command.executeAI = async (payload: IExecuteAIPayload) => {
    const {
      systemContent = '',
      temperature = 0.7,
      model,
      apiKey,
      baseURL,
      inputText
    } = payload
    const openai = new OpenAI({
      apiKey,
      baseURL,
      dangerouslyAllowBrowser: true
    })
    return openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemContent },
        {
          role: 'user',
          content: inputText
        }
      ],
      temperature,
      stream: true
    })
  }
}
