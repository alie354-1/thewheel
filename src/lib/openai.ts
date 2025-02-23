import OpenAI from 'openai';
import { supabase } from './supabase';

// Get OpenAI client with settings from app_settings table
async function getOpenAIClient() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'openai')
    .single();

  if (error) {
    throw new Error('OpenAI settings not found. Please configure OpenAI in the admin panel.');
  }

  if (!data?.value?.api_key) {
    throw new Error('OpenAI API key not configured. Please add your API key in the admin panel.');
  }

  return {
    client: new OpenAI({
      apiKey: data.value.api_key,
      dangerouslyAllowBrowser: true
    }),
    model: data.value.model || 'gpt-4'
  };
}

// Enhanced helper function to clean and parse JSON response
function parseOpenAIResponse(content: string, expectedSchema?: Record<string, any>) {
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  try {
    // Remove any markdown code block syntax
    let cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
    
    // Remove any potential leading/trailing comments or text
    const jsonStart = cleanContent.indexOf('{');
    const jsonEnd = cleanContent.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON object found in response');
    }
    
    cleanContent = cleanContent.slice(jsonStart, jsonEnd + 1);

    // If the content is just an empty object, throw an error
    if (cleanContent === '{}') {
      throw new Error('Empty JSON object received');
    }

    // Parse the cleaned content
    let parsedData: any;
    try {
      parsedData = JSON.parse(cleanContent);
    } catch (parseError) {
      // Try to fix common JSON issues
      cleanContent = cleanContent
        // Fix unquoted property names
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
        // Fix single quotes
        .replace(/'/g, '"')
        // Remove trailing commas
        .replace(/,(\s*[}\]])/g, '$1');
      
      parsedData = JSON.parse(cleanContent);
    }

    // Validate the parsed data has the expected structure
    if (typeof parsedData !== 'object' || parsedData === null) {
      throw new Error('Invalid response format: expected an object');
    }

    // Validate against expected schema if provided
    if (expectedSchema) {
      validateSchema(parsedData, expectedSchema);
    }

    return parsedData;
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    console.error('Raw content:', content);
    
    // Provide more helpful error messages
    if (error instanceof SyntaxError) {
      const position = parseInt(error.message.match(/position (\d+)/)?.[1] || '0');
      const context = content.slice(Math.max(0, position - 20), position + 20);
      throw new Error(`JSON syntax error near: ...${context}...`);
    }
    
    throw new Error(`Failed to parse OpenAI response: ${error.message}`);
  }
}

// Schema validation helper
function validateSchema(data: any, schema: Record<string, any>, path: string = '') {
  if (schema === null || schema === undefined) {
    return;
  }

  if (Array.isArray(schema)) {
    if (!Array.isArray(data)) {
      throw new Error(`Expected array at ${path || 'root'}`);
    }
    data.forEach((item, index) => {
      validateSchema(item, schema[0], `${path}[${index}]`);
    });
    return;
  }

  if (typeof schema === 'object') {
    if (typeof data !== 'object' || data === null) {
      throw new Error(`Expected object at ${path || 'root'}`);
    }
    
    // Check for required fields
    Object.entries(schema).forEach(([key, value]) => {
      if (value && !data.hasOwnProperty(key)) {
        throw new Error(`Missing required field "${key}" at ${path || 'root'}`);
      }
      if (data[key] !== undefined) {
        validateSchema(data[key], value, path ? `${path}.${key}` : key);
      }
    });
    return;
  }

  // Type validation
  const expectedType = typeof schema;
  const actualType = typeof data;
  if (actualType !== expectedType && actualType !== 'undefined') {
    throw new Error(`Type mismatch at ${path}: expected ${expectedType}, got ${actualType}`);
  }
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

    try {
      const data = parseOpenAIResponse(content);
      return {
        feedback: data.feedback,
        follow_up_questions: data.follow_up_questions,
        tasks: data.tasks
      };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse AI response. Please try again.');
    }
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
}`
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

    try {
      return parseOpenAIResponse(content);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse AI response. Please try again.');
    }
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

    try {
      return parseOpenAIResponse(content);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse AI response. Please try again.');
    }
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

    try {
      const { variations } = parseOpenAIResponse(content);
      return variations.map((v: any) => ({
        ...v,
        isSelected: false,
        isEditing: false
      }));
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse AI response. Please try again.');
    }
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

    try {
      const { combined_ideas } = parseOpenAIResponse(content);
      return combined_ideas.map((idea: any) => ({
        ...idea,
        isSelected: false,
        isEditing: false
      }));
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  } catch (error: any) {
    console.error('Error generating combined ideas:', error);
    throw new Error(error.message || 'Failed to generate combined ideas');
  }
};