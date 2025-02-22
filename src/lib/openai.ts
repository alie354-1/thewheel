import OpenAI from 'openai';
import { supabase } from './supabase';

// Get OpenAI client with settings from superadmin profile
async function getOpenAIClient() {
  const { data: adminSettings } = await supabase
    .from('profiles')
    .select('settings')
    .eq('role', 'superadmin')
    .limit(1)
    .single();

  if (!adminSettings?.settings?.openai?.api_key) {
    throw new Error('OpenAI API key not configured. Please contact an administrator.');
  }

  return {
    client: new OpenAI({
      apiKey: adminSettings.settings.openai.api_key,
      dangerouslyAllowBrowser: true
    }),
    model: adminSettings.settings.openai.model || 'gpt-4'
  };
}

// Generate AI feedback and tasks
export const generateTasks = async (entry: {
  accomplished: string;
  working_on: string;
  blockers: string;
  goals: string;
}, userId: string) => {
  try {
    const { client, model } = await getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an experienced co-founder and tech lead providing strategic guidance and support. Your role is to:

1. Analyze updates thoughtfully and provide specific, actionable feedback
2. Ask probing questions to uncover deeper insights
3. Challenge assumptions constructively
4. Share relevant experience and patterns
5. Help identify risks and opportunities
6. Break down complex problems into manageable steps
7. Suggest concrete next actions

Your response should follow this format:

{
  "feedback": {
    "insights": {
      "strengths": [],
      "areas_for_improvement": [],
      "opportunities": [],
      "risks": [],
      "strategic_recommendations": []
    }
  },
  "tasks": [
    {
      "title": "Clear task title",
      "description": "Detailed description of what needs to be done and why",
      "priority": "high/medium/low",
      "estimated_hours": 2,
      "task_type": "Feature Development/Bug Fix/Documentation/Research/Design/Planning/Marketing/Sales/Customer Support/Infrastructure/Testing/Analytics/Process Improvement/Team Coordination/Other",
      "implementation_tips": [
        "Specific actionable tip 1",
        "Specific actionable tip 2",
        "Specific actionable tip 3"
      ],
      "potential_challenges": [
        "Challenge 1 with mitigation strategy",
        "Challenge 2 with mitigation strategy",
        "Challenge 3 with mitigation strategy"
      ],
      "success_metrics": [
        "Concrete measurable metric 1",
        "Concrete measurable metric 2",
        "Concrete measurable metric 3"
      ],
      "resources": [
        {
          "title": "Resource Title",
          "url": "https://example.com",
          "type": "article/video/tool",
          "description": "Brief description"
        }
      ],
      "learning_resources": [
        {
          "title": "Resource Title",
          "url": "https://example.com",
          "type": "course/tutorial/guide",
          "platform": "Platform name",
          "description": "Brief description"
        }
      ],
      "tools": [
        {
          "name": "Tool Name",
          "url": "https://example.com",
          "category": "Category",
          "description": "Brief description"
        }
      ]
    }
  ]
}`
        },
        {
          role: "user",
          content: `Please analyze this update and provide strategic feedback and tasks:

${entry.accomplished ? 'Accomplished: ' + entry.accomplished + '\n' : ''}${entry.working_on ? 'Working On: ' + entry.working_on + '\n' : ''}${entry.blockers ? 'Blockers: ' + entry.blockers + '\n' : ''}${entry.goals ? 'Goals: ' + entry.goals : ''}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response generated');
    }

    // Parse response
    const result = JSON.parse(content);
    
    return {
      feedback: JSON.stringify(result.feedback),
      tasks: result.tasks.map((task: any) => ({
        ...task,
        status: 'pending',
        implementation_tips: task.implementation_tips || [],
        potential_challenges: task.potential_challenges || [],
        success_metrics: task.success_metrics || [],
        resources: task.resources || [],
        learning_resources: task.learning_resources || [],
        tools: task.tools || []
      }))
    };
  } catch (error: any) {
    console.error('Error generating tasks:', error);
    throw new Error(error.message || 'Failed to generate tasks');
  }
};

// Generate idea variations
export const generateIdeaVariations = async (idea: {
  title: string;
  inspiration: string;
  type: string;
}) => {
  try {
    const { client, model } = await getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an experienced startup advisor helping founders explore variations of their ideas.
          Based on the core idea, generate 3-4 unique variations that explore different angles or approaches.
          Each variation should have a unique value proposition and target market.
          Format your response as a JSON array of objects with these exact keys:
          {
            "id": "uuid string",
            "title": "string",
            "description": "string",
            "differentiator": "string",
            "targetMarket": "string",
            "revenueModel": "string",
            "isSelected": false,
            "isEditing": false
          }`
        },
        {
          role: "user",
          content: `Please generate variations for this idea:
            Core Idea: ${idea.title}
            Inspiration: ${idea.inspiration}
            Type: ${idea.type}`
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response generated');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Error generating variations:', error);
    throw new Error(error.message || 'Failed to generate variations');
  }
};

// Generate combined ideas
export const generateCombinedIdeas = async (
  originalIdea: string,
  selectedVariations: any[]
) => {
  try {
    const { client, model } = await getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an experienced startup advisor helping founders combine different aspects of their idea variations.
          Create 2-3 unique combinations that merge the best elements from the selected variations.
          Format your response as a JSON array of objects with these exact keys:
          {
            "id": "uuid string",
            "title": "string",
            "description": "string",
            "sourceElements": ["string array of elements used from original variations"],
            "targetMarket": "string",
            "revenueModel": "string",
            "valueProposition": "string",
            "isSelected": false,
            "isEditing": false
          }`
        },
        {
          role: "user",
          content: `Please combine elements from these variations:
            Original Idea: ${originalIdea}
            Selected Variations: ${JSON.stringify(selectedVariations, null, 2)}`
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response generated');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Error generating combined ideas:', error);
    throw new Error(error.message || 'Failed to generate combined ideas');
  }
};

// Generate market suggestions
export const generateMarketSuggestions = async (idea: {
  title: string;
  description: string;
  solution_concept: string;
  target_audience?: string;
  sales_channels?: string;
  pricing_model?: string;
  customer_type?: string;
  integration_needs?: string;
}) => {
  try {
    const { client, model } = await getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an experienced market research analyst helping founders validate their startup ideas.
          Based on the provided idea details, generate 5 highly relevant suggestions for each market aspect.
          Format your response as a JSON object with these exact keys:
          {
            "target_audience": string[],
            "sales_channels": string[],
            "pricing_model": string[],
            "customer_type": string[],
            "integration_needs": string[]
          }
          Each array should contain EXACTLY 5 suggestions that are specific and relevant to this particular idea.`
        },
        {
          role: "user",
          content: `Please generate market suggestions for this startup idea:
            Title: ${idea.title}
            Description: ${idea.description}
            Solution Type: ${idea.solution_concept}
            Current Target Audience: ${idea.target_audience || 'Not specified'}
            Current Sales Channels: ${idea.sales_channels || 'Not specified'}
            Current Pricing Model: ${idea.pricing_model || 'Not specified'}
            Current Customer Type: ${idea.customer_type || 'Not specified'}
            Current Integration Needs: ${idea.integration_needs || 'Not specified'}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response generated');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Error generating market suggestions:', error);
    throw new Error(error.message || 'Failed to generate market suggestions');
  }
};