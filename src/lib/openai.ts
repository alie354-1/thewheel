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
    "strengths": [],
    "areas_for_improvement": [],
    "opportunities": [],
    "risks": [],
    "strategic_recommendations": []
  },
  "follow_up_questions": [],
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
          content: `Please analyze this standup update and provide strategic feedback and tasks:

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
    const data = JSON.parse(content);
    return {
      feedback: data.feedback,
      follow_up_questions: data.follow_up_questions,
      tasks: data.tasks
    };
  } catch (error: any) {
    console.error('Error generating tasks:', error);
    throw new Error(error.message || 'Failed to generate tasks');
  }
};

// Generate market analysis
export const generateMarketAnalysis = async (idea: any) => {
  try {
    const { client, model } = await getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are a market research expert. Analyze the provided idea and generate comprehensive market insights with credible sources in this format:

{
  "customer_profiles": [
    {
      "segment": "string",
      "description": "string",
      "needs": ["string"],
      "pain_points": ["string"],
      "buying_behavior": "string",
      "sources": [
        {
          "name": "string",
          "url": "string",
          "type": "research_report | industry_analysis | market_study | survey_data",
          "year": number
        }
      ]
    }
  ],
  "early_adopters": [
    {
      "type": "string",
      "characteristics": ["string"],
      "acquisition_strategy": "string",
      "sources": [
        {
          "name": "string",
          "url": "string",
          "type": "case_study | market_research | industry_report",
          "year": number
        }
      ]
    }
  ],
  "sales_channels": [
    {
      "channel": "string",
      "effectiveness": number,
      "cost": "string",
      "timeline": "string",
      "sources": [
        {
          "name": "string",
          "url": "string",
          "type": "industry_report | benchmark_study | market_analysis",
          "year": number
        }
      ]
    }
  ],
  "pricing_insights": [
    {
      "model": "string",
      "price_point": "string",
      "justification": "string",
      "sources": [
        {
          "name": "string",
          "url": "string",
          "type": "pricing_study | competitor_analysis | market_research",
          "year": number
        }
      ]
    }
  ],
  "market_size": {
    "tam": "string",
    "sam": "string",
    "som": "string",
    "growth_rate": "string",
    "sources": [
      {
        "name": "string",
        "url": "string",
        "type": "market_report | industry_forecast | research_study",
        "year": number
      }
    ]
  }
}

Use real, credible sources like:
- Gartner reports
- Forrester research
- IDC market analysis
- McKinsey insights
- Statista data
- Industry association reports
- Government data sources
- Academic research papers
- Reputable market research firms

For each insight, provide at least 2-3 recent sources (within last 2-3 years when possible).`
        },
        {
          role: "user",
          content: `Please analyze this business idea:

Title: ${idea.title}
Description: ${idea.description}
Problem: ${idea.problem_statement}
Solution: ${idea.solution}
Target Market: ${idea.target_market}`
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
    console.error('Error generating market analysis:', error);
    throw new Error(error.message || 'Failed to generate market analysis');
  }
};

// Generate market suggestions
export const generateMarketSuggestions = async (idea: any) => {
  try {
    const { client, model } = await getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are a market research expert. Generate market suggestions in this format:

{
  "target_audience": ["string"],
  "sales_channels": ["string"],
  "pricing_model": ["string"],
  "customer_type": ["string"],
  "integration_needs": ["string"]
}`
        },
        {
          role: "user",
          content: `Please generate market suggestions for:

Title: ${idea.title}
Description: ${idea.description}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
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

// Generate idea variations
export const generateIdeaVariations = async (idea: any) => {
  try {
    const { client, model } = await getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an innovation expert. Generate creative variations of the provided idea in this format:

{
  "variations": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "differentiator": "string",
      "targetMarket": "string",
      "revenueModel": "string"
    }
  ]
}`
        },
        {
          role: "user",
          content: `Please generate variations for:

Title: ${idea.title}
Inspiration: ${idea.inspiration}
Type: ${idea.type}`
        }
      ],
      temperature: 0.8,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response generated');
    }

    const { variations } = JSON.parse(content);
    return variations.map((v: any) => ({
      ...v,
      isSelected: false,
      isEditing: false
    }));
  } catch (error: any) {
    console.error('Error generating idea variations:', error);
    throw new Error(error.message || 'Failed to generate idea variations');
  }
};

// Generate combined ideas
export const generateCombinedIdeas = async (baseIdea: string, selectedVariations: any[]) => {
  try {
    const { client, model } = await getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an innovation expert. Combine the selected variations into refined ideas in this format:

{
  "combined_ideas": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "sourceElements": ["string"],
      "targetMarket": "string",
      "revenueModel": "string",
      "valueProposition": "string"
    }
  ]
}`
        },
        {
          role: "user",
          content: `Please combine these variations of:

Base Idea: ${baseIdea}

Selected Variations:
${selectedVariations.map(v => `
Title: ${v.title}
Description: ${v.description}
Differentiator: ${v.differentiator}
Liked Aspects: ${v.likedAspects || 'None specified'}
`).join('\n')}`
        }
      ],
      temperature: 0.8,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response generated');
    }

    const { combined_ideas } = JSON.parse(content);
    return combined_ideas.map((idea: any) => ({
      ...idea,
      isSelected: false,
      isEditing: false
    }));
  } catch (error: any) {
    console.error('Error generating combined ideas:', error);
    throw new Error(error.message || 'Failed to generate combined ideas');
  }
};