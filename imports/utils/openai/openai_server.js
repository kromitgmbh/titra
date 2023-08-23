import { fetch } from 'meteor/fetch'
import { getGlobalSettingAsync } from '../server_method_helpers'

export const getOpenAIResponse = async (prompt) => {
  if (!await getGlobalSettingAsync('openapi_apikey')) {
    try {
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getGlobalSettingAsync('openai_apikey')}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0,
        }),
      })
      const aiResponseContent = await aiResponse.json()
      return JSON.parse(aiResponseContent?.choices[0]?.message?.content)
    } catch (e) {
      throw new Meteor.Error('notifications.OpenAI_error', e.message)
    }
  }
  throw new Meteor.Error('notifications.OpenAI_API_key_not_set')
}
export default getOpenAIResponse
