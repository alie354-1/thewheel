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

Your response should be a valid JSON object with this exact structure:

{
  "feedback": {
    "strengths": ["strength 1", "strength 2", ...],
    "areas_for_improvement": ["area 1", "area 2", ...],
    "opportunities": ["opportunity 1", "opportunity 2", ...],
    "risks": ["risk 1", "risk 2", ...],
    "strategic_recommendations": ["recommendation 1", "recommendation 2", ...]
  },
  "follow_up_questions": ["question 1", "question 2", ...],
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed task description",
      "priority": "high/medium/low",
      "status": "pending",
      "category": "personal/company",
      "task_type": "Feature Development/Bug Fix/Documentation/Research/Design/Planning/Marketing/Sales/Customer Support/Infrastructure/Testing/Analytics/Process Improvement/Team Coordination/Other",
      "estimated_hours": 2,
      "due_date": "2025-02-22",
      "implementation_tips": ["tip 1", "tip 2", ...],
      "potential_challenges": ["challenge 1", "challenge 2", ...],
      "success_metrics": ["metric 1", "metric 2", ...],
      "resources": [
        {
          "title": "Resource title",
          "url": "https://example.com",
          "type": "article/video/tool/template/guide",
          "description": "Resource description"
        }
      ],
      "learning_resources": [
        {
          "title": "Resource title",
          "url": "https://example.com",
          "type": "course/tutorial/guide",
          "platform": "Platform name",
          "description": "Resource description"
        }
      ],
      "tools": [
        {
          "name": "Tool name",
          "url": "https://example.com",
          "category": "Category",
          "description": "Tool description"
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
      max_tokens: 2500
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content received');
    }

    try {
      const parsedContent = JSON.parse(content);
      
      // Validate response structure
      if (!parsedContent.feedback || !parsedContent.tasks) {
        throw new Error('Invalid response format');
      }

      // Ensure tasks have all required fields
      const validatedTasks = parsedContent.tasks.map((task: any) => ({
        ...task,
        status: task.status || 'pending',
        implementation_tips: task.implementation_tips || [],
        potential_challenges: task.potential_challenges || [],
        success_metrics: task.success_metrics || [],
        resources: task.resources || [],
        learning_resources: task.learning_resources || [],
        tools: task.tools || []
      }));

      return {
        feedback: parsedContent.feedback,
        follow_up_questions: parsedContent.follow_up_questions || [],
        tasks: validatedTasks
      };
    } catch (e) {
      console.error('Error parsing response:', e, content);
      return {
        feedback: {
          strengths: [],
          areas_for_improvement: [],
          opportunities: [],
          risks: [],
          strategic_recommendations: []
        },
        follow_up_questions: [],
        tasks: []
      };
    }
  } catch (error: any) {
    console.error('Error generating tasks:', error);
    throw new Error(error.message || 'Failed to generate tasks');
  }
};

// Generate market analysis with enhanced VC-focused insights
export const generateMarketAnalysis = async (questionnaire: any) => {
  try {
    const { client, model } = await getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an experienced VC analyst with an MBA, providing detailed market analysis. Your analysis should be data-driven, strategic, and focused on key metrics VCs care about. Your response should be a valid JSON object with this structure:

{
  "market_insights": {
    "customer_profiles": [
      {
        "profile": "Detailed customer segment profile",
        "data_points": [
          {
            "point": "Specific data point with quantitative metrics",
            "sources": ["https://example.com"],
            "commentary": "Analysis of implications for growth and market fit"
          }
        ],
        "sources": ["https://example.com"],
        "commentary": "Strategic implications and growth potential"
      }
    ],
    "early_adopters": [
      {
        "segment": "Early adopter segment with clear characteristics",
        "characteristics": [
          {
            "trait": "Specific trait with market validation",
            "sources": ["https://example.com"],
            "commentary": "Analysis of acquisition strategy and scalability"
          }
        ],
        "validation_method": "Data-driven validation approach",
        "sources": ["https://example.com"],
        "commentary": "Market penetration strategy analysis"
      }
    ],
    "sales_channels": [
      {
        "channel": "Sales channel name",
        "effectiveness": "Quantitative effectiveness metrics",
        "cost_metrics": "CAC and ROI analysis",
        "examples": [
          {
            "example": "Specific success case",
            "sources": ["https://example.com"],
            "commentary": "Scalability and unit economics analysis"
          }
        ],
        "sources": ["https://example.com"],
        "commentary": "Channel strategy and growth potential"
      }
    ],
    "pricing_insights": [
      {
        "model": "Pricing model with competitive analysis",
        "market_data": "Market pricing benchmarks and trends",
        "competitor_analysis": "Detailed competitor pricing strategy",
        "sources": ["https://example.com"],
        "commentary": "Revenue potential and pricing power analysis"
      }
    ],
    "integration_recommendations": [
      {
        "integration": "Strategic integration opportunity",
        "market_share": "Market penetration potential",
        "implementation_cost": "Cost-benefit analysis",
        "sources": ["https://example.com"],
        "commentary": "Strategic value and competitive advantage"
      }
    ],
    "market_size_estimates": [
      {
        "segment": "Market segment with clear boundaries",
        "size": "TAM/SAM/SOM breakdown",
        "growth_rate": "CAGR with supporting data",
        "methodology": "Bottom-up calculation methodology",
        "sources": ["https://example.com"],
        "commentary": "Market opportunity and growth drivers"
      }
    ],
    "competition_analysis": [
      {
        "competitor_type": "Competitor category",
        "market_share": "Market share with data",
        "strengths": [
          {
            "point": "Competitive strength",
            "sources": ["https://example.com"],
            "commentary": "Impact on market dynamics"
          }
        ],
        "weaknesses": [
          {
            "point": "Competitive weakness",
            "sources": ["https://example.com"],
            "commentary": "Opportunity for differentiation"
          }
        ],
        "sources": ["https://example.com"],
        "commentary": "Competitive positioning analysis"
      }
    ]
  }
}`
        },
        {
          role: "user",
          content: `Please provide a VC-focused market analysis for this opportunity:
${JSON.stringify(questionnaire, null, 2)}

Focus on:
1. Quantitative metrics and market sizing
2. Clear competitive advantages and moats
3. Unit economics and scalability
4. Market timing and growth drivers
5. Strategic value and exit potential`
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content received');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Error generating market analysis:', error);
    throw new Error(error.message || 'Failed to generate market analysis');
  }
};

// Generate market suggestions with VC focus
export const generateMarketSuggestions = async (idea: any) => {
  try {
    const { client, model } = await getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are a VC analyst with an MBA providing market suggestions. Focus on high-growth opportunities and defensible market positions. Your response should be a valid JSON object with this structure:

{
  "target_audience": ["suggestion 1", "suggestion 2", ...],
  "sales_channels": ["suggestion 1", "suggestion 2", ...],
  "pricing_model": ["suggestion 1", "suggestion 2", ...],
  "customer_type": ["suggestion 1", "suggestion 2", ...],
  "integration_needs": ["suggestion 1", "suggestion 2", ...]
}

Each suggestion should be specific, actionable, and focused on:
1. Market size and growth potential
2. Clear path to revenue
3. Scalability and unit economics
4. Competitive advantages
5. Strategic value`
        },
        {
          role: "user",
          content: `Please provide VC-focused market suggestions for this idea:
${JSON.stringify(idea, null, 2)}

Consider:
1. Market timing and trends
2. Competitive landscape
3. Growth drivers
4. Exit potential
5. Strategic value to acquirers`
        }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content received');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Error generating market suggestions:', error);
    throw new Error(error.message || 'Failed to generate market suggestions');
  }
};

// Generate idea variations
export const generateIdeaVariations = async (ideaData: any) => {
  try {
    const { client, model } = await getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an expert startup advisor helping founders explore variations of their ideas. Generate 3-5 unique variations of the provided idea. Your response should be a valid JSON array with this structure:

[
  {
    "id": "unique-id",
    "title": "Variation title",
    "description": "Detailed description",
    "differentiator": "Key differentiating factor",
    "targetMarket": "Specific target market",
    "revenueModel": "Proposed revenue model",
    "isSelected": false,
    "isEditing": false
  }
]`
        },
        {
          role: "user",
          content: `Please generate variations for this idea:
${JSON.stringify(ideaData, null, 2)}`
        }
      ],
      temperature: 0.8,
      max_tokens: 2500
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content received');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Error generating idea variations:', error);
    throw new Error(error.message || 'Failed to generate idea variations');
  }
};

// Generate combined ideas
export const generateCombinedIdeas = async (originalIdea: string, selectedVariations: any[]) => {
  try {
    const { client, model } = await getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an expert startup advisor helping founders combine the best elements of different idea variations. Generate 2-3 refined ideas that combine elements from the selected variations. Your response should be a valid JSON array with this structure:

[
  {
    "id": "unique-id",
    "title": "Combined idea title",
    "description": "Detailed description",
    "sourceElements": ["Element 1", "Element 2"],
    "targetMarket": "Refined target market",
    "revenueModel": "Refined revenue model",
    "valueProposition": "Unique value proposition",
    "isSelected": false,
    "isEditing": false
  }
]`
        },
        {
          role: "user",
          content: `Please generate combined ideas from these variations:
Original Idea: ${originalIdea}
Selected Variations: ${JSON.stringify(selectedVariations, null, 2)}`
        }
      ],
      temperature: 0.8,
      max_tokens: 2500
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content received');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Error generating combined ideas:', error);
    throw new Error(error.message || 'Failed to generate combined ideas');
  }
};